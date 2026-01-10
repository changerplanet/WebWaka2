/**
 * MVM Vendor Tier Service
 * 
 * Manages vendor tier definitions and automatic tier assignment.
 * 
 * @module lib/mvm/vendor-tier-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTierInput {
  tenantId: string
  name: string
  code: string
  description?: string
  commissionRate: number
  priorityLevel?: number
  featuredSlots?: number
  supportLevel?: 'STANDARD' | 'PRIORITY' | 'DEDICATED'
  minMonthlySales?: number
  minRating?: number
  minOrderCount?: number
  isDefault?: boolean
}

export interface UpdateTierInput {
  name?: string
  description?: string
  commissionRate?: number
  priorityLevel?: number
  featuredSlots?: number
  supportLevel?: 'STANDARD' | 'PRIORITY' | 'DEDICATED'
  minMonthlySales?: number
  minRating?: number
  minOrderCount?: number
  isActive?: boolean
  isDefault?: boolean
}

export interface TierQualification {
  tierId: string
  tierName: string
  tierCode: string
  qualifies: boolean
  requirements: {
    metric: string
    required: number | null
    current: number
    met: boolean
  }[]
}

// ============================================================================
// VENDOR TIER SERVICE
// ============================================================================

export const VendorTierService = {
  /**
   * Create a new tier
   */
  async create(input: CreateTierInput) {
    // If this is set as default, unset other defaults first
    if (input.isDefault) {
      await prisma.mvm_vendor_tier.updateMany({
        where: { tenantId: input.tenantId, isDefault: true },
        data: { isDefault: false }
      })
    }
    
    return prisma.mvm_vendor_tier.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        commissionRate: input.commissionRate,
        priorityLevel: input.priorityLevel ?? 0,
        featuredSlots: input.featuredSlots ?? 0,
        supportLevel: input.supportLevel ?? 'STANDARD',
        minMonthlySales: input.minMonthlySales,
        minRating: input.minRating,
        minOrderCount: input.minOrderCount,
        isDefault: input.isDefault ?? false,
        isActive: true
      }) // AUTO-FIX: required by Prisma schema
    })
  },
  
  /**
   * Get tier by ID
   */
  async getById(tenantId: string, tierId: string) {
    return prisma.mvm_vendor_tier.findFirst({
      where: { id: tierId, tenantId }
    })
  },
  
  /**
   * Get tier by code
   */
  async getByCode(tenantId: string, code: string) {
    return prisma.mvm_vendor_tier.findFirst({
      where: { tenantId, code: code.toUpperCase() }
    })
  },
  
  /**
   * Get default tier for tenant
   */
  async getDefault(tenantId: string) {
    return prisma.mvm_vendor_tier.findFirst({
      where: { tenantId, isDefault: true, isActive: true }
    })
  },
  
  /**
   * List all tiers for tenant
   */
  async list(tenantId: string, includeInactive = false) {
    return prisma.mvm_vendor_tier.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true })
      },
      orderBy: { priorityLevel: 'desc' }
    })
  },
  
  /**
   * Update a tier
   */
  async update(tenantId: string, tierId: string, input: UpdateTierInput) {
    // If setting as default, unset others first
    if (input.isDefault) {
      await prisma.mvm_vendor_tier.updateMany({
        where: { tenantId, isDefault: true, NOT: { id: tierId } },
        data: { isDefault: false }
      })
    }
    
    return prisma.mvm_vendor_tier.update({
      where: { id: tierId },
      data: input
    })
  },
  
  /**
   * Delete a tier (soft delete by setting inactive)
   */
  async delete(tenantId: string, tierId: string) {
    // Check if any vendors are using this tier
    const vendorCount = await prisma.mvm_vendor.count({
      where: { tierId }
    })
    
    if (vendorCount > 0) {
      // Move vendors to default tier first
      const defaultTier = await this.getDefault(tenantId)
      if (defaultTier && defaultTier.id !== tierId) {
        await prisma.mvm_vendor.updateMany({
          where: { tierId },
          data: { tierId: defaultTier.id }
        })
      }
    }
    
    return prisma.mvm_vendor_tier.update({
      where: { id: tierId },
      data: { isActive: false }
    })
  },
  
  /**
   * Check if vendor qualifies for a specific tier
   */
  async checkQualification(
    vendorId: string, 
    tierId: string
  ): Promise<TierQualification | null> {
    const [vendor, tier] = await Promise.all([
      prisma.mvm_vendor.findUnique({ where: { id: vendorId } }),
      prisma.mvm_vendor_tier.findUnique({ where: { id: tierId } })
    ])
    
    if (!vendor || !tier) return null
    
    const requirements: TierQualification['requirements'] = []
    let qualifies = true
    
    // Check minimum monthly sales
    if (tier.minMonthlySales) {
      const met = vendor.totalSales.toNumber() >= tier.minMonthlySales.toNumber()
      requirements.push({
        metric: 'Monthly Sales (NGN)',
        required: tier.minMonthlySales.toNumber(),
        current: vendor.totalSales.toNumber(),
        met
      })
      if (!met) qualifies = false
    }
    
    // Check minimum rating
    if (tier.minRating) {
      const currentRating = vendor.averageRating?.toNumber() ?? 0
      const met = currentRating >= tier.minRating.toNumber()
      requirements.push({
        metric: 'Average Rating',
        required: tier.minRating.toNumber(),
        current: currentRating,
        met
      })
      if (!met) qualifies = false
    }
    
    // Check minimum order count
    if (tier.minOrderCount) {
      const met = vendor.totalOrders >= tier.minOrderCount
      requirements.push({
        metric: 'Total Orders',
        required: tier.minOrderCount,
        current: vendor.totalOrders,
        met
      })
      if (!met) qualifies = false
    }
    
    return {
      tierId: tier.id,
      tierName: tier.name,
      tierCode: tier.code,
      qualifies,
      requirements
    }
  },
  
  /**
   * Find the best tier a vendor qualifies for
   */
  async findBestTier(tenantId: string, vendorId: string) {
    const tiers = await this.list(tenantId)
    
    // Sort by priority (highest first)
    const sortedTiers = tiers.sort((a: any, b: any) => b.priorityLevel - a.priorityLevel)
    
    for (const tier of sortedTiers) {
      const qualification = await this.checkQualification(vendorId, tier.id)
      if (qualification?.qualifies) {
        return tier
      }
    }
    
    // Return default tier if no qualifications met
    return this.getDefault(tenantId)
  },
  
  /**
   * Auto-assign tier to vendor based on performance
   */
  async autoAssignTier(vendorId: string): Promise<{
    changed: boolean
    previousTierId: string | null
    newTierId: string | null
    tierName: string | null
  }> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { tenantId: true, tierId: true }
    })
    
    if (!vendor) {
      return { changed: false, previousTierId: null, newTierId: null, tierName: null }
    }
    
    const bestTier = await this.findBestTier(vendor.tenantId, vendorId)
    
    if (!bestTier) {
      return { 
        changed: false, 
        previousTierId: vendor.tierId, 
        newTierId: vendor.tierId,
        tierName: null
      }
    }
    
    if (bestTier.id === vendor.tierId) {
      return { 
        changed: false, 
        previousTierId: vendor.tierId, 
        newTierId: vendor.tierId,
        tierName: bestTier.name
      }
    }
    
    await prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: { tierId: bestTier.id }
    })
    
    return {
      changed: true,
      previousTierId: vendor.tierId,
      newTierId: bestTier.id,
      tierName: bestTier.name
    }
  },
  
  /**
   * Get tier progress for a vendor (how close to next tier)
   */
  async getTierProgress(tenantId: string, vendorId: string) {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      include: { tier: true }
    })
    
    if (!vendor) return null
    
    const tiers = await this.list(tenantId)
    
    // Find next tier (higher priority than current)
    const currentPriority = vendor.tier?.priorityLevel ?? -1
    const nextTiers = tiers
      .filter((t: any) => t.priorityLevel > currentPriority)
      .sort((a: any, b: any) => a.priorityLevel - b.priorityLevel)
    
    const nextTier = nextTiers[0]
    
    if (!nextTier) {
      return {
        currentTier: vendor.tier ? {
          id: vendor.tier.id,
          name: vendor.tier.name,
          code: vendor.tier.code,
          commissionRate: vendor.tier.commissionRate.toNumber()
        } : null,
        nextTier: null,
        progress: 100,
        requirements: []
      }
    }
    
    const qualification = await this.checkQualification(vendorId, nextTier.id)
    
    return {
      currentTier: vendor.tier ? {
        id: vendor.tier.id,
        name: vendor.tier.name,
        code: vendor.tier.code,
        commissionRate: vendor.tier.commissionRate.toNumber()
      } : null,
      nextTier: {
        id: nextTier.id,
        name: nextTier.name,
        code: nextTier.code,
        commissionRate: nextTier.commissionRate.toNumber()
      },
      progress: qualification ? 
        Math.round((qualification.requirements.filter((r: any) => r.met).length / qualification.requirements.length) * 100) : 0,
      requirements: qualification?.requirements ?? []
    }
  },
  
  /**
   * Seed default tiers for a new tenant (Nigeria-first)
   */
  async seedDefaultTiers(tenantId: string) {
    const existingTiers = await prisma.mvm_vendor_tier.count({ where: { tenantId } })
    
    if (existingTiers > 0) {
      return { created: 0, message: 'Tiers already exist' }
    }
    
    const defaultTiers: CreateTierInput[] = [
      {
        tenantId,
        name: 'Bronze',
        code: 'BRONZE',
        description: 'Starting tier for new vendors',
        commissionRate: 15,
        priorityLevel: 1,
        featuredSlots: 0,
        supportLevel: 'STANDARD',
        isDefault: true
      },
      {
        tenantId,
        name: 'Silver',
        code: 'SILVER',
        description: 'For growing vendors with good performance',
        commissionRate: 12,
        priorityLevel: 2,
        featuredSlots: 2,
        supportLevel: 'STANDARD',
        minMonthlySales: 500000, // ₦500,000
        minRating: 4.0,
        minOrderCount: 50
      },
      {
        tenantId,
        name: 'Gold',
        code: 'GOLD',
        description: 'For established vendors with strong sales',
        commissionRate: 10,
        priorityLevel: 3,
        featuredSlots: 5,
        supportLevel: 'PRIORITY',
        minMonthlySales: 2000000, // ₦2,000,000
        minRating: 4.5,
        minOrderCount: 200
      },
      {
        tenantId,
        name: 'Platinum',
        code: 'PLATINUM',
        description: 'Top-tier vendors with exceptional performance',
        commissionRate: 8,
        priorityLevel: 4,
        featuredSlots: 10,
        supportLevel: 'DEDICATED',
        minMonthlySales: 10000000, // ₦10,000,000
        minRating: 4.8,
        minOrderCount: 1000
      }
    ]
    
    for (const tier of defaultTiers) {
      await this.create(tier)
    }
    
    return { created: defaultTiers.length, message: 'Default tiers created' }
  }
}
