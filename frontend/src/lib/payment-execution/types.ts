/**
 * Payment Execution Types
 * 
 * Phase E1.2: Transaction Execution Layer
 * 
 * These types define the interface for executing payments across all suites.
 * The execution layer sits between the Provider abstraction (E1.1) and
 * individual suite implementations.
 */

export type TransactionType = 'PAYMENT' | 'REFUND' | 'AUTHORIZATION' | 'CAPTURE'

export type TransactionStatus = 
  | 'PENDING'      // Transaction initiated, awaiting customer action
  | 'PROCESSING'   // Payment in progress with provider
  | 'SUCCESS'      // Payment completed successfully
  | 'FAILED'       // Payment failed
  | 'ABANDONED'    // Customer abandoned payment flow
  | 'EXPIRED'      // Transaction expired before completion
  | 'CANCELLED'    // Transaction cancelled

export interface InitiateTransactionInput {
  tenantId: string
  partnerId: string
  
  amount: number
  currency: string
  
  customerEmail: string
  customerName?: string
  customerId?: string
  
  sourceModule?: string
  sourceType?: string
  sourceId?: string
  
  callbackUrl?: string
  
  metadata?: Record<string, unknown>
}

export interface TransactionResult {
  success: boolean
  transactionId: string
  reference: string
  status: TransactionStatus
  
  authorizationUrl?: string
  accessCode?: string
  
  provider: string
  isDemo: boolean
  
  error?: string
  errorCode?: string
}

export interface VerifyTransactionInput {
  tenantId: string
  partnerId: string
  reference: string
}

export interface VerificationResult {
  success: boolean
  transactionId: string
  reference: string
  status: TransactionStatus
  
  amount?: number
  currency?: string
  fee?: number
  netAmount?: number
  
  channel?: string
  paidAt?: Date
  
  provider: string
  isDemo: boolean
  
  error?: string
}

export interface TransactionRecord {
  id: string
  reference: string
  providerReference?: string | null
  
  type: TransactionType
  status: TransactionStatus
  provider: string
  
  amount: number
  currency: string
  fee?: number | null
  netAmount?: number | null
  
  customerEmail: string
  customerName?: string | null
  customerId?: string | null
  
  sourceModule?: string | null
  sourceType?: string | null
  sourceId?: string | null
  
  authorizationUrl?: string | null
  
  initiatedAt: Date
  verifiedAt?: Date | null
  completedAt?: Date | null
  
  isDemo: boolean
  
  errorCode?: string | null
  errorMessage?: string | null
  
  metadata?: Record<string, unknown> | null
}

export interface ListTransactionsInput {
  tenantId: string
  partnerId?: string
  
  status?: TransactionStatus | TransactionStatus[]
  provider?: string
  
  customerEmail?: string
  sourceModule?: string
  sourceType?: string
  sourceId?: string
  
  fromDate?: Date
  toDate?: Date
  
  includeDemo?: boolean
  
  limit?: number
  offset?: number
}

export interface ListTransactionsResult {
  transactions: TransactionRecord[]
  total: number
  limit: number
  offset: number
}

export interface TransactionSummary {
  totalCount: number
  totalAmount: number
  successCount: number
  successAmount: number
  pendingCount: number
  pendingAmount: number
  failedCount: number
}
