/**
 * Education Suite - Domain Types
 * 
 * Type definitions for the Education domain.
 * Nigeria-first: 3-term calendar, VAT-exempt fees, NGN currency.
 * 
 * @module lib/education/types
 * @phase S2
 * @standard Platform Standardisation v2
 */

// ============================================================================
// ENUMS (Mirror Prisma enums for type safety)
// ============================================================================

export type EduStudentStatus =
  | 'PROSPECTIVE'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'WITHDRAWN'
  | 'EXPELLED'
  | 'GRADUATED'
  | 'TRANSFERRED_OUT'

export type EduEnrollmentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ENROLLED'
  | 'DEFERRED'
  | 'REJECTED'
  | 'CANCELLED'

export type EduGuardianRelation =
  | 'FATHER'
  | 'MOTHER'
  | 'GUARDIAN'
  | 'SPONSOR'
  | 'SIBLING'
  | 'GRANDPARENT'
  | 'UNCLE'
  | 'AUNT'
  | 'OTHER'

export type EduTermNumber = 'TERM_1' | 'TERM_2' | 'TERM_3'

export type EduSessionStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export type EduTermStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export type EduAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'HALF_DAY'

export type EduGradeScale =
  | 'PERCENTAGE'
  | 'LETTER_AF'
  | 'GPA_4'
  | 'GPA_5'
  | 'CUSTOM'

export type EduAssessmentType =
  | 'CONTINUOUS_ASSESSMENT'
  | 'TEST'
  | 'QUIZ'
  | 'ASSIGNMENT'
  | 'PROJECT'
  | 'MID_TERM_EXAM'
  | 'FINAL_EXAM'
  | 'PRACTICAL'

export type EduResultStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RELEASED'
  | 'LOCKED'

export type EduFeeType =
  | 'TUITION'
  | 'REGISTRATION'
  | 'DEVELOPMENT_LEVY'
  | 'PTA_DUES'
  | 'EXAM_FEE'
  | 'LAB_FEE'
  | 'LIBRARY_FEE'
  | 'SPORTS_FEE'
  | 'UNIFORM'
  | 'BOOKS'
  | 'TRANSPORT'
  | 'BOARDING'
  | 'OTHER'

export type EduFeeAssignmentStatus =
  | 'PENDING'
  | 'BILLED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'WAIVED'
  | 'CANCELLED'

export type EduStaffRole =
  | 'TEACHER'
  | 'CLASS_TEACHER'
  | 'HEAD_OF_DEPARTMENT'
  | 'VICE_PRINCIPAL'
  | 'PRINCIPAL'
  | 'BURSAR'
  | 'REGISTRAR'
  | 'LIBRARIAN'
  | 'COUNSELOR'
  | 'ADMIN'

// ============================================================================
// DOMAIN ENTITIES
// ============================================================================

export interface EduStudent {
  id: string
  tenantId: string
  platformInstanceId?: string
  studentId: string
  firstName: string
  lastName: string
  middleName?: string
  fullName?: string
  dateOfBirth?: Date
  gender?: string
  nationality: string
  stateOfOrigin?: string
  lga?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  bloodGroup?: string
  genotype?: string
  allergies?: string
  medicalNotes?: string
  photoUrl?: string
  status: EduStudentStatus
  statusChangedAt?: Date
  statusReason?: string
  admissionDate?: Date
  admissionNumber?: string
  previousSchool?: string
  createdAt: Date
  updatedAt: Date
}

export interface EduGuardian {
  id: string
  tenantId: string
  platformInstanceId?: string
  firstName: string
  lastName: string
  middleName?: string
  fullName?: string
  email?: string
  phone: string
  whatsapp?: string
  address?: string
  city?: string
  state?: string
  occupation?: string
  employer?: string
  preferSms: boolean
  preferEmail: boolean
  preferWhatsApp: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EduStudentGuardianLink {
  id: string
  tenantId: string
  studentId: string
  guardianId: string
  relation: EduGuardianRelation
  isPrimary: boolean
  canPickup: boolean
  isFinancialContact: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EduSession {
  id: string
  tenantId: string
  platformInstanceId?: string
  name: string
  code: string
  startDate: Date
  endDate: Date
  status: EduSessionStatus
  isCurrent: boolean
  termCount: number
  createdAt: Date
  updatedAt: Date
}

export interface EduTerm {
  id: string
  tenantId: string
  sessionId: string
  termNumber: EduTermNumber
  name: string
  startDate: Date
  endDate: Date
  midTermBreakStart?: Date
  midTermBreakEnd?: Date
  status: EduTermStatus
  isCurrent: boolean
  resultReleaseDate?: Date
  resultsLocked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EduClass {
  id: string
  tenantId: string
  platformInstanceId?: string
  name: string
  code: string
  level: number
  description?: string
  capacity?: number
  classTeacherId?: string
  arm?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EduSubject {
  id: string
  tenantId: string
  platformInstanceId?: string
  name: string
  code: string
  shortName?: string
  description?: string
  category?: string
  isCompulsory: boolean
  creditUnits?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EduStaff {
  id: string
  tenantId: string
  platformInstanceId?: string
  staffId: string
  firstName: string
  lastName: string
  middleName?: string
  fullName?: string
  email?: string
  phone?: string
  role: EduStaffRole
  department?: string
  qualifications?: string
  employmentDate?: Date
  isActive: boolean
  userId?: string
  createdAt: Date
  updatedAt: Date
}

export interface EduEnrollment {
  id: string
  tenantId: string
  studentId: string
  classId: string
  sessionId: string
  enrollmentNumber?: string
  status: EduEnrollmentStatus
  statusChangedAt?: Date
  statusReason?: string
  enrollmentDate?: Date
  withdrawalDate?: Date
  isRepeating: boolean
  repeatReason?: string
  createdAt: Date
  updatedAt: Date
}

export interface EduFeeStructure {
  id: string
  tenantId: string
  platformInstanceId?: string
  classId?: string
  termId?: string
  name: string
  feeType: EduFeeType
  description?: string
  currency: string
  amount: number
  isVatExempt: boolean
  allowInstallments: boolean
  installmentCount: number
  dueDate?: Date
  gracePeriodDays: number
  lateFeeAmount?: number
  lateFeePercent?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EduFeeAssignment {
  id: string
  tenantId: string
  studentId: string
  feeStructureId: string
  assignmentNumber?: string
  originalAmount: number
  discountAmount: number
  discountReason?: string
  finalAmount: number
  status: EduFeeAssignmentStatus
  billingInvoiceId?: string
  billingInvoiceRef?: string
  amountPaid: number
  amountOutstanding: number
  lastPaymentDate?: Date
  dueDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface EduAttendance {
  id: string
  tenantId: string
  studentId: string
  classId: string
  termId: string
  attendanceDate: Date
  status: EduAttendanceStatus
  arrivalTime?: Date
  departureTime?: Date
  notes?: string
  excuseReason?: string
  markedById?: string
  markedAt: Date
  isBackfilled: boolean
  backfilledAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface EduAssessment {
  id: string
  tenantId: string
  studentId: string
  classId: string
  subjectId: string
  termId: string
  assessmentType: EduAssessmentType
  assessmentName?: string
  maxScore: number
  score: number
  gradedById?: string
  gradedAt?: Date
  teacherComment?: string
  createdAt: Date
  updatedAt: Date
}

export interface EduResult {
  id: string
  tenantId: string
  studentId: string
  classId: string
  subjectId: string
  termId: string
  sessionId: string
  caScore: number
  caMaxScore: number
  examScore: number
  examMaxScore: number
  totalScore: number
  grade?: string
  gradePoint?: number
  remark?: string
  classPosition?: number
  classSize?: number
  status: EduResultStatus
  submittedAt?: Date
  submittedById?: string
  approvedAt?: Date
  approvedById?: string
  releasedAt?: Date
  teacherComment?: string
  isLocked: boolean
  lockedAt?: Date
  lockedReason?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// GRADE BOUNDARY
// ============================================================================

export interface GradeBoundary {
  grade: string
  minScore: number
  maxScore: number
  gradePoint: number
  remark: string
}

// ============================================================================
// SERVICE INPUT/OUTPUT TYPES
// ============================================================================

export interface CreateStudentInput {
  tenantId: string
  platformInstanceId?: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth?: Date
  gender?: string
  nationality?: string
  stateOfOrigin?: string
  lga?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  previousSchool?: string
}

export interface CreateGuardianInput {
  tenantId: string
  platformInstanceId?: string
  firstName: string
  lastName: string
  middleName?: string
  email?: string
  phone: string
  whatsapp?: string
  address?: string
  city?: string
  state?: string
  occupation?: string
  employer?: string
}

export interface LinkGuardianInput {
  tenantId: string
  studentId: string
  guardianId: string
  relation: EduGuardianRelation
  isPrimary?: boolean
  canPickup?: boolean
  isFinancialContact?: boolean
}

export interface CreateSessionInput {
  tenantId: string
  platformInstanceId?: string
  name: string
  code: string
  startDate: Date
  endDate: Date
  termCount?: number
}

export interface CreateTermInput {
  tenantId: string
  sessionId: string
  termNumber: EduTermNumber
  name: string
  startDate: Date
  endDate: Date
  midTermBreakStart?: Date
  midTermBreakEnd?: Date
}

export interface CreateClassInput {
  tenantId: string
  platformInstanceId?: string
  name: string
  code: string
  level: number
  description?: string
  capacity?: number
  arm?: string
}

export interface CreateSubjectInput {
  tenantId: string
  platformInstanceId?: string
  name: string
  code: string
  shortName?: string
  description?: string
  category?: string
  isCompulsory?: boolean
  creditUnits?: number
}

export interface EnrollStudentInput {
  tenantId: string
  studentId: string
  classId: string
  sessionId: string
  isRepeating?: boolean
  repeatReason?: string
}

export interface CreateFeeStructureInput {
  tenantId: string
  platformInstanceId?: string
  classId?: string
  termId?: string
  name: string
  feeType: EduFeeType
  description?: string
  amount: number
  allowInstallments?: boolean
  installmentCount?: number
  dueDate?: Date
  gracePeriodDays?: number
  lateFeeAmount?: number
  lateFeePercent?: number
}

export interface AssignFeeInput {
  tenantId: string
  studentId: string
  feeStructureId: string
  discountAmount?: number
  discountReason?: string
  dueDate?: Date
  notes?: string
}

export interface MarkAttendanceInput {
  tenantId: string
  studentId: string
  classId: string
  termId: string
  attendanceDate: Date
  status: EduAttendanceStatus
  arrivalTime?: Date
  notes?: string
  excuseReason?: string
  markedById?: string
  isBackfilled?: boolean
}

export interface RecordAssessmentInput {
  tenantId: string
  studentId: string
  classId: string
  subjectId: string
  termId: string
  assessmentType: EduAssessmentType
  assessmentName?: string
  maxScore: number
  score: number
  gradedById?: string
  teacherComment?: string
}

// ============================================================================
// FEE FACT EVENT (For Commerce Integration)
// Education emits this; Billing consumes it
// ============================================================================

export interface FeeFact {
  /** Unique identifier for this fee fact */
  factId: string
  
  /** Tenant scope */
  tenantId: string
  
  /** Student who owes the fee */
  studentId: string
  studentName: string
  
  /** Guardian to bill (financial contact) */
  guardianId?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  
  /** Fee details */
  feeStructureId: string
  feeType: EduFeeType
  feeName: string
  
  /** Amount (NGN) */
  currency: 'NGN'
  originalAmount: number
  discountAmount: number
  finalAmount: number
  
  /** VAT handling */
  isVatExempt: true // Education is always VAT-exempt in Nigeria
  
  /** Due date */
  dueDate?: Date
  
  /** Reference back to Education */
  feeAssignmentId: string
  
  /** Metadata */
  sessionName?: string
  termName?: string
  className?: string
  
  /** Timestamp */
  emittedAt: Date
}
