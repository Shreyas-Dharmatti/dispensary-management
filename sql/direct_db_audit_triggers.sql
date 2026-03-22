USE DispensaryManagement;

-- ============================================================
-- DirectDBChangeLog table
-- Written to by MySQL triggers on sensitive tables.
-- If a row appears here but NOT in audit.log → direct DB change.
-- ============================================================

CREATE TABLE IF NOT EXISTS DirectDBChangeLog (
    LogID        INT AUTO_INCREMENT PRIMARY KEY,
    TableName    VARCHAR(100) NOT NULL,
    Action       ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    RecordID     INT,
    ChangedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ChangedBy    VARCHAR(100) DEFAULT (USER()),  -- MySQL user, e.g. root@localhost
    Note         VARCHAR(200) DEFAULT 'Direct DB modification detected'
);

-- ============================================================
-- Triggers on Member
-- ============================================================

DELIMITER //

CREATE TRIGGER trg_audit_member_insert
AFTER INSERT ON Member
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Member', 'INSERT', NEW.MemberID);
END//

CREATE TRIGGER trg_audit_member_update
AFTER UPDATE ON Member
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Member', 'UPDATE', NEW.MemberID);
END//

CREATE TRIGGER trg_audit_member_delete
AFTER DELETE ON Member
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Member', 'DELETE', OLD.MemberID);
END//

-- ============================================================
-- Triggers on Doctor
-- ============================================================

CREATE TRIGGER trg_audit_doctor_insert
AFTER INSERT ON Doctor
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Doctor', 'INSERT', NEW.DoctorID);
END//

CREATE TRIGGER trg_audit_doctor_update
AFTER UPDATE ON Doctor
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Doctor', 'UPDATE', NEW.DoctorID);
END//

CREATE TRIGGER trg_audit_doctor_delete
AFTER DELETE ON Doctor
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Doctor', 'DELETE', OLD.DoctorID);
END//

-- ============================================================
-- Triggers on StaffEmployee
-- ============================================================

CREATE TRIGGER trg_audit_staff_insert
AFTER INSERT ON StaffEmployee
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('StaffEmployee', 'INSERT', NEW.EmployeeID);
END//

CREATE TRIGGER trg_audit_staff_update
AFTER UPDATE ON StaffEmployee
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('StaffEmployee', 'UPDATE', NEW.EmployeeID);
END//

CREATE TRIGGER trg_audit_staff_delete
AFTER DELETE ON StaffEmployee
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('StaffEmployee', 'DELETE', OLD.EmployeeID);
END//

-- ============================================================
-- Triggers on Inventory
-- ============================================================

CREATE TRIGGER trg_audit_inventory_update
AFTER UPDATE ON Inventory
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Inventory', 'UPDATE', NEW.InventoryID);
END//

CREATE TRIGGER trg_audit_inventory_delete
AFTER DELETE ON Inventory
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Inventory', 'DELETE', OLD.InventoryID);
END//

-- ============================================================
-- Triggers on Prescription
-- ============================================================

CREATE TRIGGER trg_audit_presc_insert
AFTER INSERT ON Prescription
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Prescription', 'INSERT', NEW.PrescriptionID);
END//

CREATE TRIGGER trg_audit_presc_delete
AFTER DELETE ON Prescription
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID)
    VALUES ('Prescription', 'DELETE', OLD.PrescriptionID);
END//

-- ============================================================
-- Triggers on UserLogin
-- ============================================================

CREATE TRIGGER trg_audit_userlogin_update
AFTER UPDATE ON UserLogin
FOR EACH ROW
BEGIN
    INSERT INTO DirectDBChangeLog (TableName, Action, RecordID,
        Note)
    VALUES ('UserLogin', 'UPDATE', NEW.UserLoginID,
        'Direct credential/status change detected');
END//

DELIMITER ;

-- ============================================================
-- How to detect unauthorized changes:
--
-- Any row in DirectDBChangeLog where ChangedBy != 'your_app_user'
-- OR where no matching entry exists in audit.log for the same
-- RecordID + TableName + timestamp window = direct DB modification.
--
-- Quick check query:
-- SELECT * FROM DirectDBChangeLog ORDER BY ChangedAt DESC;
-- ============================================================
