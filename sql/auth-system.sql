USE DispensaryManagement;

-- ============================================================
-- STEP 1: SuperAdmin Table
-- Standalone profile table for super admins (no Member/Doctor/Staff entry)
-- ============================================================

CREATE TABLE SuperAdmin (
    SuperAdminID   INT AUTO_INCREMENT PRIMARY KEY,
    Name           VARCHAR(100)  NOT NULL,
    Email          VARCHAR(100)  NOT NULL UNIQUE,
    Phone          VARCHAR(15)   NOT NULL,
    CreatedAt      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    Status         ENUM('Active', 'Inactive') DEFAULT 'Active'
);


-- ============================================================
-- STEP 2: SystemRole Table
-- Lookup table of all roles in the system
-- ============================================================

CREATE TABLE SystemRole (
    RoleID    INT AUTO_INCREMENT PRIMARY KEY,
    RoleName  VARCHAR(50) NOT NULL UNIQUE
);

-- Seed all roles
INSERT INTO SystemRole (RoleName) VALUES
('Student'),
('Faculty'),
('Staff'),
('Doctor'),
('Nurse'),
('Pharmacist'),
('Admin'),
('Technician'),
('Support Staff'),
('SuperAdmin');


-- ============================================================
-- STEP 3: UserLogin Table
-- Single source of truth for all credentials
-- EntityType + EntityID identify which table the user belongs to
-- SuperAdmin rows have EntityType='SuperAdmin', EntityID = SuperAdminID
-- ============================================================

CREATE TABLE UserLogin (
    UserLoginID   INT AUTO_INCREMENT PRIMARY KEY,
    Username      VARCHAR(100)  NOT NULL UNIQUE,
    PasswordHash  VARCHAR(255)  NOT NULL DEFAULT 'CHANGEME',  -- must be reset on first login
    EntityType    ENUM('Member', 'Doctor', 'Staff', 'SuperAdmin') NOT NULL,
    EntityID      INT           NOT NULL,
    IsActive      BOOLEAN       DEFAULT TRUE,
    LastLogin     TIMESTAMP     NULL,
    CreatedAt     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate login rows for same entity
    CONSTRAINT uq_entity UNIQUE (EntityType, EntityID)
);


-- ============================================================
-- STEP 4: UserRoleMapping Table
-- Many-to-many: one login can have multiple roles
-- ============================================================

CREATE TABLE UserRoleMapping (
    MappingID    INT AUTO_INCREMENT PRIMARY KEY,
    UserLoginID  INT  NOT NULL,
    RoleID       INT  NOT NULL,
    AssignedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_urm_login FOREIGN KEY (UserLoginID)
        REFERENCES UserLogin(UserLoginID)
        ON DELETE CASCADE   -- login deleted → remove all its role mappings
        ON UPDATE CASCADE,

    CONSTRAINT fk_urm_role FOREIGN KEY (RoleID)
        REFERENCES SystemRole(RoleID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Prevent assigning the same role twice to the same login
    CONSTRAINT uq_login_role UNIQUE (UserLoginID, RoleID)
);


-- ============================================================
-- STEP 5: Triggers on Member
-- ============================================================

DELIMITER //

-- 5a. AFTER INSERT on Member
--     → Create UserLogin using RollNumberOrEmployeeCode as username
--     → Auto-assign role based on MemberType
CREATE TRIGGER trg_member_after_insert
AFTER INSERT ON Member
FOR EACH ROW
BEGIN
    DECLARE v_login_id INT;
    DECLARE v_role_id  INT;

    -- Create the login row
    INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
    VALUES (NEW.RollNumberOrEmployeeCode, 'Member', NEW.MemberID, TRUE);

    SET v_login_id = LAST_INSERT_ID();

    -- Resolve the role based on MemberType
    SELECT RoleID INTO v_role_id
    FROM SystemRole
    WHERE RoleName = NEW.MemberType;  -- MemberType values match RoleName: 'Student','Faculty','Staff'

    -- Assign the role
    INSERT INTO UserRoleMapping (UserLoginID, RoleID)
    VALUES (v_login_id, v_role_id);
END//


-- 5b. AFTER UPDATE on Member
--     → If Status flipped to 'Inactive', deactivate the login (keep the row)
--     → If Status flipped back to 'Active', re-activate the login
CREATE TRIGGER trg_member_after_update
AFTER UPDATE ON Member
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        IF NEW.Status = 'Inactive' THEN
            UPDATE UserLogin
            SET IsActive = FALSE
            WHERE EntityType = 'Member' AND EntityID = NEW.MemberID;

        ELSEIF NEW.Status = 'Active' THEN
            UPDATE UserLogin
            SET IsActive = TRUE
            WHERE EntityType = 'Member' AND EntityID = NEW.MemberID;
        END IF;
    END IF;
END//


-- 5c. BEFORE DELETE on Member
--     → Deactivate the login (keep it for audit trail, per your requirement)
--     → Role mappings are left intact since login row stays
CREATE TRIGGER trg_member_before_delete
BEFORE DELETE ON Member
FOR EACH ROW
BEGIN
    UPDATE UserLogin
    SET IsActive = FALSE
    WHERE EntityType = 'Member' AND EntityID = OLD.MemberID;
END//


-- ============================================================
-- STEP 6: Triggers on Doctor
-- ============================================================

-- 6a. AFTER INSERT on Doctor → Create UserLogin + assign Doctor role
CREATE TRIGGER trg_doctor_after_insert
AFTER INSERT ON Doctor
FOR EACH ROW
BEGIN
    DECLARE v_login_id INT;
    DECLARE v_role_id  INT;

    INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
    VALUES (NEW.LicenseNumber, 'Doctor', NEW.DoctorID, TRUE);

    SET v_login_id = LAST_INSERT_ID();

    SELECT RoleID INTO v_role_id
    FROM SystemRole WHERE RoleName = 'Doctor';

    INSERT INTO UserRoleMapping (UserLoginID, RoleID)
    VALUES (v_login_id, v_role_id);
END//


-- 6b. AFTER UPDATE on Doctor → Sync IsActive with Status
CREATE TRIGGER trg_doctor_after_update
AFTER UPDATE ON Doctor
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        IF NEW.Status = 'Inactive' THEN
            UPDATE UserLogin SET IsActive = FALSE
            WHERE EntityType = 'Doctor' AND EntityID = NEW.DoctorID;

        ELSEIF NEW.Status = 'Active' THEN
            UPDATE UserLogin SET IsActive = TRUE
            WHERE EntityType = 'Doctor' AND EntityID = NEW.DoctorID;
        END IF;
    END IF;
END//


-- 6c. BEFORE DELETE on Doctor → Deactivate login (keep row)
CREATE TRIGGER trg_doctor_before_delete
BEFORE DELETE ON Doctor
FOR EACH ROW
BEGIN
    UPDATE UserLogin
    SET IsActive = FALSE
    WHERE EntityType = 'Doctor' AND EntityID = OLD.DoctorID;
END//


-- ============================================================
-- STEP 7: Triggers on StaffEmployee
-- ============================================================

-- 7a. AFTER INSERT on StaffEmployee
--     → Username = LicenseNumber if available, else 'EMP' + EmployeeID
--     → Role is mapped directly from the Role column in StaffEmployee
CREATE TRIGGER trg_staff_after_insert
AFTER INSERT ON StaffEmployee
FOR EACH ROW
BEGIN
    DECLARE v_login_id INT;
    DECLARE v_role_id  INT;
    DECLARE v_username VARCHAR(100);

    -- Build username: prefer LicenseNumber, fall back to EMP00001 style
    IF NEW.LicenseNumber IS NOT NULL AND NEW.LicenseNumber != '' THEN
        SET v_username = NEW.LicenseNumber;
    ELSE
        SET v_username = CONCAT('EMP', LPAD(NEW.EmployeeID, 5, '0'));
    END IF;

    INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
    VALUES (v_username, 'Staff', NEW.EmployeeID, TRUE);

    SET v_login_id = LAST_INSERT_ID();

    -- NEW.Role values match SystemRole.RoleName exactly:
    -- 'Nurse','Pharmacist','Admin','Technician','Support Staff'
    SELECT RoleID INTO v_role_id
    FROM SystemRole WHERE RoleName = NEW.Role;

    INSERT INTO UserRoleMapping (UserLoginID, RoleID)
    VALUES (v_login_id, v_role_id);
END//


-- 7b. AFTER UPDATE on StaffEmployee → Sync IsActive with Status
CREATE TRIGGER trg_staff_after_update
AFTER UPDATE ON StaffEmployee
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        IF NEW.Status IN ('Inactive', 'Resigned') THEN
            UPDATE UserLogin SET IsActive = FALSE
            WHERE EntityType = 'Staff' AND EntityID = NEW.EmployeeID;

        ELSEIF NEW.Status = 'Active' THEN
            UPDATE UserLogin SET IsActive = TRUE
            WHERE EntityType = 'Staff' AND EntityID = NEW.EmployeeID;
        END IF;
    END IF;
END//


-- 7c. BEFORE DELETE on StaffEmployee → Deactivate login (keep row)
CREATE TRIGGER trg_staff_before_delete
BEFORE DELETE ON StaffEmployee
FOR EACH ROW
BEGIN
    UPDATE UserLogin
    SET IsActive = FALSE
    WHERE EntityType = 'Staff' AND EntityID = OLD.EmployeeID;
END//


-- ============================================================
-- STEP 8: Triggers on SuperAdmin
-- ============================================================

-- 8a. AFTER INSERT on SuperAdmin → Create UserLogin using Email as username
--     SuperAdmin username = their Email (already unique)
CREATE TRIGGER trg_superadmin_after_insert
AFTER INSERT ON SuperAdmin
FOR EACH ROW
BEGIN
    DECLARE v_login_id INT;
    DECLARE v_role_id  INT;

    INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
    VALUES (NEW.Email, 'SuperAdmin', NEW.SuperAdminID, TRUE);

    SET v_login_id = LAST_INSERT_ID();

    SELECT RoleID INTO v_role_id
    FROM SystemRole WHERE RoleName = 'SuperAdmin';

    INSERT INTO UserRoleMapping (UserLoginID, RoleID)
    VALUES (v_login_id, v_role_id);
END//


-- 8b. AFTER UPDATE on SuperAdmin → Sync IsActive with Status
CREATE TRIGGER trg_superadmin_after_update
AFTER UPDATE ON SuperAdmin
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        IF NEW.Status = 'Inactive' THEN
            UPDATE UserLogin SET IsActive = FALSE
            WHERE EntityType = 'SuperAdmin' AND EntityID = NEW.SuperAdminID;

        ELSEIF NEW.Status = 'Active' THEN
            UPDATE UserLogin SET IsActive = TRUE
            WHERE EntityType = 'SuperAdmin' AND EntityID = NEW.SuperAdminID;
        END IF;
    END IF;
END//


-- 8c. BEFORE DELETE on SuperAdmin → Deactivate login (keep row)
CREATE TRIGGER trg_superadmin_before_delete
BEFORE DELETE ON SuperAdmin
FOR EACH ROW
BEGIN
    UPDATE UserLogin
    SET IsActive = FALSE
    WHERE EntityType = 'SuperAdmin' AND EntityID = OLD.SuperAdminID;
END//

DELIMITER ;


-- ============================================================
-- STEP 9: Backfill existing data
-- The 10 Members, 5 Doctors, 5 Staff inserted earlier have NO login yet.
-- Run this once to generate their logins + roles.
-- ============================================================

-- Backfill Members
INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
SELECT
    RollNumberOrEmployeeCode,
    'Member',
    MemberID,
    CASE WHEN Status = 'Active' THEN TRUE ELSE FALSE END
FROM Member
WHERE NOT EXISTS (
    SELECT 1 FROM UserLogin
    WHERE EntityType = 'Member' AND EntityID = Member.MemberID
);

INSERT INTO UserRoleMapping (UserLoginID, RoleID)
SELECT
    ul.UserLoginID,
    sr.RoleID
FROM Member m
JOIN UserLogin ul ON ul.EntityType = 'Member' AND ul.EntityID = m.MemberID
JOIN SystemRole sr ON sr.RoleName = m.MemberType
WHERE NOT EXISTS (
    SELECT 1 FROM UserRoleMapping
    WHERE UserLoginID = ul.UserLoginID AND RoleID = sr.RoleID
);

-- Backfill Doctors
INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
SELECT
    LicenseNumber,
    'Doctor',
    DoctorID,
    CASE WHEN Status = 'Active' THEN TRUE ELSE FALSE END
FROM Doctor
WHERE NOT EXISTS (
    SELECT 1 FROM UserLogin
    WHERE EntityType = 'Doctor' AND EntityID = Doctor.DoctorID
);

INSERT INTO UserRoleMapping (UserLoginID, RoleID)
SELECT
    ul.UserLoginID,
    sr.RoleID
FROM Doctor d
JOIN UserLogin ul ON ul.EntityType = 'Doctor' AND ul.EntityID = d.DoctorID
JOIN SystemRole sr ON sr.RoleName = 'Doctor'
WHERE NOT EXISTS (
    SELECT 1 FROM UserRoleMapping
    WHERE UserLoginID = ul.UserLoginID AND RoleID = sr.RoleID
);

-- Backfill StaffEmployee
INSERT INTO UserLogin (Username, EntityType, EntityID, IsActive)
SELECT
    COALESCE(
        NULLIF(LicenseNumber, ''),
        CONCAT('EMP', LPAD(EmployeeID, 5, '0'))
    ),
    'Staff',
    EmployeeID,
    CASE WHEN Status = 'Active' THEN TRUE ELSE FALSE END
FROM StaffEmployee
WHERE NOT EXISTS (
    SELECT 1 FROM UserLogin
    WHERE EntityType = 'Staff' AND EntityID = StaffEmployee.EmployeeID
);

INSERT INTO UserRoleMapping (UserLoginID, RoleID)
SELECT
    ul.UserLoginID,
    sr.RoleID
FROM StaffEmployee se
JOIN UserLogin ul ON ul.EntityType = 'Staff' AND ul.EntityID = se.EmployeeID
JOIN SystemRole sr ON sr.RoleName = se.Role
WHERE NOT EXISTS (
    SELECT 1 FROM UserRoleMapping
    WHERE UserLoginID = ul.UserLoginID AND RoleID = sr.RoleID
);


-- ============================================================
-- STEP 10: Indexes for performance
-- ============================================================

CREATE INDEX idx_userlogin_entity   ON UserLogin(EntityType, EntityID);
CREATE INDEX idx_userlogin_username ON UserLogin(Username);
CREATE INDEX idx_userlogin_active   ON UserLogin(IsActive);
CREATE INDEX idx_urm_login          ON UserRoleMapping(UserLoginID);
CREATE INDEX idx_urm_role           ON UserRoleMapping(RoleID);


-- ============================================================
-- STEP 11: Verification queries
-- Run these to confirm everything is wired correctly
-- ============================================================

-- See all logins with their roles
SELECT
    ul.UserLoginID,
    ul.Username,
    ul.EntityType,
    ul.EntityID,
    ul.IsActive,
    GROUP_CONCAT(sr.RoleName ORDER BY sr.RoleName SEPARATOR ', ') AS Roles
FROM UserLogin ul
LEFT JOIN UserRoleMapping urm ON urm.UserLoginID = ul.UserLoginID
LEFT JOIN SystemRole sr       ON sr.RoleID = urm.RoleID
GROUP BY ul.UserLoginID, ul.Username, ul.EntityType, ul.EntityID, ul.IsActive
ORDER BY ul.EntityType, ul.EntityID;

-- Count logins per entity type
SELECT EntityType, COUNT(*) AS LoginCount, SUM(IsActive) AS ActiveCount
FROM UserLogin
GROUP BY EntityType;
