/**
 * PAYMENTS & COLLECTIONS SUITE
 * Payment Methods Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Nigeria-first payment method definitions, availability checking, and fee calculations.
 * This is the SINGLE SOURCE OF TRUTH for payment method logic across POS, SVM, MVM.
 * 
 * @module lib/payments/methods-service
 */

import { prisma } from '@/lib/prisma'
import { PayPaymentMethod } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethodCode = 
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'WALLET'
  | 'POS_TERMINAL'
  | 'USSD'
  | 'PAY_ON_DELIVERY'

export interface PaymentMethodDefinition {
  code: PaymentMethodCode
  prismaValue: PayPaymentMethod
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
  nigeriaFirstPriority: 'P0' | 'P1' | 'P2'
}

export interface PaymentMethodAvailability {
  method: PaymentMethodDefinition
  isAvailable: boolean
  unavailableReason: string | null
}

// ============================================================================
// NIGERIA-FIRST PAYMENT METHOD DEFINITIONS
// ============================================================================

/**
 * Canonical payment method definitions
 * Priority: P0 = Must be first-class, P1 = Strong coverage, P2 = Light/Internal
 */
export const CANONICAL_PAYMENT_METHODS: PaymentMethodDefinition[] = [
  // P0 — Must Be First-Class
  {
    code: 'BANK_TRANSFER',
    prismaValue: 'BANK_TRANSFER',
    name: 'Bank Transfer',
    description: 'Pay via direct bank transfer',
    icon: 'building-2',
    isEnabled: true,
    requiresVerification: true,
    minAmount: 1000, // ₦1,000 minimum
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: 'Transfer to the account below and enter your reference',
    nigeriaFirstPriority: 'P0'
  },
  {
    code: 'CARD',
    prismaValue: 'CARD',
    name: 'Debit/Credit Card',
    description: 'Pay with your bank card (Visa, Mastercard, Verve)',
    icon: 'credit-card',
    isEnabled: true,
    requiresVerification: false,
    minAmount: 100, // ₦100 minimum
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null,
    nigeriaFirstPriority: 'P0'
  },
  {
    code: 'PAY_ON_DELIVERY',
    prismaValue: 'PAY_ON_DELIVERY',
    name: 'Pay on Delivery',
    description: 'Pay cash when your order arrives',
    icon: 'truck',
    isEnabled: true,
    requiresVerification: true,
    minAmount: 1000,
    maxAmount: 500000, // ₦500,000 max
    additionalFee: 500, // ₦500 POD fee
    additionalFeeType: 'FIXED',
    instructions: 'Please have exact change ready for the delivery person',
    nigeriaFirstPriority: 'P0'
  },
  // P1 — Strong Nigeria Coverage
  {
    code: 'USSD',
    prismaValue: 'USSD',
    name: 'USSD Payment',
    description: 'Pay using USSD code (*737#, *919#, etc.)',
    icon: 'hash',
    isEnabled: true,
    requiresVerification: true,
    minAmount: 100,
    maxAmount: 100000,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: 'Dial the USSD code on your phone to complete payment',
    nigeriaFirstPriority: 'P1'
  },
  {
    code: 'MOBILE_MONEY',
    prismaValue: 'MOBILE_MONEY',
    name: 'Mobile Money',
    description: 'Pay with OPay, PalmPay, or Moniepoint',
    icon: 'smartphone',
    isEnabled: true,
    requiresVerification: false,
    minAmount: 100,
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null,
    nigeriaFirstPriority: 'P1'
  },
  {
    code: 'POS_TERMINAL',
    prismaValue: 'POS_TERMINAL',
    name: 'POS Terminal',
    description: 'Pay via POS terminal (external confirmation)',
    icon: 'credit-card',
    isEnabled: true,
    requiresVerification: true,
    minAmount: null,
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: 'Present your card to the POS terminal',
    nigeriaFirstPriority: 'P1'
  },
  {
    code: 'CASH',
    prismaValue: 'CASH',
    name: 'Cash',
    description: 'Pay with cash at point of sale',
    icon: 'banknote',
    isEnabled: true,
    requiresVerification: false,
    minAmount: null,
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null,
    nigeriaFirstPriority: 'P1'
  },
  // P2 — Light / Internal
  {
    code: 'WALLET',
    prismaValue: 'WALLET',
    name: 'Store Wallet',
    description: 'Pay from your store wallet balance',
    icon: 'wallet',
    isEnabled: false, // Disabled by default
    requiresVerification: false,
    minAmount: null,
    maxAmount: null,
    additionalFee: 0,
    additionalFeeType: 'FIXED',
    instructions: null,
    nigeriaFirstPriority: 'P2'
  }
]

// ============================================================================
// PAYMENT METHOD AVAILABILITY SERVICE
// ============================================================================

export class PaymentMethodAvailabilityService {
  /**
   * Get all payment methods for a tenant with their configuration
   */
  static async getPaymentMethods(tenantId: string): Promise<PaymentMethodDefinition[]> {
    const config = await this.getTenantPaymentConfig(tenantId)
    
    return CANONICAL_PAYMENT_METHODS.map(method => {
      // Apply tenant-specific overrides
      const isEnabled = this.isMethodEnabledForTenant(method.code, config)
      return { ...method, isEnabled }
    })
  }

  /**
   * Get a specific payment method
   */
  static async getPaymentMethod(
    tenantId: string,
    code: PaymentMethodCode
  ): Promise<PaymentMethodDefinition | null> {
    const methods = await this.getPaymentMethods(tenantId)
    return methods.find((m: any) => m.code === code) || null
  }

  /**
   * Check if a payment method is available for a specific transaction
   */
  static async checkAvailability(
    tenantId: string,
    code: PaymentMethodCode,
    amount: number,
    context?: {
      state?: string
      customerId?: string
      walletBalance?: number
    }
  ): Promise<PaymentMethodAvailability> {
    const method = await this.getPaymentMethod(tenantId, code)

    if (!method) {
      return {
        method: CANONICAL_PAYMENT_METHODS.find((m: any) => m.code === code)!,
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
        unavailableReason: `Minimum amount for ${method.name} is ₦${method.minAmount.toLocaleString()}`
      }
    }

    // Check maximum amount
    if (method.maxAmount !== null && amount > method.maxAmount) {
      return {
        method,
        isAvailable: false,
        unavailableReason: `Maximum amount for ${method.name} is ₦${method.maxAmount.toLocaleString()}`
      }
    }

    // PAY_ON_DELIVERY specific checks
    if (code === 'PAY_ON_DELIVERY' && context?.state) {
      const podCheck = await PODService.checkAvailability(tenantId, amount, context.state)
      if (!podCheck.available) {
        return {
          method,
          isAvailable: false,
          unavailableReason: podCheck.reason || 'POD not available'
        }
      }
    }

    // WALLET specific checks
    if (code === 'WALLET' && context?.walletBalance !== undefined) {
      if (context.walletBalance < amount) {
        return {
          method,
          isAvailable: false,
          unavailableReason: 'Insufficient wallet balance'
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
   * Get all available payment methods for a transaction
   */
  static async getAvailableMethods(
    tenantId: string,
    amount: number,
    context?: {
      state?: string
      customerId?: string
      walletBalance?: number
    }
  ): Promise<PaymentMethodAvailability[]> {
    const methods = await this.getPaymentMethods(tenantId)
    const results: PaymentMethodAvailability[] = []

    for (const method of methods) {
      const availability = await this.checkAvailability(
        tenantId,
        method.code,
        amount,
        context
      )
      results.push(availability)
    }

    // Sort by Nigeria-first priority
    const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
    results.sort((a: any, b: any) => 
      priorityOrder[a.method.nigeriaFirstPriority as string] - priorityOrder[b.method.nigeriaFirstPriority as string]
    )

    return results
  }

  /**
   * Calculate payment total with method-specific fee
   */
  static async calculateTotalWithFee(
    tenantId: string,
    code: PaymentMethodCode,
    subtotal: number,
    shippingTotal: number = 0,
    taxTotal: number = 0,
    discountTotal: number = 0
  ): Promise<{
    subtotal: number
    shippingTotal: number
    taxTotal: number
    discountTotal: number
    paymentFee: number
    grandTotal: number
  }> {
    const method = await this.getPaymentMethod(tenantId, code)
    let paymentFee = 0

    if (method) {
      if (method.additionalFeeType === 'FIXED') {
        paymentFee = method.additionalFee
      } else {
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

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static async getTenantPaymentConfig(tenantId: string) {
    try {
      return await prisma.pay_configurations.findUnique({
        where: { tenantId }
      })
    } catch {
      return null
    }
  }

  private static isMethodEnabledForTenant(
    code: PaymentMethodCode,
    config: Awaited<ReturnType<typeof this.getTenantPaymentConfig>>
  ): boolean {
    if (!config) return CANONICAL_PAYMENT_METHODS.find((m: any) => m.code === code)?.isEnabled ?? false

    switch (code) {
      case 'CASH': return config.cashEnabled
      case 'CARD': return config.cardEnabled
      case 'BANK_TRANSFER': return config.bankTransferEnabled
      case 'MOBILE_MONEY': return config.mobileMoneyEnabled
      case 'USSD': return config.ussdEnabled ?? false
      case 'PAY_ON_DELIVERY': return config.podEnabled ?? true
      case 'WALLET': return config.walletsEnabled
      case 'POS_TERMINAL': return config.offlineCashEnabled // Uses same flag as offline
      default: return false
    }
  }
}

// ============================================================================
// PAY ON DELIVERY SERVICE
// ============================================================================

export interface PODConfig {
  isEnabled: boolean
  maxAmount: number
  additionalFee: number
  requiresPhoneVerification: boolean
  allowedStates: string[]
  excludedStates: string[]
}

export const DEFAULT_POD_CONFIG: PODConfig = {
  isEnabled: true,
  maxAmount: 500000, // ₦500,000
  additionalFee: 500, // ₦500
  requiresPhoneVerification: true,
  allowedStates: [], // Empty = all states allowed
  excludedStates: ['Borno', 'Yobe', 'Adamawa'] // Security-affected areas
}

export class PODService {
  /**
   * Get POD configuration for a tenant
   */
  static async getConfig(tenantId: string): Promise<PODConfig> {
    try {
      const config = await prisma.pay_configurations.findUnique({
        where: { tenantId },
        select: {
          podEnabled: true,
          podMaxAmount: true,
          podFee: true,
          podExcludedStates: true
        }
      })

      if (config) {
        const excludedStates = config.podExcludedStates as string[] ?? DEFAULT_POD_CONFIG.excludedStates
        
        return {
          isEnabled: config.podEnabled ?? true,
          maxAmount: config.podMaxAmount?.toNumber() ?? DEFAULT_POD_CONFIG.maxAmount,
          additionalFee: config.podFee?.toNumber() ?? DEFAULT_POD_CONFIG.additionalFee,
          requiresPhoneVerification: DEFAULT_POD_CONFIG.requiresPhoneVerification,
          allowedStates: [], // Not configurable yet
          excludedStates
        }
      }
    } catch (error) {
      console.error('[PODService] Error fetching config:', error)
    }

    return DEFAULT_POD_CONFIG
  }

  /**
   * Check if POD is available for a specific order
   */
  static async checkAvailability(
    tenantId: string,
    amount: number,
    state: string
  ): Promise<{ available: boolean; reason?: string }> {
    const config = await this.getConfig(tenantId)

    if (!config.isEnabled) {
      return { available: false, reason: 'Pay on Delivery is not enabled' }
    }

    if (amount > config.maxAmount) {
      return {
        available: false,
        reason: `Pay on Delivery is limited to orders under ₦${config.maxAmount.toLocaleString()}`
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
  static async calculateFee(tenantId: string): Promise<number> {
    const config = await this.getConfig(tenantId)
    return config.additionalFee
  }

  /**
   * Get risk assessment for POD order
   */
  static async getRiskAssessment(
    tenantId: string,
    amount: number,
    state: string,
    customerId?: string
  ): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    flags: string[]
    recommendation: 'APPROVE' | 'REVIEW' | 'REJECT'
  }> {
    const flags: string[] = []
    let riskScore = 0

    // Amount-based risk
    if (amount > 200000) {
      flags.push('HIGH_VALUE_ORDER')
      riskScore += 2
    } else if (amount > 100000) {
      flags.push('ELEVATED_VALUE_ORDER')
      riskScore += 1
    }

    // State-based risk (near security-affected areas)
    const borderStates = ['Taraba', 'Gombe', 'Bauchi']
    if (borderStates.includes(state)) {
      flags.push('BORDER_STATE')
      riskScore += 1
    }

    // First-time customer
    if (!customerId) {
      flags.push('GUEST_CHECKOUT')
      riskScore += 1
    }

    // Determine risk level and recommendation
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    let recommendation: 'APPROVE' | 'REVIEW' | 'REJECT'

    if (riskScore >= 4) {
      riskLevel = 'HIGH'
      recommendation = 'REJECT'
    } else if (riskScore >= 2) {
      riskLevel = 'MEDIUM'
      recommendation = 'REVIEW'
    } else {
      riskLevel = 'LOW'
      recommendation = 'APPROVE'
    }

    return { riskLevel, flags, recommendation }
  }
}
