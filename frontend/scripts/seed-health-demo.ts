/**
 * Demo Seed Script — PHASE D3-B
 * EXECUTION APPROVED
 * 
 * Health Suite - Nigerian Clinic Demo Data Seeder
 * 
 * Creates demo data for a Nigerian healthcare clinic:
 * - Healthcare facility configuration
 * - Facility
 * - Providers (doctors, nurses)
 * - Patients with Nigerian names
 * - Appointments
 * 
 * Run: npx tsx scripts/seed-health-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-clinic'

// =============================================================================
// FACILITY
// =============================================================================

const FACILITY = {
  id: 'facility-001',
  name: 'HealthFirst Medical Centre',
  code: 'HF-LAGOS',
  type: 'CLINIC',
  description: 'Premier primary healthcare facility in Lagos',
  phone: '01-2345678',
  email: 'info@healthfirst.ng',
  address: {
    street: '45 Broad Street',
    city: 'Lagos Island',
    state: 'Lagos',
    lga: 'Lagos Island',
    country: 'Nigeria'
  }
}

// =============================================================================
// PROVIDERS (Nigerian Medical Staff)
// =============================================================================

const PROVIDERS = [
  { id: 'prov-001', firstName: 'Chukwuemeka', lastName: 'Nnamdi', title: 'Dr.', role: 'DOCTOR', specialty: 'General Practice', license: 'MDCN/2010/45678', email: 'c.nnamdi@healthfirst.ng', phone: '08011112222' },
  { id: 'prov-002', firstName: 'Fatima', lastName: 'Ibrahim', title: 'Dr.', role: 'DOCTOR', specialty: 'Internal Medicine', license: 'MDCN/2012/56789', email: 'f.ibrahim@healthfirst.ng', phone: '08022223333' },
  { id: 'prov-003', firstName: 'Oluwaseun', lastName: 'Adeyemi', title: 'Dr.', role: 'DOCTOR', specialty: 'Family Medicine', license: 'MDCN/2015/67890', email: 'o.adeyemi@healthfirst.ng', phone: '08033334444' },
  { id: 'prov-004', firstName: 'Ngozi', lastName: 'Okwu', title: 'Dr.', role: 'DOCTOR', specialty: 'Pediatrics', license: 'MDCN/2016/78901', email: 'n.okwu@healthfirst.ng', phone: '08044445555' },
  { id: 'prov-005', firstName: 'Yusuf', lastName: 'Garba', title: 'Dr.', role: 'DOCTOR', specialty: 'Obstetrics & Gynecology', license: 'MDCN/2014/89012', email: 'y.garba@healthfirst.ng', phone: '08055556666' },
  { id: 'prov-006', firstName: 'Amaka', lastName: 'Eze', title: 'Nurse', role: 'NURSE', specialty: 'Nursing', license: 'NMC/2018/12345', email: 'a.eze@healthfirst.ng', phone: '08066667777' },
  { id: 'prov-007', firstName: 'Blessing', lastName: 'Okafor', title: 'Nurse', role: 'NURSE', specialty: 'Nursing', license: 'NMC/2019/23456', email: 'b.okafor@healthfirst.ng', phone: '08077778888' },
  { id: 'prov-008', firstName: 'Halima', lastName: 'Bello', title: 'Nurse', role: 'NURSE', specialty: 'Nursing', license: 'NMC/2020/34567', email: 'h.bello@healthfirst.ng', phone: '08088889999' },
  { id: 'prov-009', firstName: 'Tunde', lastName: 'Bakare', title: 'Mr.', role: 'LAB_TECHNICIAN', specialty: 'Laboratory', license: 'MLT/2017/45678', email: 't.bakare@healthfirst.ng', phone: '08099990000' },
  { id: 'prov-010', firstName: 'Chidinma', lastName: 'Obi', title: 'Mrs.', role: 'PHARMACIST', specialty: 'Pharmacy', license: 'PCN/2016/56789', email: 'c.obi@healthfirst.ng', phone: '08010101010' },
]

// =============================================================================
// PATIENTS (Nigerian Demographics)
// =============================================================================

const BLOOD_GROUPS: Record<string, string> = {
  'O+': 'O_POSITIVE',
  'O-': 'O_NEGATIVE',
  'A+': 'A_POSITIVE',
  'A-': 'A_NEGATIVE',
  'B+': 'B_POSITIVE',
  'B-': 'B_NEGATIVE',
  'AB+': 'AB_POSITIVE',
  'AB-': 'AB_NEGATIVE',
}

const PATIENTS = [
  { id: 'pat-001', mrn: 'MRN-001', firstName: 'Adaeze', lastName: 'Okoro', gender: 'FEMALE', dob: '1985-03-15', phone: '08111222333', email: 'adaeze.okoro@email.com', bloodGroup: 'O+', address: { street: '12 Akin Adesola Street', city: 'Victoria Island', state: 'Lagos', country: 'Nigeria' } },
  { id: 'pat-002', mrn: 'MRN-002', firstName: 'Emeka', lastName: 'Nwosu', gender: 'MALE', dob: '1978-07-22', phone: '08222333444', email: 'emeka.nwosu@email.com', bloodGroup: 'A+', address: { street: '45 Allen Avenue', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' } },
  { id: 'pat-003', mrn: 'MRN-003', firstName: 'Fatima', lastName: 'Abubakar', gender: 'FEMALE', dob: '1992-11-08', phone: '08333444555', email: 'fatima.abubakar@email.com', bloodGroup: 'B+', address: { street: '78 Ahmadu Bello Way', city: 'Kaduna', state: 'Kaduna', country: 'Nigeria' } },
  { id: 'pat-004', mrn: 'MRN-004', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'MALE', dob: '1965-01-30', phone: '08444555666', email: 'seun.adeyemi@email.com', bloodGroup: 'AB+', address: { street: '23 Ogunlana Drive', city: 'Surulere', state: 'Lagos', country: 'Nigeria' } },
  { id: 'pat-005', mrn: 'MRN-005', firstName: 'Ngozi', lastName: 'Eze', gender: 'FEMALE', dob: '2018-05-12', phone: '08555666777', email: 'ngozi.parent@email.com', bloodGroup: 'O+', address: { street: '56 Wuse Zone 5', city: 'Abuja', state: 'FCT', country: 'Nigeria' } },
  { id: 'pat-006', mrn: 'MRN-006', firstName: 'Abdullahi', lastName: 'Mohammed', gender: 'MALE', dob: '1955-09-18', phone: '08666777888', email: 'abdullahi.m@email.com', bloodGroup: 'A-', address: { street: '34 Gimbiya Street', city: 'Garki', state: 'FCT', country: 'Nigeria' } },
  { id: 'pat-007', mrn: 'MRN-007', firstName: 'Chidinma', lastName: 'Okafor', gender: 'FEMALE', dob: '1988-12-25', phone: '08777888999', email: 'chidinma.ok@email.com', bloodGroup: 'B-', address: { street: '89 Rumuola Road', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria' } },
  { id: 'pat-008', mrn: 'MRN-008', firstName: 'Tunde', lastName: 'Bakare', gender: 'MALE', dob: '1990-04-03', phone: '08888999000', email: 'tunde.bakare@email.com', bloodGroup: 'O+', address: { street: '67 Opebi Road', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' } },
  { id: 'pat-009', mrn: 'MRN-009', firstName: 'Blessing', lastName: 'Ndu', gender: 'FEMALE', dob: '1975-08-14', phone: '08999000111', email: 'blessing.ndu@email.com', bloodGroup: 'A+', address: { street: '12 Awolowo Road', city: 'Ikoyi', state: 'Lagos', country: 'Nigeria' } },
  { id: 'pat-010', mrn: 'MRN-010', firstName: 'Yusuf', lastName: 'Sani', gender: 'MALE', dob: '2015-02-28', phone: '08100111222', email: 'yusuf.parent@email.com', bloodGroup: 'B+', address: { street: '45 Murtala Mohammed Way', city: 'Kano', state: 'Kano', country: 'Nigeria' } },
  { id: 'pat-011', mrn: 'MRN-011', firstName: 'Amaka', lastName: 'Uzoma', gender: 'FEMALE', dob: '1995-06-20', phone: '08200222333', email: 'amaka.uzoma@email.com', bloodGroup: 'O-', address: { street: '23 New Haven', city: 'Enugu', state: 'Enugu', country: 'Nigeria' } },
  { id: 'pat-012', mrn: 'MRN-012', firstName: 'Gbenga', lastName: 'Adeola', gender: 'MALE', dob: '1982-10-11', phone: '08300333444', email: 'gbenga.adeola@email.com', bloodGroup: 'AB-', address: { street: '78 Ring Road', city: 'Ibadan', state: 'Oyo', country: 'Nigeria' } },
  { id: 'pat-013', mrn: 'MRN-013', firstName: 'Hauwa', lastName: 'Ibrahim', gender: 'FEMALE', dob: '2010-03-05', phone: '08400444555', email: 'hauwa.parent@email.com', bloodGroup: 'A+', address: { street: '56 Zaria Road', city: 'Kaduna', state: 'Kaduna', country: 'Nigeria' } },
  { id: 'pat-014', mrn: 'MRN-014', firstName: 'Chukwuemeka', lastName: 'Agu', gender: 'MALE', dob: '1970-07-28', phone: '08500555666', email: 'emeka.agu@email.com', bloodGroup: 'B+', address: { street: '34 Ogui Road', city: 'Enugu', state: 'Enugu', country: 'Nigeria' } },
  { id: 'pat-015', mrn: 'MRN-015', firstName: 'Folake', lastName: 'Ogunleye', gender: 'FEMALE', dob: '1998-11-15', phone: '08600666777', email: 'folake.og@email.com', bloodGroup: 'O+', address: { street: '89 Lekki Phase 1', city: 'Lekki', state: 'Lagos', country: 'Nigeria' } },
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
    throw new Error(`FATAL: Demo Tenant not found with slug: ${DEMO_TENANT_SLUG}`)
  }
  
  console.log(`  Found Demo Tenant: ${tenant.name} (${tenant.id})`)
  return tenant
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
        facilityName: 'HealthFirst Medical Centre',
        facilityType: 'CLINIC',
        facilityCode: 'HF-LAGOS',
        facilityLicense: 'NMC/LAG/2020/1234',
        patientMrnPrefix: 'MRN',
        patientMrnNextSeq: 16,
        visitNumberPrefix: 'VST',
        visitNumberNextSeq: 1,
        defaultAppointmentDuration: 30,
        allowWalkIns: true,
        allowOnlineBooking: true,
        requireVitalsOnEncounter: true,
        autoCreateBillingFacts: true,
        defaultConsultationFee: 5000,
        requireConsentOnRegistration: true,
        isActive: true,
      }
    })
    console.log('  Created health configuration')
  } else {
    console.log('  Config exists')
  }
}

async function seedFacility(tenantId: string) {
  console.log('Creating facility...')
  
  const facilityId = `${tenantId}-${FACILITY.id}`
  
  const existing = await prisma.health_facility.findFirst({
    where: { id: facilityId }
  })
  
  if (!existing) {
    await prisma.health_facility.create({
      data: {
        id: facilityId,
        tenantId,
        name: FACILITY.name,
        code: FACILITY.code,
        type: FACILITY.type as any,
        description: FACILITY.description,
        phone: FACILITY.phone,
        email: FACILITY.email,
        address: FACILITY.address,
        isActive: true,
      }
    })
    console.log(`  Created facility: ${FACILITY.name}`)
  } else {
    console.log(`  Facility exists: ${FACILITY.name}`)
  }
  
  return facilityId
}

async function seedProviders(tenantId: string, facilityId: string) {
  console.log('Creating providers...')
  
  for (const prov of PROVIDERS) {
    const providerId = `${tenantId}-${prov.id}`
    
    const existing = await prisma.health_provider.findFirst({
      where: { id: providerId }
    })
    
    if (!existing) {
      await prisma.health_provider.create({
        data: {
          id: providerId,
          tenantId,
          firstName: prov.firstName,
          lastName: prov.lastName,
          title: prov.title,
          role: prov.role as any,
          specialty: prov.specialty,
          licenseNumber: prov.license,
          email: prov.email,
          phone: prov.phone,
          facilityId,
          isActive: true,
        }
      })
      console.log(`  Created provider: ${prov.title} ${prov.firstName} ${prov.lastName}`)
    } else {
      console.log(`  Provider exists: ${prov.firstName} ${prov.lastName}`)
    }
  }
}

async function seedPatients(tenantId: string) {
  console.log('Creating patients...')
  
  for (const pat of PATIENTS) {
    const patientId = `${tenantId}-${pat.id}`
    
    const existing = await prisma.health_patient.findFirst({
      where: { id: patientId }
    })
    
    if (!existing) {
      await prisma.health_patient.create({
        data: {
          id: patientId,
          tenantId,
          mrn: pat.mrn,
          firstName: pat.firstName,
          lastName: pat.lastName,
          gender: pat.gender as any,
          dateOfBirth: new Date(pat.dob),
          bloodGroup: BLOOD_GROUPS[pat.bloodGroup] as any,
          phone: pat.phone,
          email: pat.email,
          address: pat.address,
          status: 'ACTIVE',
          isActive: true,
        }
      })
      console.log(`  Created patient: ${pat.firstName} ${pat.lastName}`)
    } else {
      console.log(`  Patient exists: ${pat.firstName} ${pat.lastName}`)
    }
  }
}

async function seedAppointments(tenantId: string, facilityId: string) {
  console.log('Creating appointments...')
  
  const patients = await prisma.health_patient.findMany({
    where: { tenantId },
    take: 10
  })
  
  const providers = await prisma.health_provider.findMany({
    where: { tenantId, role: 'DOCTOR' },
    take: 5
  })
  
  if (patients.length === 0 || providers.length === 0) {
    console.log('  Skipping - no patients or providers')
    return
  }
  
  const appointmentTypes = ['CONSULTATION', 'FOLLOW_UP', 'LAB_TEST', 'VACCINATION']
  const today = new Date()
  let created = 0
  
  for (let i = 0; i < 10; i++) {
    const patient = patients[i % patients.length]
    const provider = providers[i % providers.length]
    const appointmentId = `${tenantId}-apt-${i + 1}`
    
    const existing = await prisma.health_appointment.findFirst({
      where: { id: appointmentId }
    })
    
    if (!existing) {
      const appointmentDate = new Date(today)
      appointmentDate.setDate(today.getDate() + i)
      
      await prisma.health_appointment.create({
        data: {
          id: appointmentId,
          tenantId,
          patientId: patient.id,
          providerId: provider.id,
          facilityId,
          appointmentDate,
          appointmentTime: `${9 + (i % 8)}:00`,
          duration: 30,
          type: appointmentTypes[i % appointmentTypes.length] as any,
          status: i < 3 ? 'COMPLETED' : 'SCHEDULED',
          isWalkIn: false,
          reason: 'Routine checkup',
        }
      })
      created++
    }
  }
  console.log(`  Created ${created} appointments`)
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
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration
    await seedConfig(tenant.id)
    const facilityId = await seedFacility(tenant.id)
    
    // Step 3: Seed operational data
    await seedProviders(tenant.id, facilityId)
    await seedPatients(tenant.id)
    await seedAppointments(tenant.id, facilityId)
    
    console.log('='.repeat(60))
    console.log('HEALTH DEMO SEEDING COMPLETE')
    console.log(`  Config: 1`)
    console.log(`  Facility: 1`)
    console.log(`  Providers: ${PROVIDERS.length}`)
    console.log(`  Patients: ${PATIENTS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
