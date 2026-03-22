const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/permissions');

const router = express.Router();
router.use(auth);

// GET /api/superadmin/:id
// SuperAdmin can fetch their own profile to get their Name
// Also accessible by SuperAdmin role to look up any superadmin
router.get('/:id', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isSuperAdmin = roles.includes(ROLES.SUPERADMIN);
  const isSelf = entityType === 'SuperAdmin' && parseInt(entityID) === parseInt(req.params.id);

  if (!isSuperAdmin && !isSelf) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const [rows] = await db.query(
      'SELECT SuperAdminID, Name, Email, Phone, Status, CreatedAt FROM SuperAdmin WHERE SuperAdminID = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'SuperAdmin not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
