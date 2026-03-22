# Dispensary Management System — Setup Guide

A full-stack college dispensary management system built with **Node.js**, **Express**, **MySQL**, and **Vanilla HTML/CSS/JS**.

---

## Project Structure

```
dispensary-management/
├── sql/
│   ├── DispensaryManagement.sql          ← Schema: all tables, constraints, triggers
│   ├── Dispensary_Management_Insert.sql  ← Base seed: 10 members, 5 doctors, 5 staff, 5 medicines
│   ├── auth_system.sql                   ← Auth tables: UserLogin, SystemRole, UserRoleMapping
│   ├── seed_data.sql                     ← (Optional) Large dataset: 260 members, 55 doctors, 205 staff
│   └── doctor_schedule_migration.sql     ← (Optional) Migrates doctor schedules to DoctorSchedule table
│
├── app/
│   ├── server.js                         ← Express entry point
│   ├── package.json
│   ├── .env                              ← Your environment variables (copy from .env.example)
│   ├── config/
│   │   └── db.js                         ← MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js                       ← JWT verification
│   │   └── permissions.js                ← RBAC role enforcement
│   ├── routes/
│   │   ├── auth.js
│   │   ├── members.js
│   │   ├── doctors.js
│   │   ├── staff.js
│   │   ├── appointments.js
│   │   ├── clinical.js
│   │   ├── inventory.js
│   │   ├── portfolio.js
│   │   ├── superadmin.js
│   │   └── doctorSchedule.js
│   ├── utils/
│   │   └── audit.js                      ← Audit logging utility
│   └── public/
│       ├── index.html                    ← Login page
│       ├── dashboard.html
│       ├── members.html
│       ├── doctors.html
│       ├── appointments.html
│       ├── prescriptions.html
│       ├── inventory.html
│       ├── portfolio.html
│       ├── js/
│       │   └── api.js                    ← Shared frontend utilities
│       └── css/
│           └── style.css
│
|─ API_DOCS_TO_RUN.md                   ← curl command reference for all 9 roles
|- benchamarking_report.md   - benchmark report for subtask 4 and 5
|- README.md
```

---

## Prerequisites

Make sure the following are installed on your system before proceeding:

| Tool | Version | Check command |
|---|---|---|
| Node.js | v18 or higher | `node --version` |
| npm | v8 or higher | `npm --version` |
| MySQL | v8.0 or higher | `mysql --version` |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/dispensary-management.git
cd dispensary-management
```

---

## Step 2 — Set Up the Database

Open your MySQL client and run the SQL files **in the exact order shown below**.

### 2.1 — Create schema and all tables

```bash
mysql -u root -p < sql/DispensaryManagement.sql
```

This creates the `DispensaryManagement` database with all 20 tables, constraints, indexes, and triggers.

### 2.2 — Insert base data

```bash
mysql -u root -p DispensaryManagement < sql/Dispensary_Management_Insert.sql
```

This inserts the minimum working dataset:
- 10 Members (Students, Faculty, Staff)
- 5 Doctors
- 5 Staff Employees
- 5 Medicines
- 10 Appointments

### 2.3 — Set up authentication tables

```bash
mysql -u root -p DispensaryManagement < sql/auth_system.sql
```

This creates `UserLogin`, `SystemRole`, `UserRoleMapping`, and `SuperAdmin` tables, along with the triggers that auto-create login accounts when Members, Doctors, or Staff are inserted. It also runs the backfill to create login accounts for all existing records.

---

## Step 3 — (Optional) Load Large Seed Dataset

> **Skip this step if you want to use your own data.**
> Run these only if you want the full dataset used in the benchmarking report (260 members, 55 doctors, 205 staff, ~530 appointments, ~325 prescriptions, ~325 bills).

### 3.1 — Load seed data

```bash
mysql -u root -p DispensaryManagement < sql/seed_data.sql
```

This temporarily drops the appointment date trigger, inserts all seed data, then recreates the trigger. A verification count is printed at the end showing row counts for every table.

### 3.2 — Migrate doctor schedules

```bash
mysql -u root -p DispensaryManagement < sql/doctor_schedule_migration.sql
```

This creates the `DoctorSchedule` table (one row per doctor per working day) and migrates all existing doctors from their free-text `WorkingDays` field (e.g. `Mon-Fri`) into proper per-day schedule rows. **This step is required if you loaded seed_data.sql**, as the appointment booking system uses `DoctorSchedule` for slot validation.

---

## Step 4 — Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cd app
cp .env.example .env
```

Open `.env` and update:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=DispensaryManagement

# JWT
JWT_SECRET=your_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=8h

# Server
PORT=3000
```

> **JWT_SECRET** — use any long random string. Example: `openssl rand -hex 32` generates a good one.
> **DB_PASSWORD** — your MySQL root password or the password of whichever user you are using.

---

## Step 5 — Install Dependencies and Start the Server

```bash
cd app
npm install
node server.js
```

Expected output:

```
MySQL connected successfully
Dispensary API running on http://localhost:3000
Health check: http://localhost:3000/api/health
```

Verify the server is running:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-03-22T..."}
```

---

## Step 6 — Open the UI

Open your browser and go to:

```
http://localhost:3000/index.html
```

Or open any of the HTML files directly from the `app/public/` directory in your browser.

---

## Step 7 — Set Passwords and Log In

All accounts are created with the placeholder password `CHANGEME`. Before logging in, you must set a real password.

### 7.1 — Find UserLoginIDs

```sql
USE DispensaryManagement;

SELECT ul.UserLoginID, ul.Username, ul.EntityType, sr.RoleName
FROM UserLogin ul
JOIN UserRoleMapping urm ON urm.UserLoginID = ul.UserLoginID
JOIN SystemRole sr ON sr.RoleID = urm.RoleID
ORDER BY ul.UserLoginID;
```

### 7.2 — Set password via API

```bash
# Replace 1 with the actual UserLoginID
curl -s -X POST http://localhost:3000/api/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 1, "newPassword": "YourPassword@123"}'
```

### 7.3 — Log in

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "CS2021001", "password": "YourPassword@123"}'
```

Or use the login page at `http://localhost:3000/index.html`.

---

## Step 8 — (Optional) API Testing with curl

If you loaded the seed data in Step 3, the `API_DOCS_TO_RUN.md` file in the root directory has ready-to-run curl commands for all 9 roles (SuperAdmin, Admin, Doctor, Faculty, Nurse, Pharmacist, Staff, Support Staff, Technician) with the exact UserLoginIDs and usernames that match the seed dataset.

```bash
# Quick start — set the base URL
BASE="http://localhost:3000/api"

# Set password for a doctor from the seed data (UserLoginID 57)
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 57, "newPassword": "Doctor@1234"}'

# Log in and save token
DOC_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "DOC124", "password": "Doctor@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Test — view own appointments
curl -s $BASE/appointments \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
```

See `API_DOCS_TO_RUN.md` for the complete reference.

---

## Resetting the Database

If you want to start completely fresh:

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS DispensaryManagement;"
```

Then repeat Steps 2–3.

If you only want to clear data without dropping the schema (keeps tables, removes all rows):

```sql
USE DispensaryManagement;
SET FOREIGN_KEY_CHECKS=0;

TRUNCATE TABLE DirectDBChangeLog;
TRUNCATE TABLE BillPayment;
TRUNCATE TABLE MedicineDispense;
TRUNCATE TABLE PrescriptionItem;
TRUNCATE TABLE Prescription;
TRUNCATE TABLE Visit;
TRUNCATE TABLE Appointment;
TRUNCATE TABLE MedicalHistory;
TRUNCATE TABLE EmergencyCase;
TRUNCATE TABLE DoctorSchedule;
TRUNCATE TABLE Inventory;
TRUNCATE TABLE UserRoleMapping;
TRUNCATE TABLE UserLogin;
TRUNCATE TABLE SuperAdmin;
TRUNCATE TABLE StaffEmployee;
TRUNCATE TABLE Member;
TRUNCATE TABLE Doctor;
TRUNCATE TABLE Medicine;
TRUNCATE TABLE MedicalSupplier;

SET FOREIGN_KEY_CHECKS=1;
```

Then re-run Steps 2.2 and 2.3 (and optionally 3.1 and 3.2).

---

## Troubleshooting

**`Error: Access denied for user 'root'@'localhost'`**
Your MySQL password in `.env` is incorrect. Verify with:
```bash
mysql -u root -p -e "SELECT 1;"
```

**`Error: ER_NOT_SUPPORTED_AUTH_MODE`**
MySQL 8 uses `caching_sha2_password` by default. Fix with:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

**`Error: listen EADDRINUSE: address already in use :::3000`**
Port 3000 is taken. Either kill the other process or change `PORT` in `.env`.

**`Failed to fetch` in the browser UI**
The backend server is not running. Run `node server.js` in the `app/` directory.

**`Password not set — please use set-password endpoint first`**
The account still has the `CHANGEME` placeholder. Run the set-password curl from Step 7.2.

**`Token expired, please log in again`**
Tokens expire after 8 hours. Log in again to get a fresh token.

**`Appointment date cannot be in the past`**
The appointment date trigger is active. Use a future date when booking.

**`Doctor does not work on [day]`**
The doctor has no schedule set for that day of the week. Either pick a different date or update the doctor's schedule via `PUT /api/doctors/:id/schedule`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 18+, Express 4 |
| Database | MySQL 8.0 |
| Authentication | JWT (jsonwebtoken), bcrypt |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Audit logging | File-based JSON (audit.log) + MySQL triggers |
