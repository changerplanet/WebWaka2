/**
 * MVM Marketplace Config Service
 * 
 * Manages tenant-level marketplace configuration.
 * Nigeria-first defaults for commission, VAT, and payout settings.
 * 
 * @module lib/mvm/marketplace-config-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'

// ============================================================================
// DEFAULT VALUES (Nigeria-First)
// ============================================================================

const DEFAULTS = {
  defaultCommissionRate: 15,    // 15%
  vatRate: 7.5,                 // 7.5% Nigerian VAT
  payoutCycleDays: 14,          // Bi-weekly
  minPayoutAmount: 5000,        // ₦5,000
  clearanceDays: 7,             // 7 days after delivery
  autoApproveVendors: false,
  requireVerification: true,
  vendorPricing: true,
  vendorShipping: false
}

// ============================================================================
// TYPES
// ============================================================================

export interface UpdateMarketplaceConfigInput {
  marketplaceName?: string
  marketplaceSlug?: string
  description?: string
  logo?: string
  defaultCommissionRate?: number
  vatRate?: number
  autoApproveVendors?: boolean
  requireVerification?: boolean
  payoutCycleDays?: number
  minPayoutAmount?: number
  clearanceDays?: number
  vendorPricing?: boolean
  vendorShipping?: boolean
  isActive?: boolean
}

export interface MarketplaceConfigSummary {
  tenantId: string
  marketplaceName: string | null
  defaultCommissionRate: number
  vatRate: number
  payoutCycleDays: number
  minPayoutAmount: number
  clearanceDays: number
  autoApproveVendors: boolean
  requireVerification: boolean
  isActive: boolean
}

// ============================================================================
// MARKETPLACE CONFIG SERVICE
// ============================================================================

export const MarketplaceConfigService = {
  /**
   * Get or create marketplace config for tenant
   */
  async getOrCreate(tenantId: string, platformInstanceId?: string) {
    let config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId }
    })
    
    if (!config) {
      config = await prisma.mvm_marketplace_config.create({
        data: withPrismaDefaults({
          tenantId,
          platformInstanceId,
          defaultCommissionRate: DEFAULTS.defaultCommissionRate,
          vatRate: DEFAULTS.vatRate,
          payoutCycleDays: DEFAULTS.payoutCycleDays,
          minPayoutAmount: DEFAULTS.minPayoutAmount,
          clearanceDays: DEFAULTS.clearanceDays,
          autoApproveVendors: DEFAULTS.autoApproveVendors,
          requireVerification: DEFAULTS.requireVerification,
          vendorPricing: DEFAULTS.vendorPricing,
          vendorShipping: DEFAULTS.vendorShipping,
          isActive: true
        }) // AUTO-FIX: required by Prisma schema
      })
    }
    
    return config
  },
  
  /**
   * Get marketplace config
   */
  async get(tenantId: string) {
    return prisma.mvm_marketplace_config.findUnique({
      where: { tenantId }
    })
  },
  
  /**
   * Update marketplace config
   */
  async update(tenantId: string, input: UpdateMarketplaceConfigInput) {
    // Ensure config exists
    await this.getOrCreate(tenantId)
    
    return prisma.mvm_marketplace_config.update({
      where: { tenantId },
      data: input
    })
  },
  
  /**
   * Get config summary (for display)
   */
  async getSummary(tenantId: string): Promise<MarketplaceConfigSummary> {
    const config = await this.getOrCreate(tenantId)
    
    return {
      tenantId: config.tenantId,
      marketplaceName: config.marketplaceName,
      defaultCommissionRate: config.defaultCommissionRate.toNumber(),
      vatRate: config.vatRate.toNumber(),
      payoutCycleDays: config.payoutCycleDays,
      minPayoutAmount: config.minPayoutAmount.toNumber(),
      clearanceDays: config.clearanceDays,
      autoApproveVendors: config.autoApproveVendors,
      requireVerification: config.requireVerification,
      isActive: config.isActive
    }
  },
  
  /**
   * Check if marketplace is active
   */
  async isActive(tenantId: string): Promise<boolean> {
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId },
      select: { isActive: true }
    })
    
    return config?.isActive ?? false
  },
  
  /**
   * Activate marketplace
   */
  async activate(tenantId: string) {
    await this.getOrCreate(tenantId)
    
    return prisma.mvm_marketplace_config.update({
      where: { tenantId },
      data: { isActive: true }
    })
  },
  
  /**
   * Deactivate marketplace
   */
  async deactivate(tenantId: string) {
    return prisma.mvm_marketplace_config.update({
      where: { tenantId },
      data: { isActive: false }
    })
  },
  
  /**
   * Get commission rate (for calculations)
   */
  async getCommissionRate(tenantId: string): Promise<number> {
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId },
      select: { defaultCommissionRate: true }
    })
    
    return config?.defaultCommissionRate?.toNumber() ?? DEFAULTS.defaultCommissionRate
  },
  
  /**
   * Get VAT rate (for calculations)
   */
  async getVatRate(tenantId: string): Promise<number> {
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId },
      select: { vatRate: true }
    })
    
    return config?.vatRate?.toNumber() ?? DEFAULTS.vatRate
  },
  
  /**
   * Get clearance days (for commission clearing)
   */
  async getClearanceDays(tenantId: string): Promise<number> {
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId },
      select: { clearanceDays: true }
    })
    
    return config?.clearanceDays ?? DEFAULTS.clearanceDays
  },
  
  /**
   * Check if vendor auto-approval is enabled
   */
  async isAutoApproveEnabled(tenantId: string): Promise<boolean> {
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId },
      select: { autoApproveVendors: true }
    })
    
    return config?.autoApproveVendors ?? false
  },
  
  /**
   * Update commission rate
   */
  async updateCommissionRate(tenantId: string, rate: number) {
    if (rate < 0 || rate > 100) {
      throw new Error('Commission rate must be between 0 and 100')
    }
    
    await this.getOrCreate(tenantId)
    
    return prisma.mvm_marketplace_config.update({
      where: { tenantId },
      data: { defaultCommissionRate: rate }
    })
  },
  
  /**
   * Update payout settings
   */
  async updatePayoutSettings(
    tenantId: string,
    settings: {
      payoutCycleDays?: number
      minPayoutAmount?: number
      clearanceDays?: number
    }
  ) {
    await this.getOrCreate(tenantId)
    
    return prisma.mvm_marketplace_config.update({
      where: { tenantId },
      data: settings
    })
  },
  
  /**
   * Reset to defaults
   */
  async resetToDefaults(tenantId: string) {
    return prisma.mvm_marketplace_config.update({
      where: { tenantId },
      data: {
        defaultCommissionRate: DEFAULTS.defaultCommissionRate,
        vatRate: DEFAULTS.vatRate,
        payoutCycleDays: DEFAULTS.payoutCycleDays,
        minPayoutAmount: DEFAULTS.minPayoutAmount,
        clearanceDays: DEFAULTS.clearanceDays,
        autoApproveVendors: DEFAULTS.autoApproveVendors,
        requireVerification: DEFAULTS.requireVerification,
        vendorPricing: DEFAULTS.vendorPricing,
        vendorShipping: DEFAULTS.vendorShipping
      }
    })
  }
}
