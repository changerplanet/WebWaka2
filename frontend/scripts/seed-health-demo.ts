/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Health Suite - Nigerian Clinic Demo Data Seeder
 * 
 * Creates demo data for a Nigerian healthcare clinic:
 * - Healthcare facility configuration
 * - Providers (doctors, nurses)
 * - Patients with Nigerian names
 * - Appointments
 * - Encounters and consultations
 * - Prescriptions
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-health-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-clinic'

// =============================================================================
// FACILITY CONFIGURATION
// =============================================================================

const FACILITY = {
  id: 'facility-001',
  name: 'HealthFirst Clinic',
  type: 'PRIMARY_CARE',
  address: '45 Broad Street, Lagos Island, Lagos',
  phone: '01-2345678',
  email: 'info@healthfirst.ng',
  licenseNumber: 'NMC/LAG/2020/1234',
}

// =============================================================================
// PROVIDERS (Nigerian Medical Staff)
// =============================================================================

const PROVIDERS = [
  { id: 'prov-001', name: 'Dr. Chukwuemeka Nnamdi', title: 'Medical Director', specialty: 'General Practice', license: 'MDCN/2010/45678', email: 'c.nnamdi@healthfirst.ng', phone: '08011112222' },
  { id: 'prov-002', name: 'Dr. Fatima Ibrahim', title: 'Senior Physician', specialty: 'Internal Medicine', license: 'MDCN/2012/56789', email: 'f.ibrahim@healthfirst.ng', phone: '08022223333' },
  { id: 'prov-003', name: 'Dr. Oluwaseun Adeyemi', title: 'Physician', specialty: 'Family Medicine', license: 'MDCN/2015/67890', email: 'o.adeyemi@healthfirst.ng', phone: '08033334444' },
  { id: 'prov-004', name: 'Dr. Ngozi Okwu', title: 'Physician', specialty: 'Pediatrics', license: 'MDCN/2016/78901', email: 'n.okwu@healthfirst.ng', phone: '08044445555' },
  { id: 'prov-005', name: 'Dr. Yusuf Garba', title: 'Physician', specialty: 'Obstetrics & Gynecology', license: 'MDCN/2014/89012', email: 'y.garba@healthfirst.ng', phone: '08055556666' },
  { id: 'prov-006', name: 'Nurse Amaka Eze', title: 'Head Nurse', specialty: 'Nursing', license: 'NMC/2018/12345', email: 'a.eze@healthfirst.ng', phone: '08066667777' },
  { id: 'prov-007', name: 'Nurse Blessing Okafor', title: 'Staff Nurse', specialty: 'Nursing', license: 'NMC/2019/23456', email: 'b.okafor@healthfirst.ng', phone: '08077778888' },
  { id: 'prov-008', name: 'Nurse Halima Bello', title: 'Staff Nurse', specialty: 'Nursing', license: 'NMC/2020/34567', email: 'h.bello@healthfirst.ng', phone: '08088889999' },
  { id: 'prov-009', name: 'Mr. Tunde Bakare', title: 'Lab Technician', specialty: 'Laboratory', license: 'MLT/2017/45678', email: 't.bakare@healthfirst.ng', phone: '08099990000' },
  { id: 'prov-010', name: 'Mrs. Chidinma Obi', title: 'Pharmacist', specialty: 'Pharmacy', license: 'PCN/2016/56789', email: 'c.obi@healthfirst.ng', phone: '08010101010' },
]

// =============================================================================
// PATIENTS (Nigerian Demographics)
// =============================================================================

const PATIENTS = [
  { id: 'pat-001', firstName: 'Adaeze', lastName: 'Okoro', gender: 'F', dob: '1985-03-15', phone: '08111222333', email: 'adaeze.okoro@email.com', bloodType: 'O+', address: '12 Akin Adesola Street, Victoria Island' },
  { id: 'pat-002', firstName: 'Emeka', lastName: 'Nwosu', gender: 'M', dob: '1978-07-22', phone: '08222333444', email: 'emeka.nwosu@email.com', bloodType: 'A+', address: '45 Allen Avenue, Ikeja' },
  { id: 'pat-003', firstName: 'Fatima', lastName: 'Abubakar', gender: 'F', dob: '1992-11-08', phone: '08333444555', email: 'fatima.abubakar@email.com', bloodType: 'B+', address: '78 Ahmadu Bello Way, Kaduna' },
  { id: 'pat-004', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'M', dob: '1965-01-30', phone: '08444555666', email: 'seun.adeyemi@email.com', bloodType: 'AB+', address: '23 Ogunlana Drive, Surulere' },
  { id: 'pat-005', firstName: 'Ngozi', lastName: 'Eze', gender: 'F', dob: '2018-05-12', phone: '08555666777', email: 'ngozi.parent@email.com', bloodType: 'O+', address: '56 Wuse Zone 5, Abuja' },
  { id: 'pat-006', firstName: 'Abdullahi', lastName: 'Mohammed', gender: 'M', dob: '1955-09-18', phone: '08666777888', email: 'abdullahi.m@email.com', bloodType: 'A-', address: '34 Gimbiya Street, Garki' },
  { id: 'pat-007', firstName: 'Chidinma', lastName: 'Okafor', gender: 'F', dob: '1988-12-25', phone: '08777888999', email: 'chidinma.ok@email.com', bloodType: 'B-', address: '89 Rumuola Road, Port Harcourt' },
  { id: 'pat-008', firstName: 'Tunde', lastName: 'Bakare', gender: 'M', dob: '1990-04-03', phone: '08888999000', email: 'tunde.bakare@email.com', bloodType: 'O+', address: '67 Opebi Road, Ikeja' },
  { id: 'pat-009', firstName: 'Blessing', lastName: 'Ndu', gender: 'F', dob: '1975-08-14', phone: '08999000111', email: 'blessing.ndu@email.com', bloodType: 'A+', address: '12 Awolowo Road, Ikoyi' },
  { id: 'pat-010', firstName: 'Yusuf', lastName: 'Sani', gender: 'M', dob: '2015-02-28', phone: '08100111222', email: 'yusuf.parent@email.com', bloodType: 'B+', address: '45 Murtala Mohammed Way, Kano' },
  { id: 'pat-011', firstName: 'Amaka', lastName: 'Uzoma', gender: 'F', dob: '1995-06-20', phone: '08200222333', email: 'amaka.uzoma@email.com', bloodType: 'O-', address: '23 New Haven, Enugu' },
  { id: 'pat-012', firstName: 'Gbenga', lastName: 'Adeola', gender: 'M', dob: '1982-10-11', phone: '08300333444', email: 'gbenga.adeola@email.com', bloodType: 'AB-', address: '78 Ring Road, Ibadan' },
  { id: 'pat-013', firstName: 'Hauwa', lastName: 'Ibrahim', gender: 'F', dob: '2010-03-05', phone: '08400444555', email: 'hauwa.parent@email.com', bloodType: 'A+', address: '56 Zaria Road, Kaduna' },
  { id: 'pat-014', firstName: 'Chukwuemeka', lastName: 'Agu', gender: 'M', dob: '1970-07-28', phone: '08500555666', email: 'emeka.agu@email.com', bloodType: 'B+', address: '34 Ogui Road, Enugu' },
  { id: 'pat-015', firstName: 'Folake', lastName: 'Ogunleye', gender: 'F', dob: '1998-11-15', phone: '08600666777', email: 'folake.og@email.com', bloodType: 'O+', address: '89 Lekki Phase 1, Lagos' },
]

// =============================================================================
// COMMON DIAGNOSES (Nigerian Context)
// =============================================================================

const DIAGNOSES = [
  { code: 'A01.0', name: 'Typhoid Fever', category: 'Infectious' },
  { code: 'B50.9', name: 'Malaria, Unspecified', category: 'Parasitic' },
  { code: 'I10', name: 'Essential Hypertension', category: 'Cardiovascular' },
  { code: 'E11.9', name: 'Type 2 Diabetes Mellitus', category: 'Metabolic' },
  { code: 'J06.9', name: 'Upper Respiratory Infection', category: 'Respiratory' },
  { code: 'A09', name: 'Diarrhea and Gastroenteritis', category: 'Gastrointestinal' },
  { code: 'K29.7', name: 'Gastritis, Unspecified', category: 'Gastrointestinal' },
  { code: 'M54.5', name: 'Low Back Pain', category: 'Musculoskeletal' },
  { code: 'N39.0', name: 'Urinary Tract Infection', category: 'Genitourinary' },
  { code: 'L30.9', name: 'Dermatitis, Unspecified', category: 'Dermatological' },
]

// =============================================================================
// COMMON MEDICATIONS (Nigerian Pharmacy)
// =============================================================================

const MEDICATIONS = [
  { name: 'Coartem (Artemether-Lumefantrine)', dosage: '20/120mg', form: 'Tablet', usage: 'Malaria treatment' },
  { name: 'Paracetamol', dosage: '500mg', form: 'Tablet', usage: 'Pain relief, fever' },
  { name: 'Amoxicillin', dosage: '500mg', form: 'Capsule', usage: 'Bacterial infections' },
  { name: 'Ciprofloxacin', dosage: '500mg', form: 'Tablet', usage: 'Typhoid, bacterial infections' },
  { name: 'Metformin', dosage: '500mg', form: 'Tablet', usage: 'Diabetes management' },
  { name: 'Lisinopril', dosage: '10mg', form: 'Tablet', usage: 'Hypertension' },
  { name: 'Omeprazole', dosage: '20mg', form: 'Capsule', usage: 'Gastric ulcer, reflux' },
  { name: 'Ibuprofen', dosage: '400mg', form: 'Tablet', usage: 'Pain, inflammation' },
  { name: 'Oral Rehydration Salts', dosage: '1 sachet', form: 'Powder', usage: 'Diarrhea, dehydration' },
  { name: 'Vitamin C', dosage: '1000mg', form: 'Tablet', usage: 'Immune support' },
]

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function verifyDemoPartner() {
  console.log('Verifying Demo Partner exists...')
  
  const partner = await prisma.partner.findUnique({
    where: { id: DEMO_PARTNER_ID }
  })
  
  if (!partner) {
    throw new Error(`FATAL: Demo Partner not found with ID: ${DEMO_PARTNER_ID}`)
  }
  
  console.log(`  Found Demo Partner: ${partner.name}`)
  return partner
}

async function verifyDemoTenant() {
  console.log('Verifying Demo Tenant exists...')
  
  const tenant = await prisma.tenant.findFirst({
    where: { 
      slug: DEMO_TENANT_SLUG,
      partnerId: DEMO_PARTNER_ID 
    }
  })
  
  if (!tenant) {
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}`)
  }
  
  if (tenant.partnerId !== DEMO_PARTNER_ID) {
    throw new Error(`FATAL: Demo Tenant does not belong to Demo Partner`)
  }
  
  console.log(`  Found Demo Tenant: ${tenant.name} (${tenant.id})`)
  return tenant
}

async function seedFacility(tenantId: string) {
  console.log('Creating facility configuration...')
  
  const existing = await prisma.health_facility.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.health_facility.create({
      data: {
        id: `${tenantId}-${FACILITY.id}`,
        tenantId,
        name: FACILITY.name,
        type: FACILITY.type,
        address: FACILITY.address,
        phone: FACILITY.phone,
        email: FACILITY.email,
        licenseNumber: FACILITY.licenseNumber,
        isActive: true,
      }
    })
    console.log(`  Created facility: ${FACILITY.name}`)
  }
}

async function seedProviders(tenantId: string) {
  console.log('Creating healthcare providers...')
  
  for (const prov of PROVIDERS) {
    const existing = await prisma.health_provider.findFirst({
      where: { tenantId, email: prov.email }
    })
    
    if (!existing) {
      await prisma.health_provider.create({
        data: {
          id: `${tenantId}-${prov.id}`,
          tenantId,
          name: prov.name,
          title: prov.title,
          specialty: prov.specialty,
          licenseNumber: prov.license,
          email: prov.email,
          phone: prov.phone,
          isActive: true,
        }
      })
      console.log(`  Created provider: ${prov.name} (${prov.specialty})`)
    }
  }
}

async function seedPatients(tenantId: string) {
  console.log('Creating patients...')
  
  for (const pat of PATIENTS) {
    const existing = await prisma.health_patient.findFirst({
      where: { tenantId, email: pat.email }
    })
    
    if (!existing) {
      await prisma.health_patient.create({
        data: {
          id: `${tenantId}-${pat.id}`,
          tenantId,
          firstName: pat.firstName,
          lastName: pat.lastName,
          gender: pat.gender,
          dateOfBirth: new Date(pat.dob),
          phone: pat.phone,
          email: pat.email,
          bloodType: pat.bloodType,
          address: pat.address,
          registrationDate: new Date(),
          isActive: true,
        }
      })
      console.log(`  Created patient: ${pat.firstName} ${pat.lastName}`)
    }
  }
}

async function seedAppointments(tenantId: string) {
  console.log('Creating appointments...')
  
  const today = new Date()
  const appointments = [
    { patientId: 'pat-001', providerId: 'prov-002', date: new Date(today.getTime() + 86400000), time: '09:00', type: 'Follow-up', status: 'SCHEDULED' },
    { patientId: 'pat-002', providerId: 'prov-003', date: new Date(today.getTime() + 86400000), time: '10:30', type: 'Consultation', status: 'SCHEDULED' },
    { patientId: 'pat-003', providerId: 'prov-005', date: new Date(today.getTime() + 86400000), time: '11:00', type: 'Antenatal Visit', status: 'SCHEDULED' },
    { patientId: 'pat-005', providerId: 'prov-004', date: new Date(today.getTime() + 86400000 * 2), time: '09:30', type: 'Pediatric Checkup', status: 'SCHEDULED' },
    { patientId: 'pat-006', providerId: 'prov-002', date: new Date(today.getTime() + 86400000 * 2), time: '14:00', type: 'Chronic Care Review', status: 'SCHEDULED' },
    { patientId: 'pat-001', providerId: 'prov-002', date: new Date(today.getTime() - 86400000 * 7), time: '09:00', type: 'Initial Consultation', status: 'COMPLETED' },
    { patientId: 'pat-004', providerId: 'prov-003', date: new Date(today.getTime() - 86400000 * 14), time: '11:00', type: 'Blood Pressure Check', status: 'COMPLETED' },
    { patientId: 'pat-007', providerId: 'prov-002', date: new Date(today.getTime() - 86400000 * 3), time: '10:00', type: 'Sick Visit', status: 'COMPLETED' },
  ]
  
  for (let i = 0; i < appointments.length; i++) {
    const appt = appointments[i]
    await prisma.health_appointment.create({
      data: {
        id: `${tenantId}-appt-${i + 1}`,
        tenantId,
        patientId: `${tenantId}-${appt.patientId}`,
        providerId: `${tenantId}-${appt.providerId}`,
        scheduledDate: appt.date,
        scheduledTime: appt.time,
        appointmentType: appt.type,
        status: appt.status,
        notes: `${appt.type} appointment`,
      }
    })
    console.log(`  Created appointment: ${appt.type} on ${appt.date.toDateString()}`)
  }
}

async function seedConfig(tenantId: string) {
  console.log('Creating health configuration...')
  
  const existing = await prisma.health_config.findFirst({
    where: { tenantId }
  })
  
  if (!existing) {
    await prisma.health_config.create({
      data: {
        tenantId,
        appointmentDuration: 30,
        workingHoursStart: '08:00',
        workingHoursEnd: '18:00',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        currency: 'NGN',
        consultationFee: 5000,
      }
    })
    console.log('  Created health configuration')
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('HEALTH SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Clinic')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    await seedFacility(tenant.id)
    
    // Step 3: Seed operational data (people)
    await seedProviders(tenant.id)
    await seedPatients(tenant.id)
    
    // Step 4: Seed transaction data
    await seedAppointments(tenant.id)
    
    console.log('='.repeat(60))
    console.log('HEALTH DEMO SEEDING COMPLETE')
    console.log(`  Facility: 1`)
    console.log(`  Providers: ${PROVIDERS.length}`)
    console.log(`  Patients: ${PATIENTS.length}`)
    console.log(`  Appointments: 8`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
