/**
 * Transaction Recording Service
 * 
 * Phase E1.2: Handles persistence and retrieval of payment transactions
 * 
 * This service is responsible for:
 * - Creating transaction records
 * - Updating transaction status
 * - Querying transactions
 * - Generating unique references
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type {
  TransactionRecord,
  TransactionStatus,
  TransactionType,
  ListTransactionsInput,
  ListTransactionsResult,
  TransactionSummary
} from './types'

function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TXN-${timestamp}-${random}`
}

function mapToTransactionRecord(tx: {
  id: string
  reference: string
  providerReference: string | null
  type: string
  status: string
  provider: string
  amount: Prisma.Decimal
  currency: string
  fee: Prisma.Decimal | null
  netAmount: Prisma.Decimal | null
  customerEmail: string
  customerName: string | null
  customerId: string | null
  sourceModule: string | null
  sourceType: string | null
  sourceId: string | null
  authorizationUrl: string | null
  initiatedAt: Date
  verifiedAt: Date | null
  completedAt: Date | null
  isDemo: boolean
  errorCode: string | null
  errorMessage: string | null
  metadata: Prisma.JsonValue | null
}): TransactionRecord {
  return {
    id: tx.id,
    reference: tx.reference,
    providerReference: tx.providerReference,
    type: tx.type as TransactionType,
    status: tx.status as TransactionStatus,
    provider: tx.provider,
    amount: Number(tx.amount),
    currency: tx.currency,
    fee: tx.fee ? Number(tx.fee) : null,
    netAmount: tx.netAmount ? Number(tx.netAmount) : null,
    customerEmail: tx.customerEmail,
    customerName: tx.customerName,
    customerId: tx.customerId,
    sourceModule: tx.sourceModule,
    sourceType: tx.sourceType,
    sourceId: tx.sourceId,
    authorizationUrl: tx.authorizationUrl,
    initiatedAt: tx.initiatedAt,
    verifiedAt: tx.verifiedAt,
    completedAt: tx.completedAt,
    isDemo: tx.isDemo,
    errorCode: tx.errorCode,
    errorMessage: tx.errorMessage,
    metadata: tx.metadata as Record<string, unknown> | null
  }
}

export class TransactionService {
  /**
   * Create a new transaction record
   */
  static async create(input: {
    tenantId: string
    partnerId: string
    type?: TransactionType
    provider: string
    amount: number
    currency: string
    customerEmail: string
    customerName?: string
    customerId?: string
    sourceModule?: string
    sourceType?: string
    sourceId?: string
    authorizationUrl?: string
    accessCode?: string
    isDemo?: boolean
    metadata?: Record<string, unknown>
  }): Promise<TransactionRecord> {
    const reference = generateReference()
    
    const tx = await prisma.paymentTransaction.create({
      data: {
        reference,
        tenantId: input.tenantId,
        partnerId: input.partnerId,
        type: input.type || 'PAYMENT',
        status: 'PENDING',
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        customerId: input.customerId,
        sourceModule: input.sourceModule,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        authorizationUrl: input.authorizationUrl,
        accessCode: input.accessCode,
        isDemo: input.isDemo ?? false,
        metadata: input.metadata ?? undefined
      }
    })
    
    return mapToTransactionRecord(tx)
  }
  
  /**
   * Get transaction by reference
   */
  static async getByReference(reference: string): Promise<TransactionRecord | null> {
    const tx = await prisma.paymentTransaction.findUnique({
      where: { reference }
    })
    
    return tx ? mapToTransactionRecord(tx) : null
  }
  
  /**
   * Get transaction by ID
   */
  static async getById(id: string): Promise<TransactionRecord | null> {
    const tx = await prisma.paymentTransaction.findUnique({
      where: { id }
    })
    
    return tx ? mapToTransactionRecord(tx) : null
  }
  
  /**
   * Update transaction status
   */
  static async updateStatus(
    reference: string,
    status: TransactionStatus,
    additionalData?: {
      providerReference?: string
      fee?: number
      netAmount?: number
      channel?: string
      gatewayResponse?: string
      verifiedAt?: Date
      completedAt?: Date
      errorCode?: string
      errorMessage?: string
      providerMetadata?: Record<string, unknown>
    }
  ): Promise<TransactionRecord | null> {
    const tx = await prisma.paymentTransaction.update({
      where: { reference },
      data: {
        status,
        ...additionalData,
        providerMetadata: additionalData?.providerMetadata ?? undefined
      }
    })
    
    return mapToTransactionRecord(tx)
  }
  
  /**
   * List transactions with filters
   */
  static async list(input: ListTransactionsInput): Promise<ListTransactionsResult> {
    const where: Prisma.PaymentTransactionWhereInput = {
      tenantId: input.tenantId
    }
    
    if (input.partnerId) {
      where.partnerId = input.partnerId
    }
    
    if (input.status) {
      if (Array.isArray(input.status)) {
        where.status = { in: input.status }
      } else {
        where.status = input.status
      }
    }
    
    if (input.provider) {
      where.provider = input.provider
    }
    
    if (input.customerEmail) {
      where.customerEmail = input.customerEmail
    }
    
    if (input.sourceModule) {
      where.sourceModule = input.sourceModule
    }
    
    if (input.sourceType) {
      where.sourceType = input.sourceType
    }
    
    if (input.sourceId) {
      where.sourceId = input.sourceId
    }
    
    if (input.fromDate || input.toDate) {
      where.initiatedAt = {}
      if (input.fromDate) {
        where.initiatedAt.gte = input.fromDate
      }
      if (input.toDate) {
        where.initiatedAt.lte = input.toDate
      }
    }
    
    if (!input.includeDemo) {
      where.isDemo = false
    }
    
    const limit = input.limit ?? 50
    const offset = input.offset ?? 0
    
    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        orderBy: { initiatedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.paymentTransaction.count({ where })
    ])
    
    return {
      transactions: transactions.map(mapToTransactionRecord),
      total,
      limit,
      offset
    }
  }
  
  /**
   * Get transaction summary for a tenant
   */
  static async getSummary(
    tenantId: string,
    options?: {
      partnerId?: string
      fromDate?: Date
      toDate?: Date
      includeDemo?: boolean
    }
  ): Promise<TransactionSummary> {
    const where: Prisma.PaymentTransactionWhereInput = {
      tenantId
    }
    
    if (options?.partnerId) {
      where.partnerId = options.partnerId
    }
    
    if (options?.fromDate || options?.toDate) {
      where.initiatedAt = {}
      if (options?.fromDate) {
        where.initiatedAt.gte = options.fromDate
      }
      if (options?.toDate) {
        where.initiatedAt.lte = options.toDate
      }
    }
    
    if (!options?.includeDemo) {
      where.isDemo = false
    }
    
    const [allTx, successTx, pendingTx, failedTx] = await Promise.all([
      prisma.paymentTransaction.aggregate({
        where,
        _count: true,
        _sum: { amount: true }
      }),
      prisma.paymentTransaction.aggregate({
        where: { ...where, status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true }
      }),
      prisma.paymentTransaction.aggregate({
        where: { ...where, status: 'PENDING' },
        _count: true,
        _sum: { amount: true }
      }),
      prisma.paymentTransaction.aggregate({
        where: { ...where, status: 'FAILED' },
        _count: true
      })
    ])
    
    return {
      totalCount: allTx._count,
      totalAmount: Number(allTx._sum.amount ?? 0),
      successCount: successTx._count,
      successAmount: Number(successTx._sum.amount ?? 0),
      pendingCount: pendingTx._count,
      pendingAmount: Number(pendingTx._sum.amount ?? 0),
      failedCount: failedTx._count
    }
  }
}
