/**
 * Payment Provider Abstraction Types
 * 
 * Phase E1.1: Platform-Wide Payment Capability Layer
 * 
 * This module defines the provider-agnostic payment interface.
 * Paystack is the first implementation, but the system supports
 * multiple providers (flutterwave, manual, etc.)
 */

export type PaymentProviderType = 'paystack' | 'flutterwave' | 'manual' | 'none'

export type PaymentProviderStatus = 
  | 'DISABLED'           // Super Admin has not enabled for this partner
  | 'ENABLED_NO_KEYS'    // Enabled but partner hasn't configured credentials
  | 'ENABLED_CONFIGURED' // Fully configured and ready
  | 'ENABLED_INVALID'    // Keys configured but validation failed

export interface PaymentProviderConfig {
  provider: PaymentProviderType
  status: PaymentProviderStatus
  enabledAt?: Date
  enabledByUserId?: string
  configuredAt?: Date
  lastValidatedAt?: Date
  validationError?: string
}

export interface PaymentCredentials {
  publicKey?: string
  secretKey?: string
  webhookSecret?: string
  testMode?: boolean
}

export interface PaymentCapabilityResult {
  available: boolean
  provider: PaymentProviderType | null
  status: PaymentProviderStatus
  reason?: string
}

export interface InitiatePaymentInput {
  tenantId: string
  partnerId: string
  amount: number
  currency: string
  email: string
  reference: string
  metadata?: Record<string, unknown>
  callbackUrl?: string
}

export interface PaymentInitiationResult {
  success: boolean
  provider: PaymentProviderType
  authorizationUrl?: string
  accessCode?: string
  reference: string
  error?: string
  errorCode?: string
}

export interface VerifyPaymentInput {
  tenantId: string
  partnerId: string
  reference: string
}

export interface PaymentVerificationResult {
  success: boolean
  provider: PaymentProviderType
  reference: string
  amount?: number
  currency?: string
  status: 'success' | 'failed' | 'pending' | 'abandoned'
  gatewayResponse?: string
  paidAt?: Date
  channel?: string
  error?: string
}

export interface PaymentProviderAdapter {
  readonly providerType: PaymentProviderType
  
  checkAvailability(partnerId: string): Promise<PaymentCapabilityResult>
  
  initiatePayment(input: InitiatePaymentInput): Promise<PaymentInitiationResult>
  
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult>
  
  validateCredentials(credentials: PaymentCredentials): Promise<{ valid: boolean; error?: string }>
}

export interface PaymentProviderRegistry {
  getAdapter(provider: PaymentProviderType): PaymentProviderAdapter | null
  
  getAvailableProvider(partnerId: string): Promise<PaymentCapabilityResult>
  
  listProviders(): PaymentProviderType[]
}
