/**
 * SVM Shipping API
 * 
 * POST /api/svm/shipping/calculate - Calculate shipping options
 * GET /api/svm/shipping/zones - List shipping zones
 * POST /api/svm/shipping/zones - Create shipping zone
 * 
 * Shipping fees are calculated here.
 * Payment collection remains in Core.
 */

import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'

// ============================================================================
// TYPES
// ============================================================================

interface ShippingZone {
  id: string
  tenantId: string
  name: string
  description?: string
  countries: string[]
  states: string[]
  postalCodes: string[]
  cities: string[]
  isDefault: boolean
  isActive: boolean
  priority: number
  rates: ShippingRate[]
}

interface ShippingRate {
  id: string
  zoneId: string
  name: string
  description?: string
  carrier?: string
  rateType: 'FLAT' | 'WEIGHT_BASED' | 'PRICE_BASED' | 'ITEM_BASED'
  flatRate?: number
  weightRate?: number
  baseWeightFee?: number
  percentageRate?: number
  perItemRate?: number
  minWeight?: number
  maxWeight?: number
  minOrderTotal?: number
  maxOrderTotal?: number
  freeAbove?: number
  minDays?: number
  maxDays?: number
  allowedProductIds?: string[]
  excludedProductIds?: string[]
  allowedCategoryIds?: string[]
  excludedCategoryIds?: string[]
  isActive: boolean
  priority: number
}

interface ShippingDestination {
  country: string
  state?: string
  city?: string
  postalCode?: string
}

interface ShippingCartItem {
  productId: string
  variantId?: string
  categoryId?: string
  quantity: number
  unitPrice: number
  weight?: number
}

// ============================================================================
// IN-MEMORY STORAGE (Production: use database)
// ============================================================================

const zonesStorage = new Map<string, ShippingZone[]>()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

// Initialize default zones for tenants
function getOrCreateDefaultZones(tenantId: string): ShippingZone[] {
  if (zonesStorage.has(tenantId)) {
    return zonesStorage.get(tenantId)!
  }
  
  // Create default zones
  const defaultZones: ShippingZone[] = [
    {
      id: generateId('zone'),
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
      rates: [
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'Standard Shipping',
          description: '5-7 business days',
          carrier: 'USPS',
          rateType: 'FLAT',
          flatRate: 5.99,
          freeAbove: 50,
          minDays: 5,
          maxDays: 7,
          isActive: true,
          priority: 0
        },
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'Express Shipping',
          description: '2-3 business days',
          carrier: 'UPS',
          rateType: 'FLAT',
          flatRate: 12.99,
          freeAbove: 100,
          minDays: 2,
          maxDays: 3,
          isActive: true,
          priority: 1
        },
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'Overnight',
          description: 'Next business day',
          carrier: 'FedEx',
          rateType: 'FLAT',
          flatRate: 24.99,
          minDays: 1,
          maxDays: 1,
          isActive: true,
          priority: 2
        }
      ]
    },
    {
      id: generateId('zone'),
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
      rates: [
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'Standard Shipping',
          description: '7-14 business days',
          carrier: 'USPS',
          rateType: 'FLAT',
          flatRate: 9.99,
          freeAbove: 75,
          minDays: 7,
          maxDays: 14,
          isActive: true,
          priority: 0
        },
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'Express Shipping',
          description: '3-5 business days',
          carrier: 'UPS',
          rateType: 'FLAT',
          flatRate: 19.99,
          minDays: 3,
          maxDays: 5,
          isActive: true,
          priority: 1
        }
      ]
    },
    {
      id: generateId('zone'),
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
      rates: [
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'International Standard',
          description: '14-21 business days',
          carrier: 'USPS',
          rateType: 'FLAT',
          flatRate: 19.99,
          minDays: 14,
          maxDays: 21,
          isActive: true,
          priority: 0
        },
        {
          id: generateId('rate'),
          zoneId: '',
          name: 'International Express',
          description: '5-10 business days',
          carrier: 'DHL',
          rateType: 'FLAT',
          flatRate: 39.99,
          minDays: 5,
          maxDays: 10,
          isActive: true,
          priority: 1
        }
      ]
    }
  ]
  
  // Set zone IDs in rates
  defaultZones.forEach(zone => {
    zone.rates.forEach(rate => {
      rate.zoneId = zone.id
    })
  })
  
  zonesStorage.set(tenantId, defaultZones)
  return defaultZones
}

// ============================================================================
// SHIPPING CALCULATION ENGINE
// ============================================================================

function findMatchingZone(zones: ShippingZone[], destination: ShippingDestination): ShippingZone | null {
  const activeZones = zones
    .filter(z => z.isActive)
    .sort((a, b) => b.priority - a.priority)
  
  for (const zone of activeZones) {
    if (zoneMatchesDestination(zone, destination)) {
      return zone
    }
  }
  
  return activeZones.find(z => z.isDefault) || null
}

function zoneMatchesDestination(zone: ShippingZone, destination: ShippingDestination): boolean {
  const { country, state, city, postalCode } = destination
  
  // Country match
  if (zone.countries.length > 0) {
    const countryMatch = zone.countries.some(c => 
      c.toUpperCase() === country.toUpperCase()
    )
    if (!countryMatch) return false
  } else if (!zone.isDefault) {
    // Zone has no countries and is not default - skip
    return false
  }
  
  // State match
  if (zone.states.length > 0 && state) {
    const stateMatch = zone.states.some(s => 
      s.toUpperCase() === state.toUpperCase()
    )
    if (!stateMatch) return false
  }
  
  // City match
  if (zone.cities.length > 0 && city) {
    const cityMatch = zone.cities.some(c => 
      c.toLowerCase() === city.toLowerCase()
    )
    if (!cityMatch) return false
  }
  
  // Postal code match (supports prefix with *)
  if (zone.postalCodes.length > 0 && postalCode) {
    const postalMatch = zone.postalCodes.some(p => {
      if (p.endsWith('*')) {
        return postalCode.startsWith(p.slice(0, -1))
      }
      return p === postalCode
    })
    if (!postalMatch) return false
  }
  
  return true
}

function isRateApplicable(
  rate: ShippingRate, 
  items: ShippingCartItem[], 
  subtotal: number,
  totalWeight: number
): boolean {
  // Check order total range
  if (rate.minOrderTotal !== undefined && subtotal < rate.minOrderTotal) return false
  if (rate.maxOrderTotal !== undefined && subtotal > rate.maxOrderTotal) return false
  
  // Check weight range
  if (rate.minWeight !== undefined && totalWeight < rate.minWeight) return false
  if (rate.maxWeight !== undefined && totalWeight > rate.maxWeight) return false
  
  // Check product restrictions
  if (rate.allowedProductIds?.length) {
    const hasAllowed = items.some(item => rate.allowedProductIds!.includes(item.productId))
    if (!hasAllowed) return false
  }
  
  if (rate.excludedProductIds?.length) {
    const hasExcluded = items.some(item => rate.excludedProductIds!.includes(item.productId))
    if (hasExcluded) return false
  }
  
  // Check category restrictions
  if (rate.allowedCategoryIds?.length) {
    const hasAllowed = items.some(item => 
      item.categoryId && rate.allowedCategoryIds!.includes(item.categoryId)
    )
    if (!hasAllowed) return false
  }
  
  if (rate.excludedCategoryIds?.length) {
    const hasExcluded = items.some(item => 
      item.categoryId && rate.excludedCategoryIds!.includes(item.categoryId)
    )
    if (hasExcluded) return false
  }
  
  return true
}

function calculateRateFee(
  rate: ShippingRate,
  subtotal: number,
  totalWeight: number,
  itemCount: number
): { fee: number; originalFee?: number; isFree: boolean; freeShippingApplied: boolean; amountToFreeShipping?: number } {
  let fee = new Decimal(0)
  
  switch (rate.rateType) {
    case 'FLAT':
      fee = new Decimal(rate.flatRate || 0)
      break
    case 'WEIGHT_BASED':
      fee = new Decimal(rate.baseWeightFee || 0).plus(
        new Decimal(rate.weightRate || 0).times(totalWeight)
      )
      break
    case 'PRICE_BASED':
      fee = new Decimal(subtotal).times(rate.percentageRate || 0)
      break
    case 'ITEM_BASED':
      fee = new Decimal(rate.perItemRate || 0).times(itemCount)
      break
  }
  
  const originalFee = fee.toDecimalPlaces(2).toNumber()
  
  // Check free shipping
  if (rate.freeAbove !== undefined && subtotal >= rate.freeAbove) {
    return {
      fee: 0,
      originalFee,
      isFree: true,
      freeShippingApplied: true
    }
  }
  
  return {
    fee: originalFee,
    isFree: originalFee === 0,
    freeShippingApplied: false,
    amountToFreeShipping: rate.freeAbove ? 
      new Decimal(rate.freeAbove).minus(subtotal).toDecimalPlaces(2).toNumber() : 
      undefined
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * POST /api/svm/shipping - Calculate shipping options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, destination, items, subtotal, currency = 'USD' } = body
    
    // Validation
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    if (!destination || !destination.country) {
      return NextResponse.json(
        { success: false, error: 'destination with country is required' },
        { status: 400 }
      )
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'items array is required' },
        { status: 400 }
      )
    }
    
    if (subtotal === undefined) {
      return NextResponse.json(
        { success: false, error: 'subtotal is required' },
        { status: 400 }
      )
    }
    
    // Get zones for tenant
    const zones = getOrCreateDefaultZones(tenantId)
    
    // Calculate totals
    const itemCount = items.reduce((sum: number, item: ShippingCartItem) => sum + item.quantity, 0)
    const totalWeight = items.reduce((sum: number, item: ShippingCartItem) => 
      sum + (item.weight || 0) * item.quantity, 0
    )
    
    // Find matching zone
    const matchedZone = findMatchingZone(zones, destination)
    
    if (!matchedZone) {
      return NextResponse.json({
        success: true,
        destination,
        matchedZone: null,
        options: [],
        itemCount,
        totalWeight,
        subtotal,
        noShippingReason: 'No shipping available to this destination'
      })
    }
    
    // Get applicable rates
    const applicableRates = matchedZone.rates
      .filter(r => r.isActive)
      .filter(r => isRateApplicable(r, items, subtotal, totalWeight))
      .sort((a, b) => a.priority - b.priority)
    
    if (applicableRates.length === 0) {
      return NextResponse.json({
        success: true,
        destination,
        matchedZone: { id: matchedZone.id, name: matchedZone.name },
        options: [],
        itemCount,
        totalWeight,
        subtotal,
        noShippingReason: 'No shipping rates available for this order'
      })
    }
    
    // Calculate options
    const options = applicableRates.map(rate => {
      const calculation = calculateRateFee(rate, subtotal, totalWeight, itemCount)
      
      return {
        rateId: rate.id,
        zoneName: matchedZone.name,
        rateName: rate.name,
        carrier: rate.carrier,
        description: rate.description,
        
        fee: calculation.fee,
        originalFee: calculation.originalFee,
        isFree: calculation.isFree,
        freeShippingApplied: calculation.freeShippingApplied,
        freeShippingThreshold: rate.freeAbove,
        amountToFreeShipping: calculation.amountToFreeShipping,
        
        estimatedDays: (rate.minDays || rate.maxDays) ? {
          min: rate.minDays,
          max: rate.maxDays
        } : null,
        
        currency
      }
    })
    
    // Find cheapest and fastest
    const cheapestOption = options.reduce((min, opt) => 
      opt.fee < min.fee ? opt : min
    , options[0])
    
    const optionsWithDays = options.filter(opt => opt.estimatedDays?.max)
    const fastestOption = optionsWithDays.length > 0 ?
      optionsWithDays.reduce((fast, opt) => 
        (opt.estimatedDays?.max || Infinity) < (fast.estimatedDays?.max || Infinity) ? opt : fast
      , optionsWithDays[0]) : null
    
    return NextResponse.json({
      success: true,
      destination,
      matchedZone: { id: matchedZone.id, name: matchedZone.name },
      options,
      cheapestOption,
      fastestOption: fastestOption !== cheapestOption ? fastestOption : null,
      itemCount,
      totalWeight,
      subtotal
    })
    
  } catch (error) {
    console.error('[SVM] Error calculating shipping:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/svm/shipping - List shipping zones
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    const zones = getOrCreateDefaultZones(tenantId)
    
    return NextResponse.json({
      success: true,
      zones: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description,
        countries: zone.countries,
        states: zone.states,
        postalCodes: zone.postalCodes,
        cities: zone.cities,
        isDefault: zone.isDefault,
        isActive: zone.isActive,
        priority: zone.priority,
        rateCount: zone.rates.filter(r => r.isActive).length,
        rates: zone.rates.map(rate => ({
          id: rate.id,
          name: rate.name,
          description: rate.description,
          carrier: rate.carrier,
          rateType: rate.rateType,
          flatRate: rate.flatRate,
          freeAbove: rate.freeAbove,
          estimatedDays: (rate.minDays || rate.maxDays) ? {
            min: rate.minDays,
            max: rate.maxDays
          } : null,
          isActive: rate.isActive
        }))
      })),
      totalZones: zones.length,
      activeZones: zones.filter(z => z.isActive).length
    })
    
  } catch (error) {
    console.error('[SVM] Error listing shipping zones:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
