/**
 * Education Suite - Full Demo Data Seeder
 * 
 * Seeds comprehensive demo data for the demo-school tenant:
 * - 100+ edu_attendance records
 * - edu_assessment records (CA, tests, exams)
 * - 60+ edu_result records with Nigerian grading
 * 
 * Run: npx tsx scripts/seed-education-full-demo.ts
 * 
 * Prerequisites: Run seed-education-demo.ts first to create base data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_TENANT_SLUG = 'demo-school'

// Nigerian grading scale
const GRADING_SCALE = [
  { min: 70, max: 100, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
  { min: 60, max: 69, grade: 'B', gradePoint: 3.5, remark: 'Very Good' },
  { min: 50, max: 59, grade: 'C', gradePoint: 3.0, remark: 'Good' },
  { min: 45, max: 49, grade: 'D', gradePoint: 2.5, remark: 'Fair' },
  { min: 40, max: 44, grade: 'E', gradePoint: 2.0, remark: 'Pass' },
  { min: 0, max: 39, grade: 'F', gradePoint: 0.0, remark: 'Fail' },
]

function getGrade(score: number) {
  for (const scale of GRADING_SCALE) {
    if (score >= scale.min && score <= scale.max) {
      return scale
    }
  }
  return GRADING_SCALE[GRADING_SCALE.length - 1]
}

function randomScore(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function getRandomStatus(): 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' {
  const rand = Math.random()
  if (rand < 0.85) return 'PRESENT'
  if (rand < 0.92) return 'LATE'
  if (rand < 0.97) return 'ABSENT'
  return 'EXCUSED'
}

function generateSchoolDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

async function main() {
  console.log('='.repeat(60))
  console.log('EDUCATION SUITE FULL DEMO SEEDER')
  console.log('Attendance, Assessments, and Results')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Get demo-school tenant
    console.log('\n1. Finding demo-school tenant...')
    const tenant = await prisma.tenant.findFirst({
      where: { slug: DEMO_TENANT_SLUG }
    })
    
    if (!tenant) {
      throw new Error(`FATAL: Demo tenant not found with slug: ${DEMO_TENANT_SLUG}. Run seed-education-demo.ts first.`)
    }
    console.log(`   Found: ${tenant.name} (${tenant.id})`)
    
    // Step 2: Get existing data
    console.log('\n2. Loading existing education data...')
    
    const students = await prisma.edu_student.findMany({
      where: { tenantId: tenant.id }
    })
    console.log(`   Students: ${students.length}`)
    
    const classes = await prisma.edu_class.findMany({
      where: { tenantId: tenant.id }
    })
    console.log(`   Classes: ${classes.length}`)
    
    const subjects = await prisma.edu_subject.findMany({
      where: { tenantId: tenant.id }
    })
    console.log(`   Subjects: ${subjects.length}`)
    
    const terms = await prisma.edu_term.findMany({
      where: { tenantId: tenant.id },
      include: { session: true }
    })
    console.log(`   Terms: ${terms.length}`)
    
    const staff = await prisma.edu_staff.findMany({
      where: { tenantId: tenant.id, role: { in: ['TEACHER', 'CLASS_TEACHER', 'HEAD_OF_DEPARTMENT'] } }
    })
    console.log(`   Teachers: ${staff.length}`)
    
    const enrollments = await prisma.edu_enrollment.findMany({
      where: { tenantId: tenant.id, status: 'ENROLLED' }
    })
    console.log(`   Enrollments: ${enrollments.length}`)
    
    if (students.length === 0 || terms.length === 0) {
      throw new Error('Missing base data. Run seed-education-demo.ts first.')
    }
    
    // Step 3: Seed Attendance Records (100+)
    console.log('\n3. Creating attendance records...')
    let attendanceCount = 0
    
    const firstTerm = terms.find(t => t.name === 'First Term')
    if (firstTerm) {
      const schoolDays = generateSchoolDates(
        new Date(firstTerm.startDate),
        new Date(Math.min(firstTerm.endDate.getTime(), new Date('2024-11-15').getTime()))
      ).slice(0, 15) // Take first 15 school days
      
      for (const enrollment of enrollments) {
        const classRecord = classes.find(c => c.id === enrollment.classId)
        if (!classRecord) continue
        
        const randomTeacher = staff[Math.floor(Math.random() * staff.length)]
        
        for (const date of schoolDays) {
          const existingAttendance = await prisma.edu_attendance.findFirst({
            where: {
              studentId: enrollment.studentId,
              classId: enrollment.classId,
              attendanceDate: date
            }
          })
          
          if (!existingAttendance) {
            const status = getRandomStatus()
            const arrivalTime = status === 'LATE' 
              ? new Date(date.getTime() + (8 * 60 + Math.floor(Math.random() * 30) + 15) * 60000)
              : status === 'PRESENT' 
                ? new Date(date.getTime() + (7 * 60 + Math.floor(Math.random() * 60) + 30) * 60000)
                : null
            
            await prisma.edu_attendance.create({
              data: {
                tenantId: tenant.id,
                studentId: enrollment.studentId,
                classId: enrollment.classId,
                termId: firstTerm.id,
                attendanceDate: date,
                status: status as any,
                arrivalTime,
                markedById: randomTeacher?.id,
                notes: status === 'EXCUSED' ? 'Medical appointment' : null,
                excuseReason: status === 'EXCUSED' ? 'Medical' : null,
              }
            })
            attendanceCount++
          }
        }
      }
    }
    console.log(`   Created ${attendanceCount} attendance records`)
    
    // Step 4: Seed Assessments
    console.log('\n4. Creating assessment records...')
    let assessmentCount = 0
    
    const assessmentTypes = [
      { type: 'CONTINUOUS_ASSESSMENT', name: 'First CA', maxScore: 15 },
      { type: 'CONTINUOUS_ASSESSMENT', name: 'Second CA', maxScore: 15 },
      { type: 'TEST', name: 'Mid-Term Test', maxScore: 10 },
      { type: 'FINAL_EXAM', name: 'First Term Exam', maxScore: 60 },
    ]
    
    // Assign subjects to classes based on level
    const classSubjectMapping: Record<string, string[]> = {
      'JSS1': ['subj-eng', 'subj-math', 'subj-civic', 'subj-agric', 'subj-computer', 'subj-yoruba'],
      'JSS2': ['subj-eng', 'subj-math', 'subj-civic', 'subj-agric', 'subj-computer', 'subj-yoruba'],
      'JSS3': ['subj-eng', 'subj-math', 'subj-civic', 'subj-agric', 'subj-computer', 'subj-yoruba', 'subj-biology'],
      'SS1-SCI': ['subj-eng', 'subj-math', 'subj-physics', 'subj-chemistry', 'subj-biology', 'subj-civic', 'subj-computer'],
      'SS1-ART': ['subj-eng', 'subj-math', 'subj-government', 'subj-literature', 'subj-economics', 'subj-civic', 'subj-crs'],
      'SS2-SCI': ['subj-eng', 'subj-math', 'subj-physics', 'subj-chemistry', 'subj-biology', 'subj-civic', 'subj-computer'],
      'SS2-ART': ['subj-eng', 'subj-math', 'subj-government', 'subj-literature', 'subj-economics', 'subj-civic', 'subj-history'],
      'SS3-SCI': ['subj-eng', 'subj-math', 'subj-physics', 'subj-chemistry', 'subj-biology', 'subj-civic'],
      'SS3-ART': ['subj-eng', 'subj-math', 'subj-government', 'subj-literature', 'subj-economics', 'subj-civic'],
    }
    
    if (firstTerm) {
      for (const enrollment of enrollments) {
        const classRecord = classes.find(c => c.id === enrollment.classId)
        if (!classRecord) continue
        
        const classSubjectIds = classSubjectMapping[classRecord.code] || ['subj-eng', 'subj-math', 'subj-civic']
        const classSubjects = subjects.filter(s => classSubjectIds.includes(s.id.replace(`${tenant.id}-`, '')))
        
        for (const subject of classSubjects) {
          const randomTeacher = staff[Math.floor(Math.random() * staff.length)]
          
          for (const assessment of assessmentTypes) {
            const existingAssessment = await prisma.edu_assessment.findFirst({
              where: {
                studentId: enrollment.studentId,
                classId: enrollment.classId,
                subjectId: subject.id,
                termId: firstTerm.id,
                assessmentName: assessment.name,
              }
            })
            
            if (!existingAssessment) {
              const score = randomScore(assessment.maxScore * 0.4, assessment.maxScore)
              
              await prisma.edu_assessment.create({
                data: {
                  tenantId: tenant.id,
                  studentId: enrollment.studentId,
                  classId: enrollment.classId,
                  subjectId: subject.id,
                  termId: firstTerm.id,
                  assessmentType: assessment.type as any,
                  assessmentName: assessment.name,
                  maxScore: assessment.maxScore,
                  score,
                  gradedById: randomTeacher?.id,
                  gradedAt: new Date(),
                }
              })
              assessmentCount++
            }
          }
        }
      }
    }
    console.log(`   Created ${assessmentCount} assessment records`)
    
    // Step 5: Compute and seed Results
    console.log('\n5. Creating result records...')
    let resultCount = 0
    
    if (firstTerm) {
      for (const enrollment of enrollments) {
        const classRecord = classes.find(c => c.id === enrollment.classId)
        if (!classRecord) continue
        
        const classSubjectIds = classSubjectMapping[classRecord.code] || ['subj-eng', 'subj-math', 'subj-civic']
        const classSubjects = subjects.filter(s => classSubjectIds.includes(s.id.replace(`${tenant.id}-`, '')))
        
        for (const subject of classSubjects) {
          const existingResult = await prisma.edu_result.findFirst({
            where: {
              studentId: enrollment.studentId,
              subjectId: subject.id,
              termId: firstTerm.id,
            }
          })
          
          if (!existingResult) {
            // Get assessments for this student/subject/term
            const studentAssessments = await prisma.edu_assessment.findMany({
              where: {
                studentId: enrollment.studentId,
                subjectId: subject.id,
                termId: firstTerm.id,
              }
            })
            
            // Calculate CA score (sum of CA and tests, max 40)
            const caAssessments = studentAssessments.filter(a => 
              ['CONTINUOUS_ASSESSMENT', 'TEST', 'QUIZ', 'ASSIGNMENT'].includes(a.assessmentType)
            )
            const caScore = caAssessments.reduce((sum, a) => sum + Number(a.score), 0)
            
            // Get exam score (max 60)
            const examAssessment = studentAssessments.find(a => 
              ['FINAL_EXAM', 'MID_TERM_EXAM'].includes(a.assessmentType) && a.assessmentName?.includes('Exam')
            )
            const examScore = examAssessment ? Number(examAssessment.score) : randomScore(30, 55)
            
            const totalScore = Math.min(caScore, 40) + Math.min(examScore, 60)
            const gradeInfo = getGrade(totalScore)
            
            const randomTeacher = staff[Math.floor(Math.random() * staff.length)]
            
            await prisma.edu_result.create({
              data: {
                tenantId: tenant.id,
                studentId: enrollment.studentId,
                classId: enrollment.classId,
                subjectId: subject.id,
                termId: firstTerm.id,
                sessionId: firstTerm.sessionId,
                caScore: Math.min(caScore, 40),
                caMaxScore: 40,
                examScore: Math.min(examScore, 60),
                examMaxScore: 60,
                totalScore,
                grade: gradeInfo.grade,
                gradePoint: gradeInfo.gradePoint,
                remark: gradeInfo.remark,
                status: 'APPROVED',
                submittedAt: new Date(),
                approvedAt: new Date(),
                approvedById: randomTeacher?.id,
                teacherComment: getTeacherComment(gradeInfo.grade),
              }
            })
            resultCount++
          }
        }
      }
    }
    console.log(`   Created ${resultCount} result records`)
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('EDUCATION FULL DEMO SEEDING COMPLETE')
    console.log(`   Attendance records: ${attendanceCount}`)
    console.log(`   Assessment records: ${assessmentCount}`)
    console.log(`   Result records: ${resultCount}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('SEEDING FAILED:', error)
    throw error
  }
}

function getTeacherComment(grade: string): string {
  const comments: Record<string, string[]> = {
    'A': ['Excellent performance! Keep up the good work.', 'Outstanding achievement this term.', 'Brilliant work, well done!'],
    'B': ['Very good performance. A little more effort will get you to the top.', 'Great work! You\'re doing well.', 'Good effort, keep improving.'],
    'C': ['Good performance. More practice will improve your results.', 'Satisfactory work. There\'s room for improvement.', 'Keep working hard.'],
    'D': ['Fair performance. You need to put in more effort.', 'More attention to classwork is required.', 'Try harder next term.'],
    'E': ['You barely passed. Significant improvement is needed.', 'More effort required to improve your grades.', 'Please seek help if needed.'],
    'F': ['You need to work much harder. Please see your teacher for extra help.', 'Failed. Extra classes recommended.', 'Improvement urgently needed.'],
  }
  const gradeComments = comments[grade] || comments['C']
  return gradeComments[Math.floor(Math.random() * gradeComments.length)]
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
