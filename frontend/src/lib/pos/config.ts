/**
 * POS Configuration Service
 * 
 * Centralized configuration for POS module.
 * Nigeria-first: NGN currency, Nigerian tax rates, local payment methods.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const POS_CONFIG = {
  // Currency
  currency: 'NGN',
  currencySymbol: '₦',
  currencyLocale: 'en-NG',
  
  // Number formatting
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  
  // Default tax rate (Nigeria VAT)
  defaultTaxRate: 0.075, // 7.5%
  
  // Receipt numbering
  receiptPrefix: 'RCP',
  salePrefix: 'SALE',
  shiftPrefix: 'SHIFT',
  
  // Shift settings
  defaultOpeningFloat: 10000, // ₦10,000 default float
  maxCashVarianceWarning: 500, // ₦500 variance triggers warning
  maxCashVarianceBlock: 5000, // ₦5,000 variance requires approval
  
  // Offline settings
  maxOfflineTransactions: 100,
  syncRetryInterval: 30000, // 30 seconds
} as const

// =============================================================================
// TYPES
// =============================================================================

export type POSPaymentMethod = 
  | 'CASH' 
  | 'CARD' 
  | 'BANK_TRANSFER' 
  | 'MOBILE_MONEY' 
  | 'POS_TERMINAL'
  | 'WALLET'
  | 'SPLIT'

export type POSShiftStatus = 'OPEN' | 'CLOSED' | 'RECONCILED' | 'VOID'

export type POSSaleStatus = 'COMPLETED' | 'VOIDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

export type POSCashMovementType = 
  | 'OPEN_FLOAT' 
  | 'SALE' 
  | 'REFUND' 
  | 'PAYOUT' 
  | 'PAY_IN' 
  | 'DROP' 
  | 'ADJUSTMENT'

// =============================================================================
// PAYMENT METHOD LABELS (Nigeria-First)
// =============================================================================

export const PAYMENT_METHOD_LABELS: Record<POSPaymentMethod, { name: string; description: string }> = {
  CASH: { 
    name: 'Cash', 
    description: 'Physical naira notes and coins' 
  },
  CARD: { 
    name: 'Card', 
    description: 'Debit/Credit card via POS terminal' 
  },
  BANK_TRANSFER: { 
    name: 'Bank Transfer', 
    description: 'Direct bank transfer (instant verification)' 
  },
  MOBILE_MONEY: { 
    name: 'Mobile Money', 
    description: 'OPay, PalmPay, Paga, etc.' 
  },
  POS_TERMINAL: { 
    name: 'POS Terminal', 
    description: 'Card swipe on physical terminal' 
  },
  WALLET: { 
    name: 'Store Credit', 
    description: 'Customer wallet balance' 
  },
  SPLIT: { 
    name: 'Split Payment', 
    description: 'Multiple payment methods' 
  },
}

// =============================================================================
// TAX CATEGORIES (Nigeria)
// =============================================================================

export const TAX_CATEGORIES = {
  STANDARD: { rate: 0.075, name: 'Standard VAT', description: 'Standard 7.5% VAT' },
  ZERO_RATED: { rate: 0, name: 'Zero Rated', description: 'Zero-rated goods (exports, basic food)' },
  EXEMPT: { rate: 0, name: 'VAT Exempt', description: 'Exempt goods (medical, educational)' },
} as const

// =============================================================================
// SHIFT STATUS LABELS
// =============================================================================

export const SHIFT_STATUS_LABELS: Record<POSShiftStatus, { name: string; color: string; description: string }> = {
  OPEN: { 
    name: 'Open', 
    color: 'green',
    description: 'Shift is active, accepting sales' 
  },
  CLOSED: { 
    name: 'Closed', 
    color: 'yellow',
    description: 'Shift ended, awaiting reconciliation' 
  },
  RECONCILED: { 
    name: 'Reconciled', 
    color: 'blue',
    description: 'Cash counted and verified' 
  },
  VOID: { 
    name: 'Void', 
    color: 'red',
    description: 'Shift cancelled or invalid' 
  },
}

// =============================================================================
// SALE STATUS LABELS
// =============================================================================

export const SALE_STATUS_LABELS: Record<POSSaleStatus, { name: string; color: string }> = {
  COMPLETED: { name: 'Completed', color: 'green' },
  VOIDED: { name: 'Voided', color: 'red' },
  REFUNDED: { name: 'Refunded', color: 'orange' },
  PARTIALLY_REFUNDED: { name: 'Partial Refund', color: 'yellow' },
}

// =============================================================================
// CASH MOVEMENT TYPE LABELS
// =============================================================================

export const CASH_MOVEMENT_LABELS: Record<POSCashMovementType, { name: string; direction: 'IN' | 'OUT'; description: string }> = {
  OPEN_FLOAT: { name: 'Opening Float', direction: 'IN', description: 'Starting cash for shift' },
  SALE: { name: 'Sale', direction: 'IN', description: 'Cash received from sale' },
  REFUND: { name: 'Refund', direction: 'OUT', description: 'Cash given for refund' },
  PAYOUT: { name: 'Paid Out', direction: 'OUT', description: 'Cash removed from drawer' },
  PAY_IN: { name: 'Paid In', direction: 'IN', description: 'Cash added to drawer' },
  DROP: { name: 'Safe Drop', direction: 'OUT', description: 'Excess cash to safe' },
  ADJUSTMENT: { name: 'Adjustment', direction: 'IN', description: 'Count correction' },
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format amount in NGN
 */
export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount with ₦ symbol (shorter format)
 */
export function formatNGNShort(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Generate sale number: SALE-YYYYMMDD-XXXXX
 */
export function generateSaleNumber(sequence: number): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(sequence).padStart(5, '0')
  return `${POS_CONFIG.salePrefix}-${dateStr}-${seq}`
}

/**
 * Generate receipt number: RCP-YYYYMMDD-XXXXX
 */
export function generateReceiptNumber(sequence: number): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(sequence).padStart(5, '0')
  return `${POS_CONFIG.receiptPrefix}-${dateStr}-${seq}`
}

/**
 * Generate shift number: SHIFT-YYYYMMDD-XXX
 */
export function generateShiftNumber(sequence: number): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(sequence).padStart(3, '0')
  return `${POS_CONFIG.shiftPrefix}-${dateStr}-${seq}`
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number = POS_CONFIG.defaultTaxRate): number {
  return Math.round(subtotal * taxRate * 100) / 100
}

/**
 * Calculate change due
 */
export function calculateChange(amountDue: number, amountTendered: number): number {
  return Math.max(0, Math.round((amountTendered - amountDue) * 100) / 100)
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface POSShift {
  id: string
  tenantId: string
  platformInstanceId?: string
  locationId: string
  registerId?: string
  shiftNumber: string
  openedById: string
  openedByName: string
  closedById?: string
  closedByName?: string
  openedAt: Date
  closedAt?: Date
  status: POSShiftStatus
  openingFloat: number
  expectedCash?: number
  actualCash?: number
  cashVariance?: number
  currency: string
  totalSales: number
  totalRefunds: number
  netSales: number
  transactionCount: number
  refundCount: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
  mobileMoneyTotal: number
  walletTotal: number
  otherTotal: number
  notes?: string
  varianceReason?: string
}

export interface POSSale {
  id: string
  tenantId: string
  platformInstanceId?: string
  locationId: string
  shiftId?: string
  saleNumber: string
  receiptNumber?: string
  staffId: string
  staffName: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  saleDate: Date
  completedAt?: Date
  status: POSSaleStatus
  voidedById?: string
  voidedByName?: string
  voidedAt?: Date
  voidReason?: string
  subtotal: number
  discountTotal: number
  discountReason?: string
  taxTotal: number
  taxRate?: number
  grandTotal: number
  currency: string
  paymentMethod: POSPaymentMethod
  amountTendered?: number
  changeGiven?: number
  transferReference?: string
  transferBank?: string
  splitPayments?: SplitPayment[]
  offlineId?: string
  syncedAt?: Date
  notes?: string
  items: POSSaleItem[]
}

export interface POSSaleItem {
  id: string
  saleId: string
  productId: string
  variantId?: string
  productName: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
  discountReason?: string
  tax: number
  lineTotal: number
  unitCost?: number
  returnedQuantity: number
  refundedAmount: number
  notes?: string
}

export interface SplitPayment {
  method: POSPaymentMethod
  amount: number
  reference?: string
}

export interface POSCashMovement {
  id: string
  tenantId: string
  shiftId: string
  movementType: POSCashMovementType
  amount: number
  direction: 'IN' | 'OUT'
  referenceType?: string
  referenceId?: string
  referenceNumber?: string
  balanceBefore?: number
  balanceAfter?: number
  currency: string
  performedById: string
  performedByName: string
  approvedById?: string
  approvedByName?: string
  reason?: string
  notes?: string
  performedAt: Date
}

export interface ZReport {
  shiftId: string
  shiftNumber: string
  locationId: string
  locationName: string
  openedAt: Date
  closedAt: Date
  openedBy: string
  closedBy: string
  
  // Sales summary
  grossSales: number
  totalRefunds: number
  netSales: number
  transactionCount: number
  refundCount: number
  averageTransaction: number
  
  // Payment breakdown
  paymentBreakdown: {
    method: POSPaymentMethod
    count: number
    total: number
  }[]
  
  // Cash reconciliation
  openingFloat: number
  cashSales: number
  cashRefunds: number
  paidOut: number
  paidIn: number
  safeDrops: number
  expectedCash: number
  actualCash: number
  variance: number
  varianceReason?: string
  
  // Tax summary
  taxCollected: number
  
  // Staff breakdown
  staffSummary: {
    staffId: string
    staffName: string
    salesCount: number
    salesTotal: number
  }[]
  
  currency: string
  generatedAt: Date
}

export interface DailySummary {
  date: string
  locationId: string
  locationName: string
  
  // Shifts
  shiftsOpened: number
  shiftsClosed: number
  shiftsReconciled: number
  
  // Sales
  grossSales: number
  totalRefunds: number
  netSales: number
  transactionCount: number
  averageTransaction: number
  
  // Payment breakdown
  paymentBreakdown: {
    method: POSPaymentMethod
    count: number
    total: number
  }[]
  
  // Cash
  totalCashVariance: number
  
  currency: string
  generatedAt: Date
}
