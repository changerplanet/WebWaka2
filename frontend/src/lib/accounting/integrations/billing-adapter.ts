/**
 * Billing Journal Adapter
 * 
 * Transforms Billing domain events into Accounting journal entries.
 * Implements idempotent, append-only processing.
 * 
 * Core Principle: "Billing emits facts. Accounting records truth."
 * 
 * @module lib/accounting/integrations/billing-adapter
 * @phase Phase 2 Track B (S2-S3)
 */

import { v4 as uuidv4 } from 'uuid'
import {
  BillingEvent,
  InvoiceIssuedEvent,
  PaymentRecordedEvent,
  CreditNoteAppliedEvent,
  JournalEntry,
  JournalLine,
  AdapterResult,
  ACCOUNT_CODES,
  ACCOUNT_NAMES,
  getPaymentAccountCode
} from './types'

// ============================================================================
// JOURNAL NUMBER GENERATOR
// ============================================================================

function generateJournalNumber(): string {
  const now = new Date()
  const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0')
  return `JE-${yymm}-${seq}`
}

// ============================================================================
// IDEMPOTENCY CHECK (Mock - replace with real DB check)
// ============================================================================

// In-memory cache for demo purposes
// In production: query acct_journal_entries where sourceEventId = event.eventId
const processedEvents = new Map<string, { journalId: string; journalNumber: string }>()

async function checkIdempotency(eventId: string, tenantId: string): Promise<{ 
  alreadyProcessed: boolean
  existingJournal?: { journalId: string; journalNumber: string }
}> {
  const key = `${tenantId}:${eventId}`
  const existing = processedEvents.get(key)
  
  if (existing) {
    return { alreadyProcessed: true, existingJournal: existing }
  }
  
  return { alreadyProcessed: false }
}

function recordProcessedEvent(eventId: string, tenantId: string, journalId: string, journalNumber: string): void {
  const key = `${tenantId}:${eventId}`
  processedEvents.set(key, { journalId, journalNumber })
}

// ============================================================================
// JOURNAL ENTRY BUILDERS
// ============================================================================

/**
 * Build journal entry for INVOICE_ISSUED event
 * 
 * Standard: DR: A/R, CR: Revenue + VAT Payable
 * VAT Exempt: DR: A/R, CR: Revenue (no VAT line)
 */
function buildInvoiceIssuedJournal(event: InvoiceIssuedEvent): JournalEntry {
  const lines: JournalLine[] = []
  let lineNumber = 1

  // Line 1: Debit Accounts Receivable (full amount)
  lines.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    debit: event.grandTotal,
    credit: 0,
    description: `Invoice ${event.invoiceNumber} - ${event.customerName}`
  })

  // Line 2: Credit Revenue (subtotal)
  lines.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.SERVICE_REVENUE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.SERVICE_REVENUE],
    debit: 0,
    credit: event.subtotal,
    description: `Revenue - ${event.invoiceNumber}`
  })

  // Line 3: Credit VAT Payable (if not exempt)
  if (!event.vatExempt && event.vatAmount > 0) {
    lines.push({
      lineNumber: lineNumber++,
      accountCode: ACCOUNT_CODES.VAT_PAYABLE,
      accountName: ACCOUNT_NAMES[ACCOUNT_CODES.VAT_PAYABLE],
      debit: 0,
      credit: event.vatAmount,
      description: `Output VAT - ${event.invoiceNumber}`
    })
  }

  return {
    journalNumber: generateJournalNumber(),
    date: event.timestamp,
    description: `Invoice ${event.invoiceNumber} - ${event.customerName}`,
    sourceType: 'BILLING_INTEGRATION',
    sourceEventType: 'INVOICE_ISSUED',
    sourceEventId: event.eventId,
    sourceReference: event.invoiceNumber,
    tenantId: event.tenantId,
    status: 'POSTED',
    lines,
    totalDebit: event.grandTotal,
    totalCredit: event.grandTotal,
    createdAt: new Date(),
    createdBy: 'SYSTEM:billing-integration'
  }
}

/**
 * Build journal entry for PAYMENT_RECORDED event
 * 
 * DR: Cash/Bank/Mobile (based on payment method)
 * CR: Accounts Receivable
 */
function buildPaymentRecordedJournal(event: PaymentRecordedEvent): JournalEntry {
  const cashAccountCode = getPaymentAccountCode(event.paymentMethod)
  const lines: JournalLine[] = []

  // Line 1: Debit Cash/Bank/Mobile
  lines.push({
    lineNumber: 1,
    accountCode: cashAccountCode,
    accountName: ACCOUNT_NAMES[cashAccountCode],
    debit: event.amountPaid,
    credit: 0,
    description: `Payment received - ${event.invoiceNumber}${event.paymentReference ? ` (Ref: ${event.paymentReference})` : ''}`
  })

  // Line 2: Credit Accounts Receivable
  lines.push({
    lineNumber: 2,
    accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    debit: 0,
    credit: event.amountPaid,
    description: `A/R reduction - ${event.invoiceNumber}`
  })

  const paymentType = event.isPartialPayment ? 'Partial payment' : 'Full payment'

  return {
    journalNumber: generateJournalNumber(),
    date: event.timestamp,
    description: `${paymentType} for ${event.invoiceNumber} via ${event.paymentMethod}`,
    sourceType: 'BILLING_INTEGRATION',
    sourceEventType: 'PAYMENT_RECORDED',
    sourceEventId: event.eventId,
    sourceReference: event.invoiceNumber,
    tenantId: event.tenantId,
    status: 'POSTED',
    lines,
    totalDebit: event.amountPaid,
    totalCredit: event.amountPaid,
    createdAt: new Date(),
    createdBy: 'SYSTEM:billing-integration'
  }
}

/**
 * Build journal entry for CREDIT_NOTE_APPLIED event
 * 
 * DR: Revenue (net portion)
 * DR: VAT Payable (if applicable)
 * CR: Accounts Receivable
 */
function buildCreditNoteAppliedJournal(event: CreditNoteAppliedEvent): JournalEntry {
  const lines: JournalLine[] = []
  let lineNumber = 1

  // Line 1: Debit Revenue (reverse the net amount)
  lines.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.SERVICE_REVENUE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.SERVICE_REVENUE],
    debit: event.netPortion,
    credit: 0,
    description: `Revenue reversal - ${event.creditNoteNumber}`
  })

  // Line 2: Debit VAT Payable (if original was not exempt)
  if (!event.wasVatExempt && event.vatPortion > 0) {
    lines.push({
      lineNumber: lineNumber++,
      accountCode: ACCOUNT_CODES.VAT_PAYABLE,
      accountName: ACCOUNT_NAMES[ACCOUNT_CODES.VAT_PAYABLE],
      debit: event.vatPortion,
      credit: 0,
      description: `VAT reversal - ${event.creditNoteNumber}`
    })
  }

  // Line 3: Credit Accounts Receivable
  lines.push({
    lineNumber: lineNumber++,
    accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    accountName: ACCOUNT_NAMES[ACCOUNT_CODES.ACCOUNTS_RECEIVABLE],
    debit: 0,
    credit: event.creditAmount,
    description: `A/R credit - ${event.creditNoteNumber} applied to ${event.invoiceNumber}`
  })

  return {
    journalNumber: generateJournalNumber(),
    date: event.timestamp,
    description: `Credit note ${event.creditNoteNumber} applied to ${event.invoiceNumber}: ${event.reason}`,
    sourceType: 'BILLING_INTEGRATION',
    sourceEventType: 'CREDIT_NOTE_APPLIED',
    sourceEventId: event.eventId,
    sourceReference: event.creditNoteNumber,
    tenantId: event.tenantId,
    status: 'POSTED',
    lines,
    totalDebit: event.creditAmount,
    totalCredit: event.creditAmount,
    createdAt: new Date(),
    createdBy: 'SYSTEM:billing-integration'
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateJournalBalance(journal: JournalEntry): boolean {
  const totalDebit = journal.lines.reduce((sum: any, line) => sum + line.debit, 0)
  const totalCredit = journal.lines.reduce((sum: any, line) => sum + line.credit, 0)
  
  // Allow for small floating point differences (< 1 kobo)
  return Math.abs(totalDebit - totalCredit) < 0.01
}

function validateEvent(event: BillingEvent): string | null {
  if (!event.eventId) {
    return 'Event ID is required for idempotency'
  }
  
  if (!event.tenantId) {
    return 'Tenant ID is required for isolation'
  }
  
  if (event.currency !== 'NGN') {
    return 'Only NGN currency is supported'
  }
  
  return null
}

// ============================================================================
// MAIN ADAPTER
// ============================================================================

/**
 * BillingJournalAdapter
 * 
 * Main entry point for processing billing events.
 * Transforms events into journal entries with:
 * - Idempotency checks
 * - Balance validation
 * - Audit trail
 */
export class BillingJournalAdapter {
  /**
   * Process a billing event and create corresponding journal entry
   */
  async handle(event: BillingEvent): Promise<AdapterResult> {
    // 1. Validate event
    const validationError = validateEvent(event)
    if (validationError) {
      return { success: false, error: validationError }
    }

    // 2. Check idempotency
    const idempotencyCheck = await checkIdempotency(event.eventId, event.tenantId)
    if (idempotencyCheck.alreadyProcessed) {
      return {
        success: true,
        alreadyProcessed: true,
        journalId: idempotencyCheck.existingJournal?.journalId,
        journalNumber: idempotencyCheck.existingJournal?.journalNumber
      }
    }

    // 3. Build journal entry based on event type
    let journal: JournalEntry

    switch (event.eventType) {
      case 'INVOICE_ISSUED':
        // Skip zero-amount invoices
        if (event.grandTotal === 0) {
          return { success: true, alreadyProcessed: false }
        }
        journal = buildInvoiceIssuedJournal(event)
        break

      case 'PAYMENT_RECORDED':
        // Skip zero-amount payments
        if (event.amountPaid === 0) {
          return { success: true, alreadyProcessed: false }
        }
        journal = buildPaymentRecordedJournal(event)
        break

      case 'CREDIT_NOTE_APPLIED':
        // Skip zero-amount credit notes
        if (event.creditAmount === 0) {
          return { success: true, alreadyProcessed: false }
        }
        journal = buildCreditNoteAppliedJournal(event)
        break

      default:
        return { success: false, error: `Unknown event type: ${(event as BillingEvent).eventType}` }
    }

    // 4. Validate journal balance
    if (!validateJournalBalance(journal)) {
      return { 
        success: false, 
        error: `Journal entry is unbalanced: Debit=${journal.totalDebit}, Credit=${journal.totalCredit}` 
      }
    }

    // 5. Persist journal entry (mock for now - replace with actual DB call)
    const journalId = uuidv4()
    
    // In production: await prisma.acct_journal_entries.create({ data: journal })
    console.log(`[BillingJournalAdapter] Created journal ${journal.journalNumber}:`, {
      eventType: event.eventType,
      eventId: event.eventId,
      totalDebit: journal.totalDebit,
      totalCredit: journal.totalCredit,
      lines: journal.lines.length
    })

    // 6. Record for idempotency
    recordProcessedEvent(event.eventId, event.tenantId, journalId, journal.journalNumber)

    return {
      success: true,
      journalId,
      journalNumber: journal.journalNumber,
      alreadyProcessed: false
    }
  }

  /**
   * Process multiple events (for batch processing)
   */
  async handleBatch(events: BillingEvent[]): Promise<AdapterResult[]> {
    const results: AdapterResult[] = []
    
    for (const event of events) {
      const result = await this.handle(event)
      results.push(result)
    }
    
    return results
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const billingJournalAdapter = new BillingJournalAdapter()
