/**
 * Form Validators - Phase E1.3
 */

import { FormStatus, SubmissionStatus } from '@/lib/sites-funnels/forms'

const VALID_FORM_STATUSES: FormStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']
const VALID_SUBMISSION_STATUSES: SubmissionStatus[] = [
  'PENDING',
  'COMPLETED',
  'PAYMENT_PENDING',
  'PAYMENT_COMPLETED',
  'PAYMENT_FAILED',
  'FAILED'
]

export function validateFormStatus(status: string | null): FormStatus | null {
  if (!status) return null
  const upper = status.toUpperCase() as FormStatus
  return VALID_FORM_STATUSES.includes(upper) ? upper : null
}

export function validateSubmissionStatus(status: string | null): SubmissionStatus | null {
  if (!status) return null
  const upper = status.toUpperCase() as SubmissionStatus
  return VALID_SUBMISSION_STATUSES.includes(upper) ? upper : null
}
