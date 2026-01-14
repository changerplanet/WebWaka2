/**
 * Payment Provider Admin Service
 * 
 * Phase E1.1: Super Admin and Partner Administration
 * 
 * This service provides administrative controls for:
 * - Super Admin: Enable/disable Paystack per Partner
 * - Partner: Configure credentials
 */

import { prisma } from '@/lib/prisma'
import { PaymentProviderType, PaymentCredentials } from './types'
import { PaystackAdapter } from './paystack-adapter'
import { encryptSecret, maskSecret, isValidPaystackPublicKey, isValidPaystackSecretKey } from './crypto-utils'

export interface PartnerPaymentStatus {
  partnerId: string
  partnerName: string
  provider: PaymentProviderType | null
  enabledBySuperAdmin: boolean
  enabledAt: Date | null
  hasCredentials: boolean
  configuredAt: Date | null
  testMode: boolean
  validationStatus: string | null
}

export interface EnablePaystackInput {
  partnerId: string
  enabledByUserId: string
}

export interface ConfigureCredentialsInput {
  partnerId: string
  provider: PaymentProviderType
  publicKey: string
  secretKey: string
  webhookSecret?: string
  testMode?: boolean
}

export class PaymentAdminService {
  /**
   * Super Admin: List all partners with their payment status
   */
  static async listPartnerPaymentStatus(): Promise<PartnerPaymentStatus[]> {
    const partners = await prisma.partner.findMany({
      where: { status: 'ACTIVE' },
      include: {
        paymentConfigs: true
      },
      orderBy: { name: 'asc' }
    })

    return partners.map(partner => {
      const config = partner.paymentConfigs?.[0]
      return {
        partnerId: partner.id,
        partnerName: partner.name,
        provider: config?.provider as PaymentProviderType || null,
        enabledBySuperAdmin: config?.enabledBySuperAdmin || false,
        enabledAt: config?.enabledAt || null,
        hasCredentials: !!(config?.publicKey && config?.secretKeyEncrypted),
        configuredAt: config?.configuredAt || null,
        testMode: config?.testMode ?? true,
        validationStatus: config?.validationStatus || null
      }
    })
  }

  /**
   * Super Admin: Get payment status for a specific partner
   */
  static async getPartnerPaymentStatus(partnerId: string): Promise<PartnerPaymentStatus | null> {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        paymentConfigs: true
      }
    })

    if (!partner) return null

    const config = partner.paymentConfigs?.[0]
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      provider: config?.provider as PaymentProviderType || null,
      enabledBySuperAdmin: config?.enabledBySuperAdmin || false,
      enabledAt: config?.enabledAt || null,
      hasCredentials: !!(config?.publicKey && config?.secretKeyEncrypted),
      configuredAt: config?.configuredAt || null,
      testMode: config?.testMode ?? true,
      validationStatus: config?.validationStatus || null
    }
  }

  /**
   * Super Admin: Enable Paystack for a partner
   */
  static async enablePaystackForPartner(input: EnablePaystackInput): Promise<{ success: boolean; error?: string }> {
    try {
      const partner = await prisma.partner.findUnique({
        where: { id: input.partnerId }
      })

      if (!partner) {
        return { success: false, error: 'Partner not found' }
      }

      await prisma.partnerPaymentConfig.upsert({
        where: {
          partnerId_provider: {
            partnerId: input.partnerId,
            provider: 'paystack'
          }
        },
        create: {
          partnerId: input.partnerId,
          provider: 'paystack',
          enabledBySuperAdmin: true,
          enabledAt: new Date(),
          enabledByUserId: input.enabledByUserId,
          testMode: true
        },
        update: {
          enabledBySuperAdmin: true,
          enabledAt: new Date(),
          enabledByUserId: input.enabledByUserId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to enable Paystack for partner:', error)
      return { success: false, error: 'Failed to enable Paystack' }
    }
  }

  /**
   * Super Admin: Disable Paystack for a partner
   */
  static async disablePaystackForPartner(partnerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.partnerPaymentConfig.updateMany({
        where: {
          partnerId,
          provider: 'paystack'
        },
        data: {
          enabledBySuperAdmin: false
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to disable Paystack for partner:', error)
      return { success: false, error: 'Failed to disable Paystack' }
    }
  }

  /**
   * Partner: Configure payment credentials
   */
  static async configureCredentials(input: ConfigureCredentialsInput): Promise<{ success: boolean; error?: string }> {
    try {
      const existingConfig = await prisma.partnerPaymentConfig.findFirst({
        where: {
          partnerId: input.partnerId,
          provider: input.provider
        }
      })

      if (!existingConfig?.enabledBySuperAdmin) {
        return { 
          success: false, 
          error: 'Payment provider must be enabled by platform administrator first' 
        }
      }

      if (!isValidPaystackPublicKey(input.publicKey)) {
        return { success: false, error: 'Invalid public key format. Key should start with pk_test_ or pk_live_' }
      }
      
      if (!isValidPaystackSecretKey(input.secretKey)) {
        return { success: false, error: 'Invalid secret key format. Key should start with sk_test_ or sk_live_' }
      }

      const adapter = new PaystackAdapter()
      const validation = await adapter.validateCredentials({
        publicKey: input.publicKey,
        secretKey: input.secretKey
      })

      const encryptedSecret = encryptSecret(input.secretKey)
      const encryptedWebhookSecret = input.webhookSecret ? encryptSecret(input.webhookSecret) : null

      await prisma.partnerPaymentConfig.update({
        where: { id: existingConfig.id },
        data: {
          publicKey: input.publicKey,
          secretKeyEncrypted: encryptedSecret,
          webhookSecret: encryptedWebhookSecret,
          testMode: input.testMode ?? true,
          configuredAt: new Date(),
          validationStatus: validation.valid ? 'valid' : 'invalid',
          validationError: validation.error
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to configure credentials:', error)
      return { success: false, error: 'Failed to save credentials' }
    }
  }

  /**
   * Partner: Get masked credentials for display
   */
  static async getMaskedCredentials(partnerId: string, provider: PaymentProviderType): Promise<{
    publicKey: string | null
    secretKeyMasked: string | null
    testMode: boolean
    configuredAt: Date | null
  } | null> {
    const config = await prisma.partnerPaymentConfig.findFirst({
      where: { partnerId, provider }
    })

    if (!config) return null

    return {
      publicKey: config.publicKey,
      secretKeyMasked: config.secretKeyEncrypted ? maskSecret('sk_****_configured') : null,
      testMode: config.testMode,
      configuredAt: config.configuredAt
    }
  }

  /**
   * Test connection (stub - no actual API call in Phase E1.1)
   */
  static async testConnection(partnerId: string, provider: PaymentProviderType): Promise<{
    success: boolean
    message: string
  }> {
    const config = await prisma.partnerPaymentConfig.findFirst({
      where: { partnerId, provider }
    })

    if (!config?.enabledBySuperAdmin) {
      return {
        success: false,
        message: 'Payment provider is not enabled'
      }
    }

    if (!config.publicKey || !config.secretKeyEncrypted) {
      return {
        success: false,
        message: 'Credentials not configured'
      }
    }

    return {
      success: true,
      message: 'Connection test passed (stub - live validation not yet implemented)'
    }
  }
}
