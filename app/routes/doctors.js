const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

// Sensitive fields stripped for non-clinical users
const PUBLIC_FIELDS  = 'DoctorID, Name, Specialization, AvailableFrom, AvailableTo, WorkingDays, Status';
const FULL_FIELDS    = '*';

// ─── GET /api/doctors ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { roles } = req.user;
  const isClinical = roles.some(r =>
    [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR,
     ROLES.NURSE, ROLES.PHARMACIST].includes(r)
  );

  try {
    // Non-clinical users (students/faculty) only see public fields — no email/phone/license
    const fields = isClinical ? FULL_FIELDS : PUBLIC_FIELDS;
    const [rows] = await db.query(`SELECT ${fields} FROM Doctor ORDER BY Name`);
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── GET /api/doctors/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { roles, entityType, entityID } = req.user;
  const isClinical = roles.some(r =>
    [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR,
     ROLES.NURSE, ROLES.PHARMACIST].includes(r)
  );
  const isSelf = entityType === 'Doctor' && parseInt(entityID) === parseInt(req.params.id);

  try {
    const fields = (isClinical || isSelf) ? FULL_FIELDS : PUBLIC_FIELDS;
    const [rows] = await db.query(
      `SELECT ${fields} FROM Doctor WHERE DoctorID = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── POST /api/doctors ────────────────────────────────────────────────────────
router.post('/', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  const {
    Name, Specialization, Email, Phone, LicenseNumber,
    AvailableFrom, AvailableTo, WorkingDays, Status,
  } = req.body;

  if (!Name || !Specialization || !Email || !Phone || !LicenseNumber)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    const [result] = await db.query(
      `INSERT INTO Doctor
       (Name, Specialization, Email, Phone, LicenseNumber,
        AvailableFrom, AvailableTo, WorkingDays, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Name, Specialization, Email, Phone, LicenseNumber,
       AvailableFrom, AvailableTo, WorkingDays, Status || 'Active']
    );

    logAudit({
      user: req.user, action: 'CREATE', table: 'Doctor',
      recordID: result.insertId, changes: req.body, ip: req.ip,
    });

    res.status(201).json({ message: 'Doctor created', doctorID: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email or LicenseNumber already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── PUT /api/doctors/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));
  const isSelf  = entityType === 'Doctor' && parseInt(entityID) === parseInt(id);

  // Doctors can only update their own record, and cannot change sensitive fields
  if (!isAdmin && !isSelf)
    return res.status(403).json({ error: 'Access denied' });

  if (isSelf && !isAdmin) {
    const restricted = ['LicenseNumber', 'Status', 'Email'];
    for (const field of restricted) {
      if (req.body[field] !== undefined)
        return res.status(403).json({ error: `Doctors cannot change their own ${field}` });
    }
  }

  const {
    Name, Specialization, Email, Phone, LicenseNumber,
    AvailableFrom, AvailableTo, WorkingDays, Status,
  } = req.body;

  try {
    const [check] = await db.query('SELECT DoctorID FROM Doctor WHERE DoctorID = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Doctor not found' });

    await db.query(
      `UPDATE Doctor SET
        Name = COALESCE(?, Name), Specialization = COALESCE(?, Specialization),
        Email = COALESCE(?, Email), Phone = COALESCE(?, Phone),
        LicenseNumber = COALESCE(?, LicenseNumber),
        AvailableFrom = COALESCE(?, AvailableFrom), AvailableTo = COALESCE(?, AvailableTo),
        WorkingDays = COALESCE(?, WorkingDays), Status = COALESCE(?, Status)
      WHERE DoctorID = ?`,
      [Name, Specialization, Email, Phone, LicenseNumber,
       AvailableFrom, AvailableTo, WorkingDays, Status, id]
    );

    logAudit({
      user: req.user, action: 'UPDATE', table: 'Doctor',
      recordID: parseInt(id), changes: req.body, ip: req.ip,
    });

    res.json({ message: 'Doctor updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── DELETE /api/doctors/:id ──────────────────────────────────────────────────
router.delete('/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM Doctor WHERE DoctorID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Doctor not found' });

    await db.query('DELETE FROM Doctor WHERE DoctorID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'Doctor',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete doctor with existing visits or prescriptions' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
