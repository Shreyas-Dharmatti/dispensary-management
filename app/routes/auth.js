const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const router = express.Router();

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  try {
    const [rows] = await db.query('SELECT * FROM UserLogin WHERE Username = ?', [username]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid username or password' });

    const user = rows[0];

    if (!user.IsActive)
      return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });

    if (user.PasswordHash === 'CHANGEME') {
      return res.status(403).json({
        error: 'Password not set. Please set your password first.',
        mustSetPassword: true,
        userLoginID: user.UserLoginID,
      });
    }

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match)
      return res.status(401).json({ error: 'Invalid username or password' });

    const [roleRows] = await db.query(
      `SELECT sr.RoleName FROM UserRoleMapping urm
       JOIN SystemRole sr ON sr.RoleID = urm.RoleID
       WHERE urm.UserLoginID = ?`, [user.UserLoginID]
    );
    const roles = roleRows.map(r => r.RoleName);

    await db.query('UPDATE UserLogin SET LastLogin = NOW() WHERE UserLoginID = ?', [user.UserLoginID]);

    const payload = {
      userLoginID: user.UserLoginID,
      username:    user.Username,
      entityType:  user.EntityType,
      entityID:    user.EntityID,
      roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    logAudit({ user: payload, action: 'LOGIN', table: 'UserLogin',
      recordID: user.UserLoginID, changes: { username }, ip: req.ip });

    return res.json({ message: 'Login successful', token, user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── POST /api/auth/set-password ─────────────────────────────────────────────
router.post('/set-password', async (req, res) => {
  const { userLoginID, newPassword } = req.body;
  if (!userLoginID || !newPassword)
    return res.status(400).json({ error: 'userLoginID and newPassword are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const [rows] = await db.query('SELECT * FROM UserLogin WHERE UserLoginID = ?', [userLoginID]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (rows[0].PasswordHash !== 'CHANGEME')
      return res.status(400).json({ error: 'Password already set. Use change-password instead.' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE UserLogin SET PasswordHash = ? WHERE UserLoginID = ?', [hash, userLoginID]);

    logAudit({
      user: { userLoginID, username: rows[0].Username, roles: [], entityType: rows[0].EntityType },
      action: 'UPDATE', table: 'UserLogin', recordID: userLoginID,
      changes: { action: 'Initial password set' }, ip: req.ip,
    });

    return res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters' });

  try {
    const [rows] = await db.query('SELECT * FROM UserLogin WHERE UserLoginID = ?', [req.user.userLoginID]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE UserLogin SET PasswordHash = ? WHERE UserLoginID = ?', [hash, req.user.userLoginID]);

    logAudit({ user: req.user, action: 'UPDATE', table: 'UserLogin',
      recordID: req.user.userLoginID, changes: { action: 'Password changed' }, ip: req.ip });

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth, (req, res) => res.json({ user: req.user }));


// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', auth, (req, res) => {
  logAudit({ user: req.user, action: 'LOGOUT', table: 'UserLogin',
    recordID: req.user.userLoginID, changes: {}, ip: req.ip });
  res.json({ message: 'Logged out successfully. Please discard your token.' });
});


module.exports = router;
