/**
 * SVM Shipping Storage
 * 
 * Database-backed storage for shipping zones using Prisma.
 * All data is tenant-isolated and persists across restarts.
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES (maintained for API compatibility)
// ============================================================================

export interface ShippingZone {
  id: string
  tenantId: string
  name: string
  description?: string | null
  countries: string[]
  states: string[]
  postalCodes: string[]
  cities: string[]
  isDefault: boolean
  isActive: boolean
  priority: number
  rates: ShippingRate[]
  createdAt?: string
  updatedAt?: string
}

export interface ShippingRate {
  id: string
  zoneId: string
  name: string
  description?: string | null
  carrier?: string | null
  rateType: 'FLAT' | 'WEIGHT_BASED' | 'PRICE_BASED' | 'ITEM_BASED'
  flatRate?: number | null
  weightRate?: number | null
  baseWeightFee?: number | null
  percentageRate?: number | null
  perItemRate?: number | null
  minWeight?: number | null
  maxWeight?: number | null
  minOrderTotal?: number | null
  maxOrderTotal?: number | null
  freeAbove?: number | null
  minDays?: number | null
  maxDays?: number | null
  allowedProductIds?: string[]
  excludedProductIds?: string[]
  allowedCategoryIds?: string[]
  excludedCategoryIds?: string[]
  isActive: boolean
  priority: number
}

// ============================================================================
// HELPERS
// ============================================================================

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

function decimalToNumber(val: Prisma.Decimal | null | undefined): number | null {
  if (val === null || val === undefined) return null
  return Number(val)
}

function mapDbZoneToInterface(dbZone: any): ShippingZone {
  return {
    id: dbZone.id,
    tenantId: dbZone.tenantId,
    name: dbZone.name,
    description: dbZone.description,
    countries: dbZone.countries || [],
    states: dbZone.states || [],
    postalCodes: dbZone.postalCodes || [],
    cities: dbZone.cities || [],
    isDefault: dbZone.isDefault,
    isActive: dbZone.isActive,
    priority: dbZone.priority,
    rates: (dbZone.svm_shipping_rates || []).map(mapDbRateToInterface),
    createdAt: dbZone.createdAt?.toISOString(),
    updatedAt: dbZone.updatedAt?.toISOString()
  }
}

function mapDbRateToInterface(dbRate: any): ShippingRate {
  return {
    id: dbRate.id,
    zoneId: dbRate.zoneId,
    name: dbRate.name,
    description: dbRate.description,
    carrier: dbRate.carrier,
    rateType: dbRate.rateType,
    flatRate: decimalToNumber(dbRate.flatRate),
    weightRate: decimalToNumber(dbRate.weightRate),
    baseWeightFee: decimalToNumber(dbRate.baseWeightFee),
    percentageRate: decimalToNumber(dbRate.percentageRate),
    perItemRate: decimalToNumber(dbRate.perItemRate),
    minWeight: decimalToNumber(dbRate.minWeight),
    maxWeight: decimalToNumber(dbRate.maxWeight),
    minOrderTotal: decimalToNumber(dbRate.minOrderTotal),
    maxOrderTotal: decimalToNumber(dbRate.maxOrderTotal),
    freeAbove: decimalToNumber(dbRate.freeAbove),
    minDays: dbRate.minDays,
    maxDays: dbRate.maxDays,
    allowedProductIds: dbRate.allowedProductIds || [],
    excludedProductIds: dbRate.excludedProductIds || [],
    allowedCategoryIds: dbRate.allowedCategoryIds || [],
    excludedCategoryIds: dbRate.excludedCategoryIds || [],
    isActive: dbRate.isActive,
    priority: dbRate.priority
  }
}

// ============================================================================
// DEFAULT ZONES SEEDING
// ============================================================================

async function seedDefaultZones(tenantId: string): Promise<ShippingZone[]> {
  // Create default US zone
  const usZone = await prisma.svm_shipping_zones.create({
    data: {
      tenantId,
      name: 'US Domestic',
      description: 'Shipping within the United States',
      countries: ['US'],
      states: [],
      postalCodes: [],
      cities: [],
      isDefault: false,
      isActive: true,
      priority: 100,
      svm_shipping_rates: {
        create: [
          {
            name: 'Standard Shipping',
            description: '5-7 business days',
            carrier: 'USPS',
            rateType: 'FLAT',
            flatRate: 5.99,
            freeAbove: 50,
            minDays: 5,
            maxDays: 7,
            isActive: true,
            priority: 0,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          },
          {
            name: 'Express Shipping',
            description: '2-3 business days',
            carrier: 'UPS',
            rateType: 'FLAT',
            flatRate: 12.99,
            freeAbove: 100,
            minDays: 2,
            maxDays: 3,
            isActive: true,
            priority: 1,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          },
          {
            name: 'Overnight',
            description: 'Next business day',
            carrier: 'FedEx',
            rateType: 'FLAT',
            flatRate: 24.99,
            minDays: 1,
            maxDays: 1,
            isActive: true,
            priority: 2,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          }
        ]
      }
    },
    include: { svm_shipping_rates: true }
  })

  // Create default Canada zone
  const caZone = await prisma.svm_shipping_zones.create({
    data: {
      tenantId,
      name: 'Canada',
      description: 'Shipping to Canada',
      countries: ['CA'],
      states: [],
      postalCodes: [],
      cities: [],
      isDefault: false,
      isActive: true,
      priority: 90,
      svm_shipping_rates: {
        create: [
          {
            name: 'Standard Shipping',
            description: '7-14 business days',
            carrier: 'USPS',
            rateType: 'FLAT',
            flatRate: 9.99,
            freeAbove: 75,
            minDays: 7,
            maxDays: 14,
            isActive: true,
            priority: 0,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          },
          {
            name: 'Express Shipping',
            description: '3-5 business days',
            carrier: 'UPS',
            rateType: 'FLAT',
            flatRate: 19.99,
            minDays: 3,
            maxDays: 5,
            isActive: true,
            priority: 1,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          }
        ]
      }
    },
    include: { svm_shipping_rates: true }
  })

  // Create default International zone
  const intlZone = await prisma.svm_shipping_zones.create({
    data: {
      tenantId,
      name: 'International',
      description: 'Worldwide shipping (default)',
      countries: [],
      states: [],
      postalCodes: [],
      cities: [],
      isDefault: true,
      isActive: true,
      priority: 0,
      svm_shipping_rates: {
        create: [
          {
            name: 'International Standard',
            description: '14-21 business days',
            carrier: 'USPS',
            rateType: 'FLAT',
            flatRate: 19.99,
            minDays: 14,
            maxDays: 21,
            isActive: true,
            priority: 0,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          },
          {
            name: 'International Express',
            description: '5-10 business days',
            carrier: 'DHL',
            rateType: 'FLAT',
            flatRate: 39.99,
            minDays: 5,
            maxDays: 10,
            isActive: true,
            priority: 1,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: []
          }
        ]
      }
    },
    include: { svm_shipping_rates: true }
  })

  return [usZone, caZone, intlZone].map(mapDbZoneToInterface)
}

// ============================================================================
// ZONE OPERATIONS
// ============================================================================

/**
 * Get or create default zones for a tenant
 */
export async function getOrCreateDefaultZones(tenantId: string): Promise<ShippingZone[]> {
  // Check if zones already exist
  const existingZones = await prisma.svm_shipping_zones.findMany({
    where: { tenantId },
    include: { svm_shipping_rates: true },
    orderBy: { priority: 'desc' }
  })
  
  if (existingZones.length > 0) {
    return existingZones.map(mapDbZoneToInterface)
  }
  
  // Seed default zones
  return seedDefaultZones(tenantId)
}

/**
 * Get zones for a tenant
 */
export async function getZones(tenantId: string): Promise<ShippingZone[]> {
  return getOrCreateDefaultZones(tenantId)
}

/**
 * Get a specific zone by ID
 */
export async function getZone(tenantId: string, zoneId: string): Promise<ShippingZone | null> {
  const zone = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId },
    include: { svm_shipping_rates: true }
  })
  
  return zone ? mapDbZoneToInterface(zone) : null
}

/**
 * Add a zone
 */
export async function addZone(zone: ShippingZone): Promise<void> {
  await prisma.svm_shipping_zones.create({
    data: {
      id: zone.id,
      tenantId: zone.tenantId,
      name: zone.name,
      description: zone.description || null,
      countries: zone.countries,
      states: zone.states,
      postalCodes: zone.postalCodes,
      cities: zone.cities,
      isDefault: zone.isDefault,
      isActive: zone.isActive,
      priority: zone.priority,
      svm_shipping_rates: {
        create: zone.rates.map(rate => ({
          id: rate.id,
          name: rate.name,
          description: rate.description,
          carrier: rate.carrier,
          rateType: rate.rateType,
          flatRate: rate.flatRate,
          weightRate: rate.weightRate,
          baseWeightFee: rate.baseWeightFee,
          percentageRate: rate.percentageRate,
          perItemRate: rate.perItemRate,
          minWeight: rate.minWeight,
          maxWeight: rate.maxWeight,
          minOrderTotal: rate.minOrderTotal,
          maxOrderTotal: rate.maxOrderTotal,
          freeAbove: rate.freeAbove,
          minDays: rate.minDays,
          maxDays: rate.maxDays,
          allowedProductIds: rate.allowedProductIds || [],
          excludedProductIds: rate.excludedProductIds || [],
          allowedCategoryIds: rate.allowedCategoryIds || [],
          excludedCategoryIds: rate.excludedCategoryIds || [],
          isActive: rate.isActive,
          priority: rate.priority
        }))
      }
    }
  })
}

/**
 * Update a zone
 */
export async function updateZone(tenantId: string, zoneId: string, updates: Partial<ShippingZone>): Promise<ShippingZone | null> {
  const existing = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId }
  })
  
  if (!existing) return null
  
  const updated = await prisma.svm_shipping_zones.update({
    where: { id: zoneId },
    data: {
      name: updates.name,
      description: updates.description,
      countries: updates.countries,
      states: updates.states,
      postalCodes: updates.postalCodes,
      cities: updates.cities,
      isDefault: updates.isDefault,
      isActive: updates.isActive,
      priority: updates.priority
    },
    include: { svm_shipping_rates: true }
  })
  
  return mapDbZoneToInterface(updated)
}

/**
 * Delete a zone
 */
export async function deleteZone(tenantId: string, zoneId: string): Promise<ShippingZone | null> {
  const existing = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId },
    include: { svm_shipping_rates: true }
  })
  
  if (!existing) return null
  
  await prisma.svm_shipping_zones.delete({
    where: { id: zoneId }
  })
  
  return mapDbZoneToInterface(existing)
}

// ============================================================================
// RATE OPERATIONS
// ============================================================================

/**
 * Get a rate by ID
 */
export async function getRate(tenantId: string, zoneId: string, rateId: string): Promise<ShippingRate | null> {
  const zone = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId }
  })
  
  if (!zone) return null
  
  const rate = await prisma.svm_shipping_rates.findFirst({
    where: { id: rateId, zoneId }
  })
  
  return rate ? mapDbRateToInterface(rate) : null
}

/**
 * Add a rate to a zone
 */
export async function addRate(tenantId: string, zoneId: string, rate: ShippingRate): Promise<ShippingRate | null> {
  const zone = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId }
  })
  
  if (!zone) return null
  
  const created = await prisma.svm_shipping_rates.create({
    data: {
      id: rate.id,
      zoneId,
      name: rate.name,
      description: rate.description,
      carrier: rate.carrier,
      rateType: rate.rateType,
      flatRate: rate.flatRate,
      weightRate: rate.weightRate,
      baseWeightFee: rate.baseWeightFee,
      percentageRate: rate.percentageRate,
      perItemRate: rate.perItemRate,
      minWeight: rate.minWeight,
      maxWeight: rate.maxWeight,
      minOrderTotal: rate.minOrderTotal,
      maxOrderTotal: rate.maxOrderTotal,
      freeAbove: rate.freeAbove,
      minDays: rate.minDays,
      maxDays: rate.maxDays,
      allowedProductIds: rate.allowedProductIds || [],
      excludedProductIds: rate.excludedProductIds || [],
      allowedCategoryIds: rate.allowedCategoryIds || [],
      excludedCategoryIds: rate.excludedCategoryIds || [],
      isActive: rate.isActive,
      priority: rate.priority
    }
  })
  
  return mapDbRateToInterface(created)
}

/**
 * Update a rate
 */
export async function updateRate(tenantId: string, zoneId: string, rateId: string, updates: Partial<ShippingRate>): Promise<ShippingRate | null> {
  const zone = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId }
  })
  
  if (!zone) return null
  
  const existing = await prisma.svm_shipping_rates.findFirst({
    where: { id: rateId, zoneId }
  })
  
  if (!existing) return null
  
  const updated = await prisma.svm_shipping_rates.update({
    where: { id: rateId },
    data: {
      name: updates.name,
      description: updates.description,
      carrier: updates.carrier,
      rateType: updates.rateType,
      flatRate: updates.flatRate,
      weightRate: updates.weightRate,
      baseWeightFee: updates.baseWeightFee,
      percentageRate: updates.percentageRate,
      perItemRate: updates.perItemRate,
      minWeight: updates.minWeight,
      maxWeight: updates.maxWeight,
      minOrderTotal: updates.minOrderTotal,
      maxOrderTotal: updates.maxOrderTotal,
      freeAbove: updates.freeAbove,
      minDays: updates.minDays,
      maxDays: updates.maxDays,
      allowedProductIds: updates.allowedProductIds,
      excludedProductIds: updates.excludedProductIds,
      allowedCategoryIds: updates.allowedCategoryIds,
      excludedCategoryIds: updates.excludedCategoryIds,
      isActive: updates.isActive,
      priority: updates.priority
    }
  })
  
  return mapDbRateToInterface(updated)
}

/**
 * Delete a rate
 */
export async function deleteRate(tenantId: string, zoneId: string, rateId: string): Promise<ShippingRate | null> {
  const zone = await prisma.svm_shipping_zones.findFirst({
    where: { id: zoneId, tenantId }
  })
  
  if (!zone) return null
  
  const existing = await prisma.svm_shipping_rates.findFirst({
    where: { id: rateId, zoneId }
  })
  
  if (!existing) return null
  
  await prisma.svm_shipping_rates.delete({
    where: { id: rateId }
  })
  
  return mapDbRateToInterface(existing)
}
