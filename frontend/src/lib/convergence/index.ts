/**
 * Convergence Module Barrel Export
 * 
 * @module lib/convergence
 * @phase Phase 3 Track C
 */

export {
  // Types
  type DerivedJournalEntry,
  type DerivedJournalMetadata,
  type DerivedJournal,
  type InvoiceForDerivation,
  type PaymentForDerivation,
  type CreditNoteForDerivation,
  type FullInvoiceDerivation,
  
  // Functions
  deriveInvoiceJournal,
  derivePaymentJournal,
  deriveCreditNoteJournal,
  deriveFullInvoiceJournals
} from './deriveInvoiceJournal'
