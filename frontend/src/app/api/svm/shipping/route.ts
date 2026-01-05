/**
 * SVM Shipping API
 * 
 * POST /api/svm/shipping - Calculate shipping options
 * GET /api/svm/shipping - List shipping zones
 */

import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'
import {
  getOrCreateDefaultZones,
  type ShippingZone,
  type ShippingRate
} from '@/lib/shipping-storage'

// ============================================================================
// TYPES
// ============================================================================

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
  if (rate.minOrderTotal !== undefined && rate.minOrderTotal !== null && subtotal < rate.minOrderTotal) return false
  if (rate.maxOrderTotal !== undefined && rate.maxOrderTotal !== null && subtotal > rate.maxOrderTotal) return false
  if (rate.minWeight !== undefined && rate.minWeight !== null && totalWeight < rate.minWeight) return false
  if (rate.maxWeight !== undefined && rate.maxWeight !== null && totalWeight > rate.maxWeight) return false
  
  if (rate.allowedProductIds?.length) {
    const hasAllowed = items.some(item => rate.allowedProductIds!.includes(item.productId))
    if (!hasAllowed) return false
  }
  
  if (rate.excludedProductIds?.length) {
    const hasExcluded = items.some(item => rate.excludedProductIds!.includes(item.productId))
    if (hasExcluded) return false
  }
  
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
  
  if (rate.freeAbove !== undefined && rate.freeAbove !== null && subtotal >= rate.freeAbove) {
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
    
    const zones = await getOrCreateDefaultZones(tenantId)
    
    const itemCount = items.reduce((sum: number, item: ShippingCartItem) => sum + item.quantity, 0)
    const totalWeight = items.reduce((sum: number, item: ShippingCartItem) => 
      sum + (item.weight || 0) * item.quantity, 0
    )
    
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
    
    const zones = await getOrCreateDefaultZones(tenantId)
    
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
