/**
 * Comprehensive Church Demo Seed Script
 * 
 * Seeds full demo data for demo-church tenant (slug: 'demo-church') with Nigerian context:
 * - 1 chu_church record (GraceLife Community Church)
 * - 5 chu_cell_group records (Home Cell groups with Nigerian areas)
 * - 35 chu_member records (Nigerian names, mix of adults/youth, some minors)
 * - 5 chu_event records (services, programs, outreaches)
 * - 50+ chu_attendance_fact records linking members to events
 * - 25+ giving records (tithes and offerings in Naira)
 * 
 * Run: cd frontend && npx tsx scripts/seed-church-full-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-church'

// =============================================================================
// CELL GROUPS (5 Nigerian Home Cell Groups)
// =============================================================================

const CELL_GROUPS = [
  { id: 'cell-full-001', name: 'Lekki Phase 1 Home Cell', code: 'LEK-P1-001', meetingDay: 'WEDNESDAY', meetingTime: '18:00', address: '12 Admiralty Road, Lekki Phase 1', area: 'Lekki Phase 1', hostName: 'Brother Chukwuemeka Obi', hostPhone: '08033456789', maxMembers: 15 },
  { id: 'cell-full-002', name: 'Ikeja GRA Family Cell', code: 'IKJ-GRA-001', meetingDay: 'THURSDAY', meetingTime: '19:00', address: '45 Joel Ogunnaike Street, Ikeja GRA', area: 'Ikeja GRA', hostName: 'Sister Ngozi Adeola', hostPhone: '08044567890', maxMembers: 12 },
  { id: 'cell-full-003', name: 'Victoria Island Praise Cell', code: 'VI-001', meetingDay: 'TUESDAY', meetingTime: '18:30', address: '8 Adeola Odeku Street, Victoria Island', area: 'Victoria Island', hostName: 'Deacon Francis Okoro', hostPhone: '08055678901', maxMembers: 15 },
  { id: 'cell-full-004', name: 'Surulere Grace Fellowship', code: 'SUR-001', meetingDay: 'WEDNESDAY', meetingTime: '17:30', address: '23 Adeniran Ogunsanya Street, Surulere', area: 'Surulere', hostName: 'Elder Babatunde Afolabi', hostPhone: '08066789012', maxMembers: 18 },
  { id: 'cell-full-005', name: 'Yaba Youth Connect Cell', code: 'YAB-YTH-001', meetingDay: 'FRIDAY', meetingTime: '19:00', address: '56 Herbert Macaulay Way, Yaba', area: 'Yaba', hostName: 'Pastor Mrs. Blessing Nwosu', hostPhone: '08077890123', maxMembers: 20 },
]

// =============================================================================
// MEMBERS (35 Nigerian Members - Mix of Adults, Youth, and Minors)
// =============================================================================

const MEMBERS = [
  // Adults (Workers/Leaders) - Yoruba, Igbo, Hausa mix
  { id: 'mem-full-001', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'MALE', phone: '08033445566', email: 'seun.adeyemi@email.com', occupation: 'Banker', status: 'WORKER', joinDate: '2020-03-15', dateOfBirth: '1985-06-20', isMinor: false, address: '15 Admiralty Way, Lekki Phase 1', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-002', firstName: 'Blessing', lastName: 'Okonkwo', gender: 'FEMALE', phone: '08044556677', email: 'blessing.okonkwo@email.com', occupation: 'Entrepreneur', status: 'WORKER', joinDate: '2019-06-20', dateOfBirth: '1988-02-14', isMinor: false, address: '23 Allen Avenue, Ikeja', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-003', firstName: 'Chukwuemeka', lastName: 'Obi', gender: 'MALE', phone: '08055667788', email: 'chukwuemeka.obi@email.com', occupation: 'Lawyer', status: 'WORKER', joinDate: '2018-01-10', dateOfBirth: '1980-11-05', isMinor: false, address: '12 Admiralty Road, Lekki', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-004', firstName: 'Fatima', lastName: 'Ibrahim', gender: 'FEMALE', phone: '08066778899', email: 'fatima.ibrahim@email.com', occupation: 'Teacher', status: 'MEMBER', joinDate: '2021-09-01', dateOfBirth: '1990-04-18', isMinor: false, address: '45 Bode Thomas Street, Surulere', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-005', firstName: 'Francis', lastName: 'Okoro', gender: 'MALE', phone: '08077889900', email: 'francis.okoro@email.com', occupation: 'Retired Civil Servant', status: 'WORKER', joinDate: '2015-04-25', dateOfBirth: '1958-08-30', isMinor: false, address: '8 Adeola Odeku Street, VI', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-006', firstName: 'Ngozi', lastName: 'Eze', gender: 'FEMALE', phone: '08088990011', email: 'ngozi.eze@email.com', occupation: 'Pastor', status: 'WORKER', joinDate: '2016-08-12', dateOfBirth: '1975-12-25', isMinor: false, address: '67 Opebi Road, Ikeja', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-007', firstName: 'Abdulrahman', lastName: 'Yusuf', gender: 'MALE', phone: '08099001122', email: 'abdul.yusuf@email.com', occupation: 'IT Consultant', status: 'MEMBER', joinDate: '2022-02-28', dateOfBirth: '1992-07-10', isMinor: false, address: '34 Awolowo Road, Ikoyi', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-008', firstName: 'Chioma', lastName: 'Nwosu', gender: 'FEMALE', phone: '08011223344', email: 'chioma.nwosu@email.com', occupation: 'Pharmacist', status: 'MEMBER', joinDate: '2023-01-08', dateOfBirth: '1995-03-22', isMinor: false, address: '12 Herbert Macaulay Way, Yaba', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-009', firstName: 'Babatunde', lastName: 'Afolabi', gender: 'MALE', phone: '08022334455', email: 'tunde.afolabi@email.com', occupation: 'Engineer', status: 'WORKER', joinDate: '2020-11-15', dateOfBirth: '1982-09-08', isMinor: false, address: '23 Adeniran Ogunsanya, Surulere', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-010', firstName: 'Amaka', lastName: 'Okafor', gender: 'FEMALE', phone: '08033445567', email: 'amaka.okafor@email.com', occupation: 'Nurse', status: 'MEMBER', joinDate: '2021-07-20', dateOfBirth: '1989-01-15', isMinor: false, address: '56 Murtala Mohammed Way, Yaba', city: 'Lagos', state: 'Lagos' },
  
  // More Adults
  { id: 'mem-full-011', firstName: 'Uche', lastName: 'Nnadi', gender: 'MALE', phone: '08044556678', email: 'uche.nnadi@email.com', occupation: 'Doctor', status: 'MEMBER', joinDate: '2019-04-10', dateOfBirth: '1983-05-12', isMinor: false, address: '78 Adetokunbo Ademola, VI', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-012', firstName: 'Halima', lastName: 'Mohammed', gender: 'FEMALE', phone: '08055667789', email: 'halima.m@email.com', occupation: 'Accountant', status: 'MEMBER', joinDate: '2020-08-05', dateOfBirth: '1991-10-28', isMinor: false, address: '90 Awolowo Way, Ikeja', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-013', firstName: 'Emeka', lastName: 'Uzoma', gender: 'MALE', phone: '08066778890', email: 'emeka.uzoma@email.com', occupation: 'Business Owner', status: 'WORKER', joinDate: '2017-02-14', dateOfBirth: '1978-06-30', isMinor: false, address: '34 Toyin Street, Ikeja', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-014', firstName: 'Adaeze', lastName: 'Igwe', gender: 'FEMALE', phone: '08077889901', email: 'adaeze.igwe@email.com', occupation: 'Fashion Designer', status: 'MEMBER', joinDate: '2022-05-20', dateOfBirth: '1994-11-08', isMinor: false, address: '12 Akin Adesola Street, VI', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-015', firstName: 'Musa', lastName: 'Danladi', gender: 'MALE', phone: '08088990012', email: 'musa.danladi@email.com', occupation: 'Trader', status: 'MEMBER', joinDate: '2021-03-18', dateOfBirth: '1986-04-25', isMinor: false, address: '67 Lagos Island', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-016', firstName: 'Folashade', lastName: 'Ojo', gender: 'FEMALE', phone: '08099001123', email: 'folashade.ojo@email.com', occupation: 'Journalist', status: 'MEMBER', joinDate: '2020-09-12', dateOfBirth: '1987-08-16', isMinor: false, address: '45 Ogunlana Drive, Surulere', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-017', firstName: 'Obinna', lastName: 'Chukwu', gender: 'MALE', phone: '08011223345', email: 'obinna.chukwu@email.com', occupation: 'Architect', status: 'WORKER', joinDate: '2018-07-22', dateOfBirth: '1979-12-03', isMinor: false, address: '89 Broad Street, Lagos Island', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-018', firstName: 'Aisha', lastName: 'Bello', gender: 'FEMALE', phone: '08022334456', email: 'aisha.bello@email.com', occupation: 'Lecturer', status: 'MEMBER', joinDate: '2019-11-30', dateOfBirth: '1984-02-20', isMinor: false, address: '23 University Road, Akoka', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-019', firstName: 'Chidi', lastName: 'Anyanwu', gender: 'MALE', phone: '08033445568', email: 'chidi.anyanwu@email.com', occupation: 'Pilot', status: 'MEMBER', joinDate: '2022-01-15', dateOfBirth: '1988-09-14', isMinor: false, address: '56 Airport Road, Ikeja', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-020', firstName: 'Yetunde', lastName: 'Bakare', gender: 'FEMALE', phone: '08044556679', email: 'yetunde.bakare@email.com', occupation: 'Caterer', status: 'MEMBER', joinDate: '2020-04-28', dateOfBirth: '1990-07-07', isMinor: false, address: '78 Aguda, Surulere', city: 'Lagos', state: 'Lagos' },
  
  // Youth Members (18-25 years)
  { id: 'mem-full-021', firstName: 'Tochukwu', lastName: 'Okonkwo', gender: 'MALE', phone: '08055667790', email: 'tochi.okonkwo@email.com', occupation: 'Student', status: 'MEMBER', joinDate: '2023-03-10', dateOfBirth: '2003-05-18', isMinor: false, address: '34 Unilag Campus, Akoka', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-022', firstName: 'Oluwafemi', lastName: 'Adeoye', gender: 'MALE', phone: '08066778891', email: 'femi.adeoye@email.com', occupation: 'Graduate Trainee', status: 'MEMBER', joinDate: '2024-01-08', dateOfBirth: '2001-11-22', isMinor: false, address: '45 Gbagada Estate', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-023', firstName: 'Nneka', lastName: 'Okwuosa', gender: 'FEMALE', phone: '08077889902', email: 'nneka.okwuosa@email.com', occupation: 'Intern', status: 'MEMBER', joinDate: '2023-08-15', dateOfBirth: '2002-03-30', isMinor: false, address: '67 Maryland, Lagos', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-024', firstName: 'Ibrahim', lastName: 'Suleiman', gender: 'MALE', phone: '08088990013', email: 'ibrahim.suleiman@email.com', occupation: 'Corps Member', status: 'MEMBER', joinDate: '2025-02-20', dateOfBirth: '2000-08-12', isMinor: false, address: '89 Ojota, Lagos', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-025', firstName: 'Chiamaka', lastName: 'Eze', gender: 'FEMALE', phone: '08099001124', email: 'chiamaka.eze@email.com', occupation: 'Student', status: 'MEMBER', joinDate: '2024-06-10', dateOfBirth: '2004-01-25', isMinor: false, address: '12 LASU Road, Ojo', city: 'Lagos', state: 'Lagos' },
  
  // Teenagers (Minors with guardians)
  { id: 'mem-full-026', firstName: 'David', lastName: 'Adeyemi', gender: 'MALE', phone: null, email: null, occupation: 'Secondary Student', status: 'MEMBER', joinDate: '2023-01-15', dateOfBirth: '2010-04-08', isMinor: true, address: '15 Admiralty Way, Lekki Phase 1', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-027', firstName: 'Grace', lastName: 'Okonkwo', gender: 'FEMALE', phone: null, email: null, occupation: 'Secondary Student', status: 'MEMBER', joinDate: '2021-09-05', dateOfBirth: '2011-09-20', isMinor: true, address: '23 Allen Avenue, Ikeja', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-028', firstName: 'Emmanuel', lastName: 'Obi', gender: 'MALE', phone: null, email: null, occupation: 'Secondary Student', status: 'MEMBER', joinDate: '2020-03-10', dateOfBirth: '2009-12-15', isMinor: true, address: '12 Admiralty Road, Lekki', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-029', firstName: 'Fatimah', lastName: 'Ibrahim', gender: 'FEMALE', phone: null, email: null, occupation: 'Primary Student', status: 'MEMBER', joinDate: '2022-06-01', dateOfBirth: '2014-07-30', isMinor: true, address: '45 Bode Thomas Street, Surulere', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-030', firstName: 'Chinedu', lastName: 'Okoro', gender: 'MALE', phone: null, email: null, occupation: 'Secondary Student', status: 'MEMBER', joinDate: '2019-01-20', dateOfBirth: '2008-02-28', isMinor: true, address: '8 Adeola Odeku Street, VI', city: 'Lagos', state: 'Lagos' },
  
  // More Adults
  { id: 'mem-full-031', firstName: 'Olumide', lastName: 'Fashola', gender: 'MALE', phone: '08011223346', email: 'olumide.fashola@email.com', occupation: 'Real Estate', status: 'WORKER', joinDate: '2017-05-18', dateOfBirth: '1976-03-12', isMinor: false, address: '90 Banana Island Road, Ikoyi', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-032', firstName: 'Ifeanyi', lastName: 'Nwachukwu', gender: 'MALE', phone: '08022334457', email: 'ifeanyi.n@email.com', occupation: 'Oil & Gas Executive', status: 'WORKER', joinDate: '2016-10-08', dateOfBirth: '1972-08-25', isMinor: false, address: '45 Ozumba Mbadiwe, VI', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-033', firstName: 'Khadijah', lastName: 'Abdullahi', gender: 'FEMALE', phone: '08033445569', email: 'khadijah.a@email.com', occupation: 'HR Manager', status: 'MEMBER', joinDate: '2021-12-05', dateOfBirth: '1993-06-18', isMinor: false, address: '78 Ajose Adeogun, VI', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-034', firstName: 'Ogochukwu', lastName: 'Nnamdi', gender: 'FEMALE', phone: '08044556680', email: 'ogo.nnamdi@email.com', occupation: 'Banker', status: 'MEMBER', joinDate: '2020-07-22', dateOfBirth: '1991-04-10', isMinor: false, address: '34 Marina, Lagos Island', city: 'Lagos', state: 'Lagos' },
  { id: 'mem-full-035', firstName: 'Segun', lastName: 'Olatunji', gender: 'MALE', phone: '08055667791', email: 'segun.olatunji@email.com', occupation: 'Media Producer', status: 'MEMBER', joinDate: '2022-09-30', dateOfBirth: '1996-11-28', isMinor: false, address: '56 Allen Avenue, Ikeja', city: 'Lagos', state: 'Lagos' },
]

// =============================================================================
// EVENTS (5 Church Events)
// =============================================================================

const EVENTS = [
  { id: 'evt-full-001', title: 'Sunday Thanksgiving Service', type: 'SERVICE', startDate: '2026-01-19T08:00:00', endDate: '2026-01-19T12:00:00', venue: 'Main Auditorium', status: 'COMPLETED', description: 'Weekly Sunday worship and thanksgiving service', maxAttendees: 500 },
  { id: 'evt-full-002', title: 'Midweek Bible Study', type: 'SEMINAR', startDate: '2026-01-22T18:00:00', endDate: '2026-01-22T20:00:00', venue: 'Fellowship Hall', status: 'COMPLETED', description: 'Wednesday evening Bible study and prayer meeting', maxAttendees: 150 },
  { id: 'evt-full-003', title: 'Youth Empowerment Conference', type: 'CONFERENCE', startDate: '2026-01-25T09:00:00', endDate: '2026-01-25T17:00:00', venue: 'Youth Center', status: 'SCHEDULED', description: 'Annual youth empowerment and career development conference', maxAttendees: 200 },
  { id: 'evt-full-004', title: 'Community Outreach - Surulere', type: 'OUTREACH', startDate: '2026-01-18T10:00:00', endDate: '2026-01-18T15:00:00', venue: 'Surulere Community Center', status: 'COMPLETED', description: 'Monthly community outreach with free medical checkup and food distribution', maxAttendees: 100 },
  { id: 'evt-full-005', title: 'Workers Retreat & Planning', type: 'RETREAT', startDate: '2026-02-01T08:00:00', endDate: '2026-02-02T18:00:00', venue: 'Epe Retreat Center', status: 'DRAFT', description: 'Annual workers retreat for strategic planning and fellowship', maxAttendees: 80 },
]

// =============================================================================
// TITHES (15 Tithe Records)
// =============================================================================

const TITHES = [
  { id: 'tithe-full-001', memberId: 'mem-full-001', amount: 250000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-002', memberId: 'mem-full-002', amount: 180000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-003', memberId: 'mem-full-003', amount: 450000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-004', memberId: 'mem-full-005', amount: 120000, givingPeriod: '2026-01', paymentMethod: 'CASH' },
  { id: 'tithe-full-005', memberId: 'mem-full-006', amount: 200000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-006', memberId: 'mem-full-009', amount: 350000, givingPeriod: '2026-01', paymentMethod: 'USSD' },
  { id: 'tithe-full-007', memberId: 'mem-full-011', amount: 500000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-008', memberId: 'mem-full-013', amount: 280000, givingPeriod: '2026-01', paymentMethod: 'CARD' },
  { id: 'tithe-full-009', memberId: 'mem-full-017', amount: 320000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-010', memberId: 'mem-full-031', amount: 750000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-011', memberId: 'mem-full-032', amount: 1200000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-012', memberId: 'mem-full-007', amount: 150000, givingPeriod: '2026-01', paymentMethod: 'USSD' },
  { id: 'tithe-full-013', memberId: 'mem-full-012', amount: 180000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
  { id: 'tithe-full-014', memberId: 'mem-full-019', amount: 400000, givingPeriod: '2026-01', paymentMethod: 'CARD' },
  { id: 'tithe-full-015', memberId: 'mem-full-034', amount: 220000, givingPeriod: '2026-01', paymentMethod: 'BANK_TRANSFER' },
]

// =============================================================================
// OFFERINGS (12 Offering Records)
// =============================================================================

const OFFERINGS = [
  { id: 'off-full-001', date: '2026-01-19', offeringType: 'GENERAL', amount: 3500000, serviceType: 'SUNDAY_SERVICE', notes: 'Sunday Thanksgiving - First and Second Service Combined' },
  { id: 'off-full-002', date: '2026-01-19', offeringType: 'BUILDING_FUND', amount: 1250000, serviceType: 'SUNDAY_SERVICE', notes: 'Building project contribution - January' },
  { id: 'off-full-003', date: '2026-01-19', offeringType: 'MISSIONS', amount: 650000, serviceType: 'SUNDAY_SERVICE', notes: 'Missions support offering' },
  { id: 'off-full-004', date: '2026-01-22', offeringType: 'GENERAL', amount: 450000, serviceType: 'MIDWEEK', notes: 'Wednesday Bible Study offering' },
  { id: 'off-full-005', date: '2026-01-18', offeringType: 'WELFARE', amount: 850000, serviceType: 'OUTREACH', notes: 'Outreach welfare fund collection' },
  { id: 'off-full-006', date: '2026-01-12', offeringType: 'GENERAL', amount: 2800000, serviceType: 'SUNDAY_SERVICE', notes: 'Second Sunday offering' },
  { id: 'off-full-007', date: '2026-01-12', offeringType: 'THANKSGIVING', amount: 1500000, serviceType: 'SUNDAY_SERVICE', notes: 'Special thanksgiving offering' },
  { id: 'off-full-008', date: '2026-01-05', offeringType: 'GENERAL', amount: 2200000, serviceType: 'SUNDAY_SERVICE', notes: 'First Sunday of the year' },
  { id: 'off-full-009', date: '2026-01-05', offeringType: 'FIRST_FRUIT', amount: 4500000, serviceType: 'SUNDAY_SERVICE', notes: 'New Year First Fruit offering' },
  { id: 'off-full-010', date: '2026-01-25', offeringType: 'YOUTH', amount: 350000, serviceType: 'YOUTH_SERVICE', notes: 'Youth conference offering' },
  { id: 'off-full-011', date: '2026-01-15', offeringType: 'MIDWEEK', amount: 380000, serviceType: 'MIDWEEK', notes: 'Wednesday service' },
  { id: 'off-full-012', date: '2026-01-08', offeringType: 'MIDWEEK', amount: 420000, serviceType: 'MIDWEEK', notes: 'Wednesday service - second week' },
]

// =============================================================================
// ATTENDANCE FACTS (Aggregate attendance records per event - 50+ total counts)
// chu_attendance_fact tracks aggregate counts, not individual members
// =============================================================================

const ATTENDANCE_FACTS = [
  // Sunday Service - Multiple Sundays (Jan 2026)
  { id: 'att-full-001', eventId: 'evt-full-001', attendanceDate: '2026-01-05', totalCount: 485, adultCount: 380, childrenCount: 105, maleCount: 210, femaleCount: 275, firstTimers: 12, visitors: 28, onlineCount: 45, notes: 'First Sunday service of 2026 - New Year thanksgiving' },
  { id: 'att-full-002', eventId: 'evt-full-001', attendanceDate: '2026-01-12', totalCount: 520, adultCount: 405, childrenCount: 115, maleCount: 225, femaleCount: 295, firstTimers: 8, visitors: 22, onlineCount: 52, notes: 'Second Sunday - good turnout' },
  { id: 'att-full-003', eventId: 'evt-full-001', attendanceDate: '2026-01-19', totalCount: 495, adultCount: 390, childrenCount: 105, maleCount: 215, femaleCount: 280, firstTimers: 6, visitors: 18, onlineCount: 48, notes: 'Third Sunday - Thanksgiving service' },
  { id: 'att-full-004', eventId: 'evt-full-001', attendanceDate: '2026-01-26', totalCount: 510, adultCount: 400, childrenCount: 110, maleCount: 220, femaleCount: 290, firstTimers: 10, visitors: 25, onlineCount: 55, notes: 'Last Sunday of January' },
  
  // Midweek Bible Study (Wednesdays)
  { id: 'att-full-005', eventId: 'evt-full-002', attendanceDate: '2026-01-08', totalCount: 145, adultCount: 130, childrenCount: 15, maleCount: 65, femaleCount: 80, firstTimers: 3, visitors: 8, onlineCount: 25, notes: 'Wednesday Bible Study - Book of Romans' },
  { id: 'att-full-006', eventId: 'evt-full-002', attendanceDate: '2026-01-15', totalCount: 152, adultCount: 138, childrenCount: 14, maleCount: 68, femaleCount: 84, firstTimers: 2, visitors: 5, onlineCount: 28, notes: 'Wednesday Bible Study - Romans continued' },
  { id: 'att-full-007', eventId: 'evt-full-002', attendanceDate: '2026-01-22', totalCount: 148, adultCount: 135, childrenCount: 13, maleCount: 66, femaleCount: 82, firstTimers: 4, visitors: 7, onlineCount: 22, notes: 'Wednesday Bible Study' },
  { id: 'att-full-008', eventId: 'evt-full-002', attendanceDate: '2026-01-29', totalCount: 155, adultCount: 142, childrenCount: 13, maleCount: 70, femaleCount: 85, firstTimers: 1, visitors: 4, onlineCount: 30, notes: 'Last Wednesday of January' },
  
  // Youth Empowerment Conference
  { id: 'att-full-009', eventId: 'evt-full-003', attendanceDate: '2026-01-25', totalCount: 185, adultCount: 165, childrenCount: 20, maleCount: 95, femaleCount: 90, firstTimers: 35, visitors: 48, onlineCount: 120, notes: 'Youth Empowerment Day 1 - Career session' },
  
  // Community Outreach
  { id: 'att-full-010', eventId: 'evt-full-004', attendanceDate: '2026-01-18', totalCount: 95, adultCount: 85, childrenCount: 10, maleCount: 40, femaleCount: 55, firstTimers: 0, visitors: 0, onlineCount: 0, notes: 'Surulere outreach - food distribution and free medical checkup' },
  
  // Additional Sunday services from December 2025 (historical data)
  { id: 'att-full-011', eventId: 'evt-full-001', attendanceDate: '2025-12-01', totalCount: 475, adultCount: 365, childrenCount: 110, maleCount: 205, femaleCount: 270, firstTimers: 5, visitors: 15, onlineCount: 40, notes: 'First Sunday of December' },
  { id: 'att-full-012', eventId: 'evt-full-001', attendanceDate: '2025-12-08', totalCount: 490, adultCount: 378, childrenCount: 112, maleCount: 210, femaleCount: 280, firstTimers: 7, visitors: 20, onlineCount: 42, notes: 'December - pre-Christmas' },
  { id: 'att-full-013', eventId: 'evt-full-001', attendanceDate: '2025-12-15', totalCount: 505, adultCount: 390, childrenCount: 115, maleCount: 220, femaleCount: 285, firstTimers: 8, visitors: 25, onlineCount: 48, notes: 'Third Sunday December' },
  { id: 'att-full-014', eventId: 'evt-full-001', attendanceDate: '2025-12-22', totalCount: 545, adultCount: 420, childrenCount: 125, maleCount: 235, femaleCount: 310, firstTimers: 15, visitors: 40, onlineCount: 60, notes: 'Christmas Sunday - carol service' },
  { id: 'att-full-015', eventId: 'evt-full-001', attendanceDate: '2025-12-25', totalCount: 680, adultCount: 520, childrenCount: 160, maleCount: 295, femaleCount: 385, firstTimers: 25, visitors: 85, onlineCount: 95, notes: 'Christmas Day service - special thanksgiving' },
  { id: 'att-full-016', eventId: 'evt-full-001', attendanceDate: '2025-12-29', totalCount: 465, adultCount: 355, childrenCount: 110, maleCount: 200, femaleCount: 265, firstTimers: 3, visitors: 12, onlineCount: 38, notes: 'Last Sunday of 2025' },
  { id: 'att-full-017', eventId: 'evt-full-001', attendanceDate: '2025-12-31', totalCount: 750, adultCount: 580, childrenCount: 170, maleCount: 325, femaleCount: 425, firstTimers: 30, visitors: 95, onlineCount: 120, notes: 'Crossover night service' },
  
  // November 2025 Sundays
  { id: 'att-full-018', eventId: 'evt-full-001', attendanceDate: '2025-11-03', totalCount: 460, adultCount: 355, childrenCount: 105, maleCount: 198, femaleCount: 262, firstTimers: 4, visitors: 12, onlineCount: 35, notes: 'First Sunday November' },
  { id: 'att-full-019', eventId: 'evt-full-001', attendanceDate: '2025-11-10', totalCount: 472, adultCount: 362, childrenCount: 110, maleCount: 204, femaleCount: 268, firstTimers: 6, visitors: 15, onlineCount: 38, notes: 'Second Sunday November' },
  { id: 'att-full-020', eventId: 'evt-full-001', attendanceDate: '2025-11-17', totalCount: 478, adultCount: 368, childrenCount: 110, maleCount: 206, femaleCount: 272, firstTimers: 5, visitors: 14, onlineCount: 40, notes: 'Third Sunday November' },
  { id: 'att-full-021', eventId: 'evt-full-001', attendanceDate: '2025-11-24', totalCount: 485, adultCount: 375, childrenCount: 110, maleCount: 210, femaleCount: 275, firstTimers: 7, visitors: 18, onlineCount: 42, notes: 'Fourth Sunday November - Thanksgiving' },
  
  // Midweek December 2025
  { id: 'att-full-022', eventId: 'evt-full-002', attendanceDate: '2025-12-04', totalCount: 138, adultCount: 125, childrenCount: 13, maleCount: 62, femaleCount: 76, firstTimers: 2, visitors: 5, onlineCount: 20, notes: 'December midweek' },
  { id: 'att-full-023', eventId: 'evt-full-002', attendanceDate: '2025-12-11', totalCount: 142, adultCount: 128, childrenCount: 14, maleCount: 64, femaleCount: 78, firstTimers: 3, visitors: 6, onlineCount: 22, notes: 'December midweek' },
  { id: 'att-full-024', eventId: 'evt-full-002', attendanceDate: '2025-12-18', totalCount: 135, adultCount: 122, childrenCount: 13, maleCount: 60, femaleCount: 75, firstTimers: 1, visitors: 4, onlineCount: 18, notes: 'Pre-Christmas midweek' },
  
  // October 2025 Sundays
  { id: 'att-full-025', eventId: 'evt-full-001', attendanceDate: '2025-10-06', totalCount: 455, adultCount: 350, childrenCount: 105, maleCount: 195, femaleCount: 260, firstTimers: 6, visitors: 16, onlineCount: 32, notes: 'First Sunday October' },
  { id: 'att-full-026', eventId: 'evt-full-001', attendanceDate: '2025-10-13', totalCount: 462, adultCount: 355, childrenCount: 107, maleCount: 199, femaleCount: 263, firstTimers: 4, visitors: 12, onlineCount: 35, notes: 'Second Sunday October' },
  { id: 'att-full-027', eventId: 'evt-full-001', attendanceDate: '2025-10-20', totalCount: 470, adultCount: 360, childrenCount: 110, maleCount: 203, femaleCount: 267, firstTimers: 8, visitors: 20, onlineCount: 38, notes: 'Third Sunday October' },
  { id: 'att-full-028', eventId: 'evt-full-001', attendanceDate: '2025-10-27', totalCount: 468, adultCount: 358, childrenCount: 110, maleCount: 201, femaleCount: 267, firstTimers: 5, visitors: 14, onlineCount: 36, notes: 'Fourth Sunday October' },
  
  // September 2025 Sundays
  { id: 'att-full-029', eventId: 'evt-full-001', attendanceDate: '2025-09-07', totalCount: 445, adultCount: 342, childrenCount: 103, maleCount: 190, femaleCount: 255, firstTimers: 7, visitors: 18, onlineCount: 28, notes: 'First Sunday September' },
  { id: 'att-full-030', eventId: 'evt-full-001', attendanceDate: '2025-09-14', totalCount: 452, adultCount: 347, childrenCount: 105, maleCount: 194, femaleCount: 258, firstTimers: 5, visitors: 13, onlineCount: 30, notes: 'Second Sunday September' },
  { id: 'att-full-031', eventId: 'evt-full-001', attendanceDate: '2025-09-21', totalCount: 458, adultCount: 352, childrenCount: 106, maleCount: 197, femaleCount: 261, firstTimers: 6, visitors: 15, onlineCount: 32, notes: 'Third Sunday September' },
  { id: 'att-full-032', eventId: 'evt-full-001', attendanceDate: '2025-09-28', totalCount: 462, adultCount: 355, childrenCount: 107, maleCount: 199, femaleCount: 263, firstTimers: 8, visitors: 20, onlineCount: 35, notes: 'Fourth Sunday September' },
  
  // August 2025 Sundays
  { id: 'att-full-033', eventId: 'evt-full-001', attendanceDate: '2025-08-03', totalCount: 430, adultCount: 330, childrenCount: 100, maleCount: 185, femaleCount: 245, firstTimers: 4, visitors: 10, onlineCount: 25, notes: 'First Sunday August' },
  { id: 'att-full-034', eventId: 'evt-full-001', attendanceDate: '2025-08-10', totalCount: 435, adultCount: 334, childrenCount: 101, maleCount: 187, femaleCount: 248, firstTimers: 5, visitors: 12, onlineCount: 26, notes: 'Second Sunday August' },
  { id: 'att-full-035', eventId: 'evt-full-001', attendanceDate: '2025-08-17', totalCount: 438, adultCount: 336, childrenCount: 102, maleCount: 188, femaleCount: 250, firstTimers: 6, visitors: 14, onlineCount: 28, notes: 'Third Sunday August' },
  { id: 'att-full-036', eventId: 'evt-full-001', attendanceDate: '2025-08-24', totalCount: 442, adultCount: 340, childrenCount: 102, maleCount: 190, femaleCount: 252, firstTimers: 5, visitors: 11, onlineCount: 28, notes: 'Fourth Sunday August' },
  { id: 'att-full-037', eventId: 'evt-full-001', attendanceDate: '2025-08-31', totalCount: 448, adultCount: 345, childrenCount: 103, maleCount: 193, femaleCount: 255, firstTimers: 7, visitors: 16, onlineCount: 30, notes: 'Fifth Sunday August' },
  
  // More midweek records
  { id: 'att-full-038', eventId: 'evt-full-002', attendanceDate: '2025-11-05', totalCount: 130, adultCount: 118, childrenCount: 12, maleCount: 58, femaleCount: 72, firstTimers: 2, visitors: 4, onlineCount: 18, notes: 'November midweek' },
  { id: 'att-full-039', eventId: 'evt-full-002', attendanceDate: '2025-11-12', totalCount: 135, adultCount: 122, childrenCount: 13, maleCount: 60, femaleCount: 75, firstTimers: 3, visitors: 6, onlineCount: 20, notes: 'November midweek' },
  { id: 'att-full-040', eventId: 'evt-full-002', attendanceDate: '2025-11-19', totalCount: 132, adultCount: 120, childrenCount: 12, maleCount: 59, femaleCount: 73, firstTimers: 1, visitors: 3, onlineCount: 18, notes: 'November midweek' },
  { id: 'att-full-041', eventId: 'evt-full-002', attendanceDate: '2025-11-26', totalCount: 128, adultCount: 116, childrenCount: 12, maleCount: 57, femaleCount: 71, firstTimers: 2, visitors: 5, onlineCount: 16, notes: 'Thanksgiving week midweek' },
  { id: 'att-full-042', eventId: 'evt-full-002', attendanceDate: '2025-10-01', totalCount: 125, adultCount: 114, childrenCount: 11, maleCount: 56, femaleCount: 69, firstTimers: 2, visitors: 4, onlineCount: 15, notes: 'October midweek' },
  { id: 'att-full-043', eventId: 'evt-full-002', attendanceDate: '2025-10-08', totalCount: 128, adultCount: 116, childrenCount: 12, maleCount: 57, femaleCount: 71, firstTimers: 3, visitors: 5, onlineCount: 17, notes: 'October midweek' },
  { id: 'att-full-044', eventId: 'evt-full-002', attendanceDate: '2025-10-15', totalCount: 130, adultCount: 118, childrenCount: 12, maleCount: 58, femaleCount: 72, firstTimers: 2, visitors: 4, onlineCount: 18, notes: 'October midweek' },
  { id: 'att-full-045', eventId: 'evt-full-002', attendanceDate: '2025-10-22', totalCount: 127, adultCount: 115, childrenCount: 12, maleCount: 56, femaleCount: 71, firstTimers: 1, visitors: 3, onlineCount: 16, notes: 'October midweek' },
  { id: 'att-full-046', eventId: 'evt-full-002', attendanceDate: '2025-10-29', totalCount: 132, adultCount: 120, childrenCount: 12, maleCount: 59, femaleCount: 73, firstTimers: 4, visitors: 6, onlineCount: 19, notes: 'October midweek end of month' },
  
  // Previous outreach events
  { id: 'att-full-047', eventId: 'evt-full-004', attendanceDate: '2025-12-20', totalCount: 88, adultCount: 78, childrenCount: 10, maleCount: 35, femaleCount: 53, firstTimers: 0, visitors: 0, onlineCount: 0, notes: 'December outreach - Christmas gifts distribution' },
  { id: 'att-full-048', eventId: 'evt-full-004', attendanceDate: '2025-11-15', totalCount: 92, adultCount: 82, childrenCount: 10, maleCount: 38, femaleCount: 54, firstTimers: 0, visitors: 0, onlineCount: 0, notes: 'November outreach - community clean up and health talk' },
  { id: 'att-full-049', eventId: 'evt-full-004', attendanceDate: '2025-10-18', totalCount: 85, adultCount: 76, childrenCount: 9, maleCount: 34, femaleCount: 51, firstTimers: 0, visitors: 0, onlineCount: 0, notes: 'October outreach - back to school program' },
  { id: 'att-full-050', eventId: 'evt-full-004', attendanceDate: '2025-09-20', totalCount: 80, adultCount: 72, childrenCount: 8, maleCount: 32, femaleCount: 48, firstTimers: 0, visitors: 0, onlineCount: 0, notes: 'September outreach - prison ministry visit' },
  
  // Additional records to exceed 50
  { id: 'att-full-051', eventId: 'evt-full-001', attendanceDate: '2025-07-06', totalCount: 420, adultCount: 322, childrenCount: 98, maleCount: 180, femaleCount: 240, firstTimers: 5, visitors: 12, onlineCount: 22, notes: 'July first Sunday' },
  { id: 'att-full-052', eventId: 'evt-full-001', attendanceDate: '2025-07-13', totalCount: 425, adultCount: 326, childrenCount: 99, maleCount: 183, femaleCount: 242, firstTimers: 6, visitors: 14, onlineCount: 24, notes: 'July second Sunday' },
  { id: 'att-full-053', eventId: 'evt-full-001', attendanceDate: '2025-07-20', totalCount: 428, adultCount: 328, childrenCount: 100, maleCount: 184, femaleCount: 244, firstTimers: 4, visitors: 10, onlineCount: 25, notes: 'July third Sunday' },
  { id: 'att-full-054', eventId: 'evt-full-001', attendanceDate: '2025-07-27', totalCount: 432, adultCount: 332, childrenCount: 100, maleCount: 186, femaleCount: 246, firstTimers: 7, visitors: 16, onlineCount: 26, notes: 'July fourth Sunday' },
  { id: 'att-full-055', eventId: 'evt-full-002', attendanceDate: '2025-09-03', totalCount: 120, adultCount: 110, childrenCount: 10, maleCount: 54, femaleCount: 66, firstTimers: 2, visitors: 4, onlineCount: 14, notes: 'September midweek' },
  { id: 'att-full-056', eventId: 'evt-full-002', attendanceDate: '2025-09-10', totalCount: 122, adultCount: 112, childrenCount: 10, maleCount: 55, femaleCount: 67, firstTimers: 3, visitors: 5, onlineCount: 15, notes: 'September midweek' },
  { id: 'att-full-057', eventId: 'evt-full-002', attendanceDate: '2025-09-17', totalCount: 125, adultCount: 114, childrenCount: 11, maleCount: 56, femaleCount: 69, firstTimers: 2, visitors: 4, onlineCount: 16, notes: 'September midweek' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function verifyDemoTenant() {
  console.log('Verifying Demo Tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_TENANT_SLUG }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}. Please run seed-demo-environment.ts first.`)
  }
  
  console.log(`  Found Demo Tenant: ${tenant.name} (${tenant.id})`)
  return tenant
}

async function seedChurch(tenantId: string): Promise<string> {
  console.log('Creating/updating church record...')
  
  const existing = await prisma.chu_church.findFirst({ where: { tenantId } })
  if (existing) {
    console.log(`  Church exists: ${existing.name} (${existing.id})`)
    return existing.id
  }
  
  const church = await prisma.chu_church.create({
    data: {
      tenantId,
      name: 'GraceLife Community Church',
      acronym: 'GLCC',
      motto: 'Grace for Life, Life for Grace',
      vision: 'To be a beacon of hope and transformation in Lagos and beyond, raising disciples who impact their world through love, faith, and service.',
      mission: 'We exist to win souls, nurture believers into mature disciples, equip workers for ministry, and send them out to transform communities across Nigeria and the world.',
      registrationNo: 'CAC-IT-123456',
      registeredDate: new Date('2010-05-15'),
      headquarters: 'Lekki Phase 1, Lagos',
      address: '25 Grace Boulevard, Lekki Phase 1, Lagos',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '+234-1-345-6789',
      email: 'info@gracelifechurch.ng',
      website: 'https://gracelifechurch.ng',
      status: 'ACTIVE',
      createdBy: 'DEMO_SEED_SCRIPT'
    }
  })
  console.log(`  Church created: ${church.name} (${church.id})`)
  return church.id
}

async function seedCellGroups(tenantId: string, churchId: string): Promise<number> {
  console.log('Creating cell groups...')
  let created = 0
  
  for (const cell of CELL_GROUPS) {
    const existing = await prisma.chu_cell_group.findFirst({ 
      where: { 
        OR: [
          { id: cell.id },
          { tenantId, churchId, code: cell.code }
        ]
      } 
    })
    if (existing) {
      console.log(`  Cell group exists: ${cell.name}`)
      continue
    }
    
    await prisma.chu_cell_group.create({
      data: {
        id: cell.id,
        tenantId,
        churchId,
        name: cell.name,
        code: cell.code,
        meetingDay: cell.meetingDay,
        meetingTime: cell.meetingTime,
        address: cell.address,
        area: cell.area,
        hostName: cell.hostName,
        hostPhone: cell.hostPhone,
        maxMembers: cell.maxMembers,
        status: 'ACTIVE',
        createdBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
    console.log(`  Created cell group: ${cell.name}`)
  }
  
  return created
}

async function seedMembers(tenantId: string, churchId: string): Promise<number> {
  console.log('Creating members...')
  let created = 0
  
  for (const mem of MEMBERS) {
    const existing = await prisma.chu_member.findFirst({ where: { id: mem.id } })
    if (existing) {
      console.log(`  Member exists: ${mem.firstName} ${mem.lastName}`)
      continue
    }
    
    await prisma.chu_member.create({
      data: {
        id: mem.id,
        tenantId,
        churchId,
        firstName: mem.firstName,
        lastName: mem.lastName,
        gender: mem.gender as any,
        phone: mem.phone,
        email: mem.email,
        occupation: mem.occupation,
        status: mem.status as any,
        joinDate: new Date(mem.joinDate),
        dateOfBirth: mem.dateOfBirth ? new Date(mem.dateOfBirth) : null,
        isMinor: mem.isMinor,
        address: mem.address,
        city: mem.city,
        state: mem.state,
        registeredBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  
  console.log(`  Members created: ${created}`)
  return created
}

async function seedEvents(tenantId: string, churchId: string): Promise<number> {
  console.log('Creating events...')
  let created = 0
  
  for (const evt of EVENTS) {
    const existing = await prisma.chu_event.findFirst({ where: { id: evt.id } })
    if (existing) {
      console.log(`  Event exists: ${evt.title}`)
      continue
    }
    
    await prisma.chu_event.create({
      data: {
        id: evt.id,
        tenantId,
        churchId,
        title: evt.title,
        type: evt.type,
        startDate: new Date(evt.startDate),
        endDate: new Date(evt.endDate),
        venue: evt.venue,
        status: evt.status as any,
        description: evt.description,
        maxAttendees: evt.maxAttendees,
        createdBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
    console.log(`  Created event: ${evt.title}`)
  }
  
  return created
}

async function seedAttendance(tenantId: string, churchId: string): Promise<number> {
  console.log('Creating attendance fact records...')
  let created = 0
  
  for (const att of ATTENDANCE_FACTS) {
    const existing = await prisma.chu_attendance_fact.findFirst({ where: { id: att.id } })
    if (existing) continue
    
    await prisma.chu_attendance_fact.create({
      data: {
        id: att.id,
        tenantId,
        churchId,
        eventId: att.eventId,
        attendanceDate: new Date(att.attendanceDate),
        totalCount: att.totalCount,
        adultCount: att.adultCount,
        childrenCount: att.childrenCount,
        maleCount: att.maleCount,
        femaleCount: att.femaleCount,
        firstTimers: att.firstTimers,
        visitors: att.visitors,
        onlineCount: att.onlineCount,
        notes: att.notes,
        recordedBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  
  console.log(`  Attendance fact records created: ${created}`)
  return created
}

async function seedTithes(tenantId: string, churchId: string): Promise<number> {
  console.log('Creating tithe records...')
  let created = 0
  
  for (const tithe of TITHES) {
    const existing = await prisma.chu_giving_tithe_fact.findFirst({ where: { id: tithe.id } })
    if (existing) continue
    
    await prisma.chu_giving_tithe_fact.create({
      data: {
        id: tithe.id,
        tenantId,
        churchId,
        memberId: tithe.memberId,
        amount: tithe.amount,
        currency: 'NGN',
        givingPeriod: tithe.givingPeriod,
        givenMethod: tithe.paymentMethod,
        notes: `Tithe for ${tithe.givingPeriod}`,
        recordedBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  
  console.log(`  Tithe records created: ${created}`)
  return created
}

async function seedOfferings(tenantId: string, churchId: string): Promise<number> {
  console.log('Creating offering records...')
  let created = 0
  
  for (const off of OFFERINGS) {
    const existing = await prisma.chu_giving_offering_fact.findFirst({ where: { id: off.id } })
    if (existing) continue
    
    await prisma.chu_giving_offering_fact.create({
      data: {
        id: off.id,
        tenantId,
        churchId,
        offeringType: off.offeringType,
        amount: off.amount,
        currency: 'NGN',
        givenMethod: 'MIXED',
        notes: off.notes,
        recordedBy: 'DEMO_SEED_SCRIPT'
      }
    })
    created++
  }
  
  console.log(`  Offering records created: ${created}`)
  return created
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(70))
  console.log('COMPREHENSIVE CHURCH DEMO SEEDER')
  console.log('Demo Tenant: demo-church | Nigerian Context')
  console.log('='.repeat(70))
  
  try {
    const tenant = await verifyDemoTenant()
    
    const churchId = await seedChurch(tenant.id)
    const cellGroups = await seedCellGroups(tenant.id, churchId)
    const members = await seedMembers(tenant.id, churchId)
    const events = await seedEvents(tenant.id, churchId)
    const attendance = await seedAttendance(tenant.id, churchId)
    const tithes = await seedTithes(tenant.id, churchId)
    const offerings = await seedOfferings(tenant.id, churchId)
    
    console.log('='.repeat(70))
    console.log('CHURCH DEMO SEEDING COMPLETE')
    console.log('='.repeat(70))
    console.log(`  Church:      1`)
    console.log(`  Cell Groups: ${cellGroups} / ${CELL_GROUPS.length}`)
    console.log(`  Members:     ${members} / ${MEMBERS.length}`)
    console.log(`  Events:      ${events} / ${EVENTS.length}`)
    console.log(`  Attendance:  ${attendance} / ${ATTENDANCE_FACTS.length}`)
    console.log(`  Tithes:      ${tithes} / ${TITHES.length}`)
    console.log(`  Offerings:   ${offerings} / ${OFFERINGS.length}`)
    console.log('='.repeat(70))
    console.log(`  Total Giving Records: ${tithes + offerings}`)
    console.log('='.repeat(70))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
