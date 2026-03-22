const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── GET /api/doctors/:id/schedule ───────────────────────────────────────────
// Returns the weekly schedule for a doctor.
// All authenticated users can view (needed for booking).
router.get('/:id/schedule', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ScheduleID, DayOfWeek, StartTime, EndTime, IsActive
       FROM DoctorSchedule
       WHERE DoctorID = ?
       ORDER BY FIELD(DayOfWeek,'Monday','Tuesday','Wednesday',
                      'Thursday','Friday','Saturday','Sunday')`,
      [req.params.id]
    );

    // Return all 7 days — null for days with no schedule row
    const schedule = DAYS.map(day => {
      const row = rows.find(r => r.DayOfWeek === day);
      return {
        day,
        scheduleID: row?.ScheduleID || null,
        startTime:  row?.StartTime  || null,
        endTime:    row?.EndTime    || null,
        isActive:   row?.IsActive   ?? false,
        hasSchedule: !!row,
      };
    });

    res.json({ doctorID: parseInt(req.params.id), schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── PUT /api/doctors/:id/schedule ───────────────────────────────────────────
// Upsert the full weekly schedule for a doctor.
// Body: { schedule: [ { day, startTime, endTime, isActive }, ... ] }
// Admin or the doctor themselves can update.
router.put('/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));
  const isSelf  = entityType === 'Doctor' && parseInt(entityID) === parseInt(id);

  if (!isAdmin && !isSelf)
    return res.status(403).json({ error: 'Access denied' });

  const { schedule } = req.body;
  if (!Array.isArray(schedule))
    return res.status(400).json({ error: 'schedule must be an array' });

  // Validate each entry
  for (const entry of schedule) {
    if (!DAYS.includes(entry.day))
      return res.status(400).json({ error: `Invalid day: ${entry.day}` });
    if (entry.isActive && (!entry.startTime || !entry.endTime))
      return res.status(400).json({ error: `startTime and endTime required for active day: ${entry.day}` });
    if (entry.isActive && entry.startTime >= entry.endTime)
      return res.status(400).json({ error: `EndTime must be after StartTime for ${entry.day}` });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const entry of schedule) {
      if (entry.isActive) {
        // UPSERT — insert or update if day already exists
        await conn.query(
          `INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime, IsActive)
           VALUES (?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE
             StartTime = VALUES(StartTime),
             EndTime   = VALUES(EndTime),
             IsActive  = TRUE`,
          [id, entry.day, entry.startTime, entry.endTime]
        );
      } else {
        // Mark inactive or delete the row
        await conn.query(
          `UPDATE DoctorSchedule SET IsActive = FALSE
           WHERE DoctorID = ? AND DayOfWeek = ?`,
          [id, entry.day]
        );
      }
    }

    await conn.commit();

    logAudit({
      user: req.user, action: 'UPDATE', table: 'DoctorSchedule',
      recordID: parseInt(id), changes: { schedule }, ip: req.ip,
    });

    res.json({ message: 'Schedule updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
