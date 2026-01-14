/**
 * Paystack Payment Provider Adapter
 * 
 * Phase E1.1: Paystack Implementation (Credential-Deferred)
 * 
 * This adapter implements the PaymentProviderAdapter interface for Paystack.
 * 
 * IMPORTANT:
 * - No actual Paystack API calls are made in Phase E1.1
 * - All methods return stubbed/mocked responses
 * - Live charges, webhooks, and settlements are NOT implemented
 */

import { prisma } from '@/lib/prisma'
import {
  PaymentProviderAdapter,
  PaymentProviderType,
  PaymentCapabilityResult,
  InitiatePaymentInput,
  PaymentInitiationResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
  PaymentCredentials,
} from './types'

export class PaystackAdapter implements PaymentProviderAdapter {
  readonly providerType: PaymentProviderType = 'paystack'

  async checkAvailability(partnerId: string): Promise<PaymentCapabilityResult> {
    try {
      const config = await prisma.partnerPaymentConfig.findFirst({
        where: { 
          partnerId,
          provider: 'paystack'
        }
      })

      if (!config) {
        return {
          available: false,
          provider: null,
          status: 'DISABLED',
          reason: 'Paystack has not been enabled for this partner'
        }
      }

      if (!config.enabledBySuperAdmin) {
        return {
          available: false,
          provider: 'paystack',
          status: 'DISABLED',
          reason: 'Paystack must be enabled by platform administrator'
        }
      }

      if (!config.secretKeyEncrypted || !config.publicKey) {
        return {
          available: false,
          provider: 'paystack',
          status: 'ENABLED_NO_KEYS',
          reason: 'Paystack credentials have not been configured'
        }
      }

      return {
        available: true,
        provider: 'paystack',
        status: 'ENABLED_CONFIGURED'
      }
    } catch (error) {
      console.error('Paystack availability check failed:', error)
      return {
        available: false,
        provider: 'paystack',
        status: 'DISABLED',
        reason: 'Failed to check Paystack availability'
      }
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<PaymentInitiationResult> {
    const availability = await this.checkAvailability(input.partnerId)
    
    if (!availability.available) {
      return {
        success: false,
        provider: 'paystack',
        reference: input.reference,
        error: availability.reason || 'Paystack is not available',
        errorCode: 'PROVIDER_NOT_AVAILABLE'
      }
    }

    return {
      success: true,
      provider: 'paystack',
      reference: input.reference,
      authorizationUrl: `https://checkout.paystack.com/stub/${input.reference}`,
      accessCode: `stub_access_${input.reference}`
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    const availability = await this.checkAvailability(input.partnerId)
    
    if (!availability.available) {
      return {
        success: false,
        provider: 'paystack',
        reference: input.reference,
        status: 'failed',
        error: availability.reason || 'Paystack is not available'
      }
    }

    return {
      success: true,
      provider: 'paystack',
      reference: input.reference,
      status: 'pending',
      gatewayResponse: 'Stub verification - live verification not yet implemented'
    }
  }

  async validateCredentials(credentials: PaymentCredentials): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.publicKey) {
      return { valid: false, error: 'Public key is required' }
    }
    if (!credentials.secretKey) {
      return { valid: false, error: 'Secret key is required' }
    }

    if (!credentials.publicKey.startsWith('pk_')) {
      return { valid: false, error: 'Public key should start with pk_' }
    }
    if (!credentials.secretKey.startsWith('sk_')) {
      return { valid: false, error: 'Secret key should start with sk_' }
    }

    return { valid: true }
  }
}
