const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, clinicalStaff, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

// ════════════════════════════════════════════════════════════
// VISITS
// ════════════════════════════════════════════════════════════

router.get('/visits', clinicalStaff, async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isDoctor = roles.includes(ROLES.DOCTOR) && entityType === 'Doctor';
  try {
    let rows;
    if (isDoctor) {
      [rows] = await db.query(
        `SELECT v.*, m.Name AS MemberName FROM Visit v
         JOIN Member m ON m.MemberID = v.MemberID
         WHERE v.DoctorID = ? ORDER BY v.VisitDate DESC`, [entityID]
      );
    } else {
      [rows] = await db.query(
        `SELECT v.*, m.Name AS MemberName, d.Name AS DoctorName FROM Visit v
         JOIN Member m ON m.MemberID = v.MemberID
         JOIN Doctor d ON d.DoctorID = v.DoctorID
         ORDER BY v.VisitDate DESC`
      );
    }
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/visits/:id', clinicalStaff, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, m.Name AS MemberName, d.Name AS DoctorName FROM Visit v
       JOIN Member m ON m.MemberID = v.MemberID
       JOIN Doctor d ON d.DoctorID = v.DoctorID
       WHERE v.VisitID = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/visits',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  async (req, res) => {
    const {
      MemberID, DoctorID, AppointmentID, VisitDate, VisitTime,
      ChiefComplaint, Diagnosis, VitalSigns, TreatmentNotes,
      FollowUpRequired, FollowUpDate, VisitType, Status,
    } = req.body;

    if (!MemberID || !DoctorID || !VisitDate || !VisitTime || !ChiefComplaint || !VisitType)
      return res.status(400).json({ error: 'Missing required fields' });

    try {
      const [result] = await db.query(
        `INSERT INTO Visit
         (MemberID, DoctorID, AppointmentID, VisitDate, VisitTime, ChiefComplaint,
          Diagnosis, VitalSigns, TreatmentNotes, FollowUpRequired, FollowUpDate, VisitType, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [MemberID, DoctorID, AppointmentID, VisitDate, VisitTime, ChiefComplaint,
         Diagnosis, VitalSigns ? JSON.stringify(VitalSigns) : null, TreatmentNotes,
         FollowUpRequired || false, FollowUpDate, VisitType, Status || 'In Progress']
      );

      logAudit({
        user: req.user, action: 'CREATE', table: 'Visit',
        recordID: result.insertId, changes: req.body, ip: req.ip,
      });

      res.status(201).json({ message: 'Visit created', visitID: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/visits/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  async (req, res) => {
    const { Diagnosis, VitalSigns, TreatmentNotes, FollowUpRequired, FollowUpDate, Status } = req.body;
    try {
      const [check] = await db.query('SELECT VisitID FROM Visit WHERE VisitID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Visit not found' });

      await db.query(
        `UPDATE Visit SET
          Diagnosis = COALESCE(?, Diagnosis),
          VitalSigns = COALESCE(?, VitalSigns),
          TreatmentNotes = COALESCE(?, TreatmentNotes),
          FollowUpRequired = COALESCE(?, FollowUpRequired),
          FollowUpDate = COALESCE(?, FollowUpDate),
          Status = COALESCE(?, Status)
        WHERE VisitID = ?`,
        [Diagnosis, VitalSigns ? JSON.stringify(VitalSigns) : null,
         TreatmentNotes, FollowUpRequired, FollowUpDate, Status, req.params.id]
      );

      logAudit({
        user: req.user, action: 'UPDATE', table: 'Visit',
        recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
      });

      res.json({ message: 'Visit updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/visits/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM Visit WHERE VisitID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Visit not found' });

    await db.query('DELETE FROM Visit WHERE VisitID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'Visit',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Visit deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ════════════════════════════════════════════════════════════
// PRESCRIPTIONS
// ════════════════════════════════════════════════════════════

router.get('/prescriptions', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isAdmin      = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST].includes(r));
  const isDoctor     = roles.includes(ROLES.DOCTOR) && entityType === 'Doctor';
  const isMember     = entityType === 'Member';

  try {
    let rows;
    if (isAdmin) {
      [rows] = await db.query(
        `SELECT p.*, m.Name AS MemberName, d.Name AS DoctorName FROM Prescription p
         JOIN Member m ON m.MemberID = p.MemberID
         JOIN Doctor d ON d.DoctorID = p.DoctorID
         ORDER BY p.IssueDate DESC`
      );
    } else if (isDoctor) {
      [rows] = await db.query(
        `SELECT p.*, m.Name AS MemberName FROM Prescription p
         JOIN Member m ON m.MemberID = p.MemberID
         WHERE p.DoctorID = ? ORDER BY p.IssueDate DESC`, [entityID]
      );
    } else if (isMember) {
      [rows] = await db.query(
        `SELECT p.*, d.Name AS DoctorName FROM Prescription p
         JOIN Doctor d ON d.DoctorID = p.DoctorID
         WHERE p.MemberID = ? ORDER BY p.IssueDate DESC`, [entityID]
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

router.get('/prescriptions/:id', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  try {
    const [rows] = await db.query(
      `SELECT p.*, m.Name AS MemberName, d.Name AS DoctorName FROM Prescription p
       JOIN Member m ON m.MemberID = p.MemberID
       JOIN Doctor d ON d.DoctorID = p.DoctorID
       WHERE p.PrescriptionID = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Prescription not found' });
    const presc    = rows[0];
    const isAdmin  = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST].includes(r));
    const isDoctor = roles.includes(ROLES.DOCTOR) && parseInt(entityID) === presc.DoctorID;
    const isMember = entityType === 'Member' && parseInt(entityID) === presc.MemberID;

    if (!isAdmin && !isDoctor && !isMember)
      return res.status(403).json({ error: 'Access denied' });

    const [items] = await db.query(
      `SELECT pi.*, m.Name AS MedicineName FROM PrescriptionItem pi
       JOIN Medicine m ON m.MedicineID = pi.MedicineID
       WHERE pi.PrescriptionID = ?`, [req.params.id]
    );
    res.json({ data: { ...presc, items } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/prescriptions',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR),
  async (req, res) => {
    const { VisitID, MemberID, DoctorID, IssueDate, ValidUntil, Diagnosis, SpecialInstructions, items } = req.body;

    if (!VisitID || !MemberID || !DoctorID || !IssueDate || !ValidUntil || !Diagnosis)
      return res.status(400).json({ error: 'Missing required fields' });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        `INSERT INTO Prescription
         (VisitID, MemberID, DoctorID, IssueDate, ValidUntil, Diagnosis, SpecialInstructions, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [VisitID, MemberID, DoctorID, IssueDate, ValidUntil, Diagnosis, SpecialInstructions]
      );
      const prescID = result.insertId;

      if (items && items.length > 0) {
        for (const item of items) {
          await conn.query(
            `INSERT INTO PrescriptionItem
             (PrescriptionID, MedicineID, Dosage, Frequency, Duration, Quantity, Instructions)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [prescID, item.MedicineID, item.Dosage, item.Frequency, item.Duration, item.Quantity, item.Instructions]
          );
        }
      }

      await conn.commit();

      logAudit({
        user: req.user, action: 'CREATE', table: 'Prescription',
        recordID: prescID, changes: req.body, ip: req.ip,
      });

      res.status(201).json({ message: 'Prescription created', prescriptionID: prescID });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      conn.release();
    }
  }
);

router.put('/prescriptions/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR),
  async (req, res) => {
    const { SpecialInstructions, Status } = req.body;
    try {
      const [check] = await db.query('SELECT PrescriptionID FROM Prescription WHERE PrescriptionID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Prescription not found' });

      await db.query(
        `UPDATE Prescription SET
          SpecialInstructions = COALESCE(?, SpecialInstructions),
          Status = COALESCE(?, Status)
        WHERE PrescriptionID = ?`,
        [SpecialInstructions, Status, req.params.id]
      );

      logAudit({
        user: req.user, action: 'UPDATE', table: 'Prescription',
        recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
      });

      res.json({ message: 'Prescription updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/prescriptions/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM Prescription WHERE PrescriptionID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Prescription not found' });

    await db.query('DELETE FROM Prescription WHERE PrescriptionID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'Prescription',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Prescription deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ════════════════════════════════════════════════════════════
// BILLING
// ════════════════════════════════════════════════════════════

router.get('/billing', async (req, res) => {
  const { entityType, entityID, roles } = req.user;
  const isAdmin = roles.some(r => [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST].includes(r));
  try {
    let rows;
    if (isAdmin) {
      [rows] = await db.query(
        `SELECT b.*, v.MemberID, m.Name AS MemberName FROM BillPayment b
         JOIN Visit v ON v.VisitID = b.VisitID
         JOIN Member m ON m.MemberID = v.MemberID
         ORDER BY b.BillDate DESC`
      );
    } else if (entityType === 'Member') {
      [rows] = await db.query(
        `SELECT b.* FROM BillPayment b
         JOIN Visit v ON v.VisitID = b.VisitID
         WHERE v.MemberID = ? ORDER BY b.BillDate DESC`, [entityID]
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

router.post('/billing',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST),
  async (req, res) => {
    const {
      VisitID, BillDate, BillTime, ConsultationFee, MedicineCost,
      LabTestCost, OtherCharges, SubTotal, DiscountAmount, TaxAmount,
      TotalAmount, PaymentMethod, PaymentStatus, TransactionID,
      PaidAmount, BalanceAmount, BilledBy, Remarks,
    } = req.body;

    if (!VisitID || !BillDate || !BillTime || SubTotal === undefined || TotalAmount === undefined || !PaymentMethod)
      return res.status(400).json({ error: 'Missing required fields' });

    try {
      const [result] = await db.query(
        `INSERT INTO BillPayment
         (VisitID, BillDate, BillTime, ConsultationFee, MedicineCost, LabTestCost, OtherCharges,
          SubTotal, DiscountAmount, TaxAmount, TotalAmount, PaymentMethod, PaymentStatus,
          TransactionID, PaidAmount, BalanceAmount, BilledBy, Remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [VisitID, BillDate, BillTime, ConsultationFee || 0, MedicineCost || 0,
         LabTestCost || 0, OtherCharges || 0, SubTotal, DiscountAmount || 0,
         TaxAmount || 0, TotalAmount, PaymentMethod, PaymentStatus || 'Pending',
         TransactionID, PaidAmount || 0, BalanceAmount || 0, BilledBy, Remarks]
      );

      logAudit({
        user: req.user, action: 'CREATE', table: 'BillPayment',
        recordID: result.insertId, changes: req.body, ip: req.ip,
      });

      res.status(201).json({ message: 'Bill created', billID: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/billing/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST),
  async (req, res) => {
    const { PaymentStatus, PaidAmount, BalanceAmount, TransactionID, Remarks } = req.body;
    try {
      const [check] = await db.query('SELECT BillID FROM BillPayment WHERE BillID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Bill not found' });

      await db.query(
        `UPDATE BillPayment SET
          PaymentStatus = COALESCE(?, PaymentStatus),
          PaidAmount = COALESCE(?, PaidAmount),
          BalanceAmount = COALESCE(?, BalanceAmount),
          TransactionID = COALESCE(?, TransactionID),
          Remarks = COALESCE(?, Remarks)
        WHERE BillID = ?`,
        [PaymentStatus, PaidAmount, BalanceAmount, TransactionID, Remarks, req.params.id]
      );

      logAudit({
        user: req.user, action: 'UPDATE', table: 'BillPayment',
        recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
      });

      res.json({ message: 'Bill updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/billing/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM BillPayment WHERE BillID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Bill not found' });

    await db.query('DELETE FROM BillPayment WHERE BillID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'BillPayment',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Bill deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ════════════════════════════════════════════════════════════
// EMERGENCY
// ════════════════════════════════════════════════════════════

router.get('/emergency', clinicalStaff, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, m.Name AS MemberName, d.Name AS DoctorName FROM EmergencyCase e
       JOIN Member m ON m.MemberID = e.MemberID
       LEFT JOIN Doctor d ON d.DoctorID = e.DoctorID
       ORDER BY e.IncidentDateTime DESC`
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/emergency',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  async (req, res) => {
    const {
      MemberID, DoctorID, AttendingStaffID, VisitID, IncidentDateTime,
      ReportedBy, Location, Severity, Symptoms, VitalSignsAtArrival,
      FirstAidGiven, ActionTaken, MedicationAdministered, Outcome,
      ReferredToHospital, AmbulanceUsed, AmbulanceArrivalTime,
      FollowUpRequired, CriticalNotes,
    } = req.body;

    if (!MemberID || !AttendingStaffID || !IncidentDateTime || !Location ||
        !Severity || !Symptoms || !ActionTaken || !Outcome)
      return res.status(400).json({ error: 'Missing required fields' });

    try {
      const [result] = await db.query(
        `INSERT INTO EmergencyCase
         (MemberID, DoctorID, AttendingStaffID, VisitID, IncidentDateTime, ReportedBy,
          Location, Severity, Symptoms, VitalSignsAtArrival, FirstAidGiven, ActionTaken,
          MedicationAdministered, Outcome, ReferredToHospital, AmbulanceUsed,
          AmbulanceArrivalTime, FollowUpRequired, CriticalNotes, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [MemberID, DoctorID, AttendingStaffID, VisitID, IncidentDateTime, ReportedBy,
         Location, Severity, Symptoms,
         VitalSignsAtArrival ? JSON.stringify(VitalSignsAtArrival) : null,
         FirstAidGiven, ActionTaken, MedicationAdministered, Outcome,
         ReferredToHospital, AmbulanceUsed || false, AmbulanceArrivalTime,
         FollowUpRequired || false, CriticalNotes]
      );

      logAudit({
        user: req.user, action: 'CREATE', table: 'EmergencyCase',
        recordID: result.insertId, changes: req.body, ip: req.ip,
      });

      res.status(201).json({ message: 'Emergency case created', emergencyID: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/emergency/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  async (req, res) => {
    const { ActionTaken, Outcome, Status, ResolvedDateTime, CriticalNotes } = req.body;
    try {
      const [check] = await db.query('SELECT EmergencyID FROM EmergencyCase WHERE EmergencyID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Emergency case not found' });

      await db.query(
        `UPDATE EmergencyCase SET
          ActionTaken = COALESCE(?, ActionTaken), Outcome = COALESCE(?, Outcome),
          Status = COALESCE(?, Status), ResolvedDateTime = COALESCE(?, ResolvedDateTime),
          CriticalNotes = COALESCE(?, CriticalNotes)
        WHERE EmergencyID = ?`,
        [ActionTaken, Outcome, Status, ResolvedDateTime, CriticalNotes, req.params.id]
      );

      logAudit({
        user: req.user, action: 'UPDATE', table: 'EmergencyCase',
        recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
      });

      res.json({ message: 'Emergency case updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
