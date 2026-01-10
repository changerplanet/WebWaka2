/**
 * Billing Event Emitter
 * 
 * Emits domain events from Billing services to be consumed by Accounting.
 * This is the integration point between Billing and Accounting suites.
 * 
 * IMPORTANT: This is ADDITIVE only - it does not modify existing Billing logic.
 * Events are emitted AFTER successful Billing operations.
 * 
 * @module lib/billing/integrations/accounting-emitter
 * @phase Phase 2 Track B (S4)
 */

import { randomUUID } from 'crypto'
import {
  billingJournalAdapter,
  InvoiceIssuedEvent,
  PaymentRecordedEvent,
  CreditNoteAppliedEvent,
  PaymentMethod
} from '@/lib/accounting/integrations'

// ============================================================================
// EVENT EMISSION FUNCTIONS
// ============================================================================

/**
 * Emit INVOICE_ISSUED event when invoice is sent
 * Call this AFTER invoice status changes from DRAFT → SENT
 */
export async function emitInvoiceIssued(params: {
  tenantId: string
  invoiceId: string
  invoiceNumber: string
  customerId: string | null
  customerName: string
  subtotal: number
  vatAmount: number
  grandTotal: number
  vatExempt: boolean
  vatInclusive: boolean
  timestamp?: Date
}): Promise<{ success: boolean; journalNumber?: string; error?: string }> {
  const event: InvoiceIssuedEvent = {
    eventType: 'INVOICE_ISSUED',
    eventId: `evt-${randomUUID()}`,
    timestamp: params.timestamp || new Date(),
    tenantId: params.tenantId,
    currency: 'NGN',
    invoiceId: params.invoiceId,
    invoiceNumber: params.invoiceNumber,
    customerId: params.customerId || 'unknown',
    customerName: params.customerName,
    subtotal: params.subtotal,
    vatAmount: params.vatAmount,
    grandTotal: params.grandTotal,
    vatExempt: params.vatExempt,
    vatInclusive: params.vatInclusive
  }

  try {
    const result = await billingJournalAdapter.handle(event)
    
    if (result.success) {
      console.log(`[Billing→Accounting] Invoice ${params.invoiceNumber} → Journal ${result.journalNumber}`)
    }
    
    return {
      success: result.success,
      journalNumber: result.journalNumber,
      error: result.error
    }
  } catch (error) {
    console.error(`[Billing→Accounting] Failed to emit INVOICE_ISSUED:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Emit PAYMENT_RECORDED event when payment is recorded
 * Call this AFTER payment is successfully recorded against invoice
 */
export async function emitPaymentRecorded(params: {
  tenantId: string
  invoiceId: string
  invoiceNumber: string
  paymentId: string
  amountPaid: number
  paymentMethod: PaymentMethod
  paymentReference?: string
  isPartialPayment: boolean
  remainingBalance: number
  timestamp?: Date
}): Promise<{ success: boolean; journalNumber?: string; error?: string }> {
  const event: PaymentRecordedEvent = {
    eventType: 'PAYMENT_RECORDED',
    eventId: `evt-${randomUUID()}`,
    timestamp: params.timestamp || new Date(),
    tenantId: params.tenantId,
    currency: 'NGN',
    invoiceId: params.invoiceId,
    invoiceNumber: params.invoiceNumber,
    paymentId: params.paymentId,
    amountPaid: params.amountPaid,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference,
    isPartialPayment: params.isPartialPayment,
    remainingBalance: params.remainingBalance
  }

  try {
    const result = await billingJournalAdapter.handle(event)
    
    if (result.success) {
      const paymentType = params.isPartialPayment ? 'Partial' : 'Full'
      console.log(`[Billing→Accounting] ${paymentType} payment ₦${params.amountPaid.toLocaleString()} → Journal ${result.journalNumber}`)
    }
    
    return {
      success: result.success,
      journalNumber: result.journalNumber,
      error: result.error
    }
  } catch (error) {
    console.error(`[Billing→Accounting] Failed to emit PAYMENT_RECORDED:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Emit CREDIT_NOTE_APPLIED event when credit note is applied
 * Call this AFTER credit note is successfully applied to invoice
 */
export async function emitCreditNoteApplied(params: {
  tenantId: string
  creditNoteId: string
  creditNoteNumber: string
  invoiceId: string
  invoiceNumber: string
  creditAmount: number
  vatPortion: number
  netPortion: number
  reason: string
  wasVatExempt: boolean
  timestamp?: Date
}): Promise<{ success: boolean; journalNumber?: string; error?: string }> {
  const event: CreditNoteAppliedEvent = {
    eventType: 'CREDIT_NOTE_APPLIED',
    eventId: `evt-${randomUUID()}`,
    timestamp: params.timestamp || new Date(),
    tenantId: params.tenantId,
    currency: 'NGN',
    creditNoteId: params.creditNoteId,
    creditNoteNumber: params.creditNoteNumber,
    invoiceId: params.invoiceId,
    invoiceNumber: params.invoiceNumber,
    creditAmount: params.creditAmount,
    vatPortion: params.vatPortion,
    netPortion: params.netPortion,
    reason: params.reason,
    wasVatExempt: params.wasVatExempt
  }

  try {
    const result = await billingJournalAdapter.handle(event)
    
    if (result.success) {
      console.log(`[Billing→Accounting] Credit note ${params.creditNoteNumber} ₦${params.creditAmount.toLocaleString()} → Journal ${result.journalNumber}`)
    }
    
    return {
      success: result.success,
      journalNumber: result.journalNumber,
      error: result.error
    }
  } catch (error) {
    console.error(`[Billing→Accounting] Failed to emit CREDIT_NOTE_APPLIED:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ============================================================================
// DEMO / TEST FUNCTION
// ============================================================================

/**
 * Demo function to simulate the full billing → accounting flow
 * For testing and demonstration purposes
 */
export async function demoBillingToAccountingFlow(tenantId: string): Promise<{
  invoiceJournal?: string
  paymentJournal?: string
  creditNoteJournal?: string
  success: boolean
}> {
  console.log('\n========================================')
  console.log('BILLING → ACCOUNTING INTEGRATION DEMO')
  console.log('========================================\n')

  const results: {
    invoiceJournal?: string
    paymentJournal?: string
    creditNoteJournal?: string
    success: boolean
  } = { success: true }

  // 1. Simulate invoice issued
  console.log('1. Issuing Invoice INV-2601-DEMO...')
  const invoiceResult = await emitInvoiceIssued({
    tenantId,
    invoiceId: 'inv-demo-001',
    invoiceNumber: 'INV-2601-DEMO',
    customerId: 'cust-demo-001',
    customerName: 'Dangote Industries Ltd',
    subtotal: 500000,
    vatAmount: 37500,
    grandTotal: 537500,
    vatExempt: false,
    vatInclusive: false
  })
  
  if (invoiceResult.success) {
    results.invoiceJournal = invoiceResult.journalNumber
    console.log(`   ✅ Journal created: ${invoiceResult.journalNumber}`)
    console.log('   DR: 1210 Accounts Receivable → ₦537,500')
    console.log('   CR: 4200 Service Revenue → ₦500,000')
    console.log('   CR: 2120 VAT Payable → ₦37,500\n')
  } else {
    results.success = false
    console.log(`   ❌ Failed: ${invoiceResult.error}\n`)
  }

  // 2. Simulate partial payment
  console.log('2. Recording partial payment ₦300,000...')
  const paymentResult = await emitPaymentRecorded({
    tenantId,
    invoiceId: 'inv-demo-001',
    invoiceNumber: 'INV-2601-DEMO',
    paymentId: 'pay-demo-001',
    amountPaid: 300000,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'GTB-REF-123456',
    isPartialPayment: true,
    remainingBalance: 237500
  })
  
  if (paymentResult.success) {
    results.paymentJournal = paymentResult.journalNumber
    console.log(`   ✅ Journal created: ${paymentResult.journalNumber}`)
    console.log('   DR: 1120 Cash in Bank (GTBank) → ₦300,000')
    console.log('   CR: 1210 Accounts Receivable → ₦300,000\n')
  } else {
    results.success = false
    console.log(`   ❌ Failed: ${paymentResult.error}\n`)
  }

  // 3. Simulate credit note
  console.log('3. Applying credit note CN-2601-DEMO...')
  const creditResult = await emitCreditNoteApplied({
    tenantId,
    creditNoteId: 'cn-demo-001',
    creditNoteNumber: 'CN-2601-DEMO',
    invoiceId: 'inv-demo-001',
    invoiceNumber: 'INV-2601-DEMO',
    creditAmount: 53750, // 10% credit
    vatPortion: 3750,
    netPortion: 50000,
    reason: 'Service adjustment',
    wasVatExempt: false
  })
  
  if (creditResult.success) {
    results.creditNoteJournal = creditResult.journalNumber
    console.log(`   ✅ Journal created: ${creditResult.journalNumber}`)
    console.log('   DR: 4200 Service Revenue → ₦50,000')
    console.log('   DR: 2120 VAT Payable → ₦3,750')
    console.log('   CR: 1210 Accounts Receivable → ₦53,750\n')
  } else {
    results.success = false
    console.log(`   ❌ Failed: ${creditResult.error}\n`)
  }

  console.log('========================================')
  console.log(`DEMO ${results.success ? 'COMPLETED SUCCESSFULLY' : 'FAILED'}`)
  console.log('========================================\n')

  return results
}
