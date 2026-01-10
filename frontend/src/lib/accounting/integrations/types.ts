/**
 * Billing Integration Event Types
 * 
 * Domain event definitions for the Billing → Accounting integration.
 * These events are emitted by Billing and consumed by Accounting.
 * 
 * @module lib/accounting/integrations/types
 * @phase Phase 2 Track B (S2)
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export type BillingEventType = 
  | 'INVOICE_ISSUED'
  | 'PAYMENT_RECORDED'
  | 'CREDIT_NOTE_APPLIED'

// ============================================================================
// BASE EVENT
// ============================================================================

export interface BillingEventBase {
  /** Event type discriminator */
  eventType: BillingEventType
  
  /** UUID for idempotency (REQUIRED) */
  eventId: string
  
  /** Event timestamp */
  timestamp: Date
  
  /** Tenant isolation (REQUIRED) */
  tenantId: string
  
  /** Currency (only NGN supported) */
  currency: 'NGN'
}

// ============================================================================
// INVOICE_ISSUED EVENT
// ============================================================================

export interface InvoiceIssuedEvent extends BillingEventBase {
  eventType: 'INVOICE_ISSUED'
  
  /** Invoice identifiers */
  invoiceId: string
  invoiceNumber: string
  
  /** Customer information */
  customerId: string
  customerName: string
  
  /** Financial amounts (in kobo/minor units for precision) */
  subtotal: number      // Before VAT
  vatAmount: number     // 7.5% VAT (or 0 if exempt)
  grandTotal: number    // subtotal + vatAmount
  
  /** VAT handling */
  vatExempt: boolean    // true if NGO, Education, etc.
  vatInclusive: boolean // true if amounts include VAT
  vatExemptionReason?: string
}

// ============================================================================
// PAYMENT_RECORDED EVENT
// ============================================================================

export type PaymentMethod = 
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'USSD'

export interface PaymentRecordedEvent extends BillingEventBase {
  eventType: 'PAYMENT_RECORDED'
  
  /** Invoice reference */
  invoiceId: string
  invoiceNumber: string
  
  /** Payment details */
  paymentId: string
  amountPaid: number
  paymentMethod: PaymentMethod
  paymentReference?: string  // Bank reference, receipt number, etc.
  
  /** Partial payment tracking */
  isPartialPayment: boolean
  remainingBalance: number
  
  /** For bank transfers: specific bank (for multi-bank support in future) */
  bankCode?: string
}

// ============================================================================
// CREDIT_NOTE_APPLIED EVENT
// ============================================================================

export interface CreditNoteAppliedEvent extends BillingEventBase {
  eventType: 'CREDIT_NOTE_APPLIED'
  
  /** Credit note identifiers */
  creditNoteId: string
  creditNoteNumber: string
  
  /** Invoice being credited */
  invoiceId: string
  invoiceNumber: string
  
  /** Credit amounts */
  creditAmount: number  // Total credit amount
  vatPortion: number    // VAT portion of credit (for reversal)
  netPortion: number    // Net portion (creditAmount - vatPortion)
  
  /** Reason for credit */
  reason: string
  
  /** Whether the credited invoice was VAT exempt */
  wasVatExempt: boolean
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type BillingEvent = 
  | InvoiceIssuedEvent
  | PaymentRecordedEvent
  | CreditNoteAppliedEvent

// ============================================================================
// JOURNAL ENTRY TYPES
// ============================================================================

export interface JournalLine {
  lineNumber: number
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description: string
}

export interface JournalEntry {
  journalNumber: string
  date: Date
  description: string
  
  /** Source tracking for audit */
  sourceType: 'BILLING_INTEGRATION'
  sourceEventType: BillingEventType
  sourceEventId: string          // UUID for idempotency
  sourceReference: string        // Invoice/credit note number
  
  /** Tenant isolation */
  tenantId: string
  
  /** Journal status */
  status: 'DRAFT' | 'POSTED' | 'VOID'
  
  /** Journal lines (must balance) */
  lines: JournalLine[]
  
  /** Totals (must be equal) */
  totalDebit: number
  totalCredit: number
  
  /** Metadata */
  createdAt: Date
  createdBy: string
}

// ============================================================================
// ACCOUNT CODE MAPPINGS
// ============================================================================

export const ACCOUNT_CODES = {
  // Assets (1xxx)
  CASH_ON_HAND: '1110',
  CASH_IN_BANK_GTBANK: '1120',
  CASH_IN_BANK_ACCESS: '1121',
  CASH_IN_BANK_ZENITH: '1122',
  MOBILE_MONEY_OPAY: '1130',
  MOBILE_MONEY_PALMPAY: '1131',
  MOBILE_MONEY_MONIEPOINT: '1132',
  POS_TERMINAL_FLOAT: '1140',
  ACCOUNTS_RECEIVABLE: '1210',
  
  // Liabilities (2xxx)
  VAT_PAYABLE: '2120',
  
  // Revenue (4xxx)
  POS_SALES: '4110',
  ONLINE_SALES: '4120',
  MARKETPLACE_SALES: '4130',
  SERVICE_REVENUE: '4200'
} as const

export const ACCOUNT_NAMES: Record<string, string> = {
  '1110': 'Cash on Hand',
  '1120': 'Cash in Bank (GTBank)',
  '1121': 'Cash in Bank (Access)',
  '1122': 'Cash in Bank (Zenith)',
  '1130': 'Mobile Money (OPay)',
  '1131': 'Mobile Money (PalmPay)',
  '1132': 'Mobile Money (Moniepoint)',
  '1140': 'POS Terminal Float',
  '1210': 'Accounts Receivable',
  '2120': 'VAT Payable (7.5%)',
  '4110': 'POS Sales',
  '4120': 'Online Sales',
  '4130': 'Marketplace Sales',
  '4200': 'Service Revenue'
}

// ============================================================================
// PAYMENT METHOD → ACCOUNT MAPPING
// ============================================================================

export function getPaymentAccountCode(method: PaymentMethod): string {
  switch (method) {
    case 'CASH':
      return ACCOUNT_CODES.CASH_ON_HAND
    case 'BANK_TRANSFER':
      return ACCOUNT_CODES.CASH_IN_BANK_GTBANK
    case 'CARD':
      return ACCOUNT_CODES.POS_TERMINAL_FLOAT
    case 'MOBILE_MONEY':
      return ACCOUNT_CODES.MOBILE_MONEY_OPAY
    case 'USSD':
      return ACCOUNT_CODES.CASH_IN_BANK_GTBANK
    default:
      return ACCOUNT_CODES.CASH_IN_BANK_GTBANK
  }
}

// ============================================================================
// ADAPTER RESULT TYPE
// ============================================================================

export interface AdapterResult {
  success: boolean
  journalId?: string
  journalNumber?: string
  alreadyProcessed?: boolean
  error?: string
}
