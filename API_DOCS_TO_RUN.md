# curl Command Reference — Dispensary Management System
## All Roles: SuperAdmin · Admin · Doctor · Faculty · Student · Nurse · Pharmacist · Staff · Support Staff · Technician

**Base URL:** `http://localhost:3000/api`

> **UserLogin ID & Username Mapping:**
>
> | Role | UserLoginID | Username | Starting Password |
> |---|---|---|---|
> | SuperAdmin | 30 | sd1@admin.college.edu | Set in Step 1 |
> | Admin | 82 | EMP00006 | Set in Step 1 |
> | Doctor | 57 | DOC125 | Set in Step 1 |
> | Faculty | 5 | FAC001 | Set in Step 1 |
> | Nurse | 23 | NUR001 | Set in Step 1 |
> | Pharmacist | 24 | PHR001 | Set in Step 1 |
> | Technician | 26 | TECH001 | Set in Step 1 |
> | Support Staff | 111 | EMP00035 | Set in Step 1 |
> | Staff | 303 | EMP4272 | Set in Step 1 |
> | Student | 1 | CS2021001 | Set in Step 1 |


---

## Step 0 — One-time Setup

```bash
BASE="http://localhost:3000/api"
```

---

## Step 1 — Set Passwords (Doctor, Faculty, Nurse, Pharmacist, Technician, Support Staff, Staff)

> SuperAdmin (ID 30) and Admin (ID 82) already have passwords — skip to Step 2.

```bash
# ── SuperAdmin (UserLoginID 30) ───────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 30, "newPassword": "Super@1234"}'

# ── Doctor (UserLoginID 82) ───────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 82, "newPassword": "Admin@1234"}'

# ── Doctor (UserLoginID 57) ───────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 57, "newPassword": "Doctor@1234"}'

# ── Faculty (UserLoginID 5) ───────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 5, "newPassword": "Faculty@1234"}'

# ── Nurse (UserLoginID 23) ────────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 23, "newPassword": "Nurse@1234"}'

# ── Pharmacist (UserLoginID 24) ───────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 24, "newPassword": "Pharma@1234"}'

# ── Technician (UserLoginID 26) ───────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 26, "newPassword": "Tech@1234"}'

# ── Support Staff (UserLoginID 111) ──────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 111, "newPassword": "Support@1234"}'

# ── Staff (UserLoginID 303) ───────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 303, "newPassword": "Staff@1234"}'

# ── Student (UserLoginID 1) ───────────────────────────────────────────────────
curl -s -X POST $BASE/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"userLoginID": 1, "newPassword": "Student@1234"}'
```

---

## Step 2 — Login & Save All Tokens

```bash
# ── SuperAdmin (UserLoginID 30) ───────────────────────────────────────────────
SUPER_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "sd1@admin.college.edu", "password": "Super@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "SuperAdmin token saved: ${SUPER_TOKEN:0:30}..."

# ── Admin (UserLoginID 82) ────────────────────────────────────────────────────
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "EMP00006", "password": "Admin@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Admin token saved: ${ADMIN_TOKEN:0:30}..."

# ── Doctor (UserLoginID 57) ───────────────────────────────────────────────────
DOC_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "DOC125", "password": "Doctor@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Doctor token saved: ${DOC_TOKEN:0:30}..."

# ── Faculty (UserLoginID 5) ───────────────────────────────────────────────────
FAC_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "FAC001", "password": "Faculty@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Faculty token saved: ${FAC_TOKEN:0:30}..."

# ── Nurse (UserLoginID 23) ────────────────────────────────────────────────────
NUR_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "NUR001", "password": "Nurse@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Nurse token saved: ${NUR_TOKEN:0:30}..."

# ── Pharmacist (UserLoginID 24) ───────────────────────────────────────────────
PHR_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "PHR001", "password": "Pharma@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Pharmacist token saved: ${PHR_TOKEN:0:30}..."

# ── Technician (UserLoginID 26) ───────────────────────────────────────────────
TECH_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "TECH001", "password": "Tech@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Technician token saved: ${TECH_TOKEN:0:30}..."

# ── Support Staff (UserLoginID 111) ──────────────────────────────────────────
SUP_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "EMP00035", "password": "Support@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Support Staff token saved: ${SUP_TOKEN:0:30}..."

# ── Staff (UserLoginID 303) ───────────────────────────────────────────────────
STF_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "EMP4272", "password": "Staff@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Staff token saved: ${STF_TOKEN:0:30}..."

# ── Student (UserLoginID 1) ───────────────────────────────────────────────────
STU_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "CS2021001", "password": "Student@1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Student token saved: ${STU_TOKEN:0:30}..."
```

---

## Step 3 — Change Password (Shown only for SuperAdmin & Admin only)

```bash
# ── SuperAdmin change password ────────────────────────────────────────────────
curl -s -X POST $BASE/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d '{"currentPassword": "Super@001", "newPassword": "NewSuper@5678"}'

# ── Admin change password ─────────────────────────────────────────────────────
curl -s -X POST $BASE/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"currentPassword": "Admin@1234", "newPassword": "NewAdmin@5678"}'
```

> After changing password, re-run the login commands in Step 2 with the new password to refresh tokens.

---
---

# SUPERADMIN (ID 30, Username: SuperAdmin01)

> **Full unrestricted access. The only role that can permanently delete Members, Doctors, Prescriptions, Visits, and Bills.**

---

## What SuperAdmin CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL members (all 260, full details) ──────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View single member ────────────────────────────────────────────────────────
curl -s $BASE/members/1 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── Create a member ───────────────────────────────────────────────────────────
curl -s -X POST $BASE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d '{
    "Name": "SuperAdmin Created",
    "Age": 21,
    "Email": "sacreated@college.edu",
    "ContactNumber": "9000000001",
    "RollNumberOrEmployeeCode": "SA2024001",
    "Department": "Physics",
    "BloodGroup": "A+",
    "EmergencyContact": "9000000002",
    "Address": "Delhi",
    "RegistrationDate": "2026-01-01",
    "MemberType": "Student",
    "Status": "Active"
  }' | python3 -m json.tool

# ── Update any member including Status and MemberType ────────────────────────
curl -s -X PUT $BASE/members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d '{"Address": "Chennai", "Status": "Active", "Department": "CSE"}' \
  | python3 -m json.tool

# ── DELETE a member permanently ───────────────────────────────────────────────
curl -s -X DELETE $BASE/members/260 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL doctors (full contact details) ───────────────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── Create a doctor ───────────────────────────────────────────────────────────
curl -s -X POST $BASE/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d '{
    "Name": "Dr SuperAdmin Created",
    "Specialization": "Cardiologist",
    "Email": "drsacreated@hospital.com",
    "Phone": "9000000010",
    "LicenseNumber": "DOC998",
    "AvailableFrom": "09:00:00",
    "AvailableTo": "17:00:00",
    "WorkingDays": "Mon-Fri",
    "Status": "Active"
  }' | python3 -m json.tool

# ── Update a doctor ───────────────────────────────────────────────────────────
curl -s -X PUT $BASE/doctors/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d '{"Status": "On Leave"}' | python3 -m json.tool

# ── DELETE a doctor permanently ───────────────────────────────────────────────
curl -s -X DELETE $BASE/doctors/55 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL staff ────────────────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View available slots ──────────────────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── Book an appointment ───────────────────────────────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d '{
    "MemberID": 1,
    "DoctorID": 1,
    "AppointmentDate": "2030-05-12",
    "AppointmentTime": "09:00:00",
    "Symptoms": "Routine checkup",
    "Priority": "Normal"
  }' | python3 -m json.tool

# ── DELETE an appointment ─────────────────────────────────────────────────────
curl -s -X DELETE $BASE/appointments/530 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL prescriptions ────────────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── DELETE a prescription permanently ────────────────────────────────────────
curl -s -X DELETE $BASE/prescriptions/1 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL visits ───────────────────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── DELETE a visit permanently ────────────────────────────────────────────────
curl -s -X DELETE $BASE/visits/1 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL inventory ────────────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View low stock ────────────────────────────────────────────────────────────
curl -s $BASE/inventory/low-stock \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL billing ──────────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── DELETE a bill permanently ─────────────────────────────────────────────────
curl -s -X DELETE $BASE/billing/1 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View portfolio of ANY member ──────────────────────────────────────────────
curl -s $BASE/portfolio/1 \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL emergency cases ──────────────────────────────────────────────────
curl -s $BASE/emergency \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool

# ── View ALL suppliers ────────────────────────────────────────────────────────
curl -s $BASE/suppliers \
  -H "Authorization: Bearer $SUPER_TOKEN" | python3 -m json.tool
```

## What SuperAdmin CANNOT do

```bash
# SuperAdmin has no blocked endpoints — full unrestricted access across all tables.
```

---
---

# ADMIN (ID 82, Username: check MySQL)

> **Can:** Create/Read/Update everything. Delete appointments, inventory, medicines, suppliers.
> **Cannot:** Delete Members, Doctors, Prescriptions, Visits, Bills — those are SuperAdmin only.

---

## What Admin CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View ALL members (full details) ──────────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View single member ────────────────────────────────────────────────────────
curl -s $BASE/members/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── Create a member ───────────────────────────────────────────────────────────
curl -s -X POST $BASE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "Name": "Admin Created Student",
    "Age": 20,
    "Email": "admincreated@college.edu",
    "ContactNumber": "9111000001",
    "RollNumberOrEmployeeCode": "AC2024001",
    "Department": "Chemistry",
    "BloodGroup": "B+",
    "EmergencyContact": "9111000002",
    "Address": "Pune",
    "RegistrationDate": "2026-01-01",
    "MemberType": "Student",
    "Status": "Active"
  }' | python3 -m json.tool

# ── Update any member ─────────────────────────────────────────────────────────
curl -s -X PUT $BASE/members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"Department": "Biotechnology", "Status": "Inactive"}' | python3 -m json.tool

# ── View ALL doctors (full contact details visible) ───────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── Create a doctor ───────────────────────────────────────────────────────────
curl -s -X POST $BASE/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "Name": "Dr Admin Created",
    "Specialization": "Dermatologist",
    "Email": "dradmin@hospital.com",
    "Phone": "9111000010",
    "LicenseNumber": "DOC997",
    "AvailableFrom": "10:00:00",
    "AvailableTo": "16:00:00",
    "WorkingDays": "Mon-Sat",
    "Status": "Active"
  }' | python3 -m json.tool

# ── Set doctor schedule ───────────────────────────────────────────────────────
curl -s -X PUT $BASE/doctors/1/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "schedule": [
      {"day":"Monday",    "isActive":true,  "startTime":"09:00","endTime":"17:00"},
      {"day":"Tuesday",   "isActive":true,  "startTime":"09:00","endTime":"17:00"},
      {"day":"Wednesday", "isActive":true,  "startTime":"09:00","endTime":"13:00"},
      {"day":"Thursday",  "isActive":true,  "startTime":"09:00","endTime":"17:00"},
      {"day":"Friday",    "isActive":true,  "startTime":"09:00","endTime":"17:00"},
      {"day":"Saturday",  "isActive":false, "startTime":null,   "endTime":null},
      {"day":"Sunday",    "isActive":false, "startTime":null,   "endTime":null}
    ]
  }' | python3 -m json.tool

# ── View ALL staff ────────────────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── Create staff employee ─────────────────────────────────────────────────────
curl -s -X POST $BASE/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "Name": "Admin Created Nurse",
    "Role": "Nurse",
    "Email": "adminnurse@college.edu",
    "Phone": "9111000020",
    "ShiftTiming": "Morning",
    "HireDate": "2026-01-01",
    "LicenseNumber": "NUR998",
    "Status": "Active"
  }' | python3 -m json.tool

# ── View ALL appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── Book an appointment on behalf of a member ─────────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "MemberID": 1,
    "DoctorID": 1,
    "AppointmentDate": "2030-05-12",
    "AppointmentTime": "11:00:00",
    "Symptoms": "Routine checkup",
    "Priority": "Normal"
  }' | python3 -m json.tool

# ── Delete an appointment ─────────────────────────────────────────────────────
curl -s -X DELETE $BASE/appointments/530 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View ALL prescriptions ────────────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View ALL inventory ────────────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View low stock ────────────────────────────────────────────────────────────
curl -s $BASE/inventory/low-stock \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── Add inventory batch ───────────────────────────────────────────────────────
curl -s -X POST $BASE/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "MedicineID": 1,
    "BatchNumber": "PARA-2026-ADMIN",
    "Quantity": 500,
    "ManufactureDate": "2025-06-01",
    "ExpiryDate": "2027-06-01",
    "Location": "Shelf B2",
    "PurchasePrice": 1.80,
    "ReorderLevel": 50,
    "MinimumStock": 20
  }' | python3 -m json.tool

# ── View ALL billing ──────────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View portfolio of any member ──────────────────────────────────────────────
curl -s $BASE/portfolio/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View emergency cases ──────────────────────────────────────────────────────
curl -s $BASE/emergency \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

# ── View suppliers ────────────────────────────────────────────────────────────
curl -s $BASE/suppliers \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
```

## What Admin CANNOT do

```bash
# ── BLOCKED: Delete a member (SuperAdmin only) ────────────────────────────────
curl -s -X DELETE $BASE/members/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a doctor (SuperAdmin only) ────────────────────────────────
curl -s -X DELETE $BASE/doctors/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a prescription (SuperAdmin only) ─────────────────────────
curl -s -X DELETE $BASE/prescriptions/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a visit (SuperAdmin only) ─────────────────────────────────
curl -s -X DELETE $BASE/visits/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a bill (SuperAdmin only) ──────────────────────────────────
curl -s -X DELETE $BASE/billing/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# DOCTOR (ID 57, Username: DOC124)

> **Can:** Own appointments only, create visits and prescriptions for own patients, view own patient portfolios, update own schedule.
> **Cannot:** Other doctors' appointments, non-patient portfolios, inventory, billing, staff.

---

## What Doctor CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── View own appointments ONLY ────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── Check available slots ─────────────────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── Update appointment status to Completed ───────────────────────────────────
curl -s -X PUT $BASE/appointments/11 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOC_TOKEN" \
  -d '{"Status": "Completed"}' | python3 -m json.tool

# ── Mark appointment as No-Show ───────────────────────────────────────────────
curl -s -X PUT $BASE/appointments/12 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOC_TOKEN" \
  -d '{"Status": "No-Show"}' | python3 -m json.tool

# ── Create a visit record ─────────────────────────────────────────────────────
curl -s -X POST $BASE/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOC_TOKEN" \
  -d '{
    "MemberID": 1,
    "DoctorID": 1,
    "AppointmentID": 11,
    "VisitDate": "2030-05-12",
    "VisitTime": "10:05:00",
    "ChiefComplaint": "Fever for 2 days",
    "Diagnosis": "Viral fever",
    "VitalSigns": {"bp": "120/80", "temp": 101.2, "pulse": 88},
    "TreatmentNotes": "Rest and fluids advised",
    "FollowUpRequired": false,
    "VisitType": "Scheduled",
    "Status": "Completed"
  }' | python3 -m json.tool

# ── Issue a prescription with medicines ──────────────────────────────────────
curl -s -X POST $BASE/prescriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOC_TOKEN" \
  -d '{
    "VisitID": 1,
    "MemberID": 1,
    "DoctorID": 1,
    "IssueDate": "2030-05-12",
    "ValidUntil": "2030-05-22",
    "Diagnosis": "Viral fever",
    "SpecialInstructions": "Take after meals",
    "items": [
      {"MedicineID": 1, "Dosage": "500mg", "Frequency": "Twice daily", "Duration": "5 days", "Quantity": 10},
      {"MedicineID": 3, "Dosage": "10mg",  "Frequency": "Once daily",  "Duration": "3 days", "Quantity": 3}
    ]
  }' | python3 -m json.tool

# ── View own prescriptions ONLY ───────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── View prescription detail ──────────────────────────────────────────────────
curl -s $BASE/prescriptions/1 \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── View patient portfolio (only patients who visited this doctor) ────────────
curl -s $BASE/portfolio/1 \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── View own schedule ─────────────────────────────────────────────────────────
curl -s $BASE/doctors/1/schedule \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool

# ── Update own schedule ───────────────────────────────────────────────────────
curl -s -X PUT $BASE/doctors/1/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOC_TOKEN" \
  -d '{
    "schedule": [
      {"day":"Monday",    "isActive":true,  "startTime":"10:00","endTime":"16:00"},
      {"day":"Tuesday",   "isActive":true,  "startTime":"10:00","endTime":"16:00"},
      {"day":"Wednesday", "isActive":false, "startTime":null,   "endTime":null},
      {"day":"Thursday",  "isActive":true,  "startTime":"10:00","endTime":"16:00"},
      {"day":"Friday",    "isActive":true,  "startTime":"10:00","endTime":"16:00"},
      {"day":"Saturday",  "isActive":false, "startTime":null,   "endTime":null},
      {"day":"Sunday",    "isActive":false, "startTime":null,   "endTime":null}
    ]
  }' | python3 -m json.tool

# ── View all medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
```

## What Doctor CANNOT do

```bash
# ── BLOCKED: View portfolio of a member who never visited this doctor ─────────
curl -s $BASE/portfolio/50 \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View inventory ───────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a member ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/members/1 \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a prescription ───────────────────────────────────────────
curl -s -X DELETE $BASE/prescriptions/1 \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Access billing ───────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View all staff ───────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $DOC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# FACULTY (ID 5, Username: FAC001)

> **Can:** Own profile, book/cancel own appointments, view own prescriptions and portfolio. Doctors shown without contact details.
> **Cannot:** Other members' data, clinical records, inventory, billing, staff.

---

## What Faculty CAN do

```bash
# ── View own profile only ─────────────────────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── View own member record by ID ──────────────────────────────────────────────
curl -s $BASE/members/5 \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── View doctors (Name and Specialization only, phone/email stripped) ─────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── View all medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── Check available appointment slots ────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── Book own appointment ──────────────────────────────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAC_TOKEN" \
  -d '{
    "MemberID": 5,
    "DoctorID": 1,
    "AppointmentDate": "2030-05-12",
    "AppointmentTime": "11:00:00",
    "Symptoms": "Back pain",
    "Priority": "Normal"
  }' | python3 -m json.tool

# ── View own appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── Cancel own appointment ────────────────────────────────────────────────────
curl -s -X PUT $BASE/appointments/11 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAC_TOKEN" \
  -d '{"Status": "Cancelled"}' | python3 -m json.tool

# ── View own prescriptions ────────────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── View own prescription detail ──────────────────────────────────────────────
curl -s $BASE/prescriptions/1 \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── View own portfolio ────────────────────────────────────────────────────────
curl -s $BASE/portfolio/5 \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool

# ── Update own non-restricted fields ─────────────────────────────────────────
curl -s -X PUT $BASE/members/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAC_TOKEN" \
  -d '{"Address": "Hyderabad", "ContactNumber": "9555000005"}' | python3 -m json.tool
```

## What Faculty CANNOT do

```bash
# ── BLOCKED: View another member's profile ────────────────────────────────────
curl -s $BASE/members/1 \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View another member's portfolio ──────────────────────────────────
curl -s $BASE/portfolio/1 \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Change own Status or MemberType ──────────────────────────────────
curl -s -X PUT $BASE/members/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAC_TOKEN" \
  -d '{"Status": "Inactive"}' | python3 -m json.tool
# Response: {"error":"Access denied"} or field ignored

# ── BLOCKED: Book appointment for another member ──────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FAC_TOKEN" \
  -d '{"MemberID": 1, "DoctorID": 1, "AppointmentDate": "2030-05-12", "AppointmentTime": "12:00:00", "Symptoms": "Test", "Priority": "Normal"}' \
  | python3 -m json.tool
# Response: {"error":"You can only book appointments for yourself"}

# ── BLOCKED: View inventory ───────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View billing ─────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View visits ──────────────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View staff list ──────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete anything ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/appointments/11 \
  -H "Authorization: Bearer $FAC_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# NURSE (ID 23, Username: NUR001)

> **Can:** Read all clinical data, create/update visits, update appointment status, log emergencies, view all portfolios (address stripped).
> **Cannot:** Create prescriptions, create members/doctors, manage inventory, delete records.

---

## What Nurse CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View ALL members (read-only) ──────────────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View ALL doctors ──────────────────────────────────────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View ALL appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── Update appointment status ─────────────────────────────────────────────────
curl -s -X PUT $BASE/appointments/11 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{"Status": "Completed"}' | python3 -m json.tool

# ── Check available slots ─────────────────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View ALL visits ───────────────────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── Create a visit record ─────────────────────────────────────────────────────
curl -s -X POST $BASE/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{
    "MemberID": 1,
    "DoctorID": 1,
    "AppointmentID": 11,
    "VisitDate": "2030-05-12",
    "VisitTime": "09:10:00",
    "ChiefComplaint": "Chest pain",
    "Diagnosis": "Pending doctor review",
    "VitalSigns": {"bp": "130/85", "temp": 98.6, "pulse": 92},
    "TreatmentNotes": "Vitals recorded, awaiting doctor",
    "FollowUpRequired": false,
    "VisitType": "Walk-in",
    "Status": "In Progress"
  }' | python3 -m json.tool

# ── Update a visit ────────────────────────────────────────────────────────────
curl -s -X PUT $BASE/visits/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{"TreatmentNotes": "BP rechecked, stable", "Status": "Completed"}' \
  | python3 -m json.tool

# ── View ALL prescriptions (read-only) ───────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View prescription detail ──────────────────────────────────────────────────
curl -s $BASE/prescriptions/1 \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View portfolio of any member (address stripped) ───────────────────────────
curl -s $BASE/portfolio/1 \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── View inventory (read-only) ────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool

# ── Log an emergency case ─────────────────────────────────────────────────────
curl -s -X POST $BASE/emergency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{
    "MemberID": 1,
    "DoctorID": 1,
    "IncidentDateTime": "2030-05-12T09:00:00",
    "Description": "Student collapsed near library",
    "Severity": "Critical",
    "Status": "Active"
  }' | python3 -m json.tool
```

## What Nurse CANNOT do

```bash
# ── BLOCKED: Create a prescription (Doctor only) ──────────────────────────────
curl -s -X POST $BASE/prescriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{"VisitID":1,"MemberID":1,"DoctorID":1,"IssueDate":"2030-05-12","ValidUntil":"2030-05-22","Diagnosis":"Test","items":[]}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Create a member ──────────────────────────────────────────────────
curl -s -X POST $BASE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{"Name":"Test","Age":20,"Email":"test@x.com","ContactNumber":"9000000099","RollNumberOrEmployeeCode":"T001","Department":"CSE","BloodGroup":"O+","EmergencyContact":"9000000001","Address":"Delhi","RegistrationDate":"2026-01-01","MemberType":"Student","Status":"Active"}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Add inventory stock ──────────────────────────────────────────────
curl -s -X POST $BASE/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NUR_TOKEN" \
  -d '{"MedicineID":1,"BatchNumber":"TEST","Quantity":100,"ManufactureDate":"2025-01-01","ExpiryDate":"2027-01-01","Location":"Shelf A","PurchasePrice":2.0,"ReorderLevel":20,"MinimumStock":5}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete anything ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/appointments/1 \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View billing ─────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View staff list ──────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $NUR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# PHARMACIST (ID 24, Username: PHR001)

> **Can:** Full medicine and inventory management, view/read all prescriptions, create bills, read members and appointments.
> **Cannot:** Create prescriptions, create members/doctors, delete clinical records, access staff or visits.

---

## What Pharmacist CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View ALL members (address stripped) ───────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View ALL doctors ──────────────────────────────────────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View ALL medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── Add a new medicine ────────────────────────────────────────────────────────
curl -s -X POST $BASE/medicines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHR_TOKEN" \
  -d '{
    "Name": "Azithromycin 250mg",
    "GenericName": "Azithromycin",
    "Category": "Antibiotic",
    "Form": "Tablet",
    "Manufacturer": "Cipla",
    "UnitPrice": 12.50,
    "RequiresPrescription": true,
    "Status": "Available"
  }' | python3 -m json.tool

# ── View ALL inventory ────────────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View low stock ────────────────────────────────────────────────────────────
curl -s $BASE/inventory/low-stock \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── Add inventory batch ───────────────────────────────────────────────────────
curl -s -X POST $BASE/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHR_TOKEN" \
  -d '{
    "MedicineID": 1,
    "BatchNumber": "PARA-2026-PHR",
    "Quantity": 300,
    "ManufactureDate": "2025-06-01",
    "ExpiryDate": "2027-06-01",
    "Location": "Counter",
    "PurchasePrice": 1.80,
    "ReorderLevel": 50,
    "MinimumStock": 20
  }' | python3 -m json.tool

# ── Update inventory stock quantity ───────────────────────────────────────────
curl -s -X PUT $BASE/inventory/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHR_TOKEN" \
  -d '{"Quantity": 450, "Status": "Available"}' | python3 -m json.tool

# ── View ALL prescriptions ────────────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View prescription detail with medicines ───────────────────────────────────
curl -s $BASE/prescriptions/1 \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View ALL appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── Create a bill for a visit ─────────────────────────────────────────────────
curl -s -X POST $BASE/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHR_TOKEN" \
  -d '{
    "VisitID": 1,
    "BillDate": "2030-05-12",
    "BillTime": "10:30:00",
    "ConsultationFee": 100.00,
    "MedicineCost": 224.86,
    "LabTestCost": 0.00,
    "OtherCharges": 0.00,
    "SubTotal": 324.86,
    "DiscountAmount": 0.00,
    "TaxAmount": 0.00,
    "TotalAmount": 324.86,
    "PaymentMethod": "UPI",
    "PaymentStatus": "Paid",
    "PaidAmount": 324.86,
    "BalanceAmount": 0.00,
    "BilledBy": 24
  }' | python3 -m json.tool

# ── View ALL billing ──────────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool

# ── View suppliers ────────────────────────────────────────────────────────────
curl -s $BASE/suppliers \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool
```

## What Pharmacist CANNOT do

```bash
# ── BLOCKED: Create a prescription (Doctor only) ──────────────────────────────
curl -s -X POST $BASE/prescriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHR_TOKEN" \
  -d '{"VisitID":1,"MemberID":1,"DoctorID":1,"IssueDate":"2030-05-12","ValidUntil":"2030-05-22","Diagnosis":"Test","items":[]}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Create a member ──────────────────────────────────────────────────
curl -s -X POST $BASE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHR_TOKEN" \
  -d '{"Name":"Test","Age":20,"Email":"test2@x.com","ContactNumber":"9000000098","RollNumberOrEmployeeCode":"T002","Department":"CSE","BloodGroup":"O+","EmergencyContact":"9000000001","Address":"Delhi","RegistrationDate":"2026-01-01","MemberType":"Student","Status":"Active"}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View visits ──────────────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a prescription ───────────────────────────────────────────
curl -s -X DELETE $BASE/prescriptions/1 \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View staff list ──────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete a member ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/members/1 \
  -H "Authorization: Bearer $PHR_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# STAFF (ID 303, Username: EMP4272)

> **Can:** Own profile, book/cancel own appointments, view own prescriptions and portfolio. Same as Faculty.
> **Cannot:** Other members, clinical data, inventory, billing, staff records, change own Role or Status.

---

## What Staff CAN do

```bash
# ── View own profile only ─────────────────────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── View doctors (Name and Specialization only) ───────────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── View all medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── Check available slots ─────────────────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── Book own appointment ──────────────────────────────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STF_TOKEN" \
  -d '{
    "MemberID": 303,
    "DoctorID": 1,
    "AppointmentDate": "2030-05-12",
    "AppointmentTime": "14:00:00",
    "Symptoms": "Knee pain",
    "Priority": "Normal"
  }' | python3 -m json.tool

# ── View own appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── Cancel own appointment ────────────────────────────────────────────────────
curl -s -X PUT $BASE/appointments/11 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STF_TOKEN" \
  -d '{"Status": "Cancelled"}' | python3 -m json.tool

# ── View own prescriptions ────────────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── View own portfolio ────────────────────────────────────────────────────────
curl -s $BASE/portfolio/303 \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool

# ── Update own non-restricted fields ─────────────────────────────────────────
curl -s -X PUT $BASE/members/303 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STF_TOKEN" \
  -d '{"Address": "Kolkata", "ContactNumber": "9888000303"}' | python3 -m json.tool
```

## What Staff CANNOT do

```bash
# ── BLOCKED: View another member's profile ────────────────────────────────────
curl -s $BASE/members/1 \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View inventory ───────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View billing ─────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View visits ──────────────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Change own Role or Status ───────────────────────────────────────
curl -s -X PUT $BASE/members/303 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STF_TOKEN" \
  -d '{"Status": "Inactive"}' | python3 -m json.tool
# Response: {"error":"Access denied"} or field ignored

# ── BLOCKED: Delete anything ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/appointments/11 \
  -H "Authorization: Bearer $STF_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# SUPPORT STAFF (ID 111, Username: EMP00035)

> **Can:** Read-only access to clinical data — members, doctors, appointments, prescriptions, visits, inventory.
> **Cannot:** Create, update, or delete anything. No billing, no staff list.

---

## What Support Staff CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View ALL members (read-only) ──────────────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View ALL doctors (read-only) ──────────────────────────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View doctor schedule ──────────────────────────────────────────────────────
curl -s $BASE/doctors/1/schedule \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View all medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── Check available slots ─────────────────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View ALL appointments (read-only) ─────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View ALL prescriptions (read-only) ───────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View ALL visits (read-only) ───────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool

# ── View inventory (read-only) ────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool
```

## What Support Staff CANNOT do

```bash
# ── BLOCKED: Create a member ──────────────────────────────────────────────────
curl -s -X POST $BASE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUP_TOKEN" \
  -d '{"Name":"Test","Age":20,"Email":"test3@x.com","ContactNumber":"9000000097","RollNumberOrEmployeeCode":"T003","Department":"CSE","BloodGroup":"O+","EmergencyContact":"9000000001","Address":"Delhi","RegistrationDate":"2026-01-01","MemberType":"Student","Status":"Active"}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Update any record ────────────────────────────────────────────────
curl -s -X PUT $BASE/members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUP_TOKEN" \
  -d '{"Address": "Mumbai"}' | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Book an appointment ──────────────────────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUP_TOKEN" \
  -d '{"MemberID":1,"DoctorID":1,"AppointmentDate":"2030-05-12","AppointmentTime":"15:00:00","Symptoms":"Test","Priority":"Normal"}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Add inventory ────────────────────────────────────────────────────
curl -s -X POST $BASE/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUP_TOKEN" \
  -d '{"MedicineID":1,"BatchNumber":"SUP-TEST","Quantity":100,"ManufactureDate":"2025-01-01","ExpiryDate":"2027-01-01","Location":"Shelf A","PurchasePrice":2.0,"ReorderLevel":20,"MinimumStock":5}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View billing ─────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View staff list ──────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete anything ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/appointments/1 \
  -H "Authorization: Bearer $SUP_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

# TECHNICIAN (ID 26, Username: TECH001)

> **Can:** Same as Support Staff — read-only access to clinical data.
> **Cannot:** Create, update, or delete anything. No billing, no staff list.

---

## What Technician CAN do

```bash
# ── View own profile ──────────────────────────────────────────────────────────
curl -s $BASE/auth/me \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View ALL members (read-only) ──────────────────────────────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View ALL doctors (read-only) ──────────────────────────────────────────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View doctor schedule ──────────────────────────────────────────────────────
curl -s $BASE/doctors/1/schedule \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View all medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── Check available slots ─────────────────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View ALL appointments (read-only) ─────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View ALL prescriptions (read-only) ───────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View ALL visits (read-only) ───────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool

# ── View inventory (read-only) ────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool
```

## What Technician CANNOT do

```bash
# ── BLOCKED: Create a member ──────────────────────────────────────────────────
curl -s -X POST $BASE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -d '{"Name":"Test","Age":20,"Email":"test4@x.com","ContactNumber":"9000000096","RollNumberOrEmployeeCode":"T004","Department":"CSE","BloodGroup":"O+","EmergencyContact":"9000000001","Address":"Delhi","RegistrationDate":"2026-01-01","MemberType":"Student","Status":"Active"}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Update any record ────────────────────────────────────────────────
curl -s -X PUT $BASE/members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -d '{"Address": "Surat"}' | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Add inventory ────────────────────────────────────────────────────
curl -s -X POST $BASE/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -d '{"MedicineID":1,"BatchNumber":"TECH-TEST","Quantity":100,"ManufactureDate":"2025-01-01","ExpiryDate":"2027-01-01","Location":"Shelf A","PurchasePrice":2.0,"ReorderLevel":20,"MinimumStock":5}' \
  | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View billing ─────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View staff list ──────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete anything ──────────────────────────────────────────────────
curl -s -X DELETE $BASE/prescriptions/1 \
  -H "Authorization: Bearer $TECH_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}
```

---
---

---
---

# STUDENT (ID 1, Username: CS2021001)

> **Can:** Own profile only, book/cancel own appointments, view own prescriptions and portfolio. Doctors shown without contact details.
> **Cannot:** Other members' data, clinical records, inventory, visits, billing, staff.

---

## What Student CAN do

```bash
# ── View own profile only (API returns only their record) ─────────────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── View own member record by ID ──────────────────────────────────────────────
curl -s $BASE/members/1 \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── View doctors (Name and Specialization only — phone/email stripped) ────────
curl -s $BASE/doctors \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── View all medicines ────────────────────────────────────────────────────────
curl -s $BASE/medicines \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── Check available appointment slots ────────────────────────────────────────
curl -s "$BASE/appointments/slots?doctorID=1&date=2030-05-12" \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── Book own appointment ──────────────────────────────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -d '{
    "MemberID": 1,
    "DoctorID": 1,
    "AppointmentDate": "2030-05-12",
    "AppointmentTime": "10:00:00",
    "Symptoms": "Headache and fever",
    "Priority": "Normal"
  }' | python3 -m json.tool

# ── View own appointments ─────────────────────────────────────────────────────
curl -s $BASE/appointments \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── Cancel own appointment ────────────────────────────────────────────────────
curl -s -X PUT $BASE/appointments/11 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -d '{"Status": "Cancelled"}' | python3 -m json.tool

# ── View own prescriptions ────────────────────────────────────────────────────
curl -s $BASE/prescriptions \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── View own prescription detail with medicines ───────────────────────────────
curl -s $BASE/prescriptions/1 \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── View own portfolio ────────────────────────────────────────────────────────
curl -s $BASE/portfolio/1 \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── View own bills ────────────────────────────────────────────────────────────
curl -s $BASE/billing \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool

# ── Update own non-restricted fields (address, contact) ──────────────────────
curl -s -X PUT $BASE/members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -d '{"Address": "Bangalore", "ContactNumber": "9876500001"}' | python3 -m json.tool
```

## What Student CANNOT do

```bash
# ── BLOCKED: View another member's profile ────────────────────────────────────
curl -s $BASE/members/2 \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View another member's portfolio ──────────────────────────────────
curl -s $BASE/portfolio/2 \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Book appointment for another member ──────────────────────────────
curl -s -X POST $BASE/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -d '{"MemberID": 2, "DoctorID": 1, "AppointmentDate": "2030-05-12", "AppointmentTime": "11:00:00", "Symptoms": "Test", "Priority": "Normal"}' \
  | python3 -m json.tool
# Response: {"error":"You can only book appointments for yourself"}

# ── BLOCKED: Change own Status or MemberType ──────────────────────────────────
curl -s -X PUT $BASE/members/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -d '{"Status": "Inactive", "MemberType": "Faculty"}' | python3 -m json.tool
# Response: {"error":"Access denied"} or field silently ignored

# ── BLOCKED: View inventory ───────────────────────────────────────────────────
curl -s $BASE/inventory \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View visits ──────────────────────────────────────────────────────
curl -s $BASE/visits \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: View staff list ──────────────────────────────────────────────────
curl -s $BASE/staff \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── BLOCKED: Delete own appointment (can only cancel, not delete) ─────────────
curl -s -X DELETE $BASE/appointments/11 \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -m json.tool
# Response: {"error":"Access denied"}

# ── CONFIRMED: GET /members only returns own record (not all 260) ─────────────
curl -s $BASE/members \
  -H "Authorization: Bearer $STU_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Count:', d['count'], '— should be 1')"
```

## Quick Access Summary

| Endpoint | SuperAdmin | Admin | Doctor | Faculty | Nurse | Pharmacist | Staff | Support Staff | Technician |
|---|---|---|---|---|---|---|---|---|---|
| GET /members | All | All | All (read) | Own only | All (read) | All stripped | Own only | All (read) | All (read) |
| POST /members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE /members | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /doctors | All | All | All | Stripped | All | All | Stripped | All | All |
| DELETE /doctors | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /appointments | All | All | Own only | Own only | All | All | Own only | All (read) | All (read) |
| POST /appointments | ✅ | ✅ | ❌ | Own only | ✅ | ❌ | Own only | ❌ | ❌ |
| DELETE /appointments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /prescriptions | All | All | Own only | Own only | All (read) | All | Own only | All (read) | All (read) |
| POST /prescriptions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE /prescriptions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /inventory | All | All | ❌ | ❌ | Read only | All | ❌ | Read only | Read only |
| POST /inventory | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| GET /billing | All | All | ❌ | ❌ | ❌ | All | ❌ | ❌ | ❌ |
| POST /billing | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| DELETE /billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /portfolio/:id | Any | Any | Own patients | Own only | Any stripped | ❌ | Own only | ❌ | ❌ |
| GET /staff | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /visits | All | All | Own only | ❌ | All | ❌ | ❌ | Read only | Read only |
| POST /visits | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /visits | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
