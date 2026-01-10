/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Zone Service - Delivery zones and coverage management
 * 
 * OWNERSHIP: This module owns delivery zones and pricing rules.
 * DOES NOT OWN: Orders, Customers, Payments, Products.
 */

import { prisma } from '@/lib/prisma'
import { LogisticsZoneType, LogisticsZoneStatus, LogisticsPricingType, Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateZoneInput {
  name: string
  code?: string
  description?: string
  zoneType?: LogisticsZoneType
  city?: string
  state?: string
  lga?: string
  postalCodes?: string[]
  centerLatitude?: number
  centerLongitude?: number
  radiusKm?: number
  polygon?: object
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export interface UpdateZoneInput extends Partial<CreateZoneInput> {
  status?: LogisticsZoneStatus
}

export interface CreatePricingRuleInput {
  zoneId: string
  name: string
  description?: string
  pricingType?: LogisticsPricingType
  baseFee?: number
  feePerKm?: number
  feePerKg?: number
  percentOfOrder?: number
  freeDeliveryThreshold?: number
  minOrderValue?: number
  maxOrderValue?: number
  minFee?: number
  maxFee?: number
  tiers?: object[]
  expressMultiplier?: number
  weekendMultiplier?: number
  peakHourMultiplier?: number
  currency?: string
  priority?: number
  validFrom?: Date
  validUntil?: Date
}

export interface DeliveryQuoteInput {
  tenantId: string
  zoneId?: string
  city?: string
  state?: string
  lga?: string
  postalCode?: string
  orderValue?: number
  weightKg?: number
  distanceKm?: number
  isExpress?: boolean
  isWeekend?: boolean
  isPeakHour?: boolean
}

export interface DeliveryQuote {
  zoneId: string
  zoneName: string
  deliveryFee: number
  currency: string
  breakdown: {
    baseFee: number
    distanceFee?: number
    weightFee?: number
    percentFee?: number
    expressMultiplier?: number
    weekendMultiplier?: number
    peakHourMultiplier?: number
    freeDelivery: boolean
    freeDeliveryThreshold?: number
  }
  estimatedDeliveryHours?: number
  ruleApplied: string
}

// ============================================================================
// ZONE SERVICE
// ============================================================================

export class ZoneService {
  /**
   * Create a delivery zone
   */
  static async createZone(tenantId: string, input: CreateZoneInput) {
    const code = input.code || this.generateZoneCode(input.name, input.city, input.state)
    
    return prisma.logistics_delivery_zones.create({
      data: {
        tenantId,
        name: input.name,
        code,
        description: input.description,
        zoneType: input.zoneType || 'CITY',
        city: input.city,
        state: input.state,
        lga: input.lga,
        postalCodes: input.postalCodes || [],
        centerLatitude: input.centerLatitude,
        centerLongitude: input.centerLongitude,
        radiusKm: input.radiusKm,
        polygon: input.polygon,
        sortOrder: input.sortOrder || 0,
        metadata: input.metadata as any,
      },
      include: {
        logistics_delivery_pricing_rules: true,
      },
    })
  }

  /**
   * Get all zones for a tenant
   */
  static async getZones(
    tenantId: string,
    options: {
      status?: LogisticsZoneStatus
      zoneType?: LogisticsZoneType
      city?: string
      state?: string
      includeRules?: boolean
    } = {}
  ) {
    const where: Prisma.logistics_delivery_zonesWhereInput = { tenantId }
    
    if (options.status) where.status = options.status
    if (options.zoneType) where.zoneType = options.zoneType
    if (options.city) where.city = options.city
    if (options.state) where.state = options.state

    return prisma.logistics_delivery_zones.findMany({
      where,
      include: {
        logistics_delivery_pricing_rules: options.includeRules ? { where: { isActive: true } } : false,
        _count: { select: { logistics_delivery_assignments: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  }

  /**
   * Get zone by ID
   */
  static async getZoneById(tenantId: string, zoneId: string) {
    return prisma.logistics_delivery_zones.findFirst({
      where: { id: zoneId, tenantId },
      include: {
        logistics_delivery_pricing_rules: { orderBy: { priority: 'desc' } },
        _count: { select: { logistics_delivery_assignments: true } },
      },
    })
  }

  /**
   * Update a zone
   */
  static async updateZone(tenantId: string, zoneId: string, input: UpdateZoneInput) {
    return prisma.logistics_delivery_zones.update({
      where: { id: zoneId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.code && { code: input.code }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.zoneType && { zoneType: input.zoneType }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.state !== undefined && { state: input.state }),
        ...(input.lga !== undefined && { lga: input.lga }),
        ...(input.postalCodes && { postalCodes: input.postalCodes }),
        ...(input.centerLatitude !== undefined && { centerLatitude: input.centerLatitude }),
        ...(input.centerLongitude !== undefined && { centerLongitude: input.centerLongitude }),
        ...(input.radiusKm !== undefined && { radiusKm: input.radiusKm }),
        ...(input.polygon !== undefined && { polygon: input.polygon }),
        ...(input.status && { status: input.status }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.metadata !== undefined && { metadata: input.metadata ?? undefined }),
      },
      include: {
        logistics_delivery_pricing_rules: true,
      },
    })
  }

  /**
   * Delete a zone
   */
  static async deleteZone(tenantId: string, zoneId: string) {
    // Check for active assignments
    const activeAssignments = await prisma.logistics_delivery_assignments.count({
      where: {
        zoneId,
        status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
      },
    })

    if (activeAssignments > 0) {
      throw new Error(`Cannot delete zone with ${activeAssignments} active deliveries`)
    }

    return prisma.logistics_delivery_zones.delete({
      where: { id: zoneId },
    })
  }

  /**
   * Find matching zone for an address
   */
  static async findZoneForAddress(
    tenantId: string,
    address: { city?: string; state?: string; lga?: string; postalCode?: string }
  ) {
    const zones = await prisma.logistics_delivery_zones.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          // Match by LGA (most specific for Nigeria)
          ...(address.lga ? [{ lga: address.lga, state: address.state }] : []),
          // Match by city
          ...(address.city ? [{ city: address.city }] : []),
          // Match by state
          ...(address.state ? [{ state: address.state, city: null }] : []),
          // Match by postal code
          ...(address.postalCode ? [{ postalCodes: { has: address.postalCode } }] : []),
        ],
      },
      include: {
        logistics_delivery_pricing_rules: { where: { isActive: true }, orderBy: { priority: 'desc' } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Return most specific match
    return zones.find(z => z.lga === address.lga) ||
           zones.find(z => z.city === address.city) ||
           zones[0] || null
  }

  /**
   * Generate zone code from name/location
   */
  private static generateZoneCode(name: string, city?: string, state?: string): string {
    const parts = [state, city, name].filter(Boolean)
    return parts
      .join('-')
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .substring(0, 30)
  }

  // ============================================================================
  // PRICING RULES
  // ============================================================================

  /**
   * Create a pricing rule for a zone
   */
  static async createPricingRule(tenantId: string, input: CreatePricingRuleInput) {
    // Verify zone belongs to tenant
    const zone = await prisma.logistics_delivery_zones.findFirst({
      where: { id: input.zoneId, tenantId },
    })

    if (!zone) {
      throw new Error('Zone not found')
    }

    return prisma.logistics_delivery_pricing_rules.create({
      data: {
        tenantId,
        zoneId: input.zoneId,
        name: input.name,
        description: input.description,
        pricingType: input.pricingType || 'FLAT_RATE',
        baseFee: input.baseFee || 0,
        feePerKm: input.feePerKm,
        feePerKg: input.feePerKg,
        percentOfOrder: input.percentOfOrder,
        freeDeliveryThreshold: input.freeDeliveryThreshold,
        minOrderValue: input.minOrderValue,
        maxOrderValue: input.maxOrderValue,
        minFee: input.minFee,
        maxFee: input.maxFee,
        tiers: input.tiers,
        expressMultiplier: input.expressMultiplier,
        weekendMultiplier: input.weekendMultiplier,
        peakHourMultiplier: input.peakHourMultiplier,
        currency: input.currency || 'NGN',
        priority: input.priority || 0,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
      },
    })
  }

  /**
   * Get pricing rules for a zone
   */
  static async getPricingRules(tenantId: string, zoneId: string) {
    return prisma.logistics_delivery_pricing_rules.findMany({
      where: { tenantId, zoneId },
      orderBy: { priority: 'desc' },
    })
  }

  /**
   * Update pricing rule
   */
  static async updatePricingRule(
    tenantId: string,
    ruleId: string,
    input: Partial<CreatePricingRuleInput> & { isActive?: boolean }
  ) {
    return prisma.logistics_delivery_pricing_rules.update({
      where: { id: ruleId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.pricingType && { pricingType: input.pricingType }),
        ...(input.baseFee !== undefined && { baseFee: input.baseFee }),
        ...(input.feePerKm !== undefined && { feePerKm: input.feePerKm }),
        ...(input.feePerKg !== undefined && { feePerKg: input.feePerKg }),
        ...(input.percentOfOrder !== undefined && { percentOfOrder: input.percentOfOrder }),
        ...(input.freeDeliveryThreshold !== undefined && { freeDeliveryThreshold: input.freeDeliveryThreshold }),
        ...(input.minOrderValue !== undefined && { minOrderValue: input.minOrderValue }),
        ...(input.maxOrderValue !== undefined && { maxOrderValue: input.maxOrderValue }),
        ...(input.minFee !== undefined && { minFee: input.minFee }),
        ...(input.maxFee !== undefined && { maxFee: input.maxFee }),
        ...(input.tiers !== undefined && { tiers: input.tiers }),
        ...(input.expressMultiplier !== undefined && { expressMultiplier: input.expressMultiplier }),
        ...(input.weekendMultiplier !== undefined && { weekendMultiplier: input.weekendMultiplier }),
        ...(input.peakHourMultiplier !== undefined && { peakHourMultiplier: input.peakHourMultiplier }),
        ...(input.currency && { currency: input.currency }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.validFrom !== undefined && { validFrom: input.validFrom }),
        ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
      },
    })
  }

  /**
   * Delete pricing rule
   */
  static async deletePricingRule(tenantId: string, ruleId: string) {
    return prisma.logistics_delivery_pricing_rules.delete({
      where: { id: ruleId },
    })
  }

  // ============================================================================
  // DELIVERY QUOTE CALCULATION
  // ============================================================================

  /**
   * Calculate delivery quote for an order
   * NOTE: This is ADVISORY ONLY - does not execute payment
   */
  static async calculateDeliveryQuote(input: DeliveryQuoteInput): Promise<DeliveryQuote | null> {
    // Find applicable zone
    let zone = input.zoneId
      ? await prisma.logistics_delivery_zones.findFirst({
          where: { id: input.zoneId, tenantId: input.tenantId, status: 'ACTIVE' },
          include: { logistics_delivery_pricing_rules: { where: { isActive: true }, orderBy: { priority: 'desc' } } },
        })
      : await this.findZoneForAddress(input.tenantId, {
          city: input.city,
          state: input.state,
          lga: input.lga,
          postalCode: input.postalCode,
        })

    if (!zone) return null

    // Find applicable pricing rule
    const rule = this.findApplicablePricingRule(zone.logistics_delivery_pricing_rules, input.orderValue)
    if (!rule) return null

    // Calculate base fee
    let deliveryFee = Number(rule.baseFee) || 0
    const breakdown: DeliveryQuote['breakdown'] = {
      baseFee: deliveryFee,
      freeDelivery: false,
    }

    // Check free delivery threshold
    if (rule.freeDeliveryThreshold && input.orderValue && input.orderValue >= Number(rule.freeDeliveryThreshold)) {
      breakdown.freeDelivery = true
      breakdown.freeDeliveryThreshold = Number(rule.freeDeliveryThreshold)
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        deliveryFee: 0,
        currency: rule.currency,
        breakdown,
        ruleApplied: rule.name,
      }
    }

    // Apply pricing type
    switch (rule.pricingType) {
      case 'DISTANCE_BASED':
        if (input.distanceKm && rule.feePerKm) {
          const distanceFee = input.distanceKm * Number(rule.feePerKm)
          deliveryFee += distanceFee
          breakdown.distanceFee = distanceFee
        }
        break

      case 'WEIGHT_BASED':
        if (input.weightKg && rule.feePerKg) {
          const weightFee = input.weightKg * Number(rule.feePerKg)
          deliveryFee += weightFee
          breakdown.weightFee = weightFee
        }
        break

      case 'ORDER_VALUE':
        if (input.orderValue && rule.percentOfOrder) {
          const percentFee = (input.orderValue * Number(rule.percentOfOrder)) / 100
          deliveryFee += percentFee
          breakdown.percentFee = percentFee
        }
        break

      case 'TIERED':
        if (input.orderValue && rule.tiers) {
          const tiers = rule.tiers as Array<{ minValue: number; maxValue: number; fee: number }>
          const applicableTier = tiers.find(
            t => input.orderValue! >= t.minValue && input.orderValue! <= t.maxValue
          )
          if (applicableTier) {
            deliveryFee = applicableTier.fee
            breakdown.baseFee = applicableTier.fee
          }
        }
        break
    }

    // Apply multipliers
    if (input.isExpress && rule.expressMultiplier) {
      const multiplier = Number(rule.expressMultiplier)
      deliveryFee *= multiplier
      breakdown.expressMultiplier = multiplier
    }

    if (input.isWeekend && rule.weekendMultiplier) {
      const multiplier = Number(rule.weekendMultiplier)
      deliveryFee *= multiplier
      breakdown.weekendMultiplier = multiplier
    }

    if (input.isPeakHour && rule.peakHourMultiplier) {
      const multiplier = Number(rule.peakHourMultiplier)
      deliveryFee *= multiplier
      breakdown.peakHourMultiplier = multiplier
    }

    // Apply min/max constraints
    if (rule.minFee && deliveryFee < Number(rule.minFee)) {
      deliveryFee = Number(rule.minFee)
    }
    if (rule.maxFee && deliveryFee > Number(rule.maxFee)) {
      deliveryFee = Number(rule.maxFee)
    }

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      currency: rule.currency,
      breakdown,
      ruleApplied: rule.name,
    }
  }

  /**
   * Find applicable pricing rule based on order value
   */
  private static findApplicablePricingRule<T extends {
    isActive: boolean
    minOrderValue: Prisma.Decimal | null
    maxOrderValue: Prisma.Decimal | null
    validFrom: Date | null
    validUntil: Date | null
    priority: number
  }>(
    rules: T[],
    orderValue?: number
  ): T | undefined {
    const now = new Date()
    
    return rules
      .filter(rule => {
        if (!rule.isActive) return false
        if (rule.validFrom && rule.validFrom > now) return false
        if (rule.validUntil && rule.validUntil < now) return false
        if (rule.minOrderValue && orderValue && orderValue < Number(rule.minOrderValue)) return false
        if (rule.maxOrderValue && orderValue && orderValue > Number(rule.maxOrderValue)) return false
        return true
      })
      .sort((a, b) => b.priority - a.priority)[0]
  }

  // ============================================================================
  // DEFAULT ZONES (NIGERIA)
  // ============================================================================

  /**
   * Create default Nigerian zones for a tenant
   */
  static async createDefaultNigerianZones(tenantId: string) {
    const defaultZones = [
      { name: 'Lagos Island', city: 'Lagos', state: 'Lagos', lga: 'Lagos Island', baseFee: 1000 },
      { name: 'Lagos Mainland', city: 'Lagos', state: 'Lagos', lga: 'Lagos Mainland', baseFee: 1200 },
      { name: 'Ikeja', city: 'Lagos', state: 'Lagos', lga: 'Ikeja', baseFee: 1000 },
      { name: 'Lekki', city: 'Lagos', state: 'Lagos', lga: 'Eti-Osa', baseFee: 1500 },
      { name: 'Victoria Island', city: 'Lagos', state: 'Lagos', lga: 'Eti-Osa', baseFee: 1500 },
      { name: 'Abuja Central', city: 'Abuja', state: 'FCT', lga: 'Abuja Municipal', baseFee: 1200 },
      { name: 'Port Harcourt', city: 'Port Harcourt', state: 'Rivers', baseFee: 1500 },
      { name: 'Ibadan', city: 'Ibadan', state: 'Oyo', baseFee: 1200 },
      { name: 'Kano', city: 'Kano', state: 'Kano', baseFee: 2000 },
    ]

    const results = []
    for (const zoneData of defaultZones) {
      try {
        const zone = await this.createZone(tenantId, {
          name: zoneData.name,
          city: zoneData.city,
          state: zoneData.state,
          lga: zoneData.lga,
          zoneType: 'LGA',
        })

        // Create default flat-rate pricing rule
        await this.createPricingRule(tenantId, {
          zoneId: zone.id,
          name: `${zoneData.name} Standard Rate`,
          pricingType: 'FLAT_RATE',
          baseFee: zoneData.baseFee,
          freeDeliveryThreshold: 50000, // Free delivery above ₦50,000
          currency: 'NGN',
        })

        results.push(zone)
      } catch (error) {
        // Zone might already exist, skip
        console.log(`Skipping zone ${zoneData.name}: ${error}`)
      }
    }

    return results
  }
}
