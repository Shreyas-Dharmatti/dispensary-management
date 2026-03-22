USE DispensaryManagement;

-- ============================================================
-- STEP 1: Create DoctorSchedule table
-- ============================================================

CREATE TABLE IF NOT EXISTS DoctorSchedule (
    ScheduleID  INT AUTO_INCREMENT PRIMARY KEY,
    DoctorID    INT NOT NULL,
    DayOfWeek   ENUM('Monday','Tuesday','Wednesday','Thursday',
                     'Friday','Saturday','Sunday') NOT NULL,
    StartTime   TIME NOT NULL,
    EndTime     TIME NOT NULL,
    IsActive    BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_schedule_doctor FOREIGN KEY (DoctorID)
        REFERENCES Doctor(DoctorID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- One row per doctor per day
    CONSTRAINT uq_doctor_day UNIQUE (DoctorID, DayOfWeek),

    CONSTRAINT chk_schedule_times CHECK (EndTime > StartTime)
);

CREATE INDEX idx_schedule_doctorid ON DoctorSchedule(DoctorID);
CREATE INDEX idx_schedule_day      ON DoctorSchedule(DayOfWeek);


-- ============================================================
-- STEP 2: Migrate existing doctors
-- Parse WorkingDays text into DoctorSchedule rows.
-- Uses AvailableFrom / AvailableTo as the time for all days.
--
-- Handles these patterns found in seed data:
--   Mon-Fri  → Monday Tuesday Wednesday Thursday Friday
--   Mon-Wed  → Monday Tuesday Wednesday
--   Tue-Thu  → Tuesday Wednesday Thursday
--   Mon-Sat  → Monday Tuesday Wednesday Thursday Friday Saturday
--   Mon-Sun  → all 7 days
-- ============================================================

-- Mon-Fri doctors
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Monday',    AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Fri' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Tuesday',   AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Fri' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Wednesday', AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Fri' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Thursday',  AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Fri' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Friday',    AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Fri' AND AvailableFrom IS NOT NULL;

-- Mon-Wed doctors
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Monday',    AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Wed' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Tuesday',   AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Wed' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Wednesday', AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Wed' AND AvailableFrom IS NOT NULL;

-- Tue-Thu doctors
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Tuesday',   AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Tue-Thu' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Wednesday', AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Tue-Thu' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Thursday',  AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Tue-Thu' AND AvailableFrom IS NOT NULL;

-- Mon-Sat doctors
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Monday',    AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Sat' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Tuesday',   AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Sat' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Wednesday', AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Sat' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Thursday',  AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Sat' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Friday',    AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Sat' AND AvailableFrom IS NOT NULL;
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime)
SELECT DoctorID, 'Saturday',  AvailableFrom, AvailableTo FROM Doctor WHERE WorkingDays = 'Mon-Sat' AND AvailableFrom IS NOT NULL;

-- Verify migration
SELECT
    d.DoctorID,
    d.Name,
    d.WorkingDays,
    COUNT(ds.ScheduleID) AS ScheduledDays
FROM Doctor d
LEFT JOIN DoctorSchedule ds ON ds.DoctorID = d.DoctorID
GROUP BY d.DoctorID, d.Name, d.WorkingDays
ORDER BY d.DoctorID;
