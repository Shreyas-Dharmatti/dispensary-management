const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

// ─── GET /api/members ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isClinical = roles.some(r =>
    [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR,
     ROLES.NURSE, ROLES.PHARMACIST, ROLES.TECHNICIAN].includes(r)
  );

  try {
    let rows;
    if (isClinical) {
      [rows] = await db.query('SELECT * FROM Member ORDER BY Name');
    } else {
      if (entityType !== 'Member')
        return res.status(403).json({ error: 'Access denied' });
      [rows] = await db.query('SELECT * FROM Member WHERE MemberID = ?', [entityID]);
    }
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── GET /api/members/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { entityType, entityID, roles } = req.user;
  const isClinical = roles.some(r =>
    [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST].includes(r)
  );

  if (!isClinical) {
    if (entityType !== 'Member' || parseInt(entityID) !== parseInt(id))
      return res.status(403).json({ error: 'You can only view your own profile' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM Member WHERE MemberID = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Member not found' });

    const [history] = await db.query('SELECT * FROM MedicalHistory WHERE MemberID = ?', [id]);
    res.json({ data: { ...rows[0], medicalHistory: history[0] || null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── POST /api/members ────────────────────────────────────────────────────────
router.post('/', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  const {
    Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
    Department, BloodGroup, EmergencyContact, Address,
    RegistrationDate, MemberType, Status,
  } = req.body;

  if (!Name || !Age || !Email || !ContactNumber || !BloodGroup ||
      !EmergencyContact || !RegistrationDate || !MemberType)
    return res.status(400).json({ error: 'Missing required fields' });

  if (Age < 16)
    return res.status(400).json({ error: 'Age must be at least 16' });

  if (!['Student', 'Faculty', 'Staff'].includes(MemberType))
    return res.status(400).json({ error: 'MemberType must be Student, Faculty, or Staff' });

  try {
    const [result] = await db.query(
      `INSERT INTO Member
       (Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
        Department, BloodGroup, EmergencyContact, Address,
        RegistrationDate, MemberType, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
       Department, BloodGroup, EmergencyContact, Address,
       RegistrationDate, MemberType, Status || 'Active']
    );

    logAudit({
      user: req.user, action: 'CREATE', table: 'Member',
      recordID: result.insertId, changes: req.body, ip: req.ip,
    });

    res.status(201).json({ message: 'Member created successfully', memberID: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── PUT /api/members/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));

  if (!isAdmin) {
    if (entityType !== 'Member' || parseInt(entityID) !== parseInt(id))
      return res.status(403).json({ error: 'You can only update your own profile' });

    // Non-admin members cannot touch sensitive fields
    const restricted = ['Status', 'MemberType', 'RollNumberOrEmployeeCode', 'RegistrationDate'];
    for (const field of restricted) {
      if (req.body[field] !== undefined)
        return res.status(403).json({ error: `You cannot change the ${field} field` });
    }
  }

  const {
    Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
    Department, BloodGroup, EmergencyContact, Address,
    RegistrationDate, MemberType, Status,
  } = req.body;

  try {
    const [check] = await db.query('SELECT MemberID FROM Member WHERE MemberID = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Member not found' });

    await db.query(
      `UPDATE Member SET
        Name = COALESCE(?, Name), Age = COALESCE(?, Age),
        Email = COALESCE(?, Email), ContactNumber = COALESCE(?, ContactNumber),
        RollNumberOrEmployeeCode = COALESCE(?, RollNumberOrEmployeeCode),
        Department = COALESCE(?, Department), BloodGroup = COALESCE(?, BloodGroup),
        EmergencyContact = COALESCE(?, EmergencyContact), Address = COALESCE(?, Address),
        RegistrationDate = COALESCE(?, RegistrationDate),
        MemberType = COALESCE(?, MemberType), Status = COALESCE(?, Status)
      WHERE MemberID = ?`,
      [Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode,
       Department, BloodGroup, EmergencyContact, Address,
       RegistrationDate, MemberType, Status, id]
    );

    logAudit({
      user: req.user, action: 'UPDATE', table: 'Member',
      recordID: parseInt(id), changes: req.body, ip: req.ip,
    });

    res.json({ message: 'Member updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── DELETE /api/members/:id ──────────────────────────────────────────────────
router.delete('/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  const { id } = req.params;
  try {
    const [check] = await db.query('SELECT * FROM Member WHERE MemberID = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Member not found' });

    const snapshot = check[0]; // capture before delete for log
    await db.query('DELETE FROM Member WHERE MemberID = ?', [id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'Member',
      recordID: parseInt(id),
      changes: { deletedRecord: snapshot },
      ip: req.ip,
      note: 'Login deactivated and kept for audit trail',
    });

    res.json({ message: 'Member deleted. Login deactivated and kept for audit.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
