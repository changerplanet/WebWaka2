/**
 * Commerce Wallet Service
 * 
 * Ledger-based wallet operations for Customer, Vendor, and Platform wallets.
 * All balance changes go through the ledger - wallet.balance is just a cache.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type CommerceWalletType = 'CUSTOMER' | 'VENDOR' | 'PLATFORM'
type LedgerEntryType = 
  | 'CREDIT_ORDER_PAYMENT' | 'CREDIT_REFUND' | 'CREDIT_SALE_PROCEEDS' 
  | 'CREDIT_PLATFORM_FEE' | 'CREDIT_ADJUSTMENT' | 'CREDIT_TRANSFER_IN' | 'CREDIT_PAYOUT_REVERSAL'
  | 'DEBIT_ORDER_PAYMENT' | 'DEBIT_VENDOR_COMMISSION' | 'DEBIT_PLATFORM_FEE'
  | 'DEBIT_PAYOUT' | 'DEBIT_ADJUSTMENT' | 'DEBIT_TRANSFER_OUT' | 'DEBIT_CHARGEBACK'
  | 'HOLD_CREATED' | 'HOLD_RELEASED' | 'HOLD_CAPTURED'

interface CreateWalletParams {
  tenantId: string
  type: CommerceWalletType
  customerId?: string
  vendorId?: string
  currency?: string
  metadata?: Record<string, unknown>
}

interface LedgerEntryParams {
  walletId: string
  entryType: LedgerEntryType
  amount: number // Positive for credits, negative for debits
  description?: string
  referenceType?: string
  referenceId?: string
  counterpartyWalletId?: string
  holdId?: string
  idempotencyKey: string
  metadata?: Record<string, unknown>
  createdBy?: string
}

interface TransferParams {
  fromWalletId: string
  toWalletId: string
  amount: number
  description?: string
  referenceType?: string
  referenceId?: string
  idempotencyKey: string
  createdBy?: string
}

/**
 * Get or create a wallet for an owner
 */
export async function getOrCreateWallet(params: CreateWalletParams) {
  const { tenantId, type, customerId, vendorId, currency = 'USD', metadata } = params

  // Build where clause for findFirst (handles nullable fields better)
  const whereClause = {
    tenantId,
    type,
    customerId: customerId || null,
    vendorId: vendorId || null
  }

  // Try to find existing wallet
  let wallet = await prisma.commerceWallet.findFirst({ where: whereClause })

  if (!wallet) {
    // Create new wallet
    wallet = await prisma.commerceWallet.create({
      data: {
        tenantId,
        type,
        customerId: customerId || null,
        vendorId: vendorId || null,
        currency,
        balance: 0,
        pendingBalance: 0,
        availableBalance: 0,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
      }
    })
  }

  return wallet
}

/**
 * Get wallet by ID
 */
export async function getWallet(walletId: string) {
  return prisma.commerceWallet.findUnique({
    where: { id: walletId }
  })
}

/**
 * Get wallet with recent ledger entries
 */
export async function getWalletWithLedger(walletId: string, limit = 50) {
  const wallet = await prisma.commerceWallet.findUnique({
    where: { id: walletId },
    include: {
      ledgerEntries: {
        orderBy: { createdAt: 'desc' },
        take: limit
      }
    }
  })
  return wallet
}

/**
 * Create a ledger entry and update wallet balance
 * This is the core function - ALL balance changes go through here
 */
export async function createLedgerEntry(params: LedgerEntryParams) {
  const {
    walletId,
    entryType,
    amount,
    description,
    referenceType,
    referenceId,
    counterpartyWalletId,
    holdId,
    idempotencyKey,
    metadata,
    createdBy
  } = params

  // Use transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // Get wallet with lock
    const wallet = await tx.commerceWallet.findUnique({
      where: { id: walletId }
    })

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`)
    }

    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Wallet is not active: ${wallet.status}`)
    }

    // Check for duplicate idempotency key
    const existingEntry = await tx.commerceWalletLedger.findUnique({
      where: { idempotencyKey }
    })

    if (existingEntry) {
      // Return existing entry (idempotent)
      return { entry: existingEntry, wallet, isDuplicate: true }
    }

    // Calculate new balances based on entry type
    let newBalance = Number(wallet.balance)
    let newPendingBalance = Number(wallet.pendingBalance)

    // Determine if this is a credit, debit, or hold operation
    if (entryType.startsWith('CREDIT_')) {
      newBalance += amount
    } else if (entryType.startsWith('DEBIT_')) {
      // Check sufficient balance for debits
      if (newBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${newBalance}, Required: ${amount}`)
      }
      newBalance -= amount
    } else if (entryType === 'HOLD_CREATED') {
      // Hold reduces available balance but not total balance
      if (Number(wallet.availableBalance) < amount) {
        throw new Error(`Insufficient available balance for hold. Available: ${wallet.availableBalance}, Required: ${amount}`)
      }
      newPendingBalance += amount
    } else if (entryType === 'HOLD_RELEASED') {
      // Release hold back to available
      newPendingBalance -= amount
    } else if (entryType === 'HOLD_CAPTURED') {
      // Convert hold to actual debit
      newPendingBalance -= amount
      newBalance -= amount
    }

    const newAvailableBalance = newBalance - newPendingBalance

    // Create ledger entry
    const entry = await tx.commerceWalletLedger.create({
      data: {
        walletId,
        entryType,
        status: 'COMPLETED',
        amount: entryType.startsWith('DEBIT_') || entryType === 'HOLD_CAPTURED' ? -amount : amount,
        currency: wallet.currency,
        balanceAfter: newBalance,
        pendingBalanceAfter: newPendingBalance,
        availableBalanceAfter: newAvailableBalance,
        referenceType,
        referenceId,
        counterpartyWalletId,
        holdId,
        idempotencyKey,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        createdBy
      }
    })

    // Update wallet balance cache
    const updatedWallet = await tx.commerceWallet.update({
      where: { id: walletId },
      data: {
        balance: newBalance,
        pendingBalance: newPendingBalance,
        availableBalance: newAvailableBalance
      }
    })

    return { entry, wallet: updatedWallet, isDuplicate: false }
  })
}

/**
 * Transfer funds between wallets
 */
export async function transferFunds(params: TransferParams) {
  const {
    fromWalletId,
    toWalletId,
    amount,
    description,
    referenceType,
    referenceId,
    idempotencyKey,
    createdBy
  } = params

  if (amount <= 0) {
    throw new Error('Transfer amount must be positive')
  }

  // Use transaction for atomic transfer
  return prisma.$transaction(async (tx) => {
    // Get both wallets
    const fromWallet = await tx.commerceWallet.findUnique({ where: { id: fromWalletId } })
    const toWallet = await tx.commerceWallet.findUnique({ where: { id: toWalletId } })

    if (!fromWallet) throw new Error(`Source wallet not found: ${fromWalletId}`)
    if (!toWallet) throw new Error(`Destination wallet not found: ${toWalletId}`)
    if (fromWallet.status !== 'ACTIVE') throw new Error(`Source wallet is not active`)
    if (toWallet.status !== 'ACTIVE') throw new Error(`Destination wallet is not active`)
    if (Number(fromWallet.availableBalance) < amount) {
      throw new Error(`Insufficient balance. Available: ${fromWallet.availableBalance}, Required: ${amount}`)
    }

    // Check idempotency
    const existingDebit = await tx.commerceWalletLedger.findUnique({
      where: { idempotencyKey: `${idempotencyKey}_debit` }
    })
    if (existingDebit) {
      return { success: true, isDuplicate: true }
    }

    // Create debit entry (from wallet)
    const newFromBalance = Number(fromWallet.balance) - amount
    const newFromAvailable = newFromBalance - Number(fromWallet.pendingBalance)

    await tx.commerceWalletLedger.create({
      data: {
        walletId: fromWalletId,
        entryType: 'DEBIT_TRANSFER_OUT',
        status: 'COMPLETED',
        amount: -amount,
        currency: fromWallet.currency,
        balanceAfter: newFromBalance,
        pendingBalanceAfter: Number(fromWallet.pendingBalance),
        availableBalanceAfter: newFromAvailable,
        referenceType,
        referenceId,
        counterpartyWalletId: toWalletId,
        idempotencyKey: `${idempotencyKey}_debit`,
        description: description || `Transfer to wallet ${toWalletId}`,
        createdBy
      }
    })

    await tx.commerceWallet.update({
      where: { id: fromWalletId },
      data: {
        balance: newFromBalance,
        availableBalance: newFromAvailable
      }
    })

    // Create credit entry (to wallet)
    const newToBalance = Number(toWallet.balance) + amount
    const newToAvailable = newToBalance - Number(toWallet.pendingBalance)

    await tx.commerceWalletLedger.create({
      data: {
        walletId: toWalletId,
        entryType: 'CREDIT_TRANSFER_IN',
        status: 'COMPLETED',
        amount: amount,
        currency: toWallet.currency,
        balanceAfter: newToBalance,
        pendingBalanceAfter: Number(toWallet.pendingBalance),
        availableBalanceAfter: newToAvailable,
        referenceType,
        referenceId,
        counterpartyWalletId: fromWalletId,
        idempotencyKey: `${idempotencyKey}_credit`,
        description: description || `Transfer from wallet ${fromWalletId}`,
        createdBy
      }
    })

    await tx.commerceWallet.update({
      where: { id: toWalletId },
      data: {
        balance: newToBalance,
        availableBalance: newToAvailable
      }
    })

    return { success: true, isDuplicate: false }
  })
}

/**
 * Credit a wallet (add funds)
 */
export async function creditWallet(
  walletId: string,
  amount: number,
  entryType: LedgerEntryType,
  idempotencyKey: string,
  options?: {
    description?: string
    referenceType?: string
    referenceId?: string
    metadata?: Record<string, unknown>
    createdBy?: string
  }
) {
  if (!entryType.startsWith('CREDIT_')) {
    throw new Error(`Invalid credit entry type: ${entryType}`)
  }

  return createLedgerEntry({
    walletId,
    entryType,
    amount,
    idempotencyKey,
    ...options
  })
}

/**
 * Debit a wallet (remove funds)
 */
export async function debitWallet(
  walletId: string,
  amount: number,
  entryType: LedgerEntryType,
  idempotencyKey: string,
  options?: {
    description?: string
    referenceType?: string
    referenceId?: string
    metadata?: Record<string, unknown>
    createdBy?: string
  }
) {
  if (!entryType.startsWith('DEBIT_')) {
    throw new Error(`Invalid debit entry type: ${entryType}`)
  }

  return createLedgerEntry({
    walletId,
    entryType,
    amount,
    idempotencyKey,
    ...options
  })
}

/**
 * Create a hold on wallet funds
 */
export async function createHold(
  walletId: string,
  amount: number,
  holdId: string,
  options?: {
    description?: string
    referenceType?: string
    referenceId?: string
    createdBy?: string
  }
) {
  return createLedgerEntry({
    walletId,
    entryType: 'HOLD_CREATED',
    amount,
    holdId,
    idempotencyKey: `hold_create_${holdId}`,
    ...options
  })
}

/**
 * Release a hold (return funds to available)
 */
export async function releaseHold(
  walletId: string,
  amount: number,
  holdId: string,
  options?: {
    description?: string
    createdBy?: string
  }
) {
  return createLedgerEntry({
    walletId,
    entryType: 'HOLD_RELEASED',
    amount,
    holdId,
    idempotencyKey: `hold_release_${holdId}`,
    ...options
  })
}

/**
 * Capture a hold (convert to actual debit)
 */
export async function captureHold(
  walletId: string,
  amount: number,
  holdId: string,
  options?: {
    description?: string
    referenceType?: string
    referenceId?: string
    createdBy?: string
  }
) {
  return createLedgerEntry({
    walletId,
    entryType: 'HOLD_CAPTURED',
    amount,
    holdId,
    idempotencyKey: `hold_capture_${holdId}`,
    ...options
  })
}

/**
 * Recalculate wallet balance from ledger (for reconciliation)
 */
export async function recalculateBalance(walletId: string) {
  const entries = await prisma.commerceWalletLedger.findMany({
    where: { 
      walletId,
      status: 'COMPLETED'
    },
    orderBy: { createdAt: 'asc' }
  })

  let balance = 0
  let pendingBalance = 0
  const holds: Record<string, number> = {}

  for (const entry of entries) {
    if (entry.entryType.startsWith('CREDIT_')) {
      balance += Number(entry.amount)
    } else if (entry.entryType.startsWith('DEBIT_')) {
      balance += Number(entry.amount) // amount is negative for debits
    } else if (entry.entryType === 'HOLD_CREATED' && entry.holdId) {
      holds[entry.holdId] = Number(entry.amount)
      pendingBalance += Number(entry.amount)
    } else if (entry.entryType === 'HOLD_RELEASED' && entry.holdId) {
      pendingBalance -= holds[entry.holdId] || Number(entry.amount)
      delete holds[entry.holdId]
    } else if (entry.entryType === 'HOLD_CAPTURED' && entry.holdId) {
      balance += Number(entry.amount) // negative amount
      pendingBalance -= holds[entry.holdId] || Math.abs(Number(entry.amount))
      delete holds[entry.holdId]
    }
  }

  const availableBalance = balance - pendingBalance

  // Update wallet
  const wallet = await prisma.commerceWallet.update({
    where: { id: walletId },
    data: {
      balance,
      pendingBalance,
      availableBalance
    }
  })

  return { wallet, calculatedBalance: balance, pendingBalance, availableBalance, entryCount: entries.length }
}

/**
 * Get ledger entries for a wallet
 */
export async function getLedgerEntries(
  walletId: string,
  options?: {
    limit?: number
    offset?: number
    entryType?: LedgerEntryType
    referenceType?: string
    referenceId?: string
    startDate?: Date
    endDate?: Date
  }
) {
  const { limit = 50, offset = 0, entryType, referenceType, referenceId, startDate, endDate } = options || {}

  const where: Prisma.CommerceWalletLedgerWhereInput = { walletId }

  if (entryType) where.entryType = entryType
  if (referenceType) where.referenceType = referenceType
  if (referenceId) where.referenceId = referenceId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [entries, total] = await Promise.all([
    prisma.commerceWalletLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.commerceWalletLedger.count({ where })
  ])

  return { entries, total, limit, offset }
}
