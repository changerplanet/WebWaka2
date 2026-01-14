/**
 * Demo Seed Script — DESIGN ONLY
 * PHASE D2
 * DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL
 * 
 * Education Suite - Nigerian School Demo Data Seeder
 * 
 * Creates demo data for a Nigerian secondary school:
 * - Academic sessions and terms
 * - Classes (JSS1-3, SS1-3)
 * - Subjects
 * - Students with Nigerian names
 * - Staff (teachers, administrators)
 * - Fee structures
 * - Attendance and grades
 * 
 * Run: npx ts-node --project tsconfig.json scripts/seed-education-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO PARTNER CONFIGURATION (MUST MATCH EXISTING)
// =============================================================================

const DEMO_PARTNER_ID = '63a86a6a-b40d-4825-8d44-cce8aa893c42'
const DEMO_TENANT_SLUG = 'demo-school'

// =============================================================================
// ACADEMIC STRUCTURE
// =============================================================================

const SESSIONS = [
  { id: 'session-2024-2025', name: '2024/2025 Academic Session', startDate: '2024-09-01', endDate: '2025-07-31', isCurrent: true },
]

const TERMS = [
  { id: 'term-1-2024', sessionId: 'session-2024-2025', name: 'First Term', startDate: '2024-09-09', endDate: '2024-12-20', sequence: 1 },
  { id: 'term-2-2025', sessionId: 'session-2024-2025', name: 'Second Term', startDate: '2025-01-06', endDate: '2025-04-11', sequence: 2 },
  { id: 'term-3-2025', sessionId: 'session-2024-2025', name: 'Third Term', startDate: '2025-04-28', endDate: '2025-07-25', sequence: 3 },
]

const CLASSES = [
  { id: 'class-jss1', name: 'JSS 1', level: 'JUNIOR', capacity: 40 },
  { id: 'class-jss2', name: 'JSS 2', level: 'JUNIOR', capacity: 40 },
  { id: 'class-jss3', name: 'JSS 3', level: 'JUNIOR', capacity: 40 },
  { id: 'class-ss1-sci', name: 'SS 1 Science', level: 'SENIOR', capacity: 35 },
  { id: 'class-ss1-art', name: 'SS 1 Arts', level: 'SENIOR', capacity: 35 },
  { id: 'class-ss2-sci', name: 'SS 2 Science', level: 'SENIOR', capacity: 35 },
  { id: 'class-ss2-art', name: 'SS 2 Arts', level: 'SENIOR', capacity: 35 },
  { id: 'class-ss3-sci', name: 'SS 3 Science', level: 'SENIOR', capacity: 30 },
  { id: 'class-ss3-art', name: 'SS 3 Arts', level: 'SENIOR', capacity: 30 },
]

const SUBJECTS = [
  { id: 'subj-eng', name: 'English Language', code: 'ENG', isCompulsory: true },
  { id: 'subj-math', name: 'Mathematics', code: 'MTH', isCompulsory: true },
  { id: 'subj-physics', name: 'Physics', code: 'PHY', isCompulsory: false },
  { id: 'subj-chemistry', name: 'Chemistry', code: 'CHM', isCompulsory: false },
  { id: 'subj-biology', name: 'Biology', code: 'BIO', isCompulsory: false },
  { id: 'subj-agric', name: 'Agricultural Science', code: 'AGR', isCompulsory: false },
  { id: 'subj-economics', name: 'Economics', code: 'ECO', isCompulsory: false },
  { id: 'subj-government', name: 'Government', code: 'GOV', isCompulsory: false },
  { id: 'subj-literature', name: 'Literature in English', code: 'LIT', isCompulsory: false },
  { id: 'subj-history', name: 'History', code: 'HIS', isCompulsory: false },
  { id: 'subj-yoruba', name: 'Yoruba Language', code: 'YOR', isCompulsory: false },
  { id: 'subj-civic', name: 'Civic Education', code: 'CIV', isCompulsory: true },
  { id: 'subj-crs', name: 'Christian Religious Studies', code: 'CRS', isCompulsory: false },
  { id: 'subj-irs', name: 'Islamic Religious Studies', code: 'IRS', isCompulsory: false },
  { id: 'subj-computer', name: 'Computer Science', code: 'ICT', isCompulsory: false },
]

// =============================================================================
// STAFF (Nigerian Names)
// =============================================================================

const STAFF = [
  { id: 'staff-001', name: 'Mrs. Adaeze Okonkwo', role: 'Principal', email: 'principal@brightfuture.edu.ng', phone: '08011112222' },
  { id: 'staff-002', name: 'Mr. Oluwaseun Adeyemi', role: 'Vice Principal Academics', email: 'vp.academics@brightfuture.edu.ng', phone: '08022223333' },
  { id: 'staff-003', name: 'Mrs. Fatima Abubakar', role: 'Vice Principal Admin', email: 'vp.admin@brightfuture.edu.ng', phone: '08033334444' },
  { id: 'staff-004', name: 'Mr. Chukwuemeka Eze', role: 'Mathematics Teacher', email: 'c.eze@brightfuture.edu.ng', phone: '08044445555', subjects: ['subj-math'] },
  { id: 'staff-005', name: 'Mrs. Blessing Nwosu', role: 'English Teacher', email: 'b.nwosu@brightfuture.edu.ng', phone: '08055556666', subjects: ['subj-eng', 'subj-literature'] },
  { id: 'staff-006', name: 'Mr. Abdullahi Yusuf', role: 'Physics Teacher', email: 'a.yusuf@brightfuture.edu.ng', phone: '08066667777', subjects: ['subj-physics'] },
  { id: 'staff-007', name: 'Mrs. Ngozi Obi', role: 'Chemistry Teacher', email: 'n.obi@brightfuture.edu.ng', phone: '08077778888', subjects: ['subj-chemistry'] },
  { id: 'staff-008', name: 'Mr. Tunde Bakare', role: 'Biology Teacher', email: 't.bakare@brightfuture.edu.ng', phone: '08088889999', subjects: ['subj-biology', 'subj-agric'] },
  { id: 'staff-009', name: 'Mrs. Halima Ibrahim', role: 'Economics Teacher', email: 'h.ibrahim@brightfuture.edu.ng', phone: '08099990000', subjects: ['subj-economics'] },
  { id: 'staff-010', name: 'Mr. Kayode Adeola', role: 'Government Teacher', email: 'k.adeola@brightfuture.edu.ng', phone: '08010101010', subjects: ['subj-government', 'subj-civic'] },
  { id: 'staff-011', name: 'Mrs. Chioma Uzor', role: 'History Teacher', email: 'c.uzor@brightfuture.edu.ng', phone: '08011111111', subjects: ['subj-history'] },
  { id: 'staff-012', name: 'Mr. Bello Sanni', role: 'Computer Teacher', email: 'b.sanni@brightfuture.edu.ng', phone: '08012121212', subjects: ['subj-computer'] },
  { id: 'staff-013', name: 'Mrs. Olufunke Adeniyi', role: 'Yoruba Teacher', email: 'o.adeniyi@brightfuture.edu.ng', phone: '08013131313', subjects: ['subj-yoruba'] },
  { id: 'staff-014', name: 'Pastor Emeka Ndu', role: 'CRS Teacher', email: 'e.ndu@brightfuture.edu.ng', phone: '08014141414', subjects: ['subj-crs'] },
  { id: 'staff-015', name: 'Mallam Musa Danladi', role: 'IRS Teacher', email: 'm.danladi@brightfuture.edu.ng', phone: '08015151515', subjects: ['subj-irs'] },
]

// =============================================================================
// STUDENTS (Nigerian Names - Sample for each class)
// =============================================================================

const STUDENTS = [
  // JSS 1 Students
  { id: 'std-001', firstName: 'Adaeze', lastName: 'Okafor', gender: 'F', classId: 'class-jss1', admissionNo: 'BFA/2024/001', dob: '2012-03-15' },
  { id: 'std-002', firstName: 'Chukwudi', lastName: 'Eze', gender: 'M', classId: 'class-jss1', admissionNo: 'BFA/2024/002', dob: '2012-05-22' },
  { id: 'std-003', firstName: 'Fatima', lastName: 'Abubakar', gender: 'F', classId: 'class-jss1', admissionNo: 'BFA/2024/003', dob: '2012-01-10' },
  { id: 'std-004', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'M', classId: 'class-jss1', admissionNo: 'BFA/2024/004', dob: '2012-08-30' },
  { id: 'std-005', firstName: 'Blessing', lastName: 'Nwosu', gender: 'F', classId: 'class-jss1', admissionNo: 'BFA/2024/005', dob: '2012-11-18' },
  { id: 'std-006', firstName: 'Musa', lastName: 'Ibrahim', gender: 'M', classId: 'class-jss1', admissionNo: 'BFA/2024/006', dob: '2012-04-25' },
  { id: 'std-007', firstName: 'Chidinma', lastName: 'Obi', gender: 'F', classId: 'class-jss1', admissionNo: 'BFA/2024/007', dob: '2012-07-12' },
  { id: 'std-008', firstName: 'Tunde', lastName: 'Bakare', gender: 'M', classId: 'class-jss1', admissionNo: 'BFA/2024/008', dob: '2012-02-28' },
  
  // JSS 2 Students
  { id: 'std-009', firstName: 'Ngozi', lastName: 'Uzoma', gender: 'F', classId: 'class-jss2', admissionNo: 'BFA/2023/001', dob: '2011-06-14' },
  { id: 'std-010', firstName: 'Abdullahi', lastName: 'Yusuf', gender: 'M', classId: 'class-jss2', admissionNo: 'BFA/2023/002', dob: '2011-09-20' },
  { id: 'std-011', firstName: 'Oluwatobi', lastName: 'Adeola', gender: 'M', classId: 'class-jss2', admissionNo: 'BFA/2023/003', dob: '2011-12-05' },
  { id: 'std-012', firstName: 'Amina', lastName: 'Bello', gender: 'F', classId: 'class-jss2', admissionNo: 'BFA/2023/004', dob: '2011-03-17' },
  { id: 'std-013', firstName: 'Emeka', lastName: 'Nnamdi', gender: 'M', classId: 'class-jss2', admissionNo: 'BFA/2023/005', dob: '2011-10-22' },
  { id: 'std-014', firstName: 'Folake', lastName: 'Ogunleye', gender: 'F', classId: 'class-jss2', admissionNo: 'BFA/2023/006', dob: '2011-01-30' },
  
  // JSS 3 Students
  { id: 'std-015', firstName: 'Chisom', lastName: 'Okwu', gender: 'F', classId: 'class-jss3', admissionNo: 'BFA/2022/001', dob: '2010-04-08' },
  { id: 'std-016', firstName: 'Ibrahim', lastName: 'Danladi', gender: 'M', classId: 'class-jss3', admissionNo: 'BFA/2022/002', dob: '2010-07-16' },
  { id: 'std-017', firstName: 'Adaugo', lastName: 'Ibe', gender: 'F', classId: 'class-jss3', admissionNo: 'BFA/2022/003', dob: '2010-11-25' },
  { id: 'std-018', firstName: 'Gbenga', lastName: 'Afolabi', gender: 'M', classId: 'class-jss3', admissionNo: 'BFA/2022/004', dob: '2010-02-14' },
  
  // SS 1 Science Students
  { id: 'std-019', firstName: 'Chinedu', lastName: 'Okoro', gender: 'M', classId: 'class-ss1-sci', admissionNo: 'BFA/2021/001', dob: '2009-05-10' },
  { id: 'std-020', firstName: 'Aisha', lastName: 'Mohammed', gender: 'F', classId: 'class-ss1-sci', admissionNo: 'BFA/2021/002', dob: '2009-08-23' },
  { id: 'std-021', firstName: 'Olumide', lastName: 'Fasina', gender: 'M', classId: 'class-ss1-sci', admissionNo: 'BFA/2021/003', dob: '2009-01-18' },
  { id: 'std-022', firstName: 'Chiamaka', lastName: 'Aneke', gender: 'F', classId: 'class-ss1-sci', admissionNo: 'BFA/2021/004', dob: '2009-12-02' },
  
  // SS 1 Arts Students
  { id: 'std-023', firstName: 'Kehinde', lastName: 'Olawale', gender: 'M', classId: 'class-ss1-art', admissionNo: 'BFA/2021/005', dob: '2009-03-28' },
  { id: 'std-024', firstName: 'Zainab', lastName: 'Usman', gender: 'F', classId: 'class-ss1-art', admissionNo: 'BFA/2021/006', dob: '2009-06-15' },
  { id: 'std-025', firstName: 'Obinna', lastName: 'Chidi', gender: 'M', classId: 'class-ss1-art', admissionNo: 'BFA/2021/007', dob: '2009-09-30' },
  
  // SS 2 Science Students
  { id: 'std-026', firstName: 'Nkechi', lastName: 'Ezeani', gender: 'F', classId: 'class-ss2-sci', admissionNo: 'BFA/2020/001', dob: '2008-04-12' },
  { id: 'std-027', firstName: 'Yusuf', lastName: 'Garba', gender: 'M', classId: 'class-ss2-sci', admissionNo: 'BFA/2020/002', dob: '2008-07-20' },
  { id: 'std-028', firstName: 'Adaora', lastName: 'Umeh', gender: 'F', classId: 'class-ss2-sci', admissionNo: 'BFA/2020/003', dob: '2008-10-05' },
  
  // SS 2 Arts Students
  { id: 'std-029', firstName: 'Segun', lastName: 'Oyedeji', gender: 'M', classId: 'class-ss2-art', admissionNo: 'BFA/2020/004', dob: '2008-02-25' },
  { id: 'std-030', firstName: 'Hauwa', lastName: 'Suleiman', gender: 'F', classId: 'class-ss2-art', admissionNo: 'BFA/2020/005', dob: '2008-05-18' },
  
  // SS 3 Science Students
  { id: 'std-031', firstName: 'Chukwuemeka', lastName: 'Agu', gender: 'M', classId: 'class-ss3-sci', admissionNo: 'BFA/2019/001', dob: '2007-06-08' },
  { id: 'std-032', firstName: 'Funke', lastName: 'Adegoke', gender: 'F', classId: 'class-ss3-sci', admissionNo: 'BFA/2019/002', dob: '2007-09-14' },
  { id: 'std-033', firstName: 'Bashir', lastName: 'Aliyu', gender: 'M', classId: 'class-ss3-sci', admissionNo: 'BFA/2019/003', dob: '2007-12-22' },
  
  // SS 3 Arts Students
  { id: 'std-034', firstName: 'Nneka', lastName: 'Okonkwo', gender: 'F', classId: 'class-ss3-art', admissionNo: 'BFA/2019/004', dob: '2007-03-10' },
  { id: 'std-035', firstName: 'Adekunle', lastName: 'Salami', gender: 'M', classId: 'class-ss3-art', admissionNo: 'BFA/2019/005', dob: '2007-08-27' },
]

// =============================================================================
// FEE STRUCTURES (Nigerian School Fees in NGN)
// =============================================================================

const FEE_STRUCTURES = [
  { id: 'fee-tuition-junior', name: 'Junior School Tuition', amount: 150000, level: 'JUNIOR', category: 'TUITION' },
  { id: 'fee-tuition-senior', name: 'Senior School Tuition', amount: 180000, level: 'SENIOR', category: 'TUITION' },
  { id: 'fee-development', name: 'Development Levy', amount: 25000, level: 'ALL', category: 'LEVY' },
  { id: 'fee-exam', name: 'Examination Fee', amount: 15000, level: 'ALL', category: 'EXAM' },
  { id: 'fee-sports', name: 'Sports Fee', amount: 10000, level: 'ALL', category: 'EXTRA' },
  { id: 'fee-pta', name: 'PTA Dues', amount: 5000, level: 'ALL', category: 'DUES' },
  { id: 'fee-waec', name: 'WAEC Registration', amount: 35000, level: 'SS3', category: 'EXAM' },
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

async function seedSessions(tenantId: string) {
  console.log('Creating academic sessions...')
  
  for (const session of SESSIONS) {
    const existing = await prisma.edu_session.findFirst({
      where: { tenantId, name: session.name }
    })
    
    if (!existing) {
      await prisma.edu_session.create({
        data: {
          id: `${tenantId}-${session.id}`,
          tenantId,
          name: session.name,
          startDate: new Date(session.startDate),
          endDate: new Date(session.endDate),
          isCurrent: session.isCurrent,
        }
      })
      console.log(`  Created session: ${session.name}`)
    }
  }
}

async function seedTerms(tenantId: string) {
  console.log('Creating terms...')
  
  for (const term of TERMS) {
    const existing = await prisma.edu_term.findFirst({
      where: { tenantId, name: term.name }
    })
    
    if (!existing) {
      await prisma.edu_term.create({
        data: {
          id: `${tenantId}-${term.id}`,
          tenantId,
          sessionId: `${tenantId}-${term.sessionId}`,
          name: term.name,
          startDate: new Date(term.startDate),
          endDate: new Date(term.endDate),
          sequence: term.sequence,
        }
      })
      console.log(`  Created term: ${term.name}`)
    }
  }
}

async function seedClasses(tenantId: string) {
  console.log('Creating classes...')
  
  for (const cls of CLASSES) {
    const existing = await prisma.edu_class.findFirst({
      where: { tenantId, name: cls.name }
    })
    
    if (!existing) {
      await prisma.edu_class.create({
        data: {
          id: `${tenantId}-${cls.id}`,
          tenantId,
          name: cls.name,
          level: cls.level,
          capacity: cls.capacity,
          isActive: true,
        }
      })
      console.log(`  Created class: ${cls.name}`)
    }
  }
}

async function seedSubjects(tenantId: string) {
  console.log('Creating subjects...')
  
  for (const subj of SUBJECTS) {
    const existing = await prisma.edu_subject.findFirst({
      where: { tenantId, code: subj.code }
    })
    
    if (!existing) {
      await prisma.edu_subject.create({
        data: {
          id: `${tenantId}-${subj.id}`,
          tenantId,
          name: subj.name,
          code: subj.code,
          isCompulsory: subj.isCompulsory,
          isActive: true,
        }
      })
      console.log(`  Created subject: ${subj.name}`)
    }
  }
}

async function seedStaff(tenantId: string) {
  console.log('Creating staff...')
  
  for (const staff of STAFF) {
    const existing = await prisma.edu_staff.findFirst({
      where: { tenantId, email: staff.email }
    })
    
    if (!existing) {
      await prisma.edu_staff.create({
        data: {
          id: `${tenantId}-${staff.id}`,
          tenantId,
          name: staff.name,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
          isActive: true,
        }
      })
      console.log(`  Created staff: ${staff.name}`)
    }
  }
}

async function seedStudents(tenantId: string) {
  console.log('Creating students...')
  
  for (const student of STUDENTS) {
    const existing = await prisma.edu_student.findFirst({
      where: { tenantId, admissionNo: student.admissionNo }
    })
    
    if (!existing) {
      await prisma.edu_student.create({
        data: {
          id: `${tenantId}-${student.id}`,
          tenantId,
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
          dateOfBirth: new Date(student.dob),
          admissionNo: student.admissionNo,
          currentClassId: `${tenantId}-${student.classId}`,
          enrollmentDate: new Date('2024-09-01'),
          status: 'ACTIVE',
        }
      })
      console.log(`  Created student: ${student.firstName} ${student.lastName}`)
    }
  }
}

async function seedFeeStructures(tenantId: string) {
  console.log('Creating fee structures...')
  
  for (const fee of FEE_STRUCTURES) {
    const existing = await prisma.edu_fee_structure.findFirst({
      where: { tenantId, name: fee.name }
    })
    
    if (!existing) {
      await prisma.edu_fee_structure.create({
        data: {
          id: `${tenantId}-${fee.id}`,
          tenantId,
          name: fee.name,
          amount: fee.amount,
          currency: 'NGN',
          category: fee.category,
          isActive: true,
        }
      })
      console.log(`  Created fee: ${fee.name} - ₦${fee.amount.toLocaleString()}`)
    }
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('EDUCATION SUITE DEMO SEEDER')
  console.log('Demo Partner Scoped - Nigerian Secondary School')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Verify infrastructure
    await verifyDemoPartner()
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration (academic structure)
    await seedSessions(tenant.id)
    await seedTerms(tenant.id)
    await seedClasses(tenant.id)
    await seedSubjects(tenant.id)
    
    // Step 3: Seed operational data (people)
    await seedStaff(tenant.id)
    await seedStudents(tenant.id)
    
    // Step 4: Seed financial configuration
    await seedFeeStructures(tenant.id)
    
    console.log('='.repeat(60))
    console.log('EDUCATION DEMO SEEDING COMPLETE')
    console.log(`  Sessions: ${SESSIONS.length}`)
    console.log(`  Terms: ${TERMS.length}`)
    console.log(`  Classes: ${CLASSES.length}`)
    console.log(`  Subjects: ${SUBJECTS.length}`)
    console.log(`  Staff: ${STAFF.length}`)
    console.log(`  Students: ${STUDENTS.length}`)
    console.log(`  Fee Structures: ${FEE_STRUCTURES.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
