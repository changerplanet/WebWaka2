/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Canonical Services - S3 Exports
 * 
 * This module provides the canonical billing services for the Commerce Suite.
 * 
 * Services included:
 * - InvoiceService: Invoice lifecycle management
 * - InvoicePaymentService: Payment tracking against invoices
 * - CreditNoteService: Credit note management
 * - VATService: Nigerian VAT calculations
 * 
 * @module lib/billing
 */

// Core Invoice Service
export { InvoiceService } from './invoice-service'
export type { 
  Invoice, 
  InvoiceItem, 
  CreateInvoiceInput 
} from './invoice-service'

// Invoice Payment Service
export { InvoicePaymentService } from './invoice-payment-service'
export type { 
  InvoicePayment, 
  RecordPaymentInput 
} from './invoice-payment-service'

// Credit Note Service
export { CreditNoteService } from './credit-note-service'
export type { 
  CreditNote, 
  CreateCreditNoteInput 
} from './credit-note-service'

// VAT Service
export { 
  VATService, 
  NIGERIAN_VAT_RATE, 
  VAT_EXEMPT_CATEGORIES 
} from './vat-service'
export type { 
  VATBreakdown, 
  VATCalculationInput, 
  VATExemptCategory 
} from './vat-service'

// Note: Pre-existing billing_* services (addon-service, bundle-service, etc.)
// remain available via direct import but are not re-exported here.
// They will be canonicalized in a future phase if needed.
