/**
 * Portal Demo Seed Script — Phase E2.2
 * 
 * Seeds demo user accounts with portal access for testing:
 * - Creates demo tenants if they don't exist
 * - Creates demo user accounts for guardians and patients
 * - Creates guardians and links them to students
 * - Links patients to user accounts
 * 
 * Run: npx tsx scripts/seed-portal-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

const DEMO_SCHOOL_SLUG = 'demo-school'
const DEMO_CLINIC_SLUG = 'demo-clinic'

async function ensureDemoTenants() {
  let schoolTenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_SCHOOL_SLUG }
  })
  
  if (!schoolTenant) {
    schoolTenant = await prisma.tenant.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Bright Future Academy',
        slug: DEMO_SCHOOL_SLUG,
        status: 'ACTIVE',
        updatedAt: new Date(),
      }
    })
    console.log('   Created demo-school tenant')
  }
  
  let clinicTenant = await prisma.tenant.findFirst({
    where: { slug: DEMO_CLINIC_SLUG }
  })
  
  if (!clinicTenant) {
    clinicTenant = await prisma.tenant.create({
      data: {
        id: crypto.randomUUID(),
        name: 'HealthFirst Clinic',
        slug: DEMO_CLINIC_SLUG,
        status: 'ACTIVE',
        updatedAt: new Date(),
      }
    })
    console.log('   Created demo-clinic tenant')
  }
  
  return { schoolTenant, clinicTenant }
}

const DEMO_GUARDIAN_USERS = [
  { email: 'guardian1@demo.com', name: 'Chief Okoro', firstName: 'Chief', lastName: 'Okoro', phone: '08011001100', relationship: 'FATHER' },
  { email: 'guardian2@demo.com', name: 'Mrs. Eze', firstName: 'Chiamaka', lastName: 'Eze', phone: '08022002200', relationship: 'MOTHER' },
  { email: 'guardian3@demo.com', name: 'Alhaji Abubakar', firstName: 'Alhaji', lastName: 'Abubakar', phone: '08033003300', relationship: 'FATHER' },
]

const DEMO_PATIENT_USERS = [
  { patientMrn: 'MRN-001', email: 'patient1@demo.com', name: 'Adaeze Okoro' },
  { patientMrn: 'MRN-002', email: 'patient2@demo.com', name: 'Emeka Nwosu' },
  { patientMrn: 'MRN-003', email: 'patient3@demo.com', name: 'Fatima Abubakar' },
]

function generateSecurePassword(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function main() {
  console.log('='.repeat(60))
  console.log('PORTAL DEMO SEEDER — Phase E2.2')
  console.log('Guardian & Patient User Links for Portal Testing')
  console.log('='.repeat(60))
  
  try {
    console.log('\n1. Ensuring demo tenants exist...')
    const { schoolTenant, clinicTenant } = await ensureDemoTenants()
    
    console.log('\n2. Tenant Status:')
    console.log(`   demo-school: ${schoolTenant.id}`)
    console.log(`   demo-clinic: ${clinicTenant.id}`)
    
    console.log('\n3. Creating Education Portal Demo Data...')
    await seedEducationPortalData(schoolTenant.id)
    
    console.log('\n4. Creating Health Portal Demo Data...')
    await seedHealthPortalData(clinicTenant.id)
    
    console.log('\n' + '='.repeat(60))
    console.log('PORTAL DEMO SEEDING COMPLETE')
    console.log('='.repeat(60))
    
    console.log('\n--- DEMO ACCOUNTS FOR TESTING ---')
    console.log('\nEducation Portal (Guardian Access):')
    DEMO_GUARDIAN_USERS.forEach(g => {
      console.log(`  ${g.name}: ${g.email}`)
    })
    
    console.log('\nHealth Portal (Patient Access):')
    DEMO_PATIENT_USERS.forEach(p => {
      console.log(`  ${p.name}: ${p.email}`)
    })
    
    console.log('\nNote: All demo accounts use session-based auth.')
    console.log('Login via tenant admin or use direct session injection for testing.')
    
  } catch (error) {
    console.error('SEED ERROR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

const DEMO_STUDENTS = [
  { firstName: 'Adaeze', lastName: 'Okafor', gender: 'F', studentId: 'DEMO/2024/001' },
  { firstName: 'Chukwudi', lastName: 'Eze', gender: 'M', studentId: 'DEMO/2024/002' },
  { firstName: 'Fatima', lastName: 'Abubakar', gender: 'F', studentId: 'DEMO/2024/003' },
  { firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'M', studentId: 'DEMO/2024/004' },
  { firstName: 'Blessing', lastName: 'Nwosu', gender: 'F', studentId: 'DEMO/2024/005' },
  { firstName: 'Musa', lastName: 'Ibrahim', gender: 'M', studentId: 'DEMO/2024/006' },
  { firstName: 'Chidinma', lastName: 'Obi', gender: 'F', studentId: 'DEMO/2024/007' },
  { firstName: 'Tunde', lastName: 'Bakare', gender: 'M', studentId: 'DEMO/2024/008' },
  { firstName: 'Ngozi', lastName: 'Uzoma', gender: 'F', studentId: 'DEMO/2024/009' },
]

const DEMO_PATIENTS_DATA = [
  { mrn: 'MRN-001', firstName: 'Adaeze', lastName: 'Okoro', gender: 'FEMALE', phone: '08111222333' },
  { mrn: 'MRN-002', firstName: 'Emeka', lastName: 'Nwosu', gender: 'MALE', phone: '08222333444' },
  { mrn: 'MRN-003', firstName: 'Fatima', lastName: 'Abubakar', gender: 'FEMALE', phone: '08333444555' },
]

async function seedEducationPortalData(tenantId: string) {
  let students = await prisma.edu_student.findMany({
    where: { tenantId },
    take: 9,
    orderBy: { createdAt: 'asc' }
  })
  
  if (students.length === 0) {
    console.log('   No students found. Creating demo students...')
    for (const s of DEMO_STUDENTS) {
      const student = await prisma.edu_student.create({
        data: {
          id: `${tenantId}-student-${s.studentId.replace(/\//g, '-')}`,
          tenantId,
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          fullName: `${s.firstName} ${s.lastName}`,
          gender: s.gender as any,
          dateOfBirth: new Date('2012-01-01'),
          status: 'ACTIVE',
        }
      })
      students.push(student)
    }
    console.log(`   Created ${students.length} demo students`)
  } else {
    console.log(`   Found ${students.length} students`)
  }
  
  let guardianCount = 0
  let linkCount = 0
  
  for (let i = 0; i < DEMO_GUARDIAN_USERS.length; i++) {
    const guardianData = DEMO_GUARDIAN_USERS[i]
    
    let user = await prisma.user.findUnique({
      where: { email: guardianData.email }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: guardianData.email,
          name: guardianData.name,
          passwordHash: generateSecurePassword(),
          globalRole: 'USER',
          emailVerifiedAt: new Date(),
          phone: guardianData.phone,
          updatedAt: new Date(),
        }
      })
      console.log(`   Created user: ${guardianData.email}`)
    } else {
      console.log(`   User exists: ${guardianData.email}`)
    }
    
    await prisma.tenantMembership.upsert({
      where: {
        userId_tenantId: {
          tenantId,
          userId: user.id,
        }
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId: user.id,
        role: 'TENANT_USER',
        updatedAt: new Date(),
      }
    })
    
    const guardianId = `${tenantId}-guardian-demo-${i + 1}`
    
    let guardian = await prisma.edu_guardian.findFirst({
      where: { id: guardianId }
    })
    
    if (!guardian) {
      guardian = await prisma.edu_guardian.create({
        data: {
          id: guardianId,
          tenantId,
          userId: user.id,
          firstName: guardianData.firstName,
          lastName: guardianData.lastName,
          fullName: guardianData.name,
          phone: guardianData.phone,
          email: guardianData.email,
          preferSms: true,
        }
      })
      guardianCount++
      console.log(`   Created guardian: ${guardianData.name}`)
    } else {
      if (!guardian.userId) {
        await prisma.edu_guardian.update({
          where: { id: guardianId },
          data: { userId: user.id }
        })
        console.log(`   Linked user to guardian: ${guardianData.name}`)
      } else {
        console.log(`   Guardian exists: ${guardianData.name}`)
      }
    }
    
    const studentIndices = [i * 3, i * 3 + 1, i * 3 + 2].filter(idx => idx < students.length)
    
    for (const studentIdx of studentIndices) {
      const student = students[studentIdx]
      
      const linkId = `${tenantId}-link-${guardian.id}-${student.id}`
      
      const existingLink = await prisma.edu_student_guardian.findFirst({
        where: {
          guardianId: guardian.id,
          studentId: student.id,
        }
      })
      
      if (!existingLink) {
        await prisma.edu_student_guardian.create({
          data: {
            id: linkId,
            tenantId,
            guardianId: guardian.id,
            studentId: student.id,
            relation: guardianData.relationship as any,
            isPrimary: studentIdx === studentIndices[0],
            isFinancialContact: studentIdx === studentIndices[0],
          }
        })
        linkCount++
        console.log(`   Linked ${guardianData.name} → ${student.firstName} ${student.lastName}`)
      }
    }
  }
  
  console.log(`   Summary: ${guardianCount} guardians created, ${linkCount} student links created`)
}

async function seedHealthPortalData(tenantId: string) {
  let patients = await prisma.health_patient.findMany({
    where: { tenantId },
    take: DEMO_PATIENT_USERS.length,
    orderBy: { createdAt: 'asc' }
  })
  
  if (patients.length === 0) {
    console.log('   No patients found. Creating demo patients...')
    for (const p of DEMO_PATIENTS_DATA) {
      const patient = await prisma.health_patient.create({
        data: {
          id: `${tenantId}-patient-${p.mrn}`,
          tenantId,
          mrn: p.mrn,
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender as any,
          dateOfBirth: new Date('1985-01-01'),
          phone: p.phone,
          isActive: true,
        }
      })
      patients.push(patient)
    }
    console.log(`   Created ${patients.length} demo patients`)
  } else {
    console.log(`   Found ${patients.length} patients`)
  }
  
  let linkedCount = 0
  
  for (let i = 0; i < DEMO_PATIENT_USERS.length && i < patients.length; i++) {
    const patientData = DEMO_PATIENT_USERS[i]
    const patient = patients[i]
    
    let user = await prisma.user.findUnique({
      where: { email: patientData.email }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: patientData.email,
          name: patientData.name,
          passwordHash: generateSecurePassword(),
          globalRole: 'USER',
          emailVerifiedAt: new Date(),
          phone: patient.phone || undefined,
          updatedAt: new Date(),
        }
      })
      console.log(`   Created user: ${patientData.email}`)
    } else {
      console.log(`   User exists: ${patientData.email}`)
    }
    
    await prisma.tenantMembership.upsert({
      where: {
        userId_tenantId: {
          tenantId,
          userId: user.id,
        }
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId: user.id,
        role: 'TENANT_USER',
        updatedAt: new Date(),
      }
    })
    
    if (!patient.userId) {
      await prisma.health_patient.update({
        where: { id: patient.id },
        data: { userId: user.id }
      })
      linkedCount++
      console.log(`   Linked ${patientData.email} → ${patient.firstName} ${patient.lastName} (${patient.mrn})`)
    } else {
      console.log(`   Patient already linked: ${patient.mrn}`)
    }
  }
  
  console.log(`   Summary: ${linkedCount} patients linked to user accounts`)
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
