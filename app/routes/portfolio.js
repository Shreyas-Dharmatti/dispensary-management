const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { ROLES } = require('../middleware/permissions');

const router = express.Router();
router.use(auth);

// ─── GET /api/portfolio ───────────────────────────────────────────────────────
// Summary list — Admin/SuperAdmin only
router.get('/', async (req, res) => {
  const { roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));
  if (!isAdmin)
    return res.status(403).json({ error: 'Only admins can list all portfolios' });

  try {
    const [rows] = await db.query(
      `SELECT
         m.MemberID, m.Name, m.Age, m.BloodGroup, m.MemberType,
         m.Department, m.Status, m.RegistrationDate,
         COUNT(DISTINCT v.VisitID) AS TotalVisits,
         COUNT(DISTINCT p.PrescriptionID) AS ActivePrescriptions,
         MAX(v.VisitDate) AS LastVisitDate
       FROM Member m
       LEFT JOIN Visit v ON v.MemberID = m.MemberID
       LEFT JOIN Prescription p ON p.MemberID = m.MemberID AND p.Status = 'Active'
       GROUP BY m.MemberID
       ORDER BY m.Name`
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/portfolio/:memberID ─────────────────────────────────────────────
router.get('/:memberID', async (req, res) => {
  const { memberID } = req.params;
  const { entityType, entityID, roles } = req.user;

  const isAdmin      = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(r));
  const isPharmNurse = roles.some(r => [ROLES.PHARMACIST, ROLES.NURSE].includes(r));
  const isDoctor     = roles.includes(ROLES.DOCTOR) && entityType === 'Doctor';
  const isSelf       = entityType === 'Member' && parseInt(entityID) === parseInt(memberID);

  if (!isAdmin && !isPharmNurse && !isDoctor && !isSelf)
    return res.status(403).json({ error: 'You do not have permission to view this portfolio' });

  // Doctors can only view their own patients
  if (isDoctor && !isAdmin) {
    const [visitCheck] = await db.query(
      'SELECT VisitID FROM Visit WHERE DoctorID = ? AND MemberID = ? LIMIT 1',
      [entityID, memberID]
    );
    if (visitCheck.length === 0)
      return res.status(403).json({ error: 'You can only view portfolios of your own patients' });
  }

  try {
    const [memberRows] = await db.query('SELECT * FROM Member WHERE MemberID = ?', [memberID]);
    if (memberRows.length === 0) return res.status(404).json({ error: 'Member not found' });

    const [historyRows] = await db.query('SELECT * FROM MedicalHistory WHERE MemberID = ?', [memberID]);

    const [visitRows] = await db.query(
      `SELECT v.VisitID, v.VisitDate, v.VisitType, v.Diagnosis,
              v.ChiefComplaint, v.Status, d.Name AS DoctorName
       FROM Visit v JOIN Doctor d ON d.DoctorID = v.DoctorID
       WHERE v.MemberID = ? ORDER BY v.VisitDate DESC LIMIT 10`, [memberID]
    );

    const [prescRows] = await db.query(
      `SELECT p.PrescriptionID, p.IssueDate, p.ValidUntil,
              p.Diagnosis, p.Status, d.Name AS DoctorName
       FROM Prescription p JOIN Doctor d ON d.DoctorID = p.DoctorID
       WHERE p.MemberID = ? AND p.Status = 'Active'
       ORDER BY p.IssueDate DESC`, [memberID]
    );

    const [apptRows] = await db.query(
      `SELECT a.AppointmentID, a.AppointmentDate, a.AppointmentTime,
              a.Status, a.Priority, d.Name AS DoctorName, d.Specialization
       FROM Appointment a JOIN Doctor d ON d.DoctorID = a.DoctorID
       WHERE a.MemberID = ? AND a.AppointmentDate >= CURDATE() AND a.Status = 'Scheduled'
       ORDER BY a.AppointmentDate, a.AppointmentTime`, [memberID]
    );

    let bills = [];
    if (isAdmin || isPharmNurse || isSelf) {
      const [billRows] = await db.query(
        `SELECT b.BillID, b.BillDate, b.TotalAmount, b.PaymentStatus, b.PaymentMethod
         FROM BillPayment b JOIN Visit v ON v.VisitID = b.VisitID
         WHERE v.MemberID = ? ORDER BY b.BillDate DESC LIMIT 5`, [memberID]
      );
      bills = billRows;
    }

    const member = memberRows[0];

    // Strip sensitive fields for nurses/pharmacists
    if (isPharmNurse && !isAdmin) {
      delete member.EmergencyContact;
      delete member.Address;
    }

    res.json({
      data: {
        profile: member,
        medicalHistory: historyRows[0] || null,
        recentVisits: visitRows,
        activePrescriptions: prescRows,
        upcomingAppointments: apptRows,
        recentBills: bills,
        summary: {
          totalVisits: visitRows.length,
          activePrescriptions: prescRows.length,
          upcomingAppointments: apptRows.length,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
