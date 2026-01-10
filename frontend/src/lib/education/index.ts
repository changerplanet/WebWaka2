/**
 * Education Suite - Barrel Export
 * 
 * @module lib/education
 * @phase S2 + S4
 * @standard Platform Standardisation v2
 */

// Types
export * from './types'

// Services
export * from './student-service'
export * from './academic-service'
export * from './fee-fact-service'
export * from './attendance-service'

// Demo Data (S4)
export { seedEducationDemoData, clearEducationDemoData } from './demo-data'
export type { SeedResult } from './demo-data'

// Assessment service - explicit exports to avoid conflicts
export {
  // Entity operations
  createAssessmentEntity,
  createResultEntity,
  
  // Grade calculation
  getGradeFromScore,
  calculateTotalScore,
  calculateCaTotal,
  
  // Position/ranking
  calculatePositions,
  calculateClassAverage,
  
  // Status transitions
  isValidResultStatusTransition,
  getAllowedResultStatuses,
  
  // Transcript integrity
  canModifyResult,
  createResultLock,
  
  // Validation
  validateAssessmentInput,
  
  // Helpers
  ASSESSMENT_TYPE_LABELS,
  getAssessmentTypeLabel,
  isCAAssessment,
  isExamAssessment,
  
  // Constants (not re-exported from academic to avoid conflict)
  NIGERIA_GRADE_BOUNDARIES,
  DEFAULT_CA_MAX,
  DEFAULT_EXAM_MAX,
} from './assessment-service'
