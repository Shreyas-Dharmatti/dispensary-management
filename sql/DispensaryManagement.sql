USE DispensaryManagement;
CREATE TABLE Member (
    MemberID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Age INT NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    ContactNumber VARCHAR(15) NOT NULL,
    RollNumberOrEmployeeCode VARCHAR(50),
    Department VARCHAR(100),
    BloodGroup VARCHAR(5) NOT NULL,
    EmergencyContact VARCHAR(15) NOT NULL,
    Address TEXT,
    RegistrationDate DATE NOT NULL,
    MemberType ENUM('Student', 'Faculty', 'Staff') NOT NULL,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    
    -- Constraints
    CONSTRAINT chk_age CHECK (Age >= 16),
    CONSTRAINT chk_contact CHECK (ContactNumber REGEXP '^[0-9]{10,15}$')
);

CREATE TABLE Doctor (
    DoctorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Specialization VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL,
    LicenseNumber VARCHAR(50) NOT NULL UNIQUE,
    AvailableFrom TIME,
    AvailableTo TIME,
    WorkingDays VARCHAR(100),
    Status ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
    
    CONSTRAINT chk_doctor_time CHECK (AvailableTo > AvailableFrom)
);

CREATE TABLE StaffEmployee (EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role ENUM('Nurse', 'Pharmacist', 'Admin', 'Technician', 'Support Staff') NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL,
    ShiftTiming VARCHAR(50),
    HireDate DATE NOT NULL,
    LicenseNumber VARCHAR(50),
    Status ENUM('Active', 'On Leave', 'Resigned') DEFAULT 'Active'
);

DELIMITER //

CREATE TRIGGER trg_hiredate_check
BEFORE INSERT ON StaffEmployee
FOR EACH ROW
BEGIN
    IF NEW.HireDate > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hire date cannot be in future';
    END IF;
END//

DELIMITER ;

CREATE TABLE Medicine (
    MedicineID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    GenericName VARCHAR(200),
    Category VARCHAR(100) NOT NULL,
    Form ENUM('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other') NOT NULL,
    Manufacturer VARCHAR(200),
    UnitPrice DECIMAL(10,2) NOT NULL,
    RequiresPrescription BOOLEAN DEFAULT TRUE,
    Status ENUM('Available', 'Discontinued') DEFAULT 'Available',
    
    CONSTRAINT chk_price CHECK (UnitPrice >= 0)
);


CREATE TABLE MedicalSupplier (
    SupplierID INT AUTO_INCREMENT PRIMARY KEY,
    CompanyName VARCHAR(200) NOT NULL,
    ContactPerson VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    AlternatePhone VARCHAR(15),
    Address TEXT NOT NULL,
    City VARCHAR(100),
    State VARCHAR(100),
    PinCode VARCHAR(10),
    GSTNumber VARCHAR(15),
    LicenseNumber VARCHAR(50) NOT NULL,
    SupplyCategory VARCHAR(200),
    Rating DECIMAL(3,2) DEFAULT 0.00,
    ContractStartDate DATE,
    ContractEndDate DATE,
    PaymentTerms VARCHAR(100),
    Status ENUM('Active', 'Inactive', 'Blacklisted') DEFAULT 'Active',
    RegisteredDate DATE DEFAULT (CURDATE()),
    LastSupplyDate DATE,
    
    CONSTRAINT chk_supplier_rating CHECK (Rating >= 0 AND Rating <= 5),
    CONSTRAINT chk_supplier_contract CHECK (
        ContractEndDate IS NULL OR 
        ContractStartDate IS NULL OR 
        ContractEndDate > ContractStartDate
    )
);

CREATE TABLE MedicalHistory (
    HistoryID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    ChronicConditions TEXT,
    KnownAllergies TEXT NOT NULL,
    PastSurgeries TEXT,
    FamilyHistory TEXT,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    BloodPressure VARCHAR(20),
    Height DECIMAL(5,2),
    Weight DECIMAL(5,2),
    
    CONSTRAINT fk_medical_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE TABLE Appointment (
    AppointmentID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    DoctorID INT NOT NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    Symptoms TEXT,
    Status ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') 
        DEFAULT 'Scheduled' NOT NULL,
    Priority ENUM('Normal', 'Urgent', 'Emergency') 
        DEFAULT 'Normal' NOT NULL,
    TokenNumber INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appt_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT fk_appt_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

DELIMITER //

CREATE TRIGGER trg_check_appointment_date
BEFORE INSERT ON Appointment
FOR EACH ROW
BEGIN
    IF NEW.AppointmentDate < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appointment date cannot be in the past';
    END IF;
END//

DELIMITER ;

DELIMITER //

CREATE TRIGGER trg_update_appointment_date
BEFORE UPDATE ON Appointment
FOR EACH ROW
BEGIN
    IF NEW.AppointmentDate < CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appointment date cannot be in the past';
    END IF;
END//

DELIMITER ;

CREATE TABLE Inventory (
    InventoryID INT AUTO_INCREMENT PRIMARY KEY,
    MedicineID INT NOT NULL,
    BatchNumber VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,
    ManufactureDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    Location VARCHAR(100) NOT NULL,
    SupplierID INT,
    PurchaseDate DATE,
    PurchasePrice DECIMAL(10,2),
    ReorderLevel INT NOT NULL DEFAULT 10,
    MinimumStock INT NOT NULL DEFAULT 5,
    Status ENUM('Available', 'Reserved', 'Expired', 'Damaged') DEFAULT 'Available',
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_inv_medicine FOREIGN KEY (MedicineID) 
        REFERENCES Medicine(MedicineID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_inv_supplier FOREIGN KEY (SupplierID) 
        REFERENCES MedicalSupplier(SupplierID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_inv_quantity CHECK (Quantity >= 0),
    CONSTRAINT chk_inv_dates CHECK (ExpiryDate > ManufactureDate),
    CONSTRAINT chk_inv_price CHECK (PurchasePrice >= 0),
    CONSTRAINT chk_inv_reorder CHECK (ReorderLevel > 0 AND MinimumStock > 0),
    CONSTRAINT uq_batch_medicine UNIQUE (MedicineID, BatchNumber)
);

CREATE TABLE Visit (
    VisitID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    DoctorID INT NOT NULL,
    AppointmentID INT,
    VisitDate DATE NOT NULL,
    VisitTime TIME NOT NULL,
    ChiefComplaint TEXT NOT NULL,
    Diagnosis TEXT,
    VitalSigns JSON,
    TreatmentNotes TEXT,
    FollowUpRequired BOOLEAN DEFAULT FALSE,
    FollowUpDate DATE,
    VisitType ENUM('Walk-in', 'Scheduled', 'Emergency') NOT NULL,
    Status ENUM('In Progress', 'Completed', 'Referred') DEFAULT 'In Progress',
    
    CONSTRAINT fk_visit_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_visit_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_visit_appt FOREIGN KEY (AppointmentID) 
        REFERENCES Appointment(AppointmentID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_followup_date CHECK (FollowUpDate IS NULL OR FollowUpDate > VisitDate)
);

CREATE TABLE Prescription (
    PrescriptionID INT AUTO_INCREMENT PRIMARY KEY,
    VisitID INT NOT NULL,
    MemberID INT NOT NULL,
    DoctorID INT NOT NULL,
    IssueDate DATE NOT NULL,
    ValidUntil DATE NOT NULL,
    Diagnosis TEXT NOT NULL,
    SpecialInstructions TEXT,
    Status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    
    CONSTRAINT fk_presc_visit FOREIGN KEY (VisitID) 
        REFERENCES Visit(VisitID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_presc_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_presc_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_presc_validity CHECK (ValidUntil > IssueDate)
);

CREATE TABLE PrescriptionItem (
    PrescriptionItemID INT AUTO_INCREMENT PRIMARY KEY,
    PrescriptionID INT NOT NULL,
    MedicineID INT NOT NULL,
    Dosage VARCHAR(100) NOT NULL,
    Frequency VARCHAR(100) NOT NULL,
    Duration VARCHAR(50) NOT NULL,
    Quantity INT NOT NULL,
    Instructions TEXT,
    
    CONSTRAINT fk_prescitem_presc FOREIGN KEY (PrescriptionID) 
        REFERENCES Prescription(PrescriptionID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_prescitem_medicine FOREIGN KEY (MedicineID) 
        REFERENCES Medicine(MedicineID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_prescitem_quantity CHECK (Quantity > 0)
);

CREATE TABLE MedicineDispense (
    DispenseID INT AUTO_INCREMENT PRIMARY KEY,
    PrescriptionID INT NOT NULL,
    PrescriptionItemID INT NOT NULL,
    MedicineID INT NOT NULL,
    InventoryID INT NOT NULL,
    QuantityDispensed INT NOT NULL,
    DispensedBy INT NOT NULL,
    DispenseDate DATE NOT NULL,
    DispenseTime TIME NOT NULL,
    BatchNumber VARCHAR(50),
    UnitPrice DECIMAL(10,2) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    
    CONSTRAINT fk_dispense_presc FOREIGN KEY (PrescriptionID) 
        REFERENCES Prescription(PrescriptionID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_prescitem FOREIGN KEY (PrescriptionItemID) 
        REFERENCES PrescriptionItem(PrescriptionItemID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_medicine FOREIGN KEY (MedicineID) 
        REFERENCES Medicine(MedicineID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_inventory FOREIGN KEY (InventoryID) 
        REFERENCES Inventory(InventoryID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_dispense_staff FOREIGN KEY (DispensedBy) 
        REFERENCES StaffEmployee(EmployeeID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT chk_dispense_quantity CHECK (QuantityDispensed > 0),
    CONSTRAINT chk_dispense_price CHECK (UnitPrice >= 0 AND TotalPrice >= 0)
);

CREATE TABLE BillPayment (
    BillID INT AUTO_INCREMENT PRIMARY KEY,
    VisitID INT NOT NULL,
    BillDate DATE NOT NULL,
    BillTime TIME NOT NULL,
    
   
    ConsultationFee DECIMAL(10,2) DEFAULT 0.00,
    MedicineCost DECIMAL(10,2) DEFAULT 0.00,
    LabTestCost DECIMAL(10,2) DEFAULT 0.00,
    OtherCharges DECIMAL(10,2) DEFAULT 0.00,
    SubTotal DECIMAL(10,2) NOT NULL,
    DiscountAmount DECIMAL(10,2) DEFAULT 0.00,
    TaxAmount DECIMAL(10,2) DEFAULT 0.00,
    TotalAmount DECIMAL(10,2) NOT NULL,
    
    
    PaymentMethod ENUM('Cash', 'Card', 'UPI', 'Insurance', 'Free') NOT NULL,
    PaymentStatus ENUM('Paid', 'Pending', 'Partially Paid', 'Waived') DEFAULT 'Pending' NOT NULL,
    TransactionID VARCHAR(100),
    PaidAmount DECIMAL(10,2) DEFAULT 0.00,
    BalanceAmount DECIMAL(10,2) DEFAULT 0.00,
    
    BilledBy INT,
    Remarks TEXT,
    
    CONSTRAINT fk_bill_visit FOREIGN KEY (VisitID) 
        REFERENCES Visit(VisitID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_bill_staff FOREIGN KEY (BilledBy) 
        REFERENCES StaffEmployee(EmployeeID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_bill_amounts CHECK (
        SubTotal >= 0 AND 
        TotalAmount >= 0 AND 
        DiscountAmount >= 0 AND 
        TaxAmount >= 0 AND
        PaidAmount >= 0 AND
        BalanceAmount >= 0
    ),
    CONSTRAINT chk_bill_total CHECK (TotalAmount = SubTotal - DiscountAmount + TaxAmount)
);

CREATE TABLE EmergencyCase (
    EmergencyID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT NOT NULL,
    DoctorID INT,
    AttendingStaffID INT NOT NULL,
    VisitID INT,
    
    IncidentDateTime DATETIME NOT NULL,
    ReportedBy VARCHAR(100),
    Location VARCHAR(200) NOT NULL,
    
    Severity ENUM('Critical', 'High', 'Moderate', 'Low') NOT NULL,
    Symptoms TEXT NOT NULL,
    VitalSignsAtArrival JSON,
    
    FirstAidGiven TEXT,
    ActionTaken TEXT NOT NULL,
    MedicationAdministered TEXT,
    
    Outcome ENUM('Stabilized', 'Referred to Hospital', 'Admitted', 'Discharged', 'Fatal') NOT NULL,
    ReferredToHospital VARCHAR(200),
    AmbulanceUsed BOOLEAN DEFAULT FALSE,
    AmbulanceArrivalTime DATETIME,
    
    ResolvedDateTime DATETIME,
    FollowUpRequired BOOLEAN DEFAULT FALSE,
    
    CriticalNotes TEXT,
    Status ENUM('Active', 'Resolved', 'Under Observation') DEFAULT 'Active',
    
    CONSTRAINT fk_emerg_member FOREIGN KEY (MemberID) 
        REFERENCES Member(MemberID) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_emerg_doctor FOREIGN KEY (DoctorID) 
        REFERENCES Doctor(DoctorID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT fk_emerg_staff FOREIGN KEY (AttendingStaffID) 
        REFERENCES StaffEmployee(EmployeeID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_emerg_visit FOREIGN KEY (VisitID) 
        REFERENCES Visit(VisitID) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_emerg_resolution CHECK (
        ResolvedDateTime IS NULL OR 
        ResolvedDateTime > IncidentDateTime
    ),
    CONSTRAINT chk_emerg_ambulance CHECK (
        AmbulanceArrivalTime IS NULL OR 
        AmbulanceArrivalTime >= IncidentDateTime
    )
);

CREATE INDEX member_email ON Member(Email);
CREATE INDEX member_contact ON Member(ContactNumber);
CREATE INDEX member_type ON Member(MemberType);

-- Doctor
CREATE INDEX doctor_specialization ON Doctor(Specialization);

-- Appointment
CREATE INDEX appt_date ON Appointment(AppointmentDate);
CREATE INDEX appt_member ON Appointment(MemberID);
CREATE INDEX appt_doctor ON Appointment(DoctorID);
CREATE INDEX appt_status ON Appointment(Status);

-- Visit
CREATE INDEX visit_date ON Visit(VisitDate);
CREATE INDEX visit_member ON Visit(MemberID);
CREATE INDEX visit_doctor ON Visit(DoctorID);
CREATE INDEX visit_type ON Visit(VisitType);

-- Prescription
CREATE INDEX presc_visit ON Prescription(VisitID);
CREATE INDEX presc_member ON Prescription(MemberID);
CREATE INDEX presc_issue_date ON Prescription(IssueDate);

-- PrescriptionItem
CREATE INDEX prescitem_presc ON PrescriptionItem(PrescriptionID);
CREATE INDEX prescitem_medicine ON PrescriptionItem(MedicineID);

-- Medicine
CREATE INDEX medicine_name ON Medicine(Name);
CREATE INDEX medicine_category ON Medicine(Category);

-- Inventory
CREATE INDEX inv_medicine ON Inventory(MedicineID);
CREATE INDEX inv_batch ON Inventory(BatchNumber);
CREATE INDEX inv_expiry ON Inventory(ExpiryDate);
CREATE INDEX inv_status ON Inventory(Status);

-- MedicineDispense
CREATE INDEX dispense_presc ON MedicineDispense(PrescriptionID);
CREATE INDEX dispense_date ON MedicineDispense(DispenseDate);
CREATE INDEX dispense_staff ON MedicineDispense(DispensedBy);

-- BillPayment
CREATE INDEX bill_visit ON BillPayment(VisitID);
CREATE INDEX bill_date ON BillPayment(BillDate);
CREATE INDEX bill_status ON BillPayment(PaymentStatus);

-- MedicalSupplier
CREATE INDEX supplier_name ON MedicalSupplier(CompanyName);
CREATE INDEX supplier_status ON MedicalSupplier(Status);
CREATE INDEX supplier_city ON MedicalSupplier(City);

-- EmergencyCase
CREATE INDEX emerg_member ON EmergencyCase(MemberID);
CREATE INDEX emerg_datetime ON EmergencyCase(IncidentDateTime);
CREATE INDEX emerg_severity ON EmergencyCase(Severity);
CREATE INDEX emerg_status ON EmergencyCase(Status);


SELECT COUNT(*) AS TotalTables 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'DispensaryManagement';

SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = 'DispensaryManagement' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY 
    TABLE_NAME;

show tables;

