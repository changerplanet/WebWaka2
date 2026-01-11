/**
 * MODULE 10: PAYMENTS & WALLETS
 * Configuration Service
 * 
 * PHASE 0 & 1: Module Constitution & Domain Setup
 * 
 * 🚨 CRITICAL MONEY RULES:
 * - Only this module mutates balances
 * - Only this module executes payments
 * - All other modules request, never act
 * - Every mutation is auditable
 * - Ledger-first, wallet-second
 */

import { prisma } from '@/lib/prisma'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface PayConfig {
  id: string
  tenantId: string
  paymentsEnabled: boolean
  walletsEnabled: boolean
  refundsEnabled: boolean
  defaultCurrency: string
  supportedCurrencies: string[]
  cashEnabled: boolean
  cardEnabled: boolean
  bankTransferEnabled: boolean
  mobileMoneyEnabled: boolean
  paystackEnabled: boolean
  flutterwaveEnabled: boolean
  autoSettlement: boolean
  settlementSchedule: string
  settlementThreshold: number
  vendorPayoutsEnabled: boolean
  platformCommission: number
  offlineCashEnabled: boolean
}

export interface PayStatus {
  initialized: boolean
  config: PayConfig | null
  statistics: {
    totalWallets: number
    totalBalance: number
    pendingPayments: number
    todayVolume: number
    pendingSettlements: number
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export class PayConfigService {
  /**
   * Get payment status for tenant
   */
  static async getStatus(tenantId: string): Promise<PayStatus> {
    const config = await prisma.pay_configurations.findUnique({
      where: { tenantId },
    })

    if (!config) {
      return {
        initialized: false,
        config: null,
        statistics: {
          totalWallets: 0,
          totalBalance: 0,
          pendingPayments: 0,
          todayVolume: 0,
          pendingSettlements: 0,
        },
      }
    }

    // Get statistics
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      totalWallets,
      walletBalance,
      pendingPayments,
      todayVolume,
      pendingSettlements,
    ] = await Promise.all([
      prisma.pay_wallets.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.pay_wallets.aggregate({
        where: { tenantId, status: 'ACTIVE' },
        _sum: { balance: true },
      }),
      prisma.pay_payment_intents.count({ where: { tenantId, status: { in: ['CREATED', 'PROCESSING'] } } }),
      prisma.pay_payment_transactions.aggregate({
        where: { tenantId, status: 'CONFIRMED', confirmedAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.paySettlement.count({ where: { tenantId, status: { in: ['PENDING', 'CALCULATED', 'APPROVED'] } } }),
    ])

    return {
      initialized: true,
      config: {
        id: config.id,
        tenantId: config.tenantId,
        paymentsEnabled: config.paymentsEnabled,
        walletsEnabled: config.walletsEnabled,
        refundsEnabled: config.refundsEnabled,
        defaultCurrency: config.defaultCurrency,
        supportedCurrencies: config.supportedCurrencies as string[],
        cashEnabled: config.cashEnabled,
        cardEnabled: config.cardEnabled,
        bankTransferEnabled: config.bankTransferEnabled,
        mobileMoneyEnabled: config.mobileMoneyEnabled,
        paystackEnabled: config.paystackEnabled,
        flutterwaveEnabled: config.flutterwaveEnabled,
        autoSettlement: config.autoSettlement,
        settlementSchedule: config.settlementSchedule,
        settlementThreshold: config.settlementThreshold.toNumber(),
        vendorPayoutsEnabled: config.vendorPayoutsEnabled,
        platformCommission: config.platformCommission.toNumber(),
        offlineCashEnabled: config.offlineCashEnabled,
      },
      statistics: {
        totalWallets,
        totalBalance: walletBalance._sum.balance?.toNumber() || 0,
        pendingPayments,
        todayVolume: todayVolume._sum.amount?.toNumber() || 0,
        pendingSettlements,
      },
    }
  }

  /**
   * Initialize payments for tenant
   */
  static async initialize(tenantId: string, options?: Partial<PayConfig>): Promise<PayConfig> {
    const config = await prisma.pay_configurations.upsert({
      where: { tenantId },
      create: withPrismaDefaults({
        tenantId,
        paymentsEnabled: options?.paymentsEnabled ?? true,
        walletsEnabled: options?.walletsEnabled ?? true,
        refundsEnabled: options?.refundsEnabled ?? true,
        defaultCurrency: options?.defaultCurrency ?? 'NGN',
        supportedCurrencies: options?.supportedCurrencies ?? ['NGN'],
        cashEnabled: options?.cashEnabled ?? true,
        cardEnabled: options?.cardEnabled ?? false,
        bankTransferEnabled: options?.bankTransferEnabled ?? true,
        mobileMoneyEnabled: options?.mobileMoneyEnabled ?? false,
        offlineCashEnabled: options?.offlineCashEnabled ?? true,
      }),
      update: {},
    })

    // Create business wallet
    await this.createBusinessWallet(tenantId, config.defaultCurrency)

    // Create platform wallet
    await this.createPlatformWallet(tenantId, config.defaultCurrency)

    return {
      id: config.id,
      tenantId: config.tenantId,
      paymentsEnabled: config.paymentsEnabled,
      walletsEnabled: config.walletsEnabled,
      refundsEnabled: config.refundsEnabled,
      defaultCurrency: config.defaultCurrency,
      supportedCurrencies: config.supportedCurrencies as string[],
      cashEnabled: config.cashEnabled,
      cardEnabled: config.cardEnabled,
      bankTransferEnabled: config.bankTransferEnabled,
      mobileMoneyEnabled: config.mobileMoneyEnabled,
      paystackEnabled: config.paystackEnabled,
      flutterwaveEnabled: config.flutterwaveEnabled,
      autoSettlement: config.autoSettlement,
      settlementSchedule: config.settlementSchedule,
      settlementThreshold: config.settlementThreshold.toNumber(),
      vendorPayoutsEnabled: config.vendorPayoutsEnabled,
      platformCommission: config.platformCommission.toNumber(),
      offlineCashEnabled: config.offlineCashEnabled,
    }
  }

  /**
   * Update payment configuration
   */
  static async updateConfig(tenantId: string, updates: Partial<PayConfig>): Promise<PayConfig> {
    const config = await prisma.pay_configurations.update({
      where: { tenantId },
      data: {
        paymentsEnabled: updates.paymentsEnabled,
        walletsEnabled: updates.walletsEnabled,
        refundsEnabled: updates.refundsEnabled,
        cashEnabled: updates.cashEnabled,
        cardEnabled: updates.cardEnabled,
        bankTransferEnabled: updates.bankTransferEnabled,
        mobileMoneyEnabled: updates.mobileMoneyEnabled,
        offlineCashEnabled: updates.offlineCashEnabled,
        autoSettlement: updates.autoSettlement,
        settlementSchedule: updates.settlementSchedule,
        settlementThreshold: updates.settlementThreshold,
        vendorPayoutsEnabled: updates.vendorPayoutsEnabled,
        platformCommission: updates.platformCommission,
      },
    })

    return {
      id: config.id,
      tenantId: config.tenantId,
      paymentsEnabled: config.paymentsEnabled,
      walletsEnabled: config.walletsEnabled,
      refundsEnabled: config.refundsEnabled,
      defaultCurrency: config.defaultCurrency,
      supportedCurrencies: config.supportedCurrencies as string[],
      cashEnabled: config.cashEnabled,
      cardEnabled: config.cardEnabled,
      bankTransferEnabled: config.bankTransferEnabled,
      mobileMoneyEnabled: config.mobileMoneyEnabled,
      paystackEnabled: config.paystackEnabled,
      flutterwaveEnabled: config.flutterwaveEnabled,
      autoSettlement: config.autoSettlement,
      settlementSchedule: config.settlementSchedule,
      settlementThreshold: config.settlementThreshold.toNumber(),
      vendorPayoutsEnabled: config.vendorPayoutsEnabled,
      platformCommission: config.platformCommission.toNumber(),
      offlineCashEnabled: config.offlineCashEnabled,
    }
  }

  /**
   * Create business wallet for tenant
   */
  private static async createBusinessWallet(tenantId: string, currency: string) {
    const walletNumber = `BIZ-${tenantId.slice(0, 8).toUpperCase()}`
    
    await prisma.pay_wallets.upsert({
      where: { tenantId_walletNumber: { tenantId, walletNumber } },
      create: {
        tenantId,
        ownerType: 'BUSINESS',
        walletNumber,
        name: 'Business Wallet',
        currency,
      },
      update: {},
    })
  }

  /**
   * Create platform wallet for fees
   */
  private static async createPlatformWallet(tenantId: string, currency: string) {
    const walletNumber = `PLT-${tenantId.slice(0, 8).toUpperCase()}`
    
    await prisma.pay_wallets.upsert({
      where: { tenantId_walletNumber: { tenantId, walletNumber } },
      create: {
        tenantId,
        ownerType: 'PLATFORM',
        walletNumber,
        name: 'Platform Fees Wallet',
        currency,
      },
      update: {},
    })
  }
}
