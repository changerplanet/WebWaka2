/**
 * Convergence v0 — Derived Invoice Journal
 * 
 * Pure function that derives journal entries from billing objects.
 * READ-ONLY, UI-DERIVED, NO WRITES, NO COUPLING.
 * 
 * This is a LENS, not a pipeline.
 * 
 * @module lib/convergence/deriveInvoiceJournal
 * @phase Phase 3 Track C
 */

import {
  ACCOUNT_CODES,
  ACCOUNT_NAMES,
  getPaymentAccountCode,
  PaymentMethod
} from '@/lib/accounting/integrations'

// ============================================================================
// TYPES
// ============================================================================

export interface DerivedJournalEntry {
  lineNumber: number
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description: string
}

export interface DerivedJournalMetadata {
  vatRate: number
  currency: 'NGN'
  exemptionReason?: string
  isPartialPayment?: boolean
  derivedFrom: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE'
}

export interface DerivedJournal {
  /** Journal entry type description */
  type: string
  
  /** Human-readable description */
  description: string
  
  /** Derived journal lines */
  entries: DerivedJournalEntry[]
  
  /** Totals (must be balanced) */
  totalDebit: number
  totalCredit: number
  
  /** Metadata */
  metadata: DerivedJournalMetadata
  
  /** Whether the journal is balanced */
  isBalanced: boolean
}

// ============================================================================
// INVOICE TYPES (Input)
// ============================================================================

export interface InvoiceForDerivation {
  invoiceNumber: string
  customerName: string
  subtotal: number
  vatAmount: number
  grandTotal: number
  vatExempt: boolean
  vatInclusive: boolean
  vatExemptionReason?: string
}

export interface PaymentForDerivation {
  invoiceNumber: string
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
  isPartial: boolean
  remainingBalance: number
}

export interface CreditNoteForDerivation {
  creditNoteNumber: string
  invoiceNumber: string
  creditAmount: number
  vatPortion: number
  netPortion: number
  reason: string
  wasVatExempt: boolean
}

// ============================================================================
// DERIVATION FUNCTIONS
// ============================================================================

/**
 * Derive journal entries from an invoice
 * 
 * Standard: DR: A/R, CR: Revenue + VAT Payable
 * VAT Exempt: DR: A/R, CR: Revenue
 */
export function deriveInvoiceJournal(invoice: InvoiceForDerivation): DerivedJournal {
  const entries: DerivedJournalEntry[] = []
  let lineNumber = 1

  // Line 1: Debit Accounts Receivable
  entries.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    debit: invoice.grandTotal,
    credit: 0,
    description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`
  })

  // Line 2: Credit Revenue
  entries.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.SERVICE_REVENUE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.SERVICE_REVENUE],
    debit: 0,
    credit: invoice.subtotal,
    description: `Revenue - ${invoice.invoiceNumber}`
  })

  // Line 3: Credit VAT Payable (if not exempt)
  if (!invoice.vatExempt && invoice.vatAmount > 0) {
    entries.push({
      lineNumber: lineNumber++,
      accountCode: ACCOUNT_CODES.VAT_PAYABLE,
      accountName: ACCOUNT_NAMES[ACCOUNT_CODES.VAT_PAYABLE],
      debit: 0,
      credit: invoice.vatAmount,
      description: `Output VAT (7.5%) - ${invoice.invoiceNumber}`
    })
  }

  const totalDebit = entries.reduce((sum: any, e: any) => sum + e.debit, 0)
  const totalCredit = entries.reduce((sum: any, e: any) => sum + e.credit, 0)

  return {
    type: 'Invoice Issued',
    description: `Journal entry for invoice ${invoice.invoiceNumber}`,
    entries,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    metadata: {
      vatRate: invoice.vatExempt ? 0 : 0.075,
      currency: 'NGN',
      exemptionReason: invoice.vatExemptionReason,
      derivedFrom: 'INVOICE'
    }
  }
}

/**
 * Derive journal entries from a payment
 * 
 * DR: Cash/Bank/Mobile (based on method)
 * CR: Accounts Receivable
 */
export function derivePaymentJournal(payment: PaymentForDerivation): DerivedJournal {
  const cashAccountCode = getPaymentAccountCode(payment.paymentMethod)
  const entries: DerivedJournalEntry[] = []

  // Line 1: Debit Cash/Bank/Mobile
  entries.push({
    lineNumber: 1,
    accountCode: cashAccountCode,
    accountName: ACCOUNT_NAMES[cashAccountCode],
    debit: payment.amount,
    credit: 0,
    description: `Payment received - ${payment.invoiceNumber}${payment.reference ? ` (Ref: ${payment.reference})` : ''}`
  })

  // Line 2: Credit Accounts Receivable
  entries.push({
    lineNumber: 2,
    accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    debit: 0,
    credit: payment.amount,
    description: `A/R reduction - ${payment.invoiceNumber}`
  })

  const paymentType = payment.isPartial ? 'Partial Payment' : 'Full Payment'

  return {
    type: paymentType,
    description: `Journal entry for ${paymentType.toLowerCase()} on ${payment.invoiceNumber}`,
    entries,
    totalDebit: payment.amount,
    totalCredit: payment.amount,
    isBalanced: true,
    metadata: {
      vatRate: 0,
      currency: 'NGN',
      isPartialPayment: payment.isPartial,
      derivedFrom: 'PAYMENT'
    }
  }
}

/**
 * Derive journal entries from a credit note
 * 
 * DR: Revenue (net) + VAT Payable (if applicable)
 * CR: Accounts Receivable
 */
export function deriveCreditNoteJournal(creditNote: CreditNoteForDerivation): DerivedJournal {
  const entries: DerivedJournalEntry[] = []
  let lineNumber = 1

  // Line 1: Debit Revenue
  entries.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.SERVICE_REVENUE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.SERVICE_REVENUE],
    debit: creditNote.netPortion,
    credit: 0,
    description: `Revenue reversal - ${creditNote.creditNoteNumber}`
  })

  // Line 2: Debit VAT Payable (if original was not exempt)
  if (!creditNote.wasVatExempt && creditNote.vatPortion > 0) {
    entries.push({
      lineNumber: lineNumber++,
      accountCode: ACCOUNT_CODES.VAT_PAYABLE,
      accountName: ACCOUNT_NAMES[ACCOUNT_CODES.VAT_PAYABLE],
      debit: creditNote.vatPortion,
      credit: 0,
      description: `VAT reversal - ${creditNote.creditNoteNumber}`
    })
  }

  // Line 3: Credit Accounts Receivable
  entries.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    debit: 0,
    credit: creditNote.creditAmount,
    description: `A/R credit - ${creditNote.creditNoteNumber}`
  })

  return {
    type: 'Credit Note Applied',
    description: `Journal entry for credit note ${creditNote.creditNoteNumber} applied to ${creditNote.invoiceNumber}`,
    entries,
    totalDebit: creditNote.creditAmount,
    totalCredit: creditNote.creditAmount,
    isBalanced: true,
    metadata: {
      vatRate: creditNote.wasVatExempt ? 0 : 0.075,
      currency: 'NGN',
      derivedFrom: 'CREDIT_NOTE'
    }
  }
}

// ============================================================================
// COMBINED DERIVATION
// ============================================================================

export interface FullInvoiceDerivation {
  invoice: DerivedJournal
  payments: DerivedJournal[]
  creditNotes: DerivedJournal[]
  summary: {
    totalJournalEntries: number
    totalDebits: number
    totalCredits: number
    netReceivable: number
  }
}

/**
 * Derive complete journal entries for an invoice with all related transactions
 */
export function deriveFullInvoiceJournals(
  invoice: InvoiceForDerivation,
  payments: PaymentForDerivation[] = [],
  creditNotes: CreditNoteForDerivation[] = []
): FullInvoiceDerivation {
  const invoiceJournal = deriveInvoiceJournal(invoice)
  const paymentJournals = payments.map((p: any) => derivePaymentJournal(p))
  const creditNoteJournals = creditNotes.map((c: any) => deriveCreditNoteJournal(c))

  // Calculate summary
  const allJournals = [invoiceJournal, ...paymentJournals, ...creditNoteJournals]
  const totalDebits = allJournals.reduce((sum: any, j) => sum + j.totalDebit, 0)
  const totalCredits = allJournals.reduce((sum: any, j) => sum + j.totalCredit, 0)
  
  // Net A/R = Invoice amount - Payments - Credit notes
  const paymentsTotal = payments.reduce((sum: any, p: any) => sum + p.amount, 0)
  const creditsTotal = creditNotes.reduce((sum: any, c: any) => sum + c.creditAmount, 0)
  const netReceivable = invoice.grandTotal - paymentsTotal - creditsTotal

  return {
    invoice: invoiceJournal,
    payments: paymentJournals,
    creditNotes: creditNoteJournals,
    summary: {
      totalJournalEntries: allJournals.length,
      totalDebits,
      totalCredits,
      netReceivable
    }
  }
}
