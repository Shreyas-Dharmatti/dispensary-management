USE DispensaryManagement;

INSERT INTO Member
(Name, Age, Email, ContactNumber, RollNumberOrEmployeeCode, Department, BloodGroup, EmergencyContact, Address, RegistrationDate, MemberType, Status)
VALUES
('Rahul Sharma',21,'[rahul1@college.edu](mailto:rahul1@college.edu)','9876543201','CS2021001','Computer Science','O+','9876500001','Bangalore','2024-01-10','Student','Active'),
('Priya Patel',20,'[priya1@college.edu](mailto:priya1@college.edu)','9876543202','EC2022002','Electronics','A+','9876500002','Pune','2024-01-11','Student','Active'),
('Arjun Kumar',22,'[arjun1@college.edu](mailto:arjun1@college.edu)','9876543203','ME2020003','Mechanical','B+','9876500003','Chennai','2024-01-12','Student','Active'),
('Ananya Reddy',19,'[ananya1@college.edu](mailto:ananya1@college.edu)','9876543204','CS2023004','Computer Science','AB+','9876500004','Hyderabad','2024-01-13','Student','Active'),
('Vikram Singh',35,'[vikram1@college.edu](mailto:vikram1@college.edu)','9876543205','FAC001','Computer Science','O-','9876500005','Delhi','2024-01-14','Faculty','Active'),
('Meera Iyer',21,'[meera1@college.edu](mailto:meera1@college.edu)','9876543206','BT2021006','Biotech','A-','9876500006','Bangalore','2024-01-15','Student','Active'),
('Karthik Nair',23,'[karthik1@college.edu](mailto:karthik1@college.edu)','9876543207','EE2019007','Electrical','B-','9876500007','Mumbai','2024-01-16','Student','Active'),
('Sneha Desai',20,'[sneha1@college.edu](mailto:sneha1@college.edu)','9876543208','CH2022008','Chemical','O+','9876500008','Ahmedabad','2024-01-17','Student','Active'),
('Rajesh Gupta',42,'[rajesh1@college.edu](mailto:rajesh1@college.edu)','9876543209','FAC002','Physics','A+','9876500009','Delhi','2024-01-18','Faculty','Active'),
('Aarav Mehta',22,'[aarav1@college.edu](mailto:aarav1@college.edu)','9876543210','IT2020010','IT','AB-','9876500010','Bangalore','2024-01-19','Student','Active');

INSERT INTO Doctor
(Name, Specialization, Email, Phone, LicenseNumber, AvailableFrom, AvailableTo, WorkingDays, Status)
VALUES
('Dr Amit Deshmukh','General Physician','[doc1@hospital.com](mailto:doc1@hospital.com)','9000000001','DOC001','09:00:00','17:00:00','Mon-Fri','Active'),
('Dr Kavita Menon','General Physician','[doc2@hospital.com](mailto:doc2@hospital.com)','9000000002','DOC002','09:00:00','13:00:00','Mon-Wed','Active'),
('Dr Suresh Reddy','Cardiologist','[doc3@hospital.com](mailto:doc3@hospital.com)','9000000003','DOC003','14:00:00','18:00:00','Tue-Thu','Active'),
('Dr Neha Kapoor','Dermatologist','[doc4@hospital.com](mailto:doc4@hospital.com)','9000000004','DOC004','10:00:00','16:00:00','Mon-Fri','Active'),
('Dr Rajiv Malhotra','Orthopedic','[doc5@hospital.com](mailto:doc5@hospital.com)','9000000005','DOC005','08:00:00','14:00:00','Mon-Wed','Active');

INSERT INTO StaffEmployee
(Name, Role, Email, Phone, ShiftTiming, HireDate, LicenseNumber, Status)
VALUES
('Sunita Kadam','Nurse','[staff1@college.edu](mailto:staff1@college.edu)','9100000001','Morning','2022-01-01','NUR001','Active'),
('Ramesh Pillai','Pharmacist','[staff2@college.edu](mailto:staff2@college.edu)','9100000002','Morning','2022-02-01','PHR001','Active'),
('Lakshmi Nair','Nurse','[staff3@college.edu](mailto:staff3@college.edu)','9100000003','Evening','2022-03-01','NUR002','Active'),
('Vijay Kumar','Technician','[staff4@college.edu](mailto:staff4@college.edu)','9100000004','Morning','2022-04-01','TECH001','Active'),
('Anita Desai','Admin','[staff5@college.edu](mailto:staff5@college.edu)','9100000005','General','2022-05-01',NULL,'Active');

INSERT INTO Medicine
(Name, GenericName, Category, Form, Manufacturer, UnitPrice, RequiresPrescription, Status)
VALUES
('Paracetamol 500mg','Paracetamol','Analgesic','Tablet','Cipla',2.5,FALSE,'Available'),
('Amoxicillin 500mg','Amoxicillin','Antibiotic','Capsule','Sun Pharma',8,TRUE,'Available'),
('Cetirizine 10mg','Cetirizine','Antihistamine','Tablet','Dr Reddy',3.5,FALSE,'Available'),
('Ibuprofen 400mg','Ibuprofen','Analgesic','Tablet','Lupin',4,FALSE,'Available'),
('Omeprazole 20mg','Omeprazole','Antacid','Capsule','Cadila',6.5,TRUE,'Available');

INSERT INTO Appointment
(MemberID, DoctorID, AppointmentDate, AppointmentTime, Symptoms, Status, Priority, TokenNumber)
VALUES
(1,1,'2030-01-10','10:00:00','Fever','Scheduled','Normal',101),
(2,1,'2030-01-10','10:30:00','Cold','Scheduled','Normal',102),
(3,2,'2030-01-11','11:00:00','Headache','Scheduled','Normal',103),
(4,3,'2030-01-11','14:00:00','Chest pain','Scheduled','Urgent',104),
(5,4,'2030-01-12','12:00:00','Skin rash','Scheduled','Normal',105),
(6,5,'2030-01-12','09:30:00','Knee pain','Scheduled','Normal',106),
(7,1,'2030-01-13','10:00:00','Fever','Scheduled','Normal',107),
(8,2,'2030-01-13','11:00:00','Cough','Scheduled','Normal',108),
(9,3,'2030-01-14','15:00:00','Eye irritation','Scheduled','Normal',109),
(10,4,'2030-01-14','16:00:00','Allergy','Scheduled','Normal',110);

