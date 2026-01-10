/**
 * SVM Payment Logic Service
 * 
 * Nigeria-first payment method management and validation.
 * Handles Pay-on-Delivery (POD), bank transfer, and payment method rules.
 * 
 * NOTE: This service handles LOGIC ONLY, not actual payment processing.
 * Payment gateway integration is handled by the Payments & Collections Suite.
 * 
 * @module lib/svm/payment-service
 */

import { prisma } from '../prisma'
import { formatNGN } from '../currency'

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethodCode = 
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'POD'  // Pay on Delivery
  | 'USSD'
  | 'MOBILE_MONEY'
  | 'WALLET'

export interface PaymentMethod {
  code: PaymentMethodCode
  name: string
  description: string
  icon: string
  isEnabled: boolean
  requiresVerification: boolean
  minAmount: number | null
  maxAmount: number | null
  additionalFee: number
  additionalFeeType: 'FIXED' | 'PERCENTAGE'
  instructions: string | null
}

export interface PaymentMethodAvailability {
  method: PaymentMethod
  isAvailable: boolean
  unavailableReason: string | null
}

export interface BankTransferDetails {
  bankName: string
  accountNumber: string
  accountName: string
  reference: string
  amount: number
  amountFormatted: string
  expiresAt: Date
  instructions: string
}

export interface PODConfig {
  isEnabled: boolean
  maxAmount: number
  additionalFee: number
  requiresPhoneVerification: boolean
  allowedStates: string[]
  excludedStates: string[]
}

// ============================================================================
// DEFAULT PAYMENT METHODS (Nigeria-First)
// ============================================================================

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    code: 'CARD',
    name: 'Debit/Credit Card',
    description: 'Pay with your bank card (Visa, Mastercard, Verve)',
    icon: 'credit-card',
    isEnabled: true,
    requiresVerification: false,
    minAmount: 100, // ₦100 minimum
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null
  },
  {
    code: 'BANK_TRANSFER',
    name: 'Bank Transfer',
    description: 'Pay via direct bank transfer',
    icon: 'building-2',
    isEnabled: true,
    requiresVerification: true,
    minAmount: 1000, // ₦1,000 minimum
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: 'Transfer to the account below and enter your reference'
  },
  {
    code: 'POD',
    name: 'Pay on Delivery',
    description: 'Pay cash when your order arrives',
    icon: 'truck',
    isEnabled: true,
    requiresVerification: true,
    minAmount: 1000,
    maxAmount: 500000, // ₦500,000 max for POD
    additionalFee: 500, // ₦500 POD fee
    additionalFeeType: 'FIXED',
    instructions: 'Please have exact change ready for the delivery person'
  },
  {
    code: 'USSD',
    name: 'USSD Payment',
    description: 'Pay using USSD code (*737#, *919#, etc.)',
    icon: 'hash',
    isEnabled: true,
    requiresVerification: true,
    minAmount: 100,
    maxAmount: 100000,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: 'Dial the USSD code on your phone to complete payment'
  },
  {
    code: 'MOBILE_MONEY',
    name: 'Mobile Money',
    description: 'Pay with OPay, PalmPay, or other mobile wallets',
    icon: 'smartphone',
    isEnabled: true,
    requiresVerification: false,
    minAmount: 100,
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null
  },
  {
    code: 'WALLET',
    name: 'Store Wallet',
    description: 'Pay from your store wallet balance',
    icon: 'wallet',
    isEnabled: false, // Disabled by default
    requiresVerification: false,
    minAmount: null,
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null
  }
]

// Default POD configuration
export const DEFAULT_POD_CONFIG: PODConfig = {
  isEnabled: true,
  maxAmount: 500000, // ₦500,000
  additionalFee: 500, // ₦500
  requiresPhoneVerification: true,
  allowedStates: [], // Empty = all states allowed
  excludedStates: ['Borno', 'Yobe', 'Adamawa'] // Security-affected areas
}

// ============================================================================
// PAYMENT METHOD MANAGEMENT
// ============================================================================

/**
 * Get available payment methods for a tenant
 */
export async function getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
  // In production, this would fetch from tenant settings
  // For now, return defaults with tenant-specific overrides if any
  try {
    const entitlement = await prisma.entitlement.findFirst({
      where: { tenantId, module: 'SVM', status: 'ACTIVE' },
      select: { limits: true }
    })
    
    const limits = entitlement?.limits as Record<string, unknown> | null
    const methodOverrides = limits?.payment_methods as Partial<PaymentMethod>[] | undefined
    
    if (methodOverrides && Array.isArray(methodOverrides)) {
      // Merge overrides with defaults
      return DEFAULT_PAYMENT_METHODS.map(defaultMethod => {
        const override = methodOverrides.find((m: any) => m.code === defaultMethod.code)
        return override ? { ...defaultMethod, ...override } : defaultMethod
      })
    }
  } catch (error) {
    console.error('[SVM Payment] Error fetching payment methods:', error)
  }
  
  return DEFAULT_PAYMENT_METHODS
}

/**
 * Get a specific payment method
 */
export async function getPaymentMethod(
  tenantId: string, 
  code: PaymentMethodCode
): Promise<PaymentMethod | null> {
  const methods = await getPaymentMethods(tenantId)
  return methods.find((m: any) => m.code === code) || null
}

/**
 * Check if a payment method is available for an order
 */
export async function checkPaymentMethodAvailability(
  tenantId: string,
  code: PaymentMethodCode,
  amount: number,
  state?: string
): Promise<PaymentMethodAvailability> {
  const method = await getPaymentMethod(tenantId, code)
  
  if (!method) {
    return {
      method: DEFAULT_PAYMENT_METHODS.find((m: any) => m.code === code)!,
      isAvailable: false,
      unavailableReason: 'Payment method not found'
    }
  }
  
  // Check if enabled
  if (!method.isEnabled) {
    return {
      method,
      isAvailable: false,
      unavailableReason: 'This payment method is currently disabled'
    }
  }
  
  // Check minimum amount
  if (method.minAmount !== null && amount < method.minAmount) {
    return {
      method,
      isAvailable: false,
      unavailableReason: `Minimum order amount for ${method.name} is ${formatNGN(method.minAmount)}`
    }
  }
  
  // Check maximum amount
  if (method.maxAmount !== null && amount > method.maxAmount) {
    return {
      method,
      isAvailable: false,
      unavailableReason: `Maximum order amount for ${method.name} is ${formatNGN(method.maxAmount)}`
    }
  }
  
  // POD-specific checks
  if (code === 'POD' && state) {
    const podConfig = await getPODConfig(tenantId)
    if (podConfig.excludedStates.includes(state)) {
      return {
        method,
        isAvailable: false,
        unavailableReason: `Pay on Delivery is not available for delivery to ${state}`
      }
    }
    if (podConfig.allowedStates.length > 0 && !podConfig.allowedStates.includes(state)) {
      return {
        method,
        isAvailable: false,
        unavailableReason: `Pay on Delivery is only available in select states`
      }
    }
  }
  
  return {
    method,
    isAvailable: true,
    unavailableReason: null
  }
}

/**
 * Get all available payment methods for an order
 */
export async function getAvailablePaymentMethods(
  tenantId: string,
  amount: number,
  state?: string
): Promise<PaymentMethodAvailability[]> {
  const methods = await getPaymentMethods(tenantId)
  const results: PaymentMethodAvailability[] = []
  
  for (const method of methods) {
    const availability = await checkPaymentMethodAvailability(
      tenantId, 
      method.code, 
      amount, 
      state
    )
    results.push(availability)
  }
  
  return results
}

// ============================================================================
// PAY ON DELIVERY (POD)
// ============================================================================

/**
 * Get POD configuration for a tenant
 */
export async function getPODConfig(tenantId: string): Promise<PODConfig> {
  try {
    const entitlement = await prisma.entitlement.findFirst({
      where: { tenantId, module: 'SVM', status: 'ACTIVE' },
      select: { limits: true }
    })
    
    const limits = entitlement?.limits as Record<string, unknown> | null
    const podConfig = limits?.pod_config as Partial<PODConfig> | undefined
    
    if (podConfig) {
      return { ...DEFAULT_POD_CONFIG, ...podConfig }
    }
  } catch (error) {
    console.error('[SVM Payment] Error fetching POD config:', error)
  }
  
  return DEFAULT_POD_CONFIG
}

/**
 * Check if POD is available for an order
 */
export async function isPODAvailable(
  tenantId: string,
  amount: number,
  state: string
): Promise<{ available: boolean; reason?: string }> {
  const config = await getPODConfig(tenantId)
  
  if (!config.isEnabled) {
    return { available: false, reason: 'Pay on Delivery is not enabled' }
  }
  
  if (amount > config.maxAmount) {
    return { 
      available: false, 
      reason: `Pay on Delivery is limited to orders under ${formatNGN(config.maxAmount)}` 
    }
  }
  
  if (config.excludedStates.includes(state)) {
    return { 
      available: false, 
      reason: `Pay on Delivery is not available for delivery to ${state}` 
    }
  }
  
  if (config.allowedStates.length > 0 && !config.allowedStates.includes(state)) {
    return { 
      available: false, 
      reason: 'Pay on Delivery is only available in select states' 
    }
  }
  
  return { available: true }
}

/**
 * Calculate POD fee
 */
export async function calculatePODFee(tenantId: string, amount: number): Promise<number> {
  const config = await getPODConfig(tenantId)
  return config.additionalFee
}

// ============================================================================
// BANK TRANSFER
// ============================================================================

/**
 * Generate bank transfer reference
 */
export function generateTransferReference(orderId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `WW-${timestamp}-${random}`
}

/**
 * Create bank transfer details for an order
 * In production, this would integrate with the payment gateway to generate
 * a unique virtual account or bank details.
 */
export async function createBankTransferDetails(
  tenantId: string,
  orderId: string,
  amount: number
): Promise<BankTransferDetails> {
  const reference = generateTransferReference(orderId)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  // In production, this would call the payment gateway API
  // For now, return placeholder details
  return {
    bankName: 'GTBank',
    accountNumber: '0123456789',
    accountName: 'WebWaka Payments',
    reference,
    amount,
    amountFormatted: formatNGN(amount),
    expiresAt,
    instructions: `Transfer exactly ${formatNGN(amount)} to the account above. Use reference: ${reference}`
  }
}

/**
 * Validate bank transfer reference format
 */
export function isValidTransferReference(reference: string): boolean {
  return /^WW-[A-Z0-9]+-[A-Z0-9]+$/.test(reference)
}

// ============================================================================
// PAYMENT CALCULATION
// ============================================================================

/**
 * Calculate total with payment method fee
 */
export async function calculatePaymentTotal(
  tenantId: string,
  subtotal: number,
  shippingTotal: number,
  taxTotal: number,
  discountTotal: number,
  paymentMethod: PaymentMethodCode
): Promise<{
  subtotal: number
  shippingTotal: number
  taxTotal: number
  discountTotal: number
  paymentFee: number
  grandTotal: number
}> {
  const method = await getPaymentMethod(tenantId, paymentMethod)
  let paymentFee = 0
  
  if (method) {
    if (method.additionalFeeType === 'FIXED') {
      paymentFee = method.additionalFee
    } else {
      // Percentage of subtotal
      paymentFee = Math.round((subtotal * method.additionalFee) / 100)
    }
  }
  
  const grandTotal = subtotal + shippingTotal + taxTotal - discountTotal + paymentFee
  
  return {
    subtotal,
    shippingTotal,
    taxTotal,
    discountTotal,
    paymentFee,
    grandTotal
  }
}

// ============================================================================
// PAYMENT STATUS
// ============================================================================

export type PaymentStatus = 
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

/**
 * Get display text for payment status
 */
export function getPaymentStatusDisplay(status: PaymentStatus): {
  text: string
  color: string
  description: string
} {
  const statusMap: Record<PaymentStatus, { text: string; color: string; description: string }> = {
    PENDING: {
      text: 'Pending',
      color: 'gray',
      description: 'Payment not yet initiated'
    },
    AWAITING_PAYMENT: {
      text: 'Awaiting Payment',
      color: 'yellow',
      description: 'Waiting for customer to complete payment'
    },
    PROCESSING: {
      text: 'Processing',
      color: 'blue',
      description: 'Payment is being verified'
    },
    PAID: {
      text: 'Paid',
      color: 'green',
      description: 'Payment completed successfully'
    },
    FAILED: {
      text: 'Failed',
      color: 'red',
      description: 'Payment could not be processed'
    },
    REFUNDED: {
      text: 'Refunded',
      color: 'purple',
      description: 'Payment has been fully refunded'
    },
    PARTIALLY_REFUNDED: {
      text: 'Partially Refunded',
      color: 'orange',
      description: 'Part of the payment has been refunded'
    }
  }
  
  return statusMap[status] || statusMap.PENDING
}
