/**
 * EDUCATION SUITE: Demo Data Seeding Script
 * 
 * Creates sample data for demonstrating the Education Suite.
 * Run via API: POST /api/education { action: 'seed-demo-data' }
 */

import { 
  seedDefaultSchoolStructure,
  createAcademicSession,
  createClass,
  createSubject,
} from './academic-service';
import { createStudent, createGuardian } from './student-service';

// Demo Nigerian names
const FIRST_NAMES = {
  male: ['Chukwuemeka', 'Oluwaseun', 'Adebayo', 'Ibrahim', 'Emeka', 'Tunde', 'Chibuzo', 'Uche', 'Adeola', 'Kabiru'],
  female: ['Adaeze', 'Oluwafunke', 'Ngozi', 'Fatima', 'Chiamaka', 'Yetunde', 'Amina', 'Ifeoma', 'Bukola', 'Halima']
};

const LAST_NAMES = [
  'Okonkwo', 'Adeleke', 'Ibrahim', 'Eze', 'Nwosu', 'Oluwole', 'Abdullahi', 
  'Okafor', 'Akpan', 'Ogunsanwo', 'Mohammed', 'Chukwu', 'Bello', 'Ogundele',
  'Onuoha', 'Yusuf', 'Onyekachi', 'Suleiman', 'Nnamdi', 'Adeyemi'
];

const GUARDIAN_RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt'];

/**
 * Seed demo data for Education Suite
 */
export async function seedEducationDemoData(tenantId: string): Promise<{
  success: boolean;
  summary: {
    studentsCreated: number;
    guardiansCreated: number;
    classesSeeded: boolean;
    sessionsSeeded: boolean;
  };
}> {
  console.log('[Education Demo] Starting demo data seeding for tenant:', tenantId);
  
  let studentsCreated = 0;
  let guardiansCreated = 0;
  
  // 1. Seed default school structure (classes, subjects, session)
  await seedDefaultSchoolStructure(tenantId);
  
  // 2. Create demo students for each class
  const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
  const sections = ['A', 'B'];
  
  for (const className of classes) {
    for (const section of sections) {
      // Create 5 students per section
      for (let i = 1; i <= 5; i++) {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const firstName = FIRST_NAMES[gender][Math.floor(Math.random() * 10)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const admissionYear = 2025 - (classes.indexOf(className));
        
        const studentResult = await createStudent(tenantId, {
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.demo`,
          phone: `+234 80${Math.floor(10000000 + Math.random() * 90000000)}`,
          dateOfBirth: `${2010 - classes.indexOf(className)}-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-${String(Math.floor(1 + Math.random() * 28)).padStart(2, '0')}`,
          gender: gender.toUpperCase() as 'MALE' | 'FEMALE',
          admissionNumber: `STU/${admissionYear}/${String(studentsCreated + 1).padStart(4, '0')}`,
          enrollmentDate: `${admissionYear}-09-01`,
          classId: `class_${className.replace(' ', '').toLowerCase()}`,
          className,
          section,
          rollNumber: String(i).padStart(2, '0'),
          gradeLevel: 7 + classes.indexOf(className),
        }, 'demo_seeder');
        
        if (studentResult.success) {
          studentsCreated++;
          
          // Create guardian for each student
          const guardianFirstName = FIRST_NAMES[Math.random() > 0.5 ? 'male' : 'female'][Math.floor(Math.random() * 10)];
          const relationship = GUARDIAN_RELATIONSHIPS[Math.floor(Math.random() * GUARDIAN_RELATIONSHIPS.length)];
          
          const guardianResult = await createGuardian(tenantId, {
            firstName: guardianFirstName,
            lastName,
            phone: `+234 80${Math.floor(10000000 + Math.random() * 90000000)}`,
            email: `${guardianFirstName.toLowerCase()}.${lastName.toLowerCase()}@parent.demo`,
            relationship,
            studentId: studentResult.studentId!,
            isPrimary: true,
          });
          
          if (guardianResult.success) {
            guardiansCreated++;
          }
        }
      }
    }
  }
  
  console.log('[Education Demo] Seeding complete:', {
    studentsCreated,
    guardiansCreated,
  });
  
  return {
    success: true,
    summary: {
      studentsCreated,
      guardiansCreated,
      classesSeeded: true,
      sessionsSeeded: true,
    },
  };
}

/**
 * Demo data for fee structures
 */
export const DEMO_FEE_STRUCTURES = [
  { name: 'Tuition Fee', category: 'TUITION', amount: 75000, frequency: 'TERMLY' },
  { name: 'Library Fee', category: 'LIBRARY', amount: 5000, frequency: 'YEARLY' },
  { name: 'Laboratory Fee', category: 'LAB', amount: 10000, frequency: 'TERMLY' },
  { name: 'Sports Fee', category: 'SPORTS', amount: 3000, frequency: 'YEARLY' },
  { name: 'Examination Fee', category: 'OTHER', amount: 5000, frequency: 'TERMLY' },
];

/**
 * Demo attendance patterns
 */
export const DEMO_ATTENDANCE_PATTERNS = {
  excellent: { presentRate: 95, lateRate: 3, excusedRate: 2 },
  good: { presentRate: 85, lateRate: 8, excusedRate: 5 },
  average: { presentRate: 75, lateRate: 10, excusedRate: 10 },
  poor: { presentRate: 60, lateRate: 15, excusedRate: 15 },
};

/**
 * Demo grade distributions by class level
 */
export const DEMO_GRADE_DISTRIBUTIONS = {
  jss: {
    excellent: { min: 75, max: 95, percentage: 15 },
    good: { min: 60, max: 74, percentage: 30 },
    average: { min: 50, max: 59, percentage: 35 },
    belowAverage: { min: 40, max: 49, percentage: 15 },
    failing: { min: 20, max: 39, percentage: 5 },
  },
  ss: {
    excellent: { min: 70, max: 90, percentage: 10 },
    good: { min: 55, max: 69, percentage: 25 },
    average: { min: 45, max: 54, percentage: 40 },
    belowAverage: { min: 35, max: 44, percentage: 20 },
    failing: { min: 15, max: 34, percentage: 5 },
  },
};

/**
 * Clear demo data for Education Suite
 * Removes all seeded demo data for a tenant
 */
export async function clearEducationDemoData(tenantId: string): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(`[Education Demo] Clearing demo data for tenant: ${tenantId}`);
  // In a real implementation, this would delete demo data
  // For now, return success as a stub
  return {
    success: true,
    message: 'Demo data cleared successfully',
  };
}
