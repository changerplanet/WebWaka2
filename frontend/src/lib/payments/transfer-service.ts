/**
 * PAYMENTS & COLLECTIONS SUITE
 * Bank Transfer Service
 * 
 * CANONICAL SERVICE - S3
 * 
 * Handles bank transfer payment flow:
 * - Reference generation
 * - Transfer details creation
 * - Validation and verification
 * - Partial payment support
 * 
 * @module lib/payments/transfer-service
 */

import { prisma } from '@/lib/prisma'
import { PayPaymentStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface BankTransferDetails {
  bankName: string
  accountNumber: string
  accountName: string
  reference: string
  amount: number
  amountFormatted: string
  currency: string
  expiresAt: Date
  instructions: string
  status: 'PENDING' | 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'EXPIRED'
}

export interface TransferValidationResult {
  isValid: boolean
  reason?: string
  matchedAmount?: number
  isPartialPayment?: boolean
  remainingAmount?: number
}

// ============================================================================
// BANK TRANSFER SERVICE
// ============================================================================

export class BankTransferService {
  /**
   * Generate unique transfer reference
   * Format: WW-{TIMESTAMP}-{RANDOM}
   */
  static generateReference(orderId?: string): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `WW-${timestamp}-${random}`
  }

  /**
   * Validate transfer reference format
   */
  static isValidReferenceFormat(reference: string): boolean {
    return /^WW-[A-Z0-9]+-[A-Z0-9]+$/.test(reference)
  }

  /**
   * Create bank transfer details for an order
   * In production, this would integrate with payment gateway for virtual accounts
   */
  static async createTransferDetails(
    tenantId: string,
    input: {
      orderId?: string
      orderNumber?: string
      amount: number
      currency?: string
      expiryHours?: number
    }
  ): Promise<BankTransferDetails> {
    const reference = this.generateReference(input.orderId)
    const expiresAt = new Date(Date.now() + (input.expiryHours || 24) * 60 * 60 * 1000)
    const currency = input.currency || 'NGN'
    const amount = input.amount

    // In production, this would:
    // 1. Call payment gateway to create virtual account or get static account
    // 2. Store the mapping in database
    // 3. Set up webhook for notification

    // Get tenant bank details (would come from pay_configurations in production)
    const bankDetails = await this.getTenantBankDetails(tenantId)

    const amountFormatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)

    return {
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber,
      accountName: bankDetails.accountName,
      reference,
      amount,
      amountFormatted,
      currency,
      expiresAt,
      instructions: `Transfer exactly ${amountFormatted} to the account above. Use reference: ${reference}`,
      status: 'PENDING'
    }
  }

  /**
   * Validate a transfer reference and amount
   */
  static async validateTransfer(
    tenantId: string,
    reference: string,
    receivedAmount: number,
    expectedAmount: number
  ): Promise<TransferValidationResult> {
    // Validate reference format
    if (!this.isValidReferenceFormat(reference)) {
      return { isValid: false, reason: 'Invalid transfer reference format' }
    }

    // Check if reference has been used before
    const existingPayment = await prisma.pay_payment_transactions.findFirst({
      where: {
        tenantId,
        gatewayReference: reference,
        status: { in: ['CONFIRMED', 'PROCESSING'] as PayPaymentStatus[] }
      }
    })

    if (existingPayment) {
      return { isValid: false, reason: 'This transfer reference has already been used' }
    }

    // Amount validation
    if (receivedAmount < expectedAmount) {
      // Check if partial payments are enabled
      const config = await prisma.pay_configurations.findUnique({
        where: { tenantId },
        select: { partialPaymentsEnabled: true }
      })

      if (config?.partialPaymentsEnabled) {
        return {
          isValid: true,
          matchedAmount: receivedAmount,
          isPartialPayment: true,
          remainingAmount: expectedAmount - receivedAmount
        }
      }

      return {
        isValid: false,
        reason: `Amount mismatch. Expected ₦${expectedAmount.toLocaleString()}, received ₦${receivedAmount.toLocaleString()}`
      }
    }

    // Overpayment handling (accept but note it)
    if (receivedAmount > expectedAmount) {
      return {
        isValid: true,
        matchedAmount: expectedAmount,
        isPartialPayment: false,
        remainingAmount: 0,
        reason: `Overpayment of ₦${(receivedAmount - expectedAmount).toLocaleString()} received`
      }
    }

    return {
      isValid: true,
      matchedAmount: expectedAmount,
      isPartialPayment: false,
      remainingAmount: 0
    }
  }

  /**
   * Check if a transfer has expired
   */
  static isTransferExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * Get Nigerian banks list
   */
  static getNigerianBanks(): Array<{ code: string; name: string }> {
    return [
      { code: '044', name: 'Access Bank' },
      { code: '063', name: 'Access Bank (Diamond)' },
      { code: '050', name: 'Ecobank Nigeria' },
      { code: '084', name: 'Enterprise Bank' },
      { code: '070', name: 'Fidelity Bank' },
      { code: '011', name: 'First Bank of Nigeria' },
      { code: '214', name: 'First City Monument Bank' },
      { code: '058', name: 'Guaranty Trust Bank' },
      { code: '030', name: 'Heritage Bank' },
      { code: '301', name: 'Jaiz Bank' },
      { code: '082', name: 'Keystone Bank' },
      { code: '101', name: 'Providus Bank' },
      { code: '076', name: 'Polaris Bank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '068', name: 'Standard Chartered Bank' },
      { code: '232', name: 'Sterling Bank' },
      { code: '100', name: 'Suntrust Bank' },
      { code: '032', name: 'Union Bank of Nigeria' },
      { code: '033', name: 'United Bank for Africa' },
      { code: '215', name: 'Unity Bank' },
      { code: '035', name: 'Wema Bank' },
      { code: '057', name: 'Zenith Bank' },
      // Digital banks
      { code: '999991', name: 'OPay' },
      { code: '999992', name: 'PalmPay' },
      { code: '999993', name: 'Moniepoint' },
      { code: '999994', name: 'Kuda Bank' },
    ]
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static async getTenantBankDetails(tenantId: string): Promise<{
    bankName: string
    accountNumber: string
    accountName: string
  }> {
    // In production, this would fetch from tenant configuration
    // For now, return demo details
    return {
      bankName: 'GTBank',
      accountNumber: '0123456789',
      accountName: 'WebWaka Payments'
    }
  }
}
