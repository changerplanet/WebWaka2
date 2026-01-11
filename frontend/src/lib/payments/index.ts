/**
 * PAYMENTS & COLLECTIONS SUITE
 * 
 * CANONICAL EXPORTS - S3
 * 
 * This is the SINGLE ENTRY POINT for all payment services.
 * POS, SVM, MVM suites MUST consume payment logic through this module.
 * 
 * @module lib/payments
 */

// Core Services (Existing, Reused)
export { PaymentService } from './payment-service'
export type { PaymentIntent, PaymentTransaction } from './payment-service'

export { WalletService } from './wallet-service'
export type { 
  Wallet, 
  WalletTransaction, 
  WalletBalance 
} from './wallet-service'

export { RefundService } from './refund-service'

export { PayConfigService } from './config-service'

export { PayEntitlementsService, PayValidationService } from './entitlements-service'

// S3 Canonical Services (New)
export { 
  PaymentMethodAvailabilityService,
  PODService,
  CANONICAL_PAYMENT_METHODS,
  DEFAULT_POD_CONFIG
} from './methods-service'
export type {
  PaymentMethodCode,
  PaymentMethodDefinition,
  PaymentMethodAvailability,
  PODConfig
} from './methods-service'

export { BankTransferService } from './transfer-service'
export type {
  BankTransferDetails,
  TransferValidationResult
} from './transfer-service'

export { PaymentProofService } from './proof-service'
export type {
  ProofAttachment,
  ProofVerificationResult
} from './proof-service'

export { PartialPaymentService } from './partial-payment-service'
export type {
  PartialPaymentSummary,
  PartialPaymentRecord
} from './partial-payment-service'

export { 
  PaymentStatusResolver,
  formatPaymentStatusForCustomer,
  getStatusBadgeClass
} from './status-resolver'
export type {
  PaymentStatusDisplay,
  IntentStatusDisplay
} from './status-resolver'

// Re-export Prisma types for convenience
export { PayPaymentMethod, PayPaymentStatus, PayIntentStatus } from '@prisma/client'
