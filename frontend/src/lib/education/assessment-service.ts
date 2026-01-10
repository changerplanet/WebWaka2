/**
 * Education Suite - Assessment Service
 * 
 * Manages assessments, grading, and results.
 * Nigeria-first: CA 40%, Exam 60% default weighting.
 * Append-only design for transcript integrity.
 * 
 * @module lib/education/assessment-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import {
  EduAssessment,
  EduResult,
  EduAssessmentType,
  EduResultStatus,
  EduGradeScale,
  GradeBoundary,
  RecordAssessmentInput,
} from './types'

// ============================================================================
// NIGERIA-FIRST GRADING DEFAULTS
// ============================================================================

/** Default CA weight (Nigeria standard: 40%) */
export const DEFAULT_CA_WEIGHT = 40

/** Default Exam weight (Nigeria standard: 60%) */
export const DEFAULT_EXAM_WEIGHT = 60

/** Default max CA score */
export const DEFAULT_CA_MAX = 40

/** Default max Exam score */
export const DEFAULT_EXAM_MAX = 60

/** Nigeria standard grading scale (A-F) */
export const NIGERIA_GRADE_BOUNDARIES: GradeBoundary[] = [
  { grade: 'A', minScore: 70, maxScore: 100, gradePoint: 4.0, remark: 'Excellent' },
  { grade: 'B', minScore: 60, maxScore: 69, gradePoint: 3.5, remark: 'Very Good' },
  { grade: 'C', minScore: 50, maxScore: 59, gradePoint: 3.0, remark: 'Good' },
  { grade: 'D', minScore: 45, maxScore: 49, gradePoint: 2.5, remark: 'Fair' },
  { grade: 'E', minScore: 40, maxScore: 44, gradePoint: 2.0, remark: 'Pass' },
  { grade: 'F', minScore: 0, maxScore: 39, gradePoint: 0.0, remark: 'Fail' },
]

// ============================================================================
// ASSESSMENT ENTITY OPERATIONS
// ============================================================================

/**
 * Create an assessment record entity (in-memory)
 */
export function createAssessmentEntity(
  input: RecordAssessmentInput
): Omit<EduAssessment, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    classId: input.classId,
    subjectId: input.subjectId,
    termId: input.termId,
    assessmentType: input.assessmentType,
    assessmentName: input.assessmentName,
    maxScore: input.maxScore,
    score: input.score,
    gradedById: input.gradedById,
    gradedAt: input.gradedById ? new Date() : undefined,
    teacherComment: input.teacherComment,
  }
}

// ============================================================================
// GRADE CALCULATION
// ============================================================================

/**
 * Get grade from score using boundary table
 */
export function getGradeFromScore(
  score: number,
  boundaries: GradeBoundary[] = NIGERIA_GRADE_BOUNDARIES
): GradeBoundary | null {
  const roundedScore = Math.round(score)
  
  for (const boundary of boundaries) {
    if (roundedScore >= boundary.minScore && roundedScore <= boundary.maxScore) {
      return boundary
    }
  }
  
  return null
}

/**
 * Calculate total score from CA and Exam
 */
export function calculateTotalScore(
  caScore: number,
  examScore: number,
  caMax: number = DEFAULT_CA_MAX,
  examMax: number = DEFAULT_EXAM_MAX
): number {
  // Normalize to percentage and combine
  const caPercent = (caScore / caMax) * DEFAULT_CA_WEIGHT
  const examPercent = (examScore / examMax) * DEFAULT_EXAM_WEIGHT
  
  return Math.round(caPercent + examPercent)
}

/**
 * Calculate CA total from multiple assessments
 */
export function calculateCaTotal(
  assessments: Array<{ score: number; maxScore: number }>,
  targetMax: number = DEFAULT_CA_MAX
): number {
  if (assessments.length === 0) return 0
  
  // Calculate weighted average
  let totalScore = 0
  let totalMax = 0
  
  for (const assessment of assessments) {
    totalScore += assessment.score
    totalMax += assessment.maxScore
  }
  
  if (totalMax === 0) return 0
  
  // Scale to target max (e.g., 40)
  return Math.round((totalScore / totalMax) * targetMax * 100) / 100
}

// ============================================================================
// RESULT OPERATIONS
// ============================================================================

interface ResultInput {
  tenantId: string
  studentId: string
  classId: string
  subjectId: string
  termId: string
  sessionId: string
  assessments: EduAssessment[]
  examScore: number
  examMaxScore?: number
  boundaries?: GradeBoundary[]
}

/**
 * Create a result entity from assessments
 * This computes CA, combines with exam, and determines grade
 */
export function createResultEntity(
  input: ResultInput
): Omit<EduResult, 'id' | 'createdAt' | 'updatedAt'> {
  const {
    tenantId,
    studentId,
    classId,
    subjectId,
    termId,
    sessionId,
    assessments,
    examScore,
    examMaxScore = DEFAULT_EXAM_MAX,
    boundaries = NIGERIA_GRADE_BOUNDARIES,
  } = input

  // Calculate CA from assessments (filter to CA types only)
  const caAssessments = assessments.filter((a: any) =>
    ['CONTINUOUS_ASSESSMENT', 'TEST', 'QUIZ', 'ASSIGNMENT', 'PROJECT'].includes(
      a.assessmentType
    )
  )
  
  const caScore = calculateCaTotal(
    caAssessments.map((a: any) => ({ score: a.score, maxScore: a.maxScore })),
    DEFAULT_CA_MAX
  )

  // Calculate total score
  const totalScore = calculateTotalScore(
    caScore,
    examScore,
    DEFAULT_CA_MAX,
    examMaxScore
  )

  // Determine grade
  const gradeBoundary = getGradeFromScore(totalScore, boundaries)

  return {
    tenantId,
    studentId,
    classId,
    subjectId,
    termId,
    sessionId,
    caScore,
    caMaxScore: DEFAULT_CA_MAX,
    examScore,
    examMaxScore,
    totalScore,
    grade: gradeBoundary?.grade,
    gradePoint: gradeBoundary?.gradePoint,
    remark: gradeBoundary?.remark,
    status: 'DRAFT',
    isLocked: false,
  }
}

// ============================================================================
// POSITION/RANKING CALCULATIONS
// ============================================================================

interface StudentScore {
  studentId: string
  totalScore: number
}

/**
 * Calculate class positions for a subject
 * Returns position assignments (handles ties)
 */
export function calculatePositions(
  studentScores: StudentScore[]
): Map<string, { position: number; classSize: number }> {
  const positions = new Map<string, { position: number; classSize: number }>()
  const classSize = studentScores.length

  if (classSize === 0) return positions

  // Sort by score descending
  const sorted = [...studentScores].sort((a: any, b: any) => b.totalScore - a.totalScore)

  let currentPosition = 1
  let previousScore: number | null = null

  sorted.forEach((student, index) => {
    // If same score as previous, same position (tie)
    if (previousScore !== null && student.totalScore === previousScore) {
      positions.set(student.studentId, { position: currentPosition, classSize })
    } else {
      currentPosition = index + 1
      positions.set(student.studentId, { position: currentPosition, classSize })
    }
    previousScore = student.totalScore
  })

  return positions
}

/**
 * Calculate class average for a subject
 */
export function calculateClassAverage(studentScores: StudentScore[]): number {
  if (studentScores.length === 0) return 0
  
  const totalSum = studentScores.reduce((sum: any, s) => sum + s.totalScore, 0)
  return Math.round((totalSum / studentScores.length) * 100) / 100
}

// ============================================================================
// RESULT STATUS TRANSITIONS
// ============================================================================

const RESULT_STATUS_TRANSITIONS: Record<EduResultStatus, EduResultStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'DRAFT'], // Can be returned for correction
  APPROVED: ['RELEASED'],
  RELEASED: ['LOCKED'],
  LOCKED: [], // Terminal state - no changes allowed
}

export function isValidResultStatusTransition(
  from: EduResultStatus,
  to: EduResultStatus
): boolean {
  return RESULT_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getAllowedResultStatuses(
  currentStatus: EduResultStatus
): EduResultStatus[] {
  return RESULT_STATUS_TRANSITIONS[currentStatus] || []
}

// ============================================================================
// TRANSCRIPT INTEGRITY
// ============================================================================

/**
 * Check if a result can be modified
 * Locked results cannot be changed (transcript integrity)
 */
export function canModifyResult(result: EduResult): {
  canModify: boolean
  reason?: string
} {
  if (result.isLocked) {
    return {
      canModify: false,
      reason: `Result is locked since ${result.lockedAt?.toISOString()}. Reason: ${result.lockedReason || 'No reason provided'}`,
    }
  }

  if (result.status === 'RELEASED' || result.status === 'LOCKED') {
    return {
      canModify: false,
      reason: 'Results that have been released cannot be modified',
    }
  }

  return { canModify: true }
}

/**
 * Lock a result (append-only, cannot be undone)
 */
export function createResultLock(
  reason: string
): { isLocked: boolean; lockedAt: Date; lockedReason: string; status: EduResultStatus } {
  return {
    isLocked: true,
    lockedAt: new Date(),
    lockedReason: reason,
    status: 'LOCKED',
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateAssessmentInput(
  input: RecordAssessmentInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.tenantId) errors.push('tenantId is required')
  if (!input.studentId) errors.push('studentId is required')
  if (!input.classId) errors.push('classId is required')
  if (!input.subjectId) errors.push('subjectId is required')
  if (!input.termId) errors.push('termId is required')
  if (!input.assessmentType) errors.push('assessmentType is required')

  if (input.maxScore === undefined || input.maxScore <= 0) {
    errors.push('maxScore must be a positive number')
  }

  if (input.score === undefined || input.score < 0) {
    errors.push('score cannot be negative')
  }

  if (input.score > input.maxScore) {
    errors.push('score cannot exceed maxScore')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// ASSESSMENT TYPE HELPERS
// ============================================================================

export const ASSESSMENT_TYPE_LABELS: Record<EduAssessmentType, string> = {
  CONTINUOUS_ASSESSMENT: 'Continuous Assessment',
  TEST: 'Test',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Assignment',
  PROJECT: 'Project',
  MID_TERM_EXAM: 'Mid-Term Examination',
  FINAL_EXAM: 'Final Examination',
  PRACTICAL: 'Practical',
}

export function getAssessmentTypeLabel(type: EduAssessmentType): string {
  return ASSESSMENT_TYPE_LABELS[type] || type
}

/**
 * Check if assessment type counts towards CA
 */
export function isCAAssessment(type: EduAssessmentType): boolean {
  return ['CONTINUOUS_ASSESSMENT', 'TEST', 'QUIZ', 'ASSIGNMENT', 'PROJECT'].includes(
    type
  )
}

/**
 * Check if assessment type is an exam
 */
export function isExamAssessment(type: EduAssessmentType): boolean {
  return ['MID_TERM_EXAM', 'FINAL_EXAM'].includes(type)
}
