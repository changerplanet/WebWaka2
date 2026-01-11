/**
 * MODULE 9: B2B & WHOLESALE
 * Configuration Service
 * 
 * PHASE 0 & 1: Module Constitution & Domain Setup
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface B2BConfig {
  id: string
  tenantId: string
  b2bEnabled: boolean
  wholesalePricing: boolean
  creditSalesEnabled: boolean
  bulkOrderingEnabled: boolean
  defaultCreditDays: number
  defaultCreditLimit: number
  defaultMinOrderValue: number
  defaultCurrency: string
  wholesaleTaxExempt: boolean
  vatRate: number
  creditApprovalRequired: boolean
  autoApproveBelow: number
  negotiatedPricingEnabled: boolean
  manualOverrideEnabled: boolean
}

export interface B2BStatus {
  initialized: boolean
  config: B2BConfig | null
  statistics: {
    totalB2BCustomers: number
    activePriceTiers: number
    activeCreditTerms: number
    pendingInvoices: number
    totalCreditExposure: number
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export class B2BConfigService {
  /**
   * Get B2B status for tenant
   */
  static async getStatus(tenantId: string): Promise<B2BStatus> {
    const config = await prisma.b2b_configurations.findUnique({
      where: { tenantId },
    })

    if (!config) {
      return {
        initialized: false,
        config: null,
        statistics: {
          totalB2BCustomers: 0,
          activePriceTiers: 0,
          activeCreditTerms: 0,
          pendingInvoices: 0,
          totalCreditExposure: 0,
        },
      }
    }

    // Get statistics
    const [
      totalB2BCustomers,
      activePriceTiers,
      activeCreditTerms,
      pendingInvoices,
      creditExposure,
    ] = await Promise.all([
      prisma.b2b_customer_profiles.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.b2b_price_tiers.count({ where: { tenantId, isActive: true } }),
      prisma.b2b_credit_terms.count({ where: { tenantId, isActive: true } }),
      prisma.b2b_invoices.count({ where: { tenantId, status: { in: ['SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'] } } }),
      prisma.b2b_customer_profiles.aggregate({
        where: { tenantId, status: 'ACTIVE' },
        _sum: { creditUsed: true },
      }),
    ])

    return {
      initialized: true,
      config: {
        id: config.id,
        tenantId: config.tenantId,
        b2bEnabled: config.b2bEnabled,
        wholesalePricing: config.wholesalePricing,
        creditSalesEnabled: config.creditSalesEnabled,
        bulkOrderingEnabled: config.bulkOrderingEnabled,
        defaultCreditDays: config.defaultCreditDays,
        defaultCreditLimit: config.defaultCreditLimit.toNumber(),
        defaultMinOrderValue: config.defaultMinOrderValue.toNumber(),
        defaultCurrency: config.defaultCurrency,
        wholesaleTaxExempt: config.wholesaleTaxExempt,
        vatRate: config.vatRate.toNumber(),
        creditApprovalRequired: config.creditApprovalRequired,
        autoApproveBelow: config.autoApproveBelow.toNumber(),
        negotiatedPricingEnabled: config.negotiatedPricingEnabled,
        manualOverrideEnabled: config.manualOverrideEnabled,
      },
      statistics: {
        totalB2BCustomers,
        activePriceTiers,
        activeCreditTerms,
        pendingInvoices,
        totalCreditExposure: creditExposure._sum.creditUsed?.toNumber() || 0,
      },
    }
  }

  /**
   * Initialize B2B for tenant
   */
  static async initialize(tenantId: string, options?: Partial<B2BConfig>): Promise<B2BConfig> {
    const config = await prisma.b2b_configurations.upsert({
      where: { tenantId },
      create: withPrismaDefaults({
        tenantId,
        b2bEnabled: options?.b2bEnabled ?? true,
        wholesalePricing: options?.wholesalePricing ?? true,
        creditSalesEnabled: options?.creditSalesEnabled ?? false,
        bulkOrderingEnabled: options?.bulkOrderingEnabled ?? true,
        defaultCreditDays: options?.defaultCreditDays ?? 30,
        defaultCreditLimit: options?.defaultCreditLimit ?? 0,
        defaultMinOrderValue: options?.defaultMinOrderValue ?? 0,
        defaultCurrency: options?.defaultCurrency ?? 'NGN',
        negotiatedPricingEnabled: options?.negotiatedPricingEnabled ?? true,
        manualOverrideEnabled: options?.manualOverrideEnabled ?? true,
      }),
      update: {},
    })

    // Create default price tiers
    await this.createDefaultPriceTiers(tenantId)
    
    // Create default credit terms
    await this.createDefaultCreditTerms(tenantId)

    return {
      id: config.id,
      tenantId: config.tenantId,
      b2bEnabled: config.b2bEnabled,
      wholesalePricing: config.wholesalePricing,
      creditSalesEnabled: config.creditSalesEnabled,
      bulkOrderingEnabled: config.bulkOrderingEnabled,
      defaultCreditDays: config.defaultCreditDays,
      defaultCreditLimit: config.defaultCreditLimit.toNumber(),
      defaultMinOrderValue: config.defaultMinOrderValue.toNumber(),
      defaultCurrency: config.defaultCurrency,
      wholesaleTaxExempt: config.wholesaleTaxExempt,
      vatRate: config.vatRate.toNumber(),
      creditApprovalRequired: config.creditApprovalRequired,
      autoApproveBelow: config.autoApproveBelow.toNumber(),
      negotiatedPricingEnabled: config.negotiatedPricingEnabled,
      manualOverrideEnabled: config.manualOverrideEnabled,
    }
  }

  /**
   * Update B2B configuration
   */
  static async updateConfig(tenantId: string, updates: Partial<B2BConfig>): Promise<B2BConfig> {
    const config = await prisma.b2b_configurations.update({
      where: { tenantId },
      data: {
        b2bEnabled: updates.b2bEnabled,
        wholesalePricing: updates.wholesalePricing,
        creditSalesEnabled: updates.creditSalesEnabled,
        bulkOrderingEnabled: updates.bulkOrderingEnabled,
        defaultCreditDays: updates.defaultCreditDays,
        defaultCreditLimit: updates.defaultCreditLimit,
        defaultMinOrderValue: updates.defaultMinOrderValue,
        negotiatedPricingEnabled: updates.negotiatedPricingEnabled,
        manualOverrideEnabled: updates.manualOverrideEnabled,
      },
    })

    return {
      id: config.id,
      tenantId: config.tenantId,
      b2bEnabled: config.b2bEnabled,
      wholesalePricing: config.wholesalePricing,
      creditSalesEnabled: config.creditSalesEnabled,
      bulkOrderingEnabled: config.bulkOrderingEnabled,
      defaultCreditDays: config.defaultCreditDays,
      defaultCreditLimit: config.defaultCreditLimit.toNumber(),
      defaultMinOrderValue: config.defaultMinOrderValue.toNumber(),
      defaultCurrency: config.defaultCurrency,
      wholesaleTaxExempt: config.wholesaleTaxExempt,
      vatRate: config.vatRate.toNumber(),
      creditApprovalRequired: config.creditApprovalRequired,
      autoApproveBelow: config.autoApproveBelow.toNumber(),
      negotiatedPricingEnabled: config.negotiatedPricingEnabled,
      manualOverrideEnabled: config.manualOverrideEnabled,
    }
  }

  /**
   * Create default price tiers
   */
  private static async createDefaultPriceTiers(tenantId: string): Promise<void> {
    const defaultTiers = [
      { name: 'Standard Retailer', code: 'STANDARD', defaultDiscount: 0, priority: 1, minOrderValue: 0 },
      { name: 'Silver Partner', code: 'SILVER', defaultDiscount: 5, priority: 2, minOrderValue: 50000 },
      { name: 'Gold Partner', code: 'GOLD', defaultDiscount: 10, priority: 3, minOrderValue: 200000 },
      { name: 'Platinum Partner', code: 'PLATINUM', defaultDiscount: 15, priority: 4, minOrderValue: 500000 },
    ]

    for (const tier of defaultTiers) {
      await prisma.b2b_price_tiers.upsert({
        where: { tenantId_code: { tenantId, code: tier.code } },
        create: {
          tenantId,
          name: tier.name,
          code: tier.code,
          defaultDiscount: tier.defaultDiscount,
          priority: tier.priority,
          minOrderValue: tier.minOrderValue,
          description: `${tier.defaultDiscount}% discount tier`,
        },
        update: {},
      })
    }
  }

  /**
   * Create default credit terms
   */
  private static async createDefaultCreditTerms(tenantId: string): Promise<void> {
    const defaultTerms = [
      { name: 'Net 7', code: 'NET7', creditDays: 7, description: 'Payment due within 7 days' },
      { name: 'Net 14', code: 'NET14', creditDays: 14, description: 'Payment due within 14 days' },
      { name: 'Net 30', code: 'NET30', creditDays: 30, description: 'Payment due within 30 days' },
      { name: 'Net 60', code: 'NET60', creditDays: 60, description: 'Payment due within 60 days' },
    ]

    for (const term of defaultTerms) {
      await prisma.b2b_credit_terms.upsert({
        where: { tenantId_code: { tenantId, code: term.code } },
        create: {
          tenantId,
          name: term.name,
          code: term.code,
          creditDays: term.creditDays,
          description: term.description,
        },
        update: {},
      })
    }
  }
}
