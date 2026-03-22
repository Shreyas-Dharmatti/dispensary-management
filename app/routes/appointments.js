const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

// ── Helper: generate all 15-min slots between two times ──────────────────────
// e.g. '09:00:00' to '17:00:00' → ['09:00', '09:15', ..., '16:45']
function generateSlots(from, to) {
  const slots = [];
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  let cur = fh * 60 + fm;
  const end = th * 60 + tm;
  while (cur < end) {
    const h = Math.floor(cur / 60).toString().padStart(2, '0');
    const m = (cur % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += 15;
  }
  return slots;
}

// ── Helper: check if a time string is a valid 15-min slot ────────────────────
function isValidSlot(timeStr) {
  const parts = timeStr.split(':');
  const minutes = parseInt(parts[1]);
  return [0, 15, 30, 45].includes(minutes);
}

// ── Helper: compare time strings HH:MM or HH:MM:SS ──────────────────────────
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}


// ─── GET /api/appointments ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isAdmin  = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.NURSE].includes(r));
  const isDoctor = roles.includes(ROLES.DOCTOR) && entityType === 'Doctor';
  const isMember = entityType === 'Member';

  try {
    let rows;
    if (isAdmin) {
      [rows] = await db.query(
        `SELECT a.*, m.Name AS MemberName, d.Name AS DoctorName FROM Appointment a
         JOIN Member m ON m.MemberID = a.MemberID
         JOIN Doctor d ON d.DoctorID = a.DoctorID
         ORDER BY a.AppointmentDate DESC, a.AppointmentTime`
      );
    } else if (isDoctor) {
      [rows] = await db.query(
        `SELECT a.*, m.Name AS MemberName FROM Appointment a
         JOIN Member m ON m.MemberID = a.MemberID
         WHERE a.DoctorID = ? ORDER BY a.AppointmentDate DESC`,
        [entityID]
      );
    } else if (isMember) {
      [rows] = await db.query(
        `SELECT a.*, d.Name AS DoctorName, d.Specialization FROM Appointment a
         JOIN Doctor d ON d.DoctorID = a.DoctorID
         WHERE a.MemberID = ? ORDER BY a.AppointmentDate DESC`,
        [entityID]
      );
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── GET /api/appointments/slots?doctorID=1&date=2030-01-15 ──────────────────
// Returns available 15-min slots for a doctor on a given date.
// Removes already-booked slots (Status != Cancelled).
// Used by the frontend to populate the time dropdown.
router.get('/slots', async (req, res) => {
  const { doctorID, date } = req.query;

  if (!doctorID || !date) {
    return res.status(400).json({ error: 'doctorID and date are required' });
  }

  try {
    // Get day of week for the requested date
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayOfWeek = dayNames[new Date(date + 'T00:00:00').getDay()];

    // Check doctor status
    const [docRows] = await db.query(
      'SELECT Name, Status FROM Doctor WHERE DoctorID = ?', [doctorID]
    );
    if (docRows.length === 0)
      return res.status(404).json({ error: 'Doctor not found' });

    const doc = docRows[0];
    if (doc.Status !== 'Active') {
      return res.status(400).json({
        error: `${doc.Name} is currently ${doc.Status} and cannot accept appointments.`,
        available: []
      });
    }

    // Check DoctorSchedule for that day
    const [schedRows] = await db.query(
      `SELECT StartTime, EndTime FROM DoctorSchedule
       WHERE DoctorID = ? AND DayOfWeek = ? AND IsActive = TRUE`,
      [doctorID, dayOfWeek]
    );

    if (schedRows.length === 0) {
      return res.status(400).json({
        error: `${doc.Name} does not work on ${dayOfWeek}s. Please choose another date.`,
        dayOfWeek,
        available: []
      });
    }

    const { StartTime, EndTime } = schedRows[0];

    // Generate all possible 15-min slots for that day
    const allSlots = generateSlots(StartTime, EndTime);

    // Fetch already booked slots
    const [bookedRows] = await db.query(
      `SELECT AppointmentTime FROM Appointment
       WHERE DoctorID = ? AND AppointmentDate = ?
         AND Status NOT IN ('Cancelled', 'No-Show')`,
      [doctorID, date]
    );

    const bookedTimes = new Set(
      bookedRows.map(r => r.AppointmentTime.substring(0, 5))
    );

    const slots = allSlots.map(slot => ({
      time:      slot,
      available: !bookedTimes.has(slot),
    }));

    res.json({
      doctorID:   parseInt(doctorID),
      date,
      dayOfWeek,
      availableFrom: StartTime,
      availableTo:   EndTime,
      slots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── GET /api/appointments/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  try {
    const [rows] = await db.query(
      `SELECT a.*, m.Name AS MemberName, d.Name AS DoctorName FROM Appointment a
       JOIN Member m ON m.MemberID = a.MemberID
       JOIN Doctor d ON d.DoctorID = a.DoctorID
       WHERE a.AppointmentID = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const appt    = rows[0];
    const isAdmin  = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.NURSE].includes(r));
    const isDoctor = roles.includes(ROLES.DOCTOR) && parseInt(entityID) === appt.DoctorID;
    const isMember = entityType === 'Member' && parseInt(entityID) === appt.MemberID;

    if (!isAdmin && !isDoctor && !isMember)
      return res.status(403).json({ error: 'Access denied' });

    res.json({ data: appt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── POST /api/appointments ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { MemberID, DoctorID, AppointmentDate, AppointmentTime, Symptoms, Priority, TokenNumber } = req.body;
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.NURSE].includes(r));

  // Members can only book for themselves
  if (!isAdmin && entityType === 'Member' && parseInt(entityID) !== parseInt(MemberID))
    return res.status(403).json({ error: 'You can only book appointments for yourself' });

  if (!MemberID || !DoctorID || !AppointmentDate || !AppointmentTime)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    // ── 1. Fetch doctor status ───────────────────────────────────────────────
    const [docRows] = await db.query(
      'SELECT Name, Status FROM Doctor WHERE DoctorID = ?', [DoctorID]
    );

    if (docRows.length === 0)
      return res.status(404).json({ error: 'Doctor not found' });

    const doc = docRows[0];

    // ── 2. Block if doctor is not Active ────────────────────────────────────
    if (doc.Status !== 'Active') {
      return res.status(400).json({
        error: `${doc.Name} is currently ${doc.Status} and cannot accept appointments.`
      });
    }

    // ── 3. Check DoctorSchedule for the day of week ──────────────────────────
    const dayNames  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayOfWeek = dayNames[new Date(AppointmentDate + 'T00:00:00').getDay()];

    const [schedRows] = await db.query(
      `SELECT StartTime, EndTime FROM DoctorSchedule
       WHERE DoctorID = ? AND DayOfWeek = ? AND IsActive = TRUE`,
      [DoctorID, dayOfWeek]
    );

    if (schedRows.length === 0) {
      return res.status(400).json({
        error: `${doc.Name} does not work on ${dayOfWeek}s. Please choose a different date.`
      });
    }

    const { StartTime, EndTime } = schedRows[0];

    // ── 4. Validate time is a 15-min boundary ───────────────────────────────
    if (!isValidSlot(AppointmentTime)) {
      return res.status(400).json({
        error: 'Appointment time must be on a 15-minute boundary (e.g. 09:00, 09:15, 09:30, 09:45).'
      });
    }

    // ── 5. Validate time is within that day's schedule window ───────────────
    const slotMins = timeToMinutes(AppointmentTime);
    const fromMins = timeToMinutes(StartTime);
    const toMins   = timeToMinutes(EndTime);

    if (slotMins < fromMins || slotMins >= toMins) {
      const fromFmt = StartTime.substring(0, 5);
      const toFmt   = EndTime.substring(0, 5);
      return res.status(400).json({
        error: `${doc.Name} is only available ${fromFmt}–${toFmt} on ${dayOfWeek}s.`
      });
    }

    // ── 6. Check for slot conflict ───────────────────────────────────────────
    const [conflict] = await db.query(
      `SELECT AppointmentID FROM Appointment
       WHERE DoctorID = ?
         AND AppointmentDate = ?
         AND AppointmentTime = ?
         AND Status NOT IN ('Cancelled', 'No-Show')`,
      [DoctorID, AppointmentDate, AppointmentTime]
    );

    if (conflict.length > 0) {
      return res.status(409).json({
        error: `This slot is already booked for ${doc.Name} on ${AppointmentDate} at ${AppointmentTime.substring(0,5)}. Please choose a different time.`
      });
    }

    // ── 7. Insert ────────────────────────────────────────────────────────────
    const [result] = await db.query(
      `INSERT INTO Appointment
       (MemberID, DoctorID, AppointmentDate, AppointmentTime, Symptoms, Status, Priority, TokenNumber)
       VALUES (?, ?, ?, ?, ?, 'Scheduled', ?, ?)`,
      [MemberID, DoctorID, AppointmentDate, AppointmentTime,
       Symptoms, Priority || 'Normal', TokenNumber]
    );

    logAudit({
      user: req.user, action: 'CREATE', table: 'Appointment',
      recordID: result.insertId, changes: req.body, ip: req.ip,
    });

    res.status(201).json({ message: 'Appointment booked', appointmentID: result.insertId });

  } catch (err) {
    // DB-level unique constraint fallback (race condition safety net)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'This slot was just booked by someone else. Please choose a different time.'
      });
    }
    if (err.sqlMessage?.includes('cannot be in the past'))
      return res.status(400).json({ error: 'Appointment date cannot be in the past' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── PUT /api/appointments/:id ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.NURSE, ROLES.DOCTOR].includes(r));

  try {
    const [rows] = await db.query('SELECT * FROM Appointment WHERE AppointmentID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    const appt    = rows[0];
    const isMember = entityType === 'Member' && parseInt(entityID) === appt.MemberID;

    if (!isAdmin && !isMember)
      return res.status(403).json({ error: 'Access denied' });

    if (isMember && !isAdmin && req.body.Status && req.body.Status !== 'Cancelled')
      return res.status(403).json({ error: 'Members can only cancel appointments' });

    const { AppointmentDate, AppointmentTime, Symptoms, Status, Priority } = req.body;

    // If rescheduling (changing time/date), re-validate availability and conflicts
    if ((AppointmentTime && AppointmentTime !== appt.AppointmentTime) ||
        (AppointmentDate && AppointmentDate !== appt.AppointmentDate)) {

      const newDate = AppointmentDate || appt.AppointmentDate;
      const newTime = AppointmentTime || appt.AppointmentTime;

      const [docRows] = await db.query(
        'SELECT Name, Status FROM Doctor WHERE DoctorID = ?', [appt.DoctorID]
      );
      const doc = docRows[0];

      if (doc.Status !== 'Active')
        return res.status(400).json({ error: `${doc.Name} is currently ${doc.Status}.` });

      if (!isValidSlot(newTime))
        return res.status(400).json({ error: 'Time must be on a 15-minute boundary.' });

      const dayNames2  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const newDayOfWeek = dayNames2[new Date(newDate + 'T00:00:00').getDay()];

      const [newSchedRows] = await db.query(
        `SELECT StartTime, EndTime FROM DoctorSchedule
         WHERE DoctorID = ? AND DayOfWeek = ? AND IsActive = TRUE`,
        [appt.DoctorID, newDayOfWeek]
      );

      if (newSchedRows.length === 0)
        return res.status(400).json({
          error: `${doc.Name} does not work on ${newDayOfWeek}s.`
        });

      const slotMins = timeToMinutes(newTime);
      const fromMins = timeToMinutes(newSchedRows[0].StartTime);
      const toMins   = timeToMinutes(newSchedRows[0].EndTime);

      if (slotMins < fromMins || slotMins >= toMins)
        return res.status(400).json({
          error: `${doc.Name} is only available ${newSchedRows[0].StartTime.substring(0,5)}–${newSchedRows[0].EndTime.substring(0,5)} on ${newDayOfWeek}s.`
        });

      const [conflict] = await db.query(
        `SELECT AppointmentID FROM Appointment
         WHERE DoctorID = ? AND AppointmentDate = ? AND AppointmentTime = ?
           AND Status NOT IN ('Cancelled','No-Show')
           AND AppointmentID != ?`,
        [appt.DoctorID, newDate, newTime, req.params.id]
      );

      if (conflict.length > 0)
        return res.status(409).json({ error: 'That slot is already booked. Please choose a different time.' });
    }

    await db.query(
      `UPDATE Appointment SET
        AppointmentDate = COALESCE(?, AppointmentDate),
        AppointmentTime = COALESCE(?, AppointmentTime),
        Symptoms = COALESCE(?, Symptoms),
        Status = COALESCE(?, Status),
        Priority = COALESCE(?, Priority)
      WHERE AppointmentID = ?`,
      [AppointmentDate, AppointmentTime, Symptoms, Status, Priority, req.params.id]
    );

    logAudit({
      user: req.user, action: 'UPDATE', table: 'Appointment',
      recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
    });

    res.json({ message: 'Appointment updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'That slot is already booked.' });
    if (err.sqlMessage?.includes('cannot be in the past'))
      return res.status(400).json({ error: 'Appointment date cannot be in the past' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ─── DELETE /api/appointments/:id ─────────────────────────────────────────────
router.delete('/:id', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM Appointment WHERE AppointmentID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    await db.query('DELETE FROM Appointment WHERE AppointmentID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'Appointment',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
