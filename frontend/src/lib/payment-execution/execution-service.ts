/**
 * Payment Execution Service
 * 
 * Phase E1.2: Orchestrates payment execution across providers
 * 
 * This service is the main entry point for suites to:
 * - Initiate payments
 * - Verify payments
 * - Query transactions
 * 
 * Clear separation of concerns:
 * - Payment Provider (E1.1): Handles provider-specific logic (Paystack adapter)
 * - Payment Execution (E1.2): Orchestrates transactions, manages state
 * - Transaction Recording (E1.2): Persists transaction data
 */

import { PaymentCapabilityService } from '@/lib/payment-providers'
import { TransactionService } from './transaction-service'
import type {
  InitiateTransactionInput,
  TransactionResult,
  VerifyTransactionInput,
  VerificationResult,
  ListTransactionsInput,
  ListTransactionsResult,
  TransactionSummary
} from './types'

export class PaymentExecutionService {
  /**
   * Check if payments are available for a tenant
   */
  static async isAvailable(partnerId: string): Promise<{
    available: boolean
    provider: string | null
    reason?: string
  }> {
    const capability = await PaymentCapabilityService.checkPartnerAvailability(partnerId)
    return {
      available: capability.available,
      provider: capability.provider,
      reason: capability.reason
    }
  }
  
  /**
   * Initiate a payment transaction
   * 
   * This is the main entry point for all payment-related flows.
   * Suites should call this method to start a payment.
   */
  static async initiatePayment(input: InitiateTransactionInput): Promise<TransactionResult> {
    const capability = await PaymentCapabilityService.checkPartnerAvailability(input.partnerId)
    
    if (!capability.available) {
      return {
        success: false,
        transactionId: '',
        reference: '',
        status: 'FAILED',
        provider: 'none',
        isDemo: false,
        error: capability.reason || 'Payments are not available for this partner',
        errorCode: 'PAYMENTS_UNAVAILABLE'
      }
    }
    
    const provider = capability.provider!
    const isDemo = capability.status === 'ENABLED_NO_KEYS'
    
    try {
      if (isDemo) {
        return await this.initiateDemoPayment(input, provider)
      }
      
      return await this.initiateProviderPayment(input, provider)
    } catch (error) {
      console.error('Payment initiation failed:', error)
      return {
        success: false,
        transactionId: '',
        reference: '',
        status: 'FAILED',
        provider,
        isDemo,
        error: 'Failed to initiate payment',
        errorCode: 'INITIATION_ERROR'
      }
    }
  }
  
  /**
   * Initiate a demo payment (no actual provider call)
   */
  private static async initiateDemoPayment(
    input: InitiateTransactionInput,
    provider: string
  ): Promise<TransactionResult> {
    const demoAuthUrl = `/demo/payment?amount=${input.amount}&currency=${input.currency}&email=${encodeURIComponent(input.customerEmail)}`
    
    const transaction = await TransactionService.create({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
      provider: 'demo',
      amount: input.amount,
      currency: input.currency,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerId: input.customerId,
      sourceModule: input.sourceModule,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      authorizationUrl: demoAuthUrl,
      isDemo: true,
      metadata: input.metadata
    })
    
    return {
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      status: 'PENDING',
      authorizationUrl: demoAuthUrl,
      provider: 'demo',
      isDemo: true
    }
  }
  
  /**
   * Initiate a real provider payment
   */
  private static async initiateProviderPayment(
    input: InitiateTransactionInput,
    provider: string
  ): Promise<TransactionResult> {
    const result = await PaymentCapabilityService.initiatePayment(
      input.tenantId,
      {
        amount: input.amount,
        currency: input.currency,
        email: input.customerEmail,
        reference: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        callbackUrl: input.callbackUrl,
        metadata: input.metadata
      }
    )
    
    if (!result.success) {
      return {
        success: false,
        transactionId: '',
        reference: result.reference,
        status: 'FAILED',
        provider,
        isDemo: false,
        error: result.error,
        errorCode: result.errorCode
      }
    }
    
    const transaction = await TransactionService.create({
      tenantId: input.tenantId,
      partnerId: input.partnerId,
      provider,
      amount: input.amount,
      currency: input.currency,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      customerId: input.customerId,
      sourceModule: input.sourceModule,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      isDemo: false,
      metadata: {
        ...input.metadata,
        providerReference: result.reference
      }
    })
    
    await TransactionService.updateStatus(transaction.reference, 'PENDING', {
      providerReference: result.reference
    })
    
    return {
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      status: 'PENDING',
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      provider,
      isDemo: false
    }
  }
  
  /**
   * Verify a payment transaction
   */
  static async verifyPayment(input: VerifyTransactionInput): Promise<VerificationResult> {
    const transaction = await TransactionService.getByReference(input.reference)
    
    if (!transaction) {
      return {
        success: false,
        transactionId: '',
        reference: input.reference,
        status: 'FAILED',
        provider: 'unknown',
        isDemo: false,
        error: 'Transaction not found'
      }
    }
    
    if (transaction.isDemo) {
      return this.verifyDemoPayment(transaction)
    }
    
    return this.verifyProviderPayment(input, transaction)
  }
  
  /**
   * Verify a demo payment (simulated success)
   */
  private static async verifyDemoPayment(
    transaction: { id: string; reference: string; amount: number; currency: string }
  ): Promise<VerificationResult> {
    await TransactionService.updateStatus(transaction.reference, 'SUCCESS', {
      verifiedAt: new Date(),
      completedAt: new Date(),
      channel: 'demo',
      gatewayResponse: 'Demo payment successful'
    })
    
    return {
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      status: 'SUCCESS',
      amount: transaction.amount,
      currency: transaction.currency,
      fee: 0,
      netAmount: transaction.amount,
      channel: 'demo',
      paidAt: new Date(),
      provider: 'demo',
      isDemo: true
    }
  }
  
  /**
   * Verify a real provider payment
   */
  private static async verifyProviderPayment(
    input: VerifyTransactionInput,
    transaction: { 
      id: string
      reference: string
      providerReference?: string | null
      provider: string
    }
  ): Promise<VerificationResult> {
    const referenceToVerify = transaction.providerReference || transaction.reference
    
    const result = await PaymentCapabilityService.verifyPayment(
      input.tenantId,
      referenceToVerify
    )
    
    const statusMap: Record<string, 'SUCCESS' | 'FAILED' | 'PENDING' | 'ABANDONED'> = {
      'success': 'SUCCESS',
      'failed': 'FAILED',
      'pending': 'PENDING',
      'abandoned': 'ABANDONED'
    }
    
    const newStatus = statusMap[result.status] || 'FAILED'
    
    await TransactionService.updateStatus(transaction.reference, newStatus, {
      verifiedAt: new Date(),
      completedAt: newStatus === 'SUCCESS' || newStatus === 'FAILED' ? new Date() : undefined,
      channel: result.channel,
      gatewayResponse: result.gatewayResponse,
      errorCode: result.error ? 'VERIFICATION_FAILED' : undefined,
      errorMessage: result.error
    })
    
    return {
      success: result.success,
      transactionId: transaction.id,
      reference: transaction.reference,
      status: newStatus,
      amount: result.amount,
      currency: result.currency,
      channel: result.channel,
      paidAt: result.paidAt,
      provider: transaction.provider,
      isDemo: false,
      error: result.error
    }
  }
  
  /**
   * Simulate a demo payment completion (for testing)
   */
  static async completeDemoPayment(reference: string, success: boolean = true): Promise<VerificationResult> {
    const transaction = await TransactionService.getByReference(reference)
    
    if (!transaction) {
      return {
        success: false,
        transactionId: '',
        reference,
        status: 'FAILED',
        provider: 'unknown',
        isDemo: false,
        error: 'Transaction not found'
      }
    }
    
    if (!transaction.isDemo) {
      return {
        success: false,
        transactionId: transaction.id,
        reference,
        status: transaction.status,
        provider: transaction.provider,
        isDemo: false,
        error: 'This is not a demo transaction'
      }
    }
    
    const newStatus = success ? 'SUCCESS' : 'FAILED'
    
    await TransactionService.updateStatus(reference, newStatus, {
      verifiedAt: new Date(),
      completedAt: new Date(),
      channel: 'demo',
      gatewayResponse: success ? 'Demo payment completed' : 'Demo payment declined'
    })
    
    return {
      success,
      transactionId: transaction.id,
      reference,
      status: newStatus,
      amount: transaction.amount,
      currency: transaction.currency,
      fee: 0,
      netAmount: transaction.amount,
      channel: 'demo',
      paidAt: success ? new Date() : undefined,
      provider: 'demo',
      isDemo: true
    }
  }
  
  /**
   * List transactions
   */
  static async listTransactions(input: ListTransactionsInput): Promise<ListTransactionsResult> {
    return TransactionService.list(input)
  }
  
  /**
   * Get transaction summary
   */
  static async getTransactionSummary(
    tenantId: string,
    options?: {
      partnerId?: string
      fromDate?: Date
      toDate?: Date
      includeDemo?: boolean
    }
  ): Promise<TransactionSummary> {
    return TransactionService.getSummary(tenantId, options)
  }
  
  /**
   * Get a single transaction by reference
   */
  static async getTransaction(reference: string) {
    return TransactionService.getByReference(reference)
  }
}
