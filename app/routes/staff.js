const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

router.get('/', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT EmployeeID, Name, Role, Email, Phone, ShiftTiming, HireDate, Status FROM StaffEmployee ORDER BY Name'
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));
  const isSelf  = entityType === 'Staff' && parseInt(entityID) === parseInt(req.params.id);

  if (!isAdmin && !isSelf)
    return res.status(403).json({ error: 'Access denied' });

  try {
    const [rows] = await db.query('SELECT * FROM StaffEmployee WHERE EmployeeID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  const { Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status } = req.body;

  if (!Name || !Role || !Email || !Phone || !HireDate)
    return res.status(400).json({ error: 'Missing required fields' });

  const validRoles = ['Nurse', 'Pharmacist', 'Admin', 'Technician', 'Support Staff'];
  if (!validRoles.includes(Role))
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });

  try {
    const [result] = await db.query(
      `INSERT INTO StaffEmployee (Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status || 'Active']
    );

    logAudit({
      user: req.user, action: 'CREATE', table: 'StaffEmployee',
      recordID: result.insertId, changes: req.body, ip: req.ip,
    });

    res.status(201).json({ message: 'Staff created', employeeID: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already exists' });
    if (err.sqlMessage?.includes('Hire date cannot be in future'))
      return res.status(400).json({ error: 'Hire date cannot be in the future' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));
  const isSelf  = entityType === 'Staff' && parseInt(entityID) === parseInt(id);

  if (!isAdmin && !isSelf)
    return res.status(403).json({ error: 'Access denied' });

  // Non-admin staff cannot change their own Role or Status
  if (isSelf && !isAdmin) {
    if (req.body.Role !== undefined)
      return res.status(403).json({ error: 'You cannot change your own Role' });
    if (req.body.Status !== undefined)
      return res.status(403).json({ error: 'You cannot change your own Status' });
  }

  const { Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status } = req.body;

  try {
    const [check] = await db.query('SELECT EmployeeID FROM StaffEmployee WHERE EmployeeID = ?', [id]);
    if (check.length === 0) return res.status(404).json({ error: 'Staff not found' });

    await db.query(
      `UPDATE StaffEmployee SET
        Name = COALESCE(?, Name), Role = COALESCE(?, Role),
        Email = COALESCE(?, Email), Phone = COALESCE(?, Phone),
        ShiftTiming = COALESCE(?, ShiftTiming), HireDate = COALESCE(?, HireDate),
        LicenseNumber = COALESCE(?, LicenseNumber), Status = COALESCE(?, Status)
      WHERE EmployeeID = ?`,
      [Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status, id]
    );

    logAudit({
      user: req.user, action: 'UPDATE', table: 'StaffEmployee',
      recordID: parseInt(id), changes: req.body, ip: req.ip,
    });

    res.json({ message: 'Staff updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM StaffEmployee WHERE EmployeeID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Staff not found' });

    await db.query('DELETE FROM StaffEmployee WHERE EmployeeID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'StaffEmployee',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Staff deleted' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete staff with existing dispense or billing records' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
