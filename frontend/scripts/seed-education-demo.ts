/**
 * Demo Seed Script — PHASE D3-B
 * EXECUTION APPROVED
 * 
 * Education Suite - Nigerian Secondary School Demo Data Seeder
 * 
 * Creates demo data for a Nigerian secondary school:
 * - Academic sessions and terms
 * - Classes (JSS1-3, SS1-3)
 * - Subjects
 * - Students with Nigerian names
 * - Staff (teachers, administrators)
 * - Fee structures
 * 
 * Run: npx tsx scripts/seed-education-demo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_TENANT_SLUG = 'demo-school'

// =============================================================================
// ACADEMIC STRUCTURE
// =============================================================================

const SESSIONS = [
  { id: 'session-2024-2025', name: '2024/2025 Academic Session', code: '2024-2025', startDate: '2024-09-01', endDate: '2025-07-31', isCurrent: true },
]

const TERMS = [
  { id: 'term-1-2024', sessionId: 'session-2024-2025', termNumber: 'TERM_1', name: 'First Term', startDate: '2024-09-09', endDate: '2024-12-20' },
  { id: 'term-2-2025', sessionId: 'session-2024-2025', termNumber: 'TERM_2', name: 'Second Term', startDate: '2025-01-06', endDate: '2025-04-11' },
  { id: 'term-3-2025', sessionId: 'session-2024-2025', termNumber: 'TERM_3', name: 'Third Term', startDate: '2025-04-28', endDate: '2025-07-25' },
]

const CLASSES = [
  { id: 'class-jss1', name: 'JSS 1', code: 'JSS1', level: 1, capacity: 40 },
  { id: 'class-jss2', name: 'JSS 2', code: 'JSS2', level: 2, capacity: 40 },
  { id: 'class-jss3', name: 'JSS 3', code: 'JSS3', level: 3, capacity: 40 },
  { id: 'class-ss1-sci', name: 'SS 1 Science', code: 'SS1-SCI', level: 4, capacity: 35 },
  { id: 'class-ss1-art', name: 'SS 1 Arts', code: 'SS1-ART', level: 4, capacity: 35 },
  { id: 'class-ss2-sci', name: 'SS 2 Science', code: 'SS2-SCI', level: 5, capacity: 35 },
  { id: 'class-ss2-art', name: 'SS 2 Arts', code: 'SS2-ART', level: 5, capacity: 35 },
  { id: 'class-ss3-sci', name: 'SS 3 Science', code: 'SS3-SCI', level: 6, capacity: 30 },
  { id: 'class-ss3-art', name: 'SS 3 Arts', code: 'SS3-ART', level: 6, capacity: 30 },
]

const SUBJECTS = [
  { id: 'subj-eng', name: 'English Language', code: 'ENG', category: 'Languages', isCompulsory: true },
  { id: 'subj-math', name: 'Mathematics', code: 'MTH', category: 'Science', isCompulsory: true },
  { id: 'subj-physics', name: 'Physics', code: 'PHY', category: 'Science', isCompulsory: false },
  { id: 'subj-chemistry', name: 'Chemistry', code: 'CHM', category: 'Science', isCompulsory: false },
  { id: 'subj-biology', name: 'Biology', code: 'BIO', category: 'Science', isCompulsory: false },
  { id: 'subj-agric', name: 'Agricultural Science', code: 'AGR', category: 'Science', isCompulsory: false },
  { id: 'subj-economics', name: 'Economics', code: 'ECO', category: 'Commercial', isCompulsory: false },
  { id: 'subj-government', name: 'Government', code: 'GOV', category: 'Arts', isCompulsory: false },
  { id: 'subj-literature', name: 'Literature in English', code: 'LIT', category: 'Arts', isCompulsory: false },
  { id: 'subj-history', name: 'History', code: 'HIS', category: 'Arts', isCompulsory: false },
  { id: 'subj-yoruba', name: 'Yoruba Language', code: 'YOR', category: 'Languages', isCompulsory: false },
  { id: 'subj-civic', name: 'Civic Education', code: 'CIV', category: 'Arts', isCompulsory: true },
  { id: 'subj-crs', name: 'Christian Religious Studies', code: 'CRS', category: 'Arts', isCompulsory: false },
  { id: 'subj-irs', name: 'Islamic Religious Studies', code: 'IRS', category: 'Arts', isCompulsory: false },
  { id: 'subj-computer', name: 'Computer Science', code: 'ICT', category: 'Science', isCompulsory: false },
]

// =============================================================================
// STAFF (Nigerian Names)
// =============================================================================

const STAFF = [
  { id: 'staff-001', staffId: 'ADM-001', firstName: 'Adaeze', lastName: 'Okonkwo', role: 'PRINCIPAL', email: 'principal@brightfuture.edu.ng', phone: '08011112222' },
  { id: 'staff-002', staffId: 'ADM-002', firstName: 'Oluwaseun', lastName: 'Adeyemi', role: 'VICE_PRINCIPAL', email: 'vp.academics@brightfuture.edu.ng', phone: '08022223333' },
  { id: 'staff-003', staffId: 'ADM-003', firstName: 'Fatima', lastName: 'Abubakar', role: 'VICE_PRINCIPAL', email: 'vp.admin@brightfuture.edu.ng', phone: '08033334444' },
  { id: 'staff-004', staffId: 'TCH-001', firstName: 'Chukwuemeka', lastName: 'Eze', role: 'TEACHER', email: 'c.eze@brightfuture.edu.ng', phone: '08044445555', department: 'Mathematics' },
  { id: 'staff-005', staffId: 'TCH-002', firstName: 'Blessing', lastName: 'Nwosu', role: 'TEACHER', email: 'b.nwosu@brightfuture.edu.ng', phone: '08055556666', department: 'English' },
  { id: 'staff-006', staffId: 'TCH-003', firstName: 'Abdullahi', lastName: 'Yusuf', role: 'TEACHER', email: 'a.yusuf@brightfuture.edu.ng', phone: '08066667777', department: 'Physics' },
  { id: 'staff-007', staffId: 'TCH-004', firstName: 'Ngozi', lastName: 'Obi', role: 'TEACHER', email: 'n.obi@brightfuture.edu.ng', phone: '08077778888', department: 'Chemistry' },
  { id: 'staff-008', staffId: 'TCH-005', firstName: 'Tunde', lastName: 'Bakare', role: 'TEACHER', email: 't.bakare@brightfuture.edu.ng', phone: '08088889999', department: 'Biology' },
  { id: 'staff-009', staffId: 'TCH-006', firstName: 'Halima', lastName: 'Ibrahim', role: 'HEAD_OF_DEPARTMENT', email: 'h.ibrahim@brightfuture.edu.ng', phone: '08099990000', department: 'Commercial' },
  { id: 'staff-010', staffId: 'TCH-007', firstName: 'Kayode', lastName: 'Adeola', role: 'CLASS_TEACHER', email: 'k.adeola@brightfuture.edu.ng', phone: '08010101010', department: 'Social Sciences' },
  { id: 'staff-011', staffId: 'TCH-008', firstName: 'Chioma', lastName: 'Uzor', role: 'TEACHER', email: 'c.uzor@brightfuture.edu.ng', phone: '08011111111', department: 'History' },
  { id: 'staff-012', staffId: 'TCH-009', firstName: 'Bello', lastName: 'Sanni', role: 'TEACHER', email: 'b.sanni@brightfuture.edu.ng', phone: '08012121212', department: 'ICT' },
  { id: 'staff-013', staffId: 'ADM-004', firstName: 'Olufunke', lastName: 'Adeniyi', role: 'BURSAR', email: 'o.adeniyi@brightfuture.edu.ng', phone: '08013131313' },
  { id: 'staff-014', staffId: 'ADM-005', firstName: 'Emeka', lastName: 'Ndu', role: 'COUNSELOR', email: 'e.ndu@brightfuture.edu.ng', phone: '08014141414' },
  { id: 'staff-015', staffId: 'ADM-006', firstName: 'Musa', lastName: 'Danladi', role: 'LIBRARIAN', email: 'm.danladi@brightfuture.edu.ng', phone: '08015151515' },
]

// =============================================================================
// STUDENTS (Nigerian Names - Sample for each class)
// =============================================================================

const STUDENTS = [
  // JSS 1 Students
  { id: 'std-001', studentId: 'BFA/2024/001', firstName: 'Adaeze', lastName: 'Okafor', gender: 'F', classId: 'class-jss1', dob: '2012-03-15' },
  { id: 'std-002', studentId: 'BFA/2024/002', firstName: 'Chukwudi', lastName: 'Eze', gender: 'M', classId: 'class-jss1', dob: '2012-05-22' },
  { id: 'std-003', studentId: 'BFA/2024/003', firstName: 'Fatima', lastName: 'Abubakar', gender: 'F', classId: 'class-jss1', dob: '2012-01-10' },
  { id: 'std-004', studentId: 'BFA/2024/004', firstName: 'Oluwaseun', lastName: 'Adeyemi', gender: 'M', classId: 'class-jss1', dob: '2012-08-30' },
  { id: 'std-005', studentId: 'BFA/2024/005', firstName: 'Blessing', lastName: 'Nwosu', gender: 'F', classId: 'class-jss1', dob: '2012-11-18' },
  { id: 'std-006', studentId: 'BFA/2024/006', firstName: 'Musa', lastName: 'Ibrahim', gender: 'M', classId: 'class-jss1', dob: '2012-04-25' },
  { id: 'std-007', studentId: 'BFA/2024/007', firstName: 'Chidinma', lastName: 'Obi', gender: 'F', classId: 'class-jss1', dob: '2012-07-12' },
  { id: 'std-008', studentId: 'BFA/2024/008', firstName: 'Tunde', lastName: 'Bakare', gender: 'M', classId: 'class-jss1', dob: '2012-02-28' },
  
  // JSS 2 Students
  { id: 'std-009', studentId: 'BFA/2023/001', firstName: 'Ngozi', lastName: 'Uzoma', gender: 'F', classId: 'class-jss2', dob: '2011-06-14' },
  { id: 'std-010', studentId: 'BFA/2023/002', firstName: 'Abdullahi', lastName: 'Yusuf', gender: 'M', classId: 'class-jss2', dob: '2011-09-20' },
  { id: 'std-011', studentId: 'BFA/2023/003', firstName: 'Oluwatobi', lastName: 'Adeola', gender: 'M', classId: 'class-jss2', dob: '2011-12-05' },
  { id: 'std-012', studentId: 'BFA/2023/004', firstName: 'Amina', lastName: 'Bello', gender: 'F', classId: 'class-jss2', dob: '2011-03-17' },
  { id: 'std-013', studentId: 'BFA/2023/005', firstName: 'Emeka', lastName: 'Nnamdi', gender: 'M', classId: 'class-jss2', dob: '2011-10-22' },
  { id: 'std-014', studentId: 'BFA/2023/006', firstName: 'Folake', lastName: 'Ogunleye', gender: 'F', classId: 'class-jss2', dob: '2011-01-30' },
  
  // JSS 3 Students
  { id: 'std-015', studentId: 'BFA/2022/001', firstName: 'Chisom', lastName: 'Okwu', gender: 'F', classId: 'class-jss3', dob: '2010-04-08' },
  { id: 'std-016', studentId: 'BFA/2022/002', firstName: 'Ibrahim', lastName: 'Danladi', gender: 'M', classId: 'class-jss3', dob: '2010-07-16' },
  { id: 'std-017', studentId: 'BFA/2022/003', firstName: 'Adaugo', lastName: 'Ibe', gender: 'F', classId: 'class-jss3', dob: '2010-11-25' },
  { id: 'std-018', studentId: 'BFA/2022/004', firstName: 'Gbenga', lastName: 'Afolabi', gender: 'M', classId: 'class-jss3', dob: '2010-02-14' },
  
  // SS 1 Science Students
  { id: 'std-019', studentId: 'BFA/2021/001', firstName: 'Chinedu', lastName: 'Okoro', gender: 'M', classId: 'class-ss1-sci', dob: '2009-05-10' },
  { id: 'std-020', studentId: 'BFA/2021/002', firstName: 'Aisha', lastName: 'Mohammed', gender: 'F', classId: 'class-ss1-sci', dob: '2009-08-23' },
  { id: 'std-021', studentId: 'BFA/2021/003', firstName: 'Olumide', lastName: 'Fasina', gender: 'M', classId: 'class-ss1-sci', dob: '2009-01-18' },
  { id: 'std-022', studentId: 'BFA/2021/004', firstName: 'Chiamaka', lastName: 'Aneke', gender: 'F', classId: 'class-ss1-sci', dob: '2009-12-02' },
  
  // SS 1 Arts Students
  { id: 'std-023', studentId: 'BFA/2021/005', firstName: 'Kehinde', lastName: 'Olawale', gender: 'M', classId: 'class-ss1-art', dob: '2009-03-28' },
  { id: 'std-024', studentId: 'BFA/2021/006', firstName: 'Zainab', lastName: 'Usman', gender: 'F', classId: 'class-ss1-art', dob: '2009-06-15' },
  { id: 'std-025', studentId: 'BFA/2021/007', firstName: 'Obinna', lastName: 'Chidi', gender: 'M', classId: 'class-ss1-art', dob: '2009-09-30' },
  
  // SS 2 Science Students
  { id: 'std-026', studentId: 'BFA/2020/001', firstName: 'Nkechi', lastName: 'Ezeani', gender: 'F', classId: 'class-ss2-sci', dob: '2008-04-12' },
  { id: 'std-027', studentId: 'BFA/2020/002', firstName: 'Yusuf', lastName: 'Garba', gender: 'M', classId: 'class-ss2-sci', dob: '2008-07-20' },
  { id: 'std-028', studentId: 'BFA/2020/003', firstName: 'Adaora', lastName: 'Umeh', gender: 'F', classId: 'class-ss2-sci', dob: '2008-10-05' },
  
  // SS 2 Arts Students
  { id: 'std-029', studentId: 'BFA/2020/004', firstName: 'Segun', lastName: 'Oyedeji', gender: 'M', classId: 'class-ss2-art', dob: '2008-02-25' },
  { id: 'std-030', studentId: 'BFA/2020/005', firstName: 'Hauwa', lastName: 'Suleiman', gender: 'F', classId: 'class-ss2-art', dob: '2008-05-18' },
  
  // SS 3 Science Students
  { id: 'std-031', studentId: 'BFA/2019/001', firstName: 'Chukwuemeka', lastName: 'Agu', gender: 'M', classId: 'class-ss3-sci', dob: '2007-06-08' },
  { id: 'std-032', studentId: 'BFA/2019/002', firstName: 'Funke', lastName: 'Adegoke', gender: 'F', classId: 'class-ss3-sci', dob: '2007-09-14' },
  { id: 'std-033', studentId: 'BFA/2019/003', firstName: 'Bashir', lastName: 'Aliyu', gender: 'M', classId: 'class-ss3-sci', dob: '2007-12-22' },
  
  // SS 3 Arts Students
  { id: 'std-034', studentId: 'BFA/2019/004', firstName: 'Nneka', lastName: 'Okonkwo', gender: 'F', classId: 'class-ss3-art', dob: '2007-03-10' },
  { id: 'std-035', studentId: 'BFA/2019/005', firstName: 'Adekunle', lastName: 'Salami', gender: 'M', classId: 'class-ss3-art', dob: '2007-08-27' },
]

// =============================================================================
// FEE STRUCTURES (Nigerian School Fees in NGN)
// =============================================================================

const FEE_STRUCTURES = [
  { id: 'fee-tuition-junior', name: 'Junior School Tuition', amount: 150000, feeType: 'TUITION' },
  { id: 'fee-tuition-senior', name: 'Senior School Tuition', amount: 180000, feeType: 'TUITION' },
  { id: 'fee-development', name: 'Development Levy', amount: 25000, feeType: 'DEVELOPMENT_LEVY' },
  { id: 'fee-exam', name: 'Examination Fee', amount: 15000, feeType: 'EXAM_FEE' },
  { id: 'fee-sports', name: 'Sports Fee', amount: 10000, feeType: 'SPORTS_FEE' },
  { id: 'fee-pta', name: 'PTA Dues', amount: 5000, feeType: 'PTA_DUES' },
  { id: 'fee-lab', name: 'Laboratory Fee', amount: 8000, feeType: 'LAB_FEE' },
  { id: 'fee-library', name: 'Library Fee', amount: 3000, feeType: 'LIBRARY_FEE' },
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

async function seedSessions(tenantId: string) {
  console.log('Creating academic sessions...')
  
  for (const session of SESSIONS) {
    const existing = await prisma.edu_session.findFirst({
      where: { tenantId, code: session.code }
    })
    
    if (!existing) {
      await prisma.edu_session.create({
        data: {
          id: `${tenantId}-${session.id}`,
          tenantId,
          name: session.name,
          code: session.code,
          startDate: new Date(session.startDate),
          endDate: new Date(session.endDate),
          status: 'ACTIVE',
          isCurrent: session.isCurrent,
        }
      })
      console.log(`  Created session: ${session.name}`)
    } else {
      console.log(`  Session exists: ${session.name}`)
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
          termNumber: term.termNumber as any,
          name: term.name,
          startDate: new Date(term.startDate),
          endDate: new Date(term.endDate),
          status: term.termNumber === 'TERM_1' ? 'ACTIVE' : 'PLANNED',
          isCurrent: term.termNumber === 'TERM_1',
        }
      })
      console.log(`  Created term: ${term.name}`)
    } else {
      console.log(`  Term exists: ${term.name}`)
    }
  }
}

async function seedClasses(tenantId: string) {
  console.log('Creating classes...')
  
  for (const cls of CLASSES) {
    const existing = await prisma.edu_class.findFirst({
      where: { tenantId, code: cls.code }
    })
    
    if (!existing) {
      await prisma.edu_class.create({
        data: {
          id: `${tenantId}-${cls.id}`,
          tenantId,
          name: cls.name,
          code: cls.code,
          level: cls.level,
          capacity: cls.capacity,
          isActive: true,
        }
      })
      console.log(`  Created class: ${cls.name}`)
    } else {
      console.log(`  Class exists: ${cls.name}`)
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
          category: subj.category,
          isCompulsory: subj.isCompulsory,
          isActive: true,
        }
      })
      console.log(`  Created subject: ${subj.name}`)
    } else {
      console.log(`  Subject exists: ${subj.name}`)
    }
  }
}

async function seedStaff(tenantId: string) {
  console.log('Creating staff...')
  
  for (const staff of STAFF) {
    const existing = await prisma.edu_staff.findFirst({
      where: { tenantId, staffId: staff.staffId }
    })
    
    if (!existing) {
      await prisma.edu_staff.create({
        data: {
          id: `${tenantId}-${staff.id}`,
          tenantId,
          staffId: staff.staffId,
          firstName: staff.firstName,
          lastName: staff.lastName,
          fullName: `${staff.firstName} ${staff.lastName}`,
          role: staff.role as any,
          email: staff.email,
          phone: staff.phone,
          department: (staff as any).department || null,
          isActive: true,
        }
      })
      console.log(`  Created staff: ${staff.firstName} ${staff.lastName}`)
    } else {
      console.log(`  Staff exists: ${staff.firstName} ${staff.lastName}`)
    }
  }
}

async function seedStudents(tenantId: string) {
  console.log('Creating students...')
  
  for (const student of STUDENTS) {
    const existing = await prisma.edu_student.findFirst({
      where: { tenantId, studentId: student.studentId }
    })
    
    if (!existing) {
      await prisma.edu_student.create({
        data: {
          id: `${tenantId}-${student.id}`,
          tenantId,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`,
          gender: student.gender,
          dateOfBirth: new Date(student.dob),
          nationality: 'Nigerian',
        }
      })
      console.log(`  Created student: ${student.firstName} ${student.lastName}`)
    } else {
      console.log(`  Student exists: ${student.firstName} ${student.lastName}`)
    }
  }
}

async function seedEnrollments(tenantId: string) {
  console.log('Creating enrollments...')
  
  const session = await prisma.edu_session.findFirst({
    where: { tenantId, isCurrent: true }
  })
  
  if (!session) {
    console.log('  Skipping enrollments - no current session found')
    return
  }
  
  let count = 0
  for (const student of STUDENTS) {
    const studentRecord = await prisma.edu_student.findFirst({
      where: { tenantId, studentId: student.studentId }
    })
    
    const classRecord = await prisma.edu_class.findFirst({
      where: { tenantId, id: `${tenantId}-${student.classId}` }
    })
    
    if (studentRecord && classRecord) {
      const existing = await prisma.edu_enrollment.findFirst({
        where: {
          tenantId,
          studentId: studentRecord.id,
          sessionId: session.id,
        }
      })
      
      if (!existing) {
        await prisma.edu_enrollment.create({
          data: {
            tenantId,
            studentId: studentRecord.id,
            classId: classRecord.id,
            sessionId: session.id,
            enrollmentNumber: `ENR-${student.studentId.replace('/', '-')}`,
            status: 'ENROLLED',
            enrollmentDate: new Date('2024-09-01'),
          }
        })
        count++
      }
    }
  }
  console.log(`  Created ${count} enrollments`)
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
          feeType: fee.feeType as any,
          amount: fee.amount,
          currency: 'NGN',
          isVatExempt: true,
          allowInstallments: true,
          installmentCount: 3,
          gracePeriodDays: 14,
          isActive: true,
        }
      })
      console.log(`  Created fee: ${fee.name} - ₦${fee.amount.toLocaleString()}`)
    } else {
      console.log(`  Fee exists: ${fee.name}`)
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
    const tenant = await verifyDemoTenant()
    
    // Step 2: Seed configuration (academic structure)
    await seedSessions(tenant.id)
    await seedTerms(tenant.id)
    await seedClasses(tenant.id)
    await seedSubjects(tenant.id)
    
    // Step 3: Seed operational data (people)
    await seedStaff(tenant.id)
    await seedStudents(tenant.id)
    await seedEnrollments(tenant.id)
    
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
