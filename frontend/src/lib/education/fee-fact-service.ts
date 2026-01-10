/**
 * Education Suite - Fee Fact Service
 * 
 * Manages fee structures and emits fee facts to Billing Suite.
 * CRITICAL: Education emits facts; Billing creates invoices.
 * Education NEVER handles money directly.
 * 
 * @module lib/education/fee-fact-service
 * @phase S2
 * @standard Platform Standardisation v2
 * @commerce-reuse Billing Suite
 */

import {
  EduFeeStructure,
  EduFeeAssignment,
  EduFeeType,
  EduFeeAssignmentStatus,
  CreateFeeStructureInput,
  AssignFeeInput,
  FeeFact,
} from './types'

// ============================================================================
// NIGERIA-FIRST DEFAULTS
// ============================================================================

/** Education is VAT-exempt in Nigeria */
export const EDUCATION_VAT_EXEMPT = true

/** Default currency for education fees */
export const DEFAULT_CURRENCY = 'NGN'

/** Default installment count (most parents pay in 3 installments) */
export const DEFAULT_INSTALLMENT_COUNT = 3

/** Default grace period before late fees */
export const DEFAULT_GRACE_PERIOD_DAYS = 14

// ============================================================================
// FEE STRUCTURE OPERATIONS
// ============================================================================

/**
 * Create a fee structure entity (in-memory)
 */
export function createFeeStructureEntity(
  input: CreateFeeStructureInput
): Omit<EduFeeStructure, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    tenantId: input.tenantId,
    platformInstanceId: input.platformInstanceId,
    classId: input.classId,
    termId: input.termId,
    name: input.name,
    feeType: input.feeType,
    description: input.description,
    currency: DEFAULT_CURRENCY,
    amount: input.amount,
    isVatExempt: EDUCATION_VAT_EXEMPT, // Always true for education
    allowInstallments: input.allowInstallments ?? true,
    installmentCount: input.installmentCount ?? DEFAULT_INSTALLMENT_COUNT,
    dueDate: input.dueDate,
    gracePeriodDays: input.gracePeriodDays ?? DEFAULT_GRACE_PERIOD_DAYS,
    lateFeeAmount: input.lateFeeAmount,
    lateFeePercent: input.lateFeePercent,
    isActive: true,
  }
}

/**
 * Calculate total fees for a class in a term
 */
export function calculateTotalFees(
  feeStructures: EduFeeStructure[]
): { total: number; breakdown: Array<{ type: EduFeeType; amount: number }> } {
  const breakdown = feeStructures.map((fs) => ({
    type: fs.feeType,
    amount: fs.amount,
  }))

  const total = feeStructures.reduce((sum: any, fs) => sum + fs.amount, 0)

  return { total, breakdown }
}

// ============================================================================
// FEE ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Create a fee assignment entity (in-memory)
 * This represents a fee assigned to a specific student
 */
export function createFeeAssignmentEntity(
  input: AssignFeeInput,
  feeStructure: EduFeeStructure,
  assignmentNumber: string
): Omit<EduFeeAssignment, 'id' | 'createdAt' | 'updatedAt'> {
  const discountAmount = input.discountAmount ?? 0
  const finalAmount = feeStructure.amount - discountAmount

  return {
    tenantId: input.tenantId,
    studentId: input.studentId,
    feeStructureId: input.feeStructureId,
    assignmentNumber,
    originalAmount: feeStructure.amount,
    discountAmount,
    discountReason: input.discountReason,
    finalAmount,
    status: 'PENDING',
    amountPaid: 0,
    amountOutstanding: finalAmount,
    dueDate: input.dueDate ?? feeStructure.dueDate,
    notes: input.notes,
  }
}

/**
 * Generate fee assignment number
 * Format: FEE-{YEAR}-{SEQ}
 */
export function generateFeeAssignmentNumber(
  year: number,
  sequence: number
): string {
  const seq = String(sequence).padStart(4, '0')
  return `FEE-${year}-${seq}`
}

// ============================================================================
// FEE FACT EMISSION (Commerce Integration)
// ============================================================================

/**
 * Create a fee fact for emission to Billing Suite.
 * 
 * IMPORTANT: This is the integration point with Commerce.
 * - Education creates the fact (what is owed)
 * - Billing creates the invoice (formal bill)
 * - Payments processes collection
 * - Accounting records the journal
 * 
 * Education NEVER touches the invoice or payment directly.
 */
export function createFeeFact(
  feeAssignment: EduFeeAssignment,
  feeStructure: EduFeeStructure,
  studentInfo: { id: string; name: string },
  guardianInfo?: { id: string; name: string; phone?: string; email?: string },
  contextInfo?: { sessionName?: string; termName?: string; className?: string }
): FeeFact {
  return {
    factId: `edu-fee-${feeAssignment.id}`,
    tenantId: feeAssignment.tenantId,
    studentId: studentInfo.id,
    studentName: studentInfo.name,
    guardianId: guardianInfo?.id,
    guardianName: guardianInfo?.name,
    guardianPhone: guardianInfo?.phone,
    guardianEmail: guardianInfo?.email,
    feeStructureId: feeStructure.id,
    feeType: feeStructure.feeType,
    feeName: feeStructure.name,
    currency: 'NGN',
    originalAmount: feeAssignment.originalAmount,
    discountAmount: feeAssignment.discountAmount,
    finalAmount: feeAssignment.finalAmount,
    isVatExempt: true, // Education is always VAT-exempt
    dueDate: feeAssignment.dueDate,
    feeAssignmentId: feeAssignment.id!,
    sessionName: contextInfo?.sessionName,
    termName: contextInfo?.termName,
    className: contextInfo?.className,
    emittedAt: new Date(),
  }
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

const FEE_ASSIGNMENT_STATUS_TRANSITIONS: Record<
  EduFeeAssignmentStatus,
  EduFeeAssignmentStatus[]
> = {
  PENDING: ['BILLED', 'WAIVED', 'CANCELLED'],
  BILLED: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'CANCELLED'],
  PAID: [], // Terminal state
  WAIVED: [], // Terminal state
  CANCELLED: [], // Terminal state
}

export function isValidFeeAssignmentStatusTransition(
  from: EduFeeAssignmentStatus,
  to: EduFeeAssignmentStatus
): boolean {
  return FEE_ASSIGNMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Update fee assignment payment status based on Billing Suite callback
 * This is called when Education receives payment updates from Billing
 */
export function calculatePaymentStatus(
  amountPaid: number,
  finalAmount: number
): EduFeeAssignmentStatus {
  if (amountPaid >= finalAmount) {
    return 'PAID'
  } else if (amountPaid > 0) {
    return 'PARTIALLY_PAID'
  }
  return 'BILLED'
}

// ============================================================================
// DISCOUNT CALCULATIONS
// ============================================================================

/**
 * Calculate sibling discount
 * Common practice: 10% discount for 2nd child, 15% for 3rd+
 */
export function calculateSiblingDiscount(
  siblingNumber: number,
  baseAmount: number
): { discountPercent: number; discountAmount: number } {
  let discountPercent = 0

  if (siblingNumber === 2) {
    discountPercent = 10
  } else if (siblingNumber >= 3) {
    discountPercent = 15
  }

  const discountAmount = Math.round((baseAmount * discountPercent) / 100)

  return { discountPercent, discountAmount }
}

/**
 * Calculate scholarship discount
 */
export function calculateScholarshipDiscount(
  scholarshipPercent: number,
  baseAmount: number
): number {
  return Math.round((baseAmount * scholarshipPercent) / 100)
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateFeeStructureInput(
  input: CreateFeeStructureInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.tenantId) errors.push('tenantId is required')
  if (!input.name?.trim()) errors.push('name is required')
  if (!input.feeType) errors.push('feeType is required')
  if (input.amount === undefined || input.amount < 0) {
    errors.push('amount must be a positive number')
  }

  return { valid: errors.length === 0, errors }
}

export function validateAssignFeeInput(
  input: AssignFeeInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.tenantId) errors.push('tenantId is required')
  if (!input.studentId) errors.push('studentId is required')
  if (!input.feeStructureId) errors.push('feeStructureId is required')

  if (input.discountAmount !== undefined && input.discountAmount < 0) {
    errors.push('discountAmount cannot be negative')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// FEE TYPE HELPERS
// ============================================================================

export const FEE_TYPE_LABELS: Record<EduFeeType, string> = {
  TUITION: 'Tuition Fee',
  REGISTRATION: 'Registration Fee',
  DEVELOPMENT_LEVY: 'Development Levy',
  PTA_DUES: 'PTA Dues',
  EXAM_FEE: 'Examination Fee',
  LAB_FEE: 'Laboratory Fee',
  LIBRARY_FEE: 'Library Fee',
  SPORTS_FEE: 'Sports Fee',
  UNIFORM: 'Uniform',
  BOOKS: 'Books & Materials',
  TRANSPORT: 'Transport Fee',
  BOARDING: 'Boarding Fee',
  OTHER: 'Other Charges',
}

export function getFeeTypeLabel(feeType: EduFeeType): string {
  return FEE_TYPE_LABELS[feeType] || feeType
}
