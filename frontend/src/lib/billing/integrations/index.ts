/**
 * Billing Integrations Barrel Export
 * 
 * @module lib/billing/integrations
 * @phase Phase 2 Track B
 */

export {
  emitInvoiceIssued,
  emitPaymentRecorded,
  emitCreditNoteApplied,
  demoBillingToAccountingFlow
} from './accounting-emitter'
