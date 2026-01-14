/**
 * Payment Capability Service
 * 
 * Phase E1.1: Central Payment Capability Layer
 * 
 * This service provides a unified interface for checking and using
 * payment capabilities across the platform. All suites should use
 * this service rather than directly integrating with payment providers.
 * 
 * Key Principles:
 * - Provider-agnostic interface
 * - Safe fallback behavior
 * - Three-level control (Super Admin → Partner → Tenant)
 */

import { prisma } from '@/lib/prisma'
import {
  PaymentProviderType,
  PaymentCapabilityResult,
  InitiatePaymentInput,
  PaymentInitiationResult,
  PaymentVerificationResult,
  PaymentProviderAdapter,
} from './types'
import { PaystackAdapter } from './paystack-adapter'

const adapters: Map<PaymentProviderType, PaymentProviderAdapter> = new Map()
adapters.set('paystack', new PaystackAdapter())

export class PaymentCapabilityService {
  /**
   * Check if payments are available for a tenant
   * Returns structured result, never throws for "not available" case
   */
  static async checkAvailability(tenantId: string): Promise<PaymentCapabilityResult> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          platformInstances: {
            include: {
              createdByPartner: true
            },
            take: 1
          }
        }
      })

      const platformInstance = tenant?.platformInstances?.[0]
      if (!tenant || !platformInstance?.createdByPartner) {
        return {
          available: false,
          provider: null,
          status: 'DISABLED',
          reason: 'Tenant is not associated with a partner'
        }
      }

      const partnerId = platformInstance.createdByPartner.id

      return this.checkPartnerAvailability(partnerId)
    } catch (error) {
      console.error('Payment capability check failed:', error)
      return {
        available: false,
        provider: null,
        status: 'DISABLED',
        reason: 'Failed to check payment availability'
      }
    }
  }

  /**
   * Check payment availability directly for a partner
   */
  static async checkPartnerAvailability(partnerId: string): Promise<PaymentCapabilityResult> {
    try {
      const config = await prisma.partnerPaymentConfig.findFirst({
        where: { 
          partnerId,
          enabledBySuperAdmin: true
        },
        orderBy: { enabledAt: 'desc' }
      })

      if (!config) {
        return {
          available: false,
          provider: null,
          status: 'DISABLED',
          reason: 'No payment provider has been enabled for this partner'
        }
      }

      const adapter = adapters.get(config.provider as PaymentProviderType)
      if (!adapter) {
        return {
          available: false,
          provider: config.provider as PaymentProviderType,
          status: 'DISABLED',
          reason: `Payment provider ${config.provider} is not supported`
        }
      }

      return adapter.checkAvailability(partnerId)
    } catch (error) {
      console.error('Partner payment availability check failed:', error)
      return {
        available: false,
        provider: null,
        status: 'DISABLED',
        reason: 'Failed to check payment availability'
      }
    }
  }

  /**
   * Get the status for display in UI
   */
  static async getDisplayStatus(partnerId: string): Promise<{
    enabled: boolean
    configured: boolean
    provider: PaymentProviderType | null
    statusLabel: string
    statusColor: 'gray' | 'yellow' | 'green' | 'red'
  }> {
    const result = await this.checkPartnerAvailability(partnerId)

    switch (result.status) {
      case 'DISABLED':
        return {
          enabled: false,
          configured: false,
          provider: null,
          statusLabel: 'Payments Not Enabled',
          statusColor: 'gray'
        }
      case 'ENABLED_NO_KEYS':
        return {
          enabled: true,
          configured: false,
          provider: result.provider,
          statusLabel: 'Awaiting Configuration',
          statusColor: 'yellow'
        }
      case 'ENABLED_CONFIGURED':
        return {
          enabled: true,
          configured: true,
          provider: result.provider,
          statusLabel: 'Ready',
          statusColor: 'green'
        }
      case 'ENABLED_INVALID':
        return {
          enabled: true,
          configured: false,
          provider: result.provider,
          statusLabel: 'Configuration Invalid',
          statusColor: 'red'
        }
      default:
        return {
          enabled: false,
          configured: false,
          provider: null,
          statusLabel: 'Unknown',
          statusColor: 'gray'
        }
    }
  }

  /**
   * Initiate a payment (provider-agnostic)
   * Returns structured result, never throws for "not available" case
   */
  static async initiatePayment(
    tenantId: string,
    input: Omit<InitiatePaymentInput, 'tenantId' | 'partnerId'>
  ): Promise<PaymentInitiationResult> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          platformInstances: {
            include: {
              createdByPartner: true
            },
            take: 1
          }
        }
      })

      const platformInstance = tenant?.platformInstances?.[0]
      if (!tenant || !platformInstance?.createdByPartner) {
        return {
          success: false,
          provider: 'none',
          reference: input.reference,
          error: 'Tenant is not associated with a partner',
          errorCode: 'NO_PARTNER'
        }
      }

      const partnerId = platformInstance.createdByPartner.id
      const availability = await this.checkPartnerAvailability(partnerId)

      if (!availability.available || !availability.provider) {
        return {
          success: false,
          provider: availability.provider || 'none',
          reference: input.reference,
          error: availability.reason || 'Payment provider not available',
          errorCode: 'PROVIDER_NOT_AVAILABLE'
        }
      }

      const adapter = adapters.get(availability.provider)
      if (!adapter) {
        return {
          success: false,
          provider: availability.provider,
          reference: input.reference,
          error: 'Payment provider adapter not found',
          errorCode: 'ADAPTER_NOT_FOUND'
        }
      }

      return adapter.initiatePayment({
        ...input,
        tenantId,
        partnerId
      })
    } catch (error) {
      console.error('Payment initiation failed:', error)
      return {
        success: false,
        provider: 'none',
        reference: input.reference,
        error: 'Failed to initiate payment',
        errorCode: 'INITIATION_FAILED'
      }
    }
  }

  /**
   * Verify a payment (provider-agnostic)
   */
  static async verifyPayment(
    tenantId: string,
    reference: string
  ): Promise<PaymentVerificationResult> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          platformInstances: {
            include: {
              createdByPartner: true
            },
            take: 1
          }
        }
      })

      const platformInstance = tenant?.platformInstances?.[0]
      if (!tenant || !platformInstance?.createdByPartner) {
        return {
          success: false,
          provider: 'none',
          reference,
          status: 'failed',
          error: 'Tenant is not associated with a partner'
        }
      }

      const partnerId = platformInstance.createdByPartner.id
      const availability = await this.checkPartnerAvailability(partnerId)

      if (!availability.available || !availability.provider) {
        return {
          success: false,
          provider: availability.provider || 'none',
          reference,
          status: 'failed',
          error: availability.reason || 'Payment provider not available'
        }
      }

      const adapter = adapters.get(availability.provider)
      if (!adapter) {
        return {
          success: false,
          provider: availability.provider,
          reference,
          status: 'failed',
          error: 'Payment provider adapter not found'
        }
      }

      return adapter.verifyPayment({
        tenantId,
        partnerId,
        reference
      })
    } catch (error) {
      console.error('Payment verification failed:', error)
      return {
        success: false,
        provider: 'none',
        reference,
        status: 'failed',
        error: 'Failed to verify payment'
      }
    }
  }

  /**
   * List all available payment providers
   */
  static listProviders(): PaymentProviderType[] {
    return Array.from(adapters.keys())
  }

  /**
   * Get adapter for a specific provider
   */
  static getAdapter(provider: PaymentProviderType): PaymentProviderAdapter | null {
    return adapters.get(provider) || null
  }
}
