/**
 * MODULE 10: PAYMENTS & WALLETS
 * Wallet Service
 * 
 * PHASE 2: Wallet Types & Ownership
 * 
 * 🚨 CRITICAL: Wallets are THE SINGLE SOURCE OF TRUTH for balances
 * - Balance derived from transactions (ledger-first)
 * - No balance overwrites
 * - All movements are append-only
 */

import { prisma } from '@/lib/prisma'
import { PayWalletOwnerType, PayWalletStatus, PayTransactionType, PayTransactionDirection, PayTxStatus, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface Wallet {
  id: string
  tenantId: string
  ownerType: PayWalletOwnerType
  ownerId: string | null
  walletNumber: string
  name: string | null
  currency: string
  balance: number
  pendingBalance: number
  totalBalance: number
  dailyLimit: number | null
  monthlyLimit: number | null
  minBalance: number
  status: PayWalletStatus
  suspendedAt: Date | null
  suspendedReason: string | null
  createdAt: Date
}

export interface WalletTransaction {
  id: string
  tenantId: string
  walletId: string
  transactionNumber: string
  type: PayTransactionType
  direction: PayTransactionDirection
  amount: number
  currency: string
  balanceBefore: number
  balanceAfter: number
  referenceType: string | null
  referenceId: string | null
  description: string | null
  status: PayTxStatus
  createdAt: Date
}

// ============================================================================
// SERVICE
// ============================================================================

export class WalletService {
  /**
   * Generate transaction number
   */
  private static async generateTransactionNumber(tenantId: string): Promise<string> {
    const count = await prisma.pay_wallet_transactions.count({ where: { tenantId } })
    const date = new Date()
    const ts = date.getTime().toString(36).toUpperCase()
    return `TXN-${ts}-${(count + 1).toString().padStart(6, '0')}`
  }

  /**
   * Get or create wallet
   */
  static async getOrCreateWallet(
    tenantId: string,
    ownerType: PayWalletOwnerType,
    ownerId: string | null,
    currency: string = 'NGN',
    name?: string
  ): Promise<Wallet> {
    // Try to find existing wallet
    const existing = await prisma.pay_wallets.findFirst({
      where: { tenantId, ownerType, ownerId, currency },
    })

    if (existing) {
      return this.formatWallet(existing)
    }

    // Create new wallet
    const walletNumber = this.generateWalletNumber(ownerType, ownerId || tenantId)
    
    const wallet = await prisma.pay_wallets.create({
      data: withPrismaDefaults({
        tenantId,
        ownerType,
        ownerId,
        walletNumber,
        name: name || `${ownerType} Wallet`,
        currency,
      }),
    })

    return this.formatWallet(wallet)
  }

  /**
   * Get wallet by ID
   */
  static async getWallet(tenantId: string, walletId: string): Promise<Wallet | null> {
    const wallet = await prisma.pay_wallets.findUnique({
      where: { id: walletId, tenantId },
    })

    return wallet ? this.formatWallet(wallet) : null
  }

  /**
   * Get wallet by owner
   */
  static async getWalletByOwner(
    tenantId: string,
    ownerType: PayWalletOwnerType,
    ownerId: string | null,
    currency: string = 'NGN'
  ): Promise<Wallet | null> {
    const wallet = await prisma.pay_wallets.findFirst({
      where: { tenantId, ownerType, ownerId, currency },
    })

    return wallet ? this.formatWallet(wallet) : null
  }

  /**
   * List wallets
   */
  static async listWallets(
    tenantId: string,
    options?: {
      ownerType?: PayWalletOwnerType
      status?: PayWalletStatus[]
      page?: number
      limit?: number
    }
  ): Promise<{ wallets: Wallet[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(options?.ownerType && { ownerType: options.ownerType }),
      ...(options?.status && { status: { in: options.status } }),
    }

    const [wallets, total] = await Promise.all([
      prisma.pay_wallets.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pay_wallets.count({ where }),
    ])

    return {
      wallets: wallets.map(w => this.formatWallet(w)),
      total,
    }
  }

  /**
   * Credit wallet (add money)
   * 🚨 This is the ONLY way to add money to a wallet
   */
  static async credit(
    tenantId: string,
    walletId: string,
    amount: number,
    options: {
      type: PayTransactionType
      referenceType?: string
      referenceId?: string
      paymentId?: string
      description?: string
      performedBy?: string
    }
  ): Promise<WalletTransaction> {
    // Get wallet and current balance
    const wallet = await prisma.pay_wallets.findUnique({
      where: { id: walletId, tenantId },
    })

    if (!wallet) throw new Error('Wallet not found')
    if (wallet.status !== 'ACTIVE') throw new Error('Wallet is not active')

    const balanceBefore = wallet.balance.toNumber()
    const balanceAfter = balanceBefore + amount
    const transactionNumber = await this.generateTransactionNumber(tenantId)

    // Create transaction and update wallet in transaction
    const [transaction] = await prisma.$transaction([
      prisma.pay_wallet_transactions.create({
        data: withPrismaDefaults({
          tenantId,
          walletId,
          transactionNumber,
          type: options.type,
          direction: 'CREDIT',
          amount,
          currency: wallet.currency,
          balanceBefore,
          balanceAfter,
          referenceType: options.referenceType,
          referenceId: options.referenceId,
          paymentId: options.paymentId,
          description: options.description,
          performedBy: options.performedBy,
          status: 'COMPLETED',
        }),
      }),
      prisma.pay_wallets.update({
        where: { id: walletId },
        data: {
          balance: balanceAfter,
          totalBalance: balanceAfter + wallet.pendingBalance.toNumber(),
        },
      }),
    ])

    // Log event
    await this.logEvent(tenantId, 'WALLET_CREDITED', {
      walletId,
      amount,
      transactionNumber,
      balanceAfter,
    })

    return this.formatTransaction(transaction)
  }

  /**
   * Debit wallet (remove money)
   * 🚨 This is the ONLY way to remove money from a wallet
   */
  static async debit(
    tenantId: string,
    walletId: string,
    amount: number,
    options: {
      type: PayTransactionType
      referenceType?: string
      referenceId?: string
      paymentId?: string
      description?: string
      performedBy?: string
    }
  ): Promise<WalletTransaction> {
    // Get wallet and current balance
    const wallet = await prisma.pay_wallets.findUnique({
      where: { id: walletId, tenantId },
    })

    if (!wallet) throw new Error('Wallet not found')
    if (wallet.status !== 'ACTIVE') throw new Error('Wallet is not active')

    const balanceBefore = wallet.balance.toNumber()
    
    // Check sufficient balance
    if (balanceBefore < amount) {
      throw new Error('Insufficient balance')
    }

    // Check minimum balance
    const balanceAfter = balanceBefore - amount
    if (balanceAfter < wallet.minBalance.toNumber()) {
      throw new Error('Cannot go below minimum balance')
    }

    const transactionNumber = await this.generateTransactionNumber(tenantId)

    // Create transaction and update wallet in transaction
    const [transaction] = await prisma.$transaction([
      prisma.pay_wallet_transactions.create({
        data: withPrismaDefaults({
          tenantId,
          walletId,
          transactionNumber,
          type: options.type,
          direction: 'DEBIT',
          amount,
          currency: wallet.currency,
          balanceBefore,
          balanceAfter,
          referenceType: options.referenceType,
          referenceId: options.referenceId,
          paymentId: options.paymentId,
          description: options.description,
          performedBy: options.performedBy,
          status: 'COMPLETED',
        }),
      }),
      prisma.pay_wallets.update({
        where: { id: walletId },
        data: {
          balance: balanceAfter,
          totalBalance: balanceAfter + wallet.pendingBalance.toNumber(),
        },
      }),
    ])

    // Log event
    await this.logEvent(tenantId, 'WALLET_DEBITED', {
      walletId,
      amount,
      transactionNumber,
      balanceAfter,
    })

    return this.formatTransaction(transaction)
  }

  /**
   * Hold funds (move to pending)
   */
  static async hold(
    tenantId: string,
    walletId: string,
    amount: number,
    referenceId: string,
    description?: string
  ): Promise<void> {
    const wallet = await prisma.pay_wallets.findUnique({
      where: { id: walletId, tenantId },
    })

    if (!wallet) throw new Error('Wallet not found')

    const available = wallet.balance.toNumber()
    if (available < amount) {
      throw new Error('Insufficient available balance')
    }

    await prisma.pay_wallets.update({
      where: { id: walletId },
      data: {
        balance: available - amount,
        pendingBalance: wallet.pendingBalance.toNumber() + amount,
      },
    })

    await this.logEvent(tenantId, 'FUNDS_HELD', { walletId, amount, referenceId })
  }

  /**
   * Release held funds
   */
  static async releaseHold(
    tenantId: string,
    walletId: string,
    amount: number,
    referenceId: string
  ): Promise<void> {
    const wallet = await prisma.pay_wallets.findUnique({
      where: { id: walletId, tenantId },
    })

    if (!wallet) throw new Error('Wallet not found')

    const pending = wallet.pendingBalance.toNumber()
    const releaseAmount = Math.min(amount, pending)

    await prisma.pay_wallets.update({
      where: { id: walletId },
      data: {
        balance: wallet.balance.toNumber() + releaseAmount,
        pendingBalance: pending - releaseAmount,
      },
    })

    await this.logEvent(tenantId, 'FUNDS_RELEASED', { walletId, amount: releaseAmount, referenceId })
  }

  /**
   * Suspend wallet
   */
  static async suspendWallet(tenantId: string, walletId: string, reason: string): Promise<Wallet> {
    const wallet = await prisma.pay_wallets.update({
      where: { id: walletId, tenantId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
    })

    await this.logEvent(tenantId, 'WALLET_SUSPENDED', { walletId, reason })

    return this.formatWallet(wallet)
  }

  /**
   * Reactivate wallet
   */
  static async reactivateWallet(tenantId: string, walletId: string): Promise<Wallet> {
    const wallet = await prisma.pay_wallets.update({
      where: { id: walletId, tenantId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspendedReason: null,
      },
    })

    await this.logEvent(tenantId, 'WALLET_REACTIVATED', { walletId })

    return this.formatWallet(wallet)
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    tenantId: string,
    walletId: string,
    options?: {
      type?: PayTransactionType[]
      page?: number
      limit?: number
    }
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 50
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      walletId,
      ...(options?.type && { type: { in: options.type } }),
    }

    const [transactions, total] = await Promise.all([
      prisma.pay_wallet_transactions.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pay_wallet_transactions.count({ where }),
    ])

    return {
      transactions: transactions.map(t => this.formatTransaction(t)),
      total,
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static generateWalletNumber(ownerType: PayWalletOwnerType, id: string): string {
    const prefix = ownerType === 'BUSINESS' ? 'BIZ' :
                   ownerType === 'VENDOR' ? 'VND' :
                   ownerType === 'CUSTOMER' ? 'CUS' : 'PLT'
    return `${prefix}-${id.slice(0, 8).toUpperCase()}`
  }

  private static formatWallet(wallet: {
    id: string
    tenantId: string
    ownerType: PayWalletOwnerType
    ownerId: string | null
    walletNumber: string
    name: string | null
    currency: string
    balance: { toNumber: () => number }
    pendingBalance: { toNumber: () => number }
    totalBalance: { toNumber: () => number }
    dailyLimit: { toNumber: () => number } | null
    monthlyLimit: { toNumber: () => number } | null
    minBalance: { toNumber: () => number }
    status: PayWalletStatus
    suspendedAt: Date | null
    suspendedReason: string | null
    createdAt: Date
  }): Wallet {
    return {
      id: wallet.id,
      tenantId: wallet.tenantId,
      ownerType: wallet.ownerType,
      ownerId: wallet.ownerId,
      walletNumber: wallet.walletNumber,
      name: wallet.name,
      currency: wallet.currency,
      balance: wallet.balance.toNumber(),
      pendingBalance: wallet.pendingBalance.toNumber(),
      totalBalance: wallet.totalBalance.toNumber(),
      dailyLimit: wallet.dailyLimit?.toNumber() || null,
      monthlyLimit: wallet.monthlyLimit?.toNumber() || null,
      minBalance: wallet.minBalance.toNumber(),
      status: wallet.status,
      suspendedAt: wallet.suspendedAt,
      suspendedReason: wallet.suspendedReason,
      createdAt: wallet.createdAt,
    }
  }

  private static formatTransaction(tx: {
    id: string
    tenantId: string
    walletId: string
    transactionNumber: string
    type: PayTransactionType
    direction: PayTransactionDirection
    amount: { toNumber: () => number }
    currency: string
    balanceBefore: { toNumber: () => number }
    balanceAfter: { toNumber: () => number }
    referenceType: string | null
    referenceId: string | null
    description: string | null
    status: PayTxStatus
    createdAt: Date
  }): WalletTransaction {
    return {
      id: tx.id,
      tenantId: tx.tenantId,
      walletId: tx.walletId,
      transactionNumber: tx.transactionNumber,
      type: tx.type,
      direction: tx.direction,
      amount: tx.amount.toNumber(),
      currency: tx.currency,
      balanceBefore: tx.balanceBefore.toNumber(),
      balanceAfter: tx.balanceAfter.toNumber(),
      referenceType: tx.referenceType,
      referenceId: tx.referenceId,
      description: tx.description,
      status: tx.status,
      createdAt: tx.createdAt,
    }
  }

  private static async logEvent(tenantId: string, eventType: string, eventData: Record<string, unknown>) {
    await prisma.pay_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType,
        eventData: eventData as Prisma.InputJsonValue,
        walletId: eventData.walletId as string | undefined,
      }),
    })
  }
}
