const express = require('express');
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const { requireRole, clinicalStaff, ROLES } = require('../middleware/permissions');
const { logAudit } = require('../utils/audit');

const router = express.Router();
router.use(auth);

// ════════════════════════════════════════════════════════════
// MEDICINES
// ════════════════════════════════════════════════════════════

router.get('/medicines', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Medicine ORDER BY Name');
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/medicines/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Medicine WHERE MedicineID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/medicines',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST),
  async (req, res) => {
    const { Name, GenericName, Category, Form, Manufacturer, UnitPrice, RequiresPrescription, Status } = req.body;
    if (!Name || !Category || !Form || UnitPrice === undefined)
      return res.status(400).json({ error: 'Missing required fields' });
    if (UnitPrice < 0)
      return res.status(400).json({ error: 'UnitPrice cannot be negative' });

    try {
      const [result] = await db.query(
        `INSERT INTO Medicine (Name, GenericName, Category, Form, Manufacturer, UnitPrice, RequiresPrescription, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [Name, GenericName, Category, Form, Manufacturer, UnitPrice,
         RequiresPrescription ?? true, Status || 'Available']
      );

      logAudit({
        user: req.user, action: 'CREATE', table: 'Medicine',
        recordID: result.insertId, changes: req.body, ip: req.ip,
      });

      res.status(201).json({ message: 'Medicine created', medicineID: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/medicines/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST),
  async (req, res) => {
    const { Name, GenericName, Category, Form, Manufacturer, UnitPrice, RequiresPrescription, Status } = req.body;
    try {
      const [check] = await db.query('SELECT MedicineID FROM Medicine WHERE MedicineID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Medicine not found' });

      await db.query(
        `UPDATE Medicine SET
          Name = COALESCE(?, Name), GenericName = COALESCE(?, GenericName),
          Category = COALESCE(?, Category), Form = COALESCE(?, Form),
          Manufacturer = COALESCE(?, Manufacturer), UnitPrice = COALESCE(?, UnitPrice),
          RequiresPrescription = COALESCE(?, RequiresPrescription), Status = COALESCE(?, Status)
        WHERE MedicineID = ?`,
        [Name, GenericName, Category, Form, Manufacturer, UnitPrice, RequiresPrescription, Status, req.params.id]
      );

      logAudit({
        user: req.user, action: 'UPDATE', table: 'Medicine',
        recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
      });

      res.json({ message: 'Medicine updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/medicines/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  async (req, res) => {
    try {
      const [check] = await db.query('SELECT * FROM Medicine WHERE MedicineID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Medicine not found' });

      await db.query('DELETE FROM Medicine WHERE MedicineID = ?', [req.params.id]);

      logAudit({
        user: req.user, action: 'DELETE', table: 'Medicine',
        recordID: parseInt(req.params.id),
        changes: { deletedRecord: check[0] }, ip: req.ip,
      });

      res.json({ message: 'Medicine deleted' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(409).json({ error: 'Cannot delete medicine used in inventory or prescriptions' });
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);


// ════════════════════════════════════════════════════════════
// INVENTORY
// ════════════════════════════════════════════════════════════

router.get('/inventory', clinicalStaff, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, m.Name AS MedicineName, s.CompanyName AS SupplierName
       FROM Inventory i
       JOIN Medicine m ON m.MedicineID = i.MedicineID
       LEFT JOIN MedicalSupplier s ON s.SupplierID = i.SupplierID
       ORDER BY i.ExpiryDate`
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/inventory/low-stock', clinicalStaff, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, m.Name AS MedicineName FROM Inventory i
       JOIN Medicine m ON m.MedicineID = i.MedicineID
       WHERE i.Quantity <= i.ReorderLevel AND i.Status = 'Available'
       ORDER BY i.Quantity`
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/inventory/:id', clinicalStaff, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Inventory WHERE InventoryID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Inventory record not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/inventory',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST),
  async (req, res) => {
    const {
      MedicineID, BatchNumber, Quantity, ManufactureDate, ExpiryDate,
      Location, SupplierID, PurchaseDate, PurchasePrice, ReorderLevel, MinimumStock, Status,
    } = req.body;

    if (!MedicineID || !BatchNumber || Quantity === undefined || !ManufactureDate || !ExpiryDate || !Location)
      return res.status(400).json({ error: 'Missing required fields' });

    try {
      const [result] = await db.query(
        `INSERT INTO Inventory
         (MedicineID, BatchNumber, Quantity, ManufactureDate, ExpiryDate,
          Location, SupplierID, PurchaseDate, PurchasePrice, ReorderLevel, MinimumStock, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [MedicineID, BatchNumber, Quantity, ManufactureDate, ExpiryDate,
         Location, SupplierID, PurchaseDate, PurchasePrice,
         ReorderLevel || 10, MinimumStock || 5, Status || 'Available']
      );

      logAudit({
        user: req.user, action: 'CREATE', table: 'Inventory',
        recordID: result.insertId, changes: req.body, ip: req.ip,
      });

      res.status(201).json({ message: 'Inventory record created', inventoryID: result.insertId });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(409).json({ error: 'Batch number already exists for this medicine' });
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put('/inventory/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST),
  async (req, res) => {
    const { Quantity, Location, ReorderLevel, MinimumStock, Status } = req.body;
    try {
      const [check] = await db.query('SELECT InventoryID FROM Inventory WHERE InventoryID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Inventory record not found' });

      await db.query(
        `UPDATE Inventory SET
          Quantity = COALESCE(?, Quantity), Location = COALESCE(?, Location),
          ReorderLevel = COALESCE(?, ReorderLevel), MinimumStock = COALESCE(?, MinimumStock),
          Status = COALESCE(?, Status)
        WHERE InventoryID = ?`,
        [Quantity, Location, ReorderLevel, MinimumStock, Status, req.params.id]
      );

      logAudit({
        user: req.user, action: 'UPDATE', table: 'Inventory',
        recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
      });

      res.json({ message: 'Inventory updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete('/inventory/:id',
  requireRole(ROLES.SUPERADMIN, ROLES.ADMIN),
  async (req, res) => {
    try {
      const [check] = await db.query('SELECT * FROM Inventory WHERE InventoryID = ?', [req.params.id]);
      if (check.length === 0) return res.status(404).json({ error: 'Inventory record not found' });

      await db.query('DELETE FROM Inventory WHERE InventoryID = ?', [req.params.id]);

      logAudit({
        user: req.user, action: 'DELETE', table: 'Inventory',
        recordID: parseInt(req.params.id),
        changes: { deletedRecord: check[0] }, ip: req.ip,
      });

      res.json({ message: 'Inventory record deleted' });
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2')
        return res.status(409).json({ error: 'Cannot delete inventory record linked to dispense records' });
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);


// ════════════════════════════════════════════════════════════
// SUPPLIERS
// ════════════════════════════════════════════════════════════

router.get('/suppliers', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM MedicalSupplier ORDER BY CompanyName');
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/suppliers/:id', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PHARMACIST), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM MedicalSupplier WHERE SupplierID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/suppliers', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  const {
    CompanyName, ContactPerson, Email, Phone, AlternatePhone,
    Address, City, State, PinCode, GSTNumber, LicenseNumber,
    SupplyCategory, ContractStartDate, ContractEndDate, PaymentTerms, Status,
  } = req.body;

  if (!CompanyName || !ContactPerson || !Email || !Phone || !Address || !LicenseNumber)
    return res.status(400).json({ error: 'Missing required fields' });

  try {
    const [result] = await db.query(
      `INSERT INTO MedicalSupplier
       (CompanyName, ContactPerson, Email, Phone, AlternatePhone, Address, City, State,
        PinCode, GSTNumber, LicenseNumber, SupplyCategory, ContractStartDate,
        ContractEndDate, PaymentTerms, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [CompanyName, ContactPerson, Email, Phone, AlternatePhone, Address, City, State,
       PinCode, GSTNumber, LicenseNumber, SupplyCategory, ContractStartDate,
       ContractEndDate, PaymentTerms, Status || 'Active']
    );

    logAudit({
      user: req.user, action: 'CREATE', table: 'MedicalSupplier',
      recordID: result.insertId, changes: req.body, ip: req.ip,
    });

    res.status(201).json({ message: 'Supplier created', supplierID: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/suppliers/:id', requireRole(ROLES.SUPERADMIN, ROLES.ADMIN), async (req, res) => {
  const { CompanyName, ContactPerson, Email, Phone, Address, City, State, Rating, Status } = req.body;
  try {
    const [check] = await db.query('SELECT SupplierID FROM MedicalSupplier WHERE SupplierID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Supplier not found' });

    await db.query(
      `UPDATE MedicalSupplier SET
        CompanyName = COALESCE(?, CompanyName), ContactPerson = COALESCE(?, ContactPerson),
        Email = COALESCE(?, Email), Phone = COALESCE(?, Phone),
        Address = COALESCE(?, Address), City = COALESCE(?, City),
        State = COALESCE(?, State), Rating = COALESCE(?, Rating),
        Status = COALESCE(?, Status)
      WHERE SupplierID = ?`,
      [CompanyName, ContactPerson, Email, Phone, Address, City, State, Rating, Status, req.params.id]
    );

    logAudit({
      user: req.user, action: 'UPDATE', table: 'MedicalSupplier',
      recordID: parseInt(req.params.id), changes: req.body, ip: req.ip,
    });

    res.json({ message: 'Supplier updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/suppliers/:id', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  try {
    const [check] = await db.query('SELECT * FROM MedicalSupplier WHERE SupplierID = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ error: 'Supplier not found' });

    await db.query('DELETE FROM MedicalSupplier WHERE SupplierID = ?', [req.params.id]);

    logAudit({
      user: req.user, action: 'DELETE', table: 'MedicalSupplier',
      recordID: parseInt(req.params.id),
      changes: { deletedRecord: check[0] }, ip: req.ip,
    });

    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
