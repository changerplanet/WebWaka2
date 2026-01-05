/**
 * EDUCATION SUITE: Configuration & Label Mappings
 * 
 * Education Suite is a composition of existing capabilities:
 * - CRM: Student/Parent management
 * - HR Attendance: Student attendance
 * - HR Staff: Teacher management
 * - Billing: Fee management
 * 
 * NO NEW SCHEMAS - Uses metadata fields and service composition.
 */

// ============================================================================
// LABEL MAPPINGS (CRM → Education)
// ============================================================================

export const EDUCATION_LABELS = {
  // Entity labels (CRM Contact mappings)
  contact: 'Person',
  contacts: 'People',
  student: 'Student',
  students: 'Students',
  guardian: 'Parent/Guardian',
  guardians: 'Parents/Guardians',
  teacher: 'Teacher',
  teachers: 'Teachers',
  staff: 'Staff',
  
  // Academic labels
  class: 'Class',
  classes: 'Classes',
  section: 'Section',
  sections: 'Sections',
  subject: 'Subject',
  subjects: 'Subjects',
  grade: 'Grade',
  grades: 'Grades',
  term: 'Term',
  terms: 'Terms',
  session: 'Academic Session',
  sessions: 'Academic Sessions',
  
  // Assessment labels
  assessment: 'Assessment',
  assessments: 'Assessments',
  exam: 'Examination',
  exams: 'Examinations',
  test: 'Test',
  tests: 'Tests',
  assignment: 'Assignment',
  assignments: 'Assignments',
  
  // Attendance labels
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
  
  // Fee labels (Billing mappings)
  fee: 'Fee',
  fees: 'Fees',
  tuition: 'Tuition',
  invoice: 'Fee Invoice',
  invoices: 'Fee Invoices',
  scholarship: 'Scholarship',
  scholarships: 'Scholarships',
  
  // Report labels
  reportCard: 'Report Card',
  reportCards: 'Report Cards',
  transcript: 'Transcript',
  transcripts: 'Transcripts',
} as const;

// ============================================================================
// CONTACT TYPE MAPPINGS
// ============================================================================

export const EDUCATION_CONTACT_TYPES = {
  STUDENT: 'STUDENT',
  GUARDIAN: 'GUARDIAN',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
} as const;

export type EducationContactType = keyof typeof EDUCATION_CONTACT_TYPES;

// ============================================================================
// GRADE SCALE DEFINITIONS
// ============================================================================

export const GRADE_SCALES = {
  // Nigerian WAEC-style grading
  WAEC: {
    name: 'WAEC Scale',
    grades: [
      { letter: 'A1', minScore: 75, maxScore: 100, gpa: 4.0, description: 'Excellent' },
      { letter: 'B2', minScore: 70, maxScore: 74, gpa: 3.5, description: 'Very Good' },
      { letter: 'B3', minScore: 65, maxScore: 69, gpa: 3.0, description: 'Good' },
      { letter: 'C4', minScore: 60, maxScore: 64, gpa: 2.5, description: 'Credit' },
      { letter: 'C5', minScore: 55, maxScore: 59, gpa: 2.0, description: 'Credit' },
      { letter: 'C6', minScore: 50, maxScore: 54, gpa: 1.5, description: 'Credit' },
      { letter: 'D7', minScore: 45, maxScore: 49, gpa: 1.0, description: 'Pass' },
      { letter: 'E8', minScore: 40, maxScore: 44, gpa: 0.5, description: 'Pass' },
      { letter: 'F9', minScore: 0, maxScore: 39, gpa: 0.0, description: 'Fail' },
    ],
  },
  
  // Standard A-F grading
  STANDARD: {
    name: 'Standard A-F',
    grades: [
      { letter: 'A', minScore: 90, maxScore: 100, gpa: 4.0, description: 'Excellent' },
      { letter: 'B', minScore: 80, maxScore: 89, gpa: 3.0, description: 'Good' },
      { letter: 'C', minScore: 70, maxScore: 79, gpa: 2.0, description: 'Average' },
      { letter: 'D', minScore: 60, maxScore: 69, gpa: 1.0, description: 'Below Average' },
      { letter: 'F', minScore: 0, maxScore: 59, gpa: 0.0, description: 'Fail' },
    ],
  },
  
  // University CGPA scale
  UNIVERSITY: {
    name: 'University CGPA',
    grades: [
      { letter: 'A', minScore: 70, maxScore: 100, gpa: 5.0, description: 'First Class' },
      { letter: 'B', minScore: 60, maxScore: 69, gpa: 4.0, description: 'Second Class Upper' },
      { letter: 'C', minScore: 50, maxScore: 59, gpa: 3.0, description: 'Second Class Lower' },
      { letter: 'D', minScore: 45, maxScore: 49, gpa: 2.0, description: 'Third Class' },
      { letter: 'E', minScore: 40, maxScore: 44, gpa: 1.0, description: 'Pass' },
      { letter: 'F', minScore: 0, maxScore: 39, gpa: 0.0, description: 'Fail' },
    ],
  },
} as const;

export type GradeScaleType = keyof typeof GRADE_SCALES;

// ============================================================================
// ASSESSMENT TYPE DEFINITIONS
// ============================================================================

export const ASSESSMENT_TYPES = {
  EXAM: { name: 'Examination', weight: 60 },
  TEST: { name: 'Test', weight: 20 },
  ASSIGNMENT: { name: 'Assignment', weight: 10 },
  PROJECT: { name: 'Project', weight: 10 },
  PRACTICAL: { name: 'Practical', weight: 20 },
  CONTINUOUS: { name: 'Continuous Assessment', weight: 40 },
} as const;

export type AssessmentType = keyof typeof ASSESSMENT_TYPES;

// ============================================================================
// TERM/SESSION DEFINITIONS
// ============================================================================

export const TERM_TYPES = {
  FIRST: { name: 'First Term', shortName: 'T1', order: 1 },
  SECOND: { name: 'Second Term', shortName: 'T2', order: 2 },
  THIRD: { name: 'Third Term', shortName: 'T3', order: 3 },
  // University semesters
  FIRST_SEMESTER: { name: 'First Semester', shortName: 'S1', order: 1 },
  SECOND_SEMESTER: { name: 'Second Semester', shortName: 'S2', order: 2 },
} as const;

export type TermType = keyof typeof TERM_TYPES;

// ============================================================================
// ATTENDANCE STATUS DEFINITIONS
// ============================================================================

export const ATTENDANCE_STATUS = {
  PRESENT: { code: 'P', name: 'Present', color: 'green' },
  ABSENT: { code: 'A', name: 'Absent', color: 'red' },
  LATE: { code: 'L', name: 'Late', color: 'yellow' },
  EXCUSED: { code: 'E', name: 'Excused', color: 'blue' },
  HALF_DAY: { code: 'H', name: 'Half Day', color: 'orange' },
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

// ============================================================================
// STUDENT METADATA SCHEMA (Stored in CRM Contact metadata)
// ============================================================================

export interface StudentMetadata {
  // Enrollment info
  enrollmentDate: string;
  enrollmentNumber: string;
  admissionNumber: string;
  
  // Class assignment
  currentClassId: string;
  currentClassName: string;
  currentSection?: string;
  rollNumber?: string;
  
  // Academic info
  gradeLevel: number; // 1-12 for schools, year 1-6 for universities
  stream?: string; // Science, Arts, Commercial
  
  // Guardian links (CRM Contact IDs)
  guardianIds: string[];
  primaryGuardianId?: string;
  
  // Status
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'WITHDRAWN' | 'SUSPENDED';
  
  // Academic records stored here
  academicRecords?: AcademicRecord[];
}

export interface AcademicRecord {
  sessionId: string;
  sessionName: string;
  termId: string;
  termName: string;
  classId: string;
  className: string;
  
  subjects: SubjectGrade[];
  
  // Aggregates
  totalScore: number;
  averageScore: number;
  gpa: number;
  position?: number;
  totalStudents?: number;
  
  // Remarks
  teacherRemarks?: string;
  principalRemarks?: string;
  
  // Attendance summary for the term
  attendanceSummary?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
  };
  
  // Report card generated
  reportCardGenerated?: boolean;
  reportCardUrl?: string;
}

export interface SubjectGrade {
  subjectCode: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  
  // Scores by assessment type
  scores: {
    assessmentType: AssessmentType;
    score: number;
    maxScore: number;
    weight: number;
  }[];
  
  // Final calculations
  totalScore: number;
  grade: string;
  gradePoint: number;
  remarks?: string;
}

// ============================================================================
// CLASS/SECTION CONFIGURATION (Stored in Tenant config)
// ============================================================================

export interface ClassConfig {
  id: string;
  name: string;
  shortName: string;
  gradeLevel: number;
  sections: string[];
  subjects: SubjectConfig[];
  classTeacherId?: string;
  capacity?: number;
}

export interface SubjectConfig {
  code: string;
  name: string;
  shortName: string;
  creditUnits?: number;
  isCompulsory: boolean;
  assessmentWeights: {
    [key in AssessmentType]?: number;
  };
}

// ============================================================================
// SESSION/TERM CONFIGURATION
// ============================================================================

export interface SessionConfig {
  id: string;
  name: string; // e.g., "2025/2026"
  startDate: string;
  endDate: string;
  terms: TermConfig[];
  isActive: boolean;
}

export interface TermConfig {
  id: string;
  type: TermType;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ============================================================================
// EDUCATION CAPABILITY BUNDLE
// ============================================================================

export const EDUCATION_CAPABILITY_BUNDLE = {
  key: 'education',
  name: 'Education Suite',
  description: 'Complete school and university management solution',
  
  // Required capabilities (must be activated)
  requiredCapabilities: [
    'crm',           // Student/parent management
    'hr_payroll',    // Staff/teacher management
    'payments',      // Fee collection
  ],
  
  // Optional capabilities
  optionalCapabilities: [
    'pos',           // Walk-in fee collection
    'analytics',     // Academic analytics
    'campaigns',     // Parent notifications
  ],
  
  // Institution types supported
  institutionTypes: [
    'PRIMARY_SCHOOL',
    'SECONDARY_SCHOOL',
    'UNIVERSITY',
    'TRAINING_CENTER',
    'TUTORING_SERVICE',
  ],
  
  // Feature flags
  features: {
    grading: true,
    attendance: true,
    feeManagement: true,
    reportCards: true,
    parentPortal: true,
    onlineAdmission: false, // Future
    timetable: false, // Future - use calendar integrations
    library: false, // Separate suite
  },
  
  // Entitlements by tier
  entitlements: {
    maxStudents: { free: 50, starter: 200, professional: 1000, enterprise: -1 },
    maxTeachers: { free: 5, starter: 20, professional: 100, enterprise: -1 },
    maxClasses: { free: 5, starter: 20, professional: 50, enterprise: -1 },
    reportCardExports: { free: 10, starter: 100, professional: -1, enterprise: -1 },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get education-specific label
 */
export function getEducationLabel(key: keyof typeof EDUCATION_LABELS): string {
  return EDUCATION_LABELS[key] || key;
}

/**
 * Get grade letter from score using specified scale
 */
export function getGradeFromScore(score: number, scale: GradeScaleType = 'WAEC'): {
  letter: string;
  gpa: number;
  description: string;
} {
  const gradeScale = GRADE_SCALES[scale];
  for (const grade of gradeScale.grades) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return {
        letter: grade.letter,
        gpa: grade.gpa,
        description: grade.description,
      };
    }
  }
  // Default to fail
  const lastGrade = gradeScale.grades[gradeScale.grades.length - 1];
  return {
    letter: lastGrade.letter,
    gpa: lastGrade.gpa,
    description: lastGrade.description,
  };
}

/**
 * Calculate GPA from subject grades
 */
export function calculateGPA(
  subjects: SubjectGrade[],
  scale: GradeScaleType = 'WAEC'
): number {
  if (subjects.length === 0) return 0;
  
  const totalPoints = subjects.reduce((sum, subject) => sum + subject.gradePoint, 0);
  return Number((totalPoints / subjects.length).toFixed(2));
}

/**
 * Calculate weighted score from assessments
 */
export function calculateWeightedScore(
  scores: { score: number; maxScore: number; weight: number }[]
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const item of scores) {
    const percentage = (item.score / item.maxScore) * 100;
    totalWeightedScore += percentage * (item.weight / 100);
    totalWeight += item.weight;
  }
  
  // Normalize if weights don't sum to 100
  if (totalWeight > 0 && totalWeight !== 100) {
    totalWeightedScore = (totalWeightedScore / totalWeight) * 100;
  }
  
  return Number(totalWeightedScore.toFixed(2));
}

/**
 * Get attendance percentage
 */
export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Number(((present / total) * 100).toFixed(1));
}
