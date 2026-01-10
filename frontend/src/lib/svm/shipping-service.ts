/**
 * SVM Shipping Service
 * 
 * Nigeria-first shipping zone management and rate calculation.
 * Provides Nigerian state coverage with region-based rate structures.
 * 
 * @module lib/svm/shipping-service
 */

import { prisma } from '../prisma'
import { formatNGN } from '../currency'

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// TYPES
// ============================================================================

export interface NigerianShippingZone {
  id: string
  name: string
  description: string
  states: string[]
  cities: string[]
  isDefault: boolean
  isActive: boolean
  priority: number
  rates: ShippingRateConfig[]
}

export interface ShippingRateConfig {
  id: string
  name: string
  description: string
  carrier: string
  rateType: 'FLAT' | 'WEIGHT_BASED' | 'PRICE_BASED'
  flatRate: number
  freeAbove: number | null
  minDays: number
  maxDays: number
  isActive: boolean
}

export interface ShippingCalculation {
  zoneId: string
  zoneName: string
  rateId: string
  rateName: string
  carrier: string
  fee: number
  feeFormatted: string
  isFree: boolean
  freeThreshold: number | null
  amountToFreeShipping: number | null
  estimatedDays: { min: number; max: number }
  isLocalPickup: boolean
}

export interface LocalPickupLocation {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  state: string
  phone: string
  hours: string
  isActive: boolean
}

// ============================================================================
// NIGERIAN STATES & REGIONS
// ============================================================================

/**
 * All 36 Nigerian states plus FCT
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const

export type NigerianState = typeof NIGERIAN_STATES[number]

/**
 * Nigerian geopolitical regions with their states
 */
export const NIGERIAN_REGIONS: Record<string, NigerianState[]> = {
  'Lagos Metro': ['Lagos'],
  'South West': ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'],
  'South East': ['Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi'],
  'South South': ['Rivers', 'Delta', 'Cross River', 'Akwa Ibom', 'Bayelsa', 'Edo'],
  'North Central': ['FCT', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Benue', 'Plateau'],
  'North West': ['Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Jigawa'],
  'North East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe']
}

/**
 * Default shipping rates for Nigerian regions (in Naira)
 */
export const NIGERIAN_SHIPPING_RATES: Record<string, { standard: number; express: number; freeAbove: number }> = {
  'Lagos Metro': { standard: 1500, express: 2500, freeAbove: 50000 },
  'South West': { standard: 2000, express: 3500, freeAbove: 75000 },
  'South East': { standard: 2500, express: 4500, freeAbove: 100000 },
  'South South': { standard: 2500, express: 4500, freeAbove: 100000 },
  'North Central': { standard: 2500, express: 4500, freeAbove: 100000 },
  'North West': { standard: 3000, express: 5500, freeAbove: 150000 },
  'North East': { standard: 3500, express: 6500, freeAbove: 150000 }
}

// ============================================================================
// ZONE MANAGEMENT
// ============================================================================

/**
 * Get region name for a Nigerian state
 */
export function getRegionForState(state: string): string | null {
  for (const [region, states] of Object.entries(NIGERIAN_REGIONS)) {
    if (states.includes(state as NigerianState)) {
      return region
    }
  }
  return null
}

/**
 * Check if a state is valid Nigerian state
 */
export function isValidNigerianState(state: string): boolean {
  return NIGERIAN_STATES.includes(state as NigerianState)
}

/**
 * Seed Nigerian shipping zones for a tenant
 */
export async function seedNigerianShippingZones(tenantId: string): Promise<NigerianShippingZone[]> {
  const zones: NigerianShippingZone[] = []
  
  // Check if zones already exist
  const existingZones = await prisma.svm_shipping_zones.count({
    where: { tenantId }
  })
  
  if (existingZones > 0) {
    console.log(`[SVM Shipping] Tenant ${tenantId} already has ${existingZones} zones`)
    return getShippingZones(tenantId)
  }
  
  // Create zones for each region
  for (const [regionName, states] of Object.entries(NIGERIAN_REGIONS)) {
    const rates = NIGERIAN_SHIPPING_RATES[regionName]
    const priority = regionName === 'Lagos Metro' ? 100 : 
                     regionName.startsWith('South') ? 80 : 60
    
    const zone = await prisma.svm_shipping_zones.create({
      data: {
        id: generateId(),
        tenantId,
        name: regionName,
        description: `Shipping to ${regionName} region`,
        countries: ['NG'],
        states: states,
        postalCodes: [],
        cities: [],
        isDefault: regionName === 'Lagos Metro',
        isActive: true,
        priority,
        updatedAt: new Date(),
        svm_shipping_rates: {
          create: [
            {
              id: generateId(),
              name: 'Standard Delivery',
              description: `3-5 business days within ${regionName}`,
              carrier: 'Local Courier',
              rateType: 'FLAT',
              flatRate: rates.standard,
              freeAbove: rates.freeAbove,
              minDays: 3,
              maxDays: 5,
              isActive: true,
              priority: 0,
              allowedProductIds: [],
              excludedProductIds: [],
              allowedCategoryIds: [],
              excludedCategoryIds: [],
              updatedAt: new Date()
            },
            {
              id: generateId(),
              name: 'Express Delivery',
              description: `1-2 business days within ${regionName}`,
              carrier: 'Express Courier',
              rateType: 'FLAT',
              flatRate: rates.express,
              freeAbove: rates.freeAbove * 2,
              minDays: 1,
              maxDays: 2,
              isActive: true,
              priority: 1,
              allowedProductIds: [],
              excludedProductIds: [],
              allowedCategoryIds: [],
              excludedCategoryIds: [],
              updatedAt: new Date()
            }
          ]
        }
      },
      include: { svm_shipping_rates: true }
    })
    
    zones.push({
      id: zone.id,
      name: zone.name,
      description: zone.description || '',
      states: zone.states,
      cities: zone.cities,
      isDefault: zone.isDefault,
      isActive: zone.isActive,
      priority: zone.priority,
      rates: zone.svm_shipping_rates.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        carrier: r.carrier || 'Local Courier',
        rateType: r.rateType as 'FLAT' | 'WEIGHT_BASED' | 'PRICE_BASED',
        flatRate: Number(r.flatRate) || 0,
        freeAbove: r.freeAbove ? Number(r.freeAbove) : null,
        minDays: r.minDays || 3,
        maxDays: r.maxDays || 5,
        isActive: r.isActive
      }))
    })
  }
  
  // Add Local Pickup zone
  await prisma.svm_shipping_zones.create({
    data: {
      id: generateId(),
      tenantId,
      name: 'Local Pickup',
      description: 'Pick up your order from our store',
      countries: ['NG'],
      states: [],
      postalCodes: [],
      cities: [],
      isDefault: false,
      isActive: true,
      priority: 200, // Highest priority
      updatedAt: new Date(),
      svm_shipping_rates: {
        create: [
          {
            id: generateId(),
            name: 'Store Pickup',
            description: 'Ready within 24 hours',
            carrier: 'Self',
            rateType: 'FLAT',
            flatRate: 0, // Free
            minDays: 0,
            maxDays: 1,
            isActive: true,
            priority: 0,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: [],
            updatedAt: new Date()
          }
        ]
      }
    }
  })
  
  console.log(`[SVM Shipping] Seeded ${zones.length + 1} Nigerian shipping zones for tenant ${tenantId}`)
  return zones
}

/**
 * Get all shipping zones for a tenant
 */
export async function getShippingZones(tenantId: string): Promise<NigerianShippingZone[]> {
  const zones = await prisma.svm_shipping_zones.findMany({
    where: { tenantId, isActive: true },
    include: { svm_shipping_rates: { where: { isActive: true } } },
    orderBy: { priority: 'desc' }
  })
  
  return zones.map((z: any) => ({
    id: z.id,
    name: z.name,
    description: z.description || '',
    states: z.states,
    cities: z.cities,
    isDefault: z.isDefault,
    isActive: z.isActive,
    priority: z.priority,
    rates: z.svm_shipping_rates.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      carrier: r.carrier || '',
      rateType: r.rateType as 'FLAT' | 'WEIGHT_BASED' | 'PRICE_BASED',
      flatRate: Number(r.flatRate) || 0,
      freeAbove: r.freeAbove ? Number(r.freeAbove) : null,
      minDays: r.minDays || 0,
      maxDays: r.maxDays || 0,
      isActive: r.isActive
    }))
  }))
}

// ============================================================================
// SHIPPING CALCULATION
// ============================================================================

/**
 * Find the matching zone for a destination state
 */
export async function findZoneForState(
  tenantId: string,
  state: string
): Promise<NigerianShippingZone | null> {
  // Ensure zones exist
  let zones = await getShippingZones(tenantId)
  if (zones.length === 0) {
    zones = await seedNigerianShippingZones(tenantId)
  }
  
  // Find zone containing this state
  for (const zone of zones) {
    if (zone.states.includes(state)) {
      return zone
    }
  }
  
  // Return default zone if no match
  return zones.find((z: any) => z.isDefault) || zones[0] || null
}

/**
 * Calculate shipping options for an order
 */
export async function calculateShipping(
  tenantId: string,
  destinationState: string,
  subtotal: number,
  includeLocalPickup: boolean = true
): Promise<ShippingCalculation[]> {
  const options: ShippingCalculation[] = []
  
  // Find matching zone
  const zone = await findZoneForState(tenantId, destinationState)
  if (!zone) {
    return options
  }
  
  // Calculate rates
  for (const rate of zone.rates) {
    const isFree = rate.freeAbove !== null && subtotal >= rate.freeAbove
    const fee = isFree ? 0 : rate.flatRate
    const amountToFreeShipping = rate.freeAbove !== null && !isFree 
      ? rate.freeAbove - subtotal 
      : null
    
    options.push({
      zoneId: zone.id,
      zoneName: zone.name,
      rateId: rate.id,
      rateName: rate.name,
      carrier: rate.carrier,
      fee,
      feeFormatted: fee === 0 ? 'FREE' : formatNGN(fee),
      isFree,
      freeThreshold: rate.freeAbove,
      amountToFreeShipping,
      estimatedDays: { min: rate.minDays, max: rate.maxDays },
      isLocalPickup: zone.name === 'Local Pickup'
    })
  }
  
  // Add local pickup if enabled
  if (includeLocalPickup) {
    const pickupZone = (await getShippingZones(tenantId)).find((z: any) => z.name === 'Local Pickup')
    if (pickupZone && !options.some((o: any) => o.isLocalPickup)) {
      options.push({
        zoneId: pickupZone.id,
        zoneName: 'Local Pickup',
        rateId: pickupZone.rates[0]?.id || 'pickup',
        rateName: 'Store Pickup',
        carrier: 'Self',
        fee: 0,
        feeFormatted: 'FREE',
        isFree: true,
        freeThreshold: null,
        amountToFreeShipping: null,
        estimatedDays: { min: 0, max: 1 },
        isLocalPickup: true
      })
    }
  }
  
  return options
}

/**
 * Get cheapest shipping option
 */
export async function getCheapestShipping(
  tenantId: string,
  destinationState: string,
  subtotal: number
): Promise<ShippingCalculation | null> {
  const options = await calculateShipping(tenantId, destinationState, subtotal, false)
  if (options.length === 0) return null
  
  return options.reduce((cheapest, opt) => 
    opt.fee < cheapest.fee ? opt : cheapest
  , options[0])
}

/**
 * Get fastest shipping option
 */
export async function getFastestShipping(
  tenantId: string,
  destinationState: string,
  subtotal: number
): Promise<ShippingCalculation | null> {
  const options = await calculateShipping(tenantId, destinationState, subtotal, false)
  if (options.length === 0) return null
  
  return options.reduce((fastest, opt) => 
    opt.estimatedDays.max < fastest.estimatedDays.max ? opt : fastest
  , options[0])
}

// ============================================================================
// LOCAL PICKUP
// ============================================================================

/**
 * Check if local pickup is available for a tenant
 */
export async function isLocalPickupAvailable(tenantId: string): Promise<boolean> {
  const pickupZone = await prisma.svm_shipping_zones.findFirst({
    where: { 
      tenantId, 
      name: 'Local Pickup',
      isActive: true 
    }
  })
  return !!pickupZone
}

/**
 * Enable local pickup for a tenant
 */
export async function enableLocalPickup(tenantId: string): Promise<void> {
  const existingZone = await prisma.svm_shipping_zones.findFirst({
    where: { tenantId, name: 'Local Pickup' }
  })
  
  if (existingZone) {
    await prisma.svm_shipping_zones.update({
      where: { id: existingZone.id },
      data: { isActive: true, updatedAt: new Date() }
    })
  } else {
    await prisma.svm_shipping_zones.create({
      data: {
        id: generateId(),
        tenantId,
        name: 'Local Pickup',
        description: 'Pick up your order from our store',
        countries: ['NG'],
        states: [],
        postalCodes: [],
        cities: [],
        isDefault: false,
        isActive: true,
        priority: 200,
        updatedAt: new Date(),
        svm_shipping_rates: {
          create: [{
            id: generateId(),
            name: 'Store Pickup',
            description: 'Ready within 24 hours',
            carrier: 'Self',
            rateType: 'FLAT',
            flatRate: 0,
            minDays: 0,
            maxDays: 1,
            isActive: true,
            priority: 0,
            allowedProductIds: [],
            excludedProductIds: [],
            allowedCategoryIds: [],
            excludedCategoryIds: [],
            updatedAt: new Date()
          }]
        }
      }
    })
  }
}

/**
 * Disable local pickup for a tenant
 */
export async function disableLocalPickup(tenantId: string): Promise<void> {
  await prisma.svm_shipping_zones.updateMany({
    where: { tenantId, name: 'Local Pickup' },
    data: { isActive: false }
  })
}
