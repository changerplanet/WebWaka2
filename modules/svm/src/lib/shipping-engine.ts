/**
 * SVM Shipping Engine
 * 
 * Calculates shipping fees based on:
 * - Geographic zones (country, state, postal code, city)
 * - Product-based rules (weight, dimensions, categories)
 * - Order-based rules (subtotal, item count)
 * - Free shipping thresholds
 * 
 * IMPORTANT:
 * - Shipping fees are calculated here
 * - Payment collection remains in Core
 * - SVM does NOT process payments
 */

import Decimal from 'decimal.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Shipping Zone - Geographic region for shipping
 */
export interface ShippingZone {
  id: string
  tenantId: string
  name: string
  description?: string
  
  // Geographic matching (any match = zone applies)
  countries: string[]      // ISO country codes (US, CA, GB)
  states: string[]         // State/province codes (CA, NY, ON)
  postalCodes: string[]    // Postal codes or prefixes (94*, 100*)
  cities: string[]         // City names (case-insensitive)
  
  isDefault: boolean       // Fallback zone if no match
  isActive: boolean
  priority: number         // Higher = checked first
  
  rates: ShippingRate[]
}

/**
 * Shipping Rate - Pricing method within a zone
 */
export interface ShippingRate {
  id: string
  zoneId: string
  
  name: string             // "Standard", "Express", "Overnight"
  description?: string
  carrier?: string         // "USPS", "FedEx", "UPS", "DHL"
  
  // Rate calculation type
  rateType: ShippingRateType
  
  // Flat rate
  flatRate?: number
  
  // Weight-based
  minWeight?: number       // Minimum weight (kg/lb)
  maxWeight?: number       // Maximum weight
  weightRate?: number      // Rate per weight unit
  baseWeightFee?: number   // Base fee + weight rate
  
  // Price-based (percentage of order)
  minOrderTotal?: number
  maxOrderTotal?: number
  percentageRate?: number  // 0.05 = 5%
  
  // Item count based
  perItemRate?: number     // Fee per item
  
  // Free shipping
  freeAbove?: number       // Free if order total >= this
  
  // Product restrictions
  allowedProductIds?: string[]   // Only these products
  excludedProductIds?: string[]  // Not these products
  allowedCategoryIds?: string[]  // Only these categories
  excludedCategoryIds?: string[] // Not these categories
  
  // Delivery estimate
  minDays?: number
  maxDays?: number
  
  isActive: boolean
  priority: number         // Higher = shown first
}

export type ShippingRateType = 
  | 'FLAT'           // Fixed rate
  | 'WEIGHT_BASED'   // Based on total weight
  | 'PRICE_BASED'    // Percentage of order total
  | 'ITEM_BASED'     // Per item fee
  | 'TIERED'         // Tiered pricing (future)
  | 'CALCULATED'     // Real-time carrier API (future)

/**
 * Shipping Address for rate calculation
 */
export interface ShippingDestination {
  country: string          // ISO code (US, CA, GB)
  state?: string           // State/province code
  city?: string
  postalCode?: string
}

/**
 * Cart item for shipping calculation
 */
export interface ShippingCartItem {
  productId: string
  variantId?: string
  categoryId?: string
  quantity: number
  unitPrice: number
  weight?: number          // Per unit weight
  // Dimensions (future)
  length?: number
  width?: number
  height?: number
}

/**
 * Shipping calculation request
 */
export interface ShippingCalculationRequest {
  tenantId: string
  destination: ShippingDestination
  items: ShippingCartItem[]
  subtotal: number
  currency?: string
}

/**
 * Available shipping option
 */
export interface ShippingOption {
  rateId: string
  zoneName: string
  rateName: string
  carrier?: string
  description?: string
  
  fee: number
  originalFee?: number     // Before free shipping applied
  isFree: boolean
  freeShippingApplied: boolean
  freeShippingThreshold?: number
  amountToFreeShipping?: number  // How much more to get free
  
  estimatedDays?: {
    min?: number
    max?: number
  }
  
  currency: string
}

/**
 * Shipping calculation result
 */
export interface ShippingCalculationResult {
  success: boolean
  destination: ShippingDestination
  matchedZone?: {
    id: string
    name: string
  }
  
  options: ShippingOption[]
  cheapestOption?: ShippingOption
  fastestOption?: ShippingOption
  
  // Summary
  itemCount: number
  totalWeight: number
  subtotal: number
  
  // If no options available
  noShippingReason?: string
}

// ============================================================================
// SHIPPING ENGINE
// ============================================================================

export class ShippingEngine {
  private zones: ShippingZone[] = []
  
  constructor(zones: ShippingZone[] = []) {
    this.zones = zones
  }

  /**
   * Load shipping zones
   */
  loadZones(zones: ShippingZone[]): void {
    // Sort by priority (descending) and filter active
    this.zones = zones
      .filter(z => z.isActive)
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Calculate shipping options for a cart
   */
  calculate(request: ShippingCalculationRequest): ShippingCalculationResult {
    const { destination, items, subtotal, currency = 'USD' } = request
    
    // Calculate totals
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalWeight = items.reduce((sum, item) => {
      return sum + (item.weight || 0) * item.quantity
    }, 0)
    
    // Find matching zone
    const matchedZone = this.findMatchingZone(destination)
    
    if (!matchedZone) {
      return {
        success: false,
        destination,
        options: [],
        itemCount,
        totalWeight,
        subtotal,
        noShippingReason: 'No shipping available to this destination'
      }
    }
    
    // Get active rates for the zone
    const activeRates = matchedZone.rates
      .filter(r => r.isActive)
      .filter(r => this.isRateApplicable(r, items, subtotal))
      .sort((a, b) => b.priority - a.priority)
    
    if (activeRates.length === 0) {
      return {
        success: false,
        destination,
        matchedZone: { id: matchedZone.id, name: matchedZone.name },
        options: [],
        itemCount,
        totalWeight,
        subtotal,
        noShippingReason: 'No shipping rates available for this order'
      }
    }
    
    // Calculate fee for each rate
    const options: ShippingOption[] = activeRates.map(rate => {
      return this.calculateRateOption(
        rate, 
        matchedZone.name, 
        items, 
        subtotal, 
        totalWeight, 
        itemCount,
        currency
      )
    })
    
    // Find cheapest and fastest
    const cheapestOption = options.reduce((min, opt) => 
      opt.fee < min.fee ? opt : min
    , options[0])
    
    const fastestOption = options
      .filter(opt => opt.estimatedDays?.max !== undefined)
      .reduce((fast, opt) => {
        const fastMax = fast.estimatedDays?.max ?? Infinity
        const optMax = opt.estimatedDays?.max ?? Infinity
        return optMax < fastMax ? opt : fast
      }, options[0])
    
    return {
      success: true,
      destination,
      matchedZone: { id: matchedZone.id, name: matchedZone.name },
      options,
      cheapestOption,
      fastestOption: fastestOption !== cheapestOption ? fastestOption : undefined,
      itemCount,
      totalWeight,
      subtotal
    }
  }

  /**
   * Find the zone that matches the destination
   */
  private findMatchingZone(destination: ShippingDestination): ShippingZone | null {
    // Check zones in priority order
    for (const zone of this.zones) {
      if (this.zoneMatchesDestination(zone, destination)) {
        return zone
      }
    }
    
    // Fall back to default zone
    return this.zones.find(z => z.isDefault) || null
  }

  /**
   * Check if a zone matches the destination
   */
  private zoneMatchesDestination(
    zone: ShippingZone, 
    destination: ShippingDestination
  ): boolean {
    const { country, state, city, postalCode } = destination
    
    // Country match
    if (zone.countries.length > 0) {
      const countryMatch = zone.countries.some(c => 
        c.toUpperCase() === country.toUpperCase()
      )
      if (!countryMatch) return false
    }
    
    // State match (if zone has states and destination has state)
    if (zone.states.length > 0 && state) {
      const stateMatch = zone.states.some(s => 
        s.toUpperCase() === state.toUpperCase()
      )
      if (!stateMatch) return false
    }
    
    // City match (case-insensitive)
    if (zone.cities && zone.cities.length > 0 && city) {
      const cityMatch = zone.cities.some(c => 
        c.toLowerCase() === city.toLowerCase()
      )
      if (!cityMatch) return false
    }
    
    // Postal code match (supports prefix matching with *)
    if (zone.postalCodes.length > 0 && postalCode) {
      const postalMatch = zone.postalCodes.some(p => {
        if (p.endsWith('*')) {
          const prefix = p.slice(0, -1)
          return postalCode.startsWith(prefix)
        }
        return p === postalCode
      })
      if (!postalMatch) return false
    }
    
    return true
  }

  /**
   * Check if a rate is applicable to the order
   */
  private isRateApplicable(
    rate: ShippingRate, 
    items: ShippingCartItem[], 
    subtotal: number
  ): boolean {
    // Check order total range
    if (rate.minOrderTotal !== undefined && subtotal < rate.minOrderTotal) {
      return false
    }
    if (rate.maxOrderTotal !== undefined && subtotal > rate.maxOrderTotal) {
      return false
    }
    
    // Check weight range
    const totalWeight = items.reduce((sum, item) => 
      sum + (item.weight || 0) * item.quantity, 0
    )
    if (rate.minWeight !== undefined && totalWeight < rate.minWeight) {
      return false
    }
    if (rate.maxWeight !== undefined && totalWeight > rate.maxWeight) {
      return false
    }
    
    // Check product restrictions
    if (rate.allowedProductIds && rate.allowedProductIds.length > 0) {
      const hasAllowed = items.some(item => 
        rate.allowedProductIds!.includes(item.productId)
      )
      if (!hasAllowed) return false
    }
    
    if (rate.excludedProductIds && rate.excludedProductIds.length > 0) {
      const hasExcluded = items.some(item => 
        rate.excludedProductIds!.includes(item.productId)
      )
      if (hasExcluded) return false
    }
    
    // Check category restrictions
    if (rate.allowedCategoryIds && rate.allowedCategoryIds.length > 0) {
      const hasAllowedCategory = items.some(item => 
        item.categoryId && rate.allowedCategoryIds!.includes(item.categoryId)
      )
      if (!hasAllowedCategory) return false
    }
    
    if (rate.excludedCategoryIds && rate.excludedCategoryIds.length > 0) {
      const hasExcludedCategory = items.some(item => 
        item.categoryId && rate.excludedCategoryIds!.includes(item.categoryId)
      )
      if (hasExcludedCategory) return false
    }
    
    return true
  }

  /**
   * Calculate the shipping fee for a rate
   */
  private calculateRateOption(
    rate: ShippingRate,
    zoneName: string,
    items: ShippingCartItem[],
    subtotal: number,
    totalWeight: number,
    itemCount: number,
    currency: string
  ): ShippingOption {
    let fee = new Decimal(0)
    
    switch (rate.rateType) {
      case 'FLAT':
        fee = new Decimal(rate.flatRate || 0)
        break
        
      case 'WEIGHT_BASED':
        const baseFee = new Decimal(rate.baseWeightFee || 0)
        const weightFee = new Decimal(rate.weightRate || 0).times(totalWeight)
        fee = baseFee.plus(weightFee)
        break
        
      case 'PRICE_BASED':
        fee = new Decimal(subtotal).times(rate.percentageRate || 0)
        break
        
      case 'ITEM_BASED':
        fee = new Decimal(rate.perItemRate || 0).times(itemCount)
        break
        
      case 'TIERED':
        // Future: implement tiered pricing
        fee = new Decimal(rate.flatRate || 0)
        break
        
      case 'CALCULATED':
        // Future: call carrier API
        fee = new Decimal(rate.flatRate || 0)
        break
    }
    
    // Round to 2 decimal places
    const originalFee = fee.toDecimalPlaces(2).toNumber()
    
    // Check free shipping threshold
    let finalFee = originalFee
    let isFree = false
    let freeShippingApplied = false
    let amountToFreeShipping: number | undefined
    
    if (rate.freeAbove !== undefined) {
      if (subtotal >= rate.freeAbove) {
        finalFee = 0
        isFree = true
        freeShippingApplied = true
      } else {
        amountToFreeShipping = new Decimal(rate.freeAbove)
          .minus(subtotal)
          .toDecimalPlaces(2)
          .toNumber()
      }
    }
    
    return {
      rateId: rate.id,
      zoneName,
      rateName: rate.name,
      carrier: rate.carrier,
      description: rate.description,
      
      fee: finalFee,
      originalFee: freeShippingApplied ? originalFee : undefined,
      isFree,
      freeShippingApplied,
      freeShippingThreshold: rate.freeAbove,
      amountToFreeShipping,
      
      estimatedDays: (rate.minDays || rate.maxDays) ? {
        min: rate.minDays,
        max: rate.maxDays
      } : undefined,
      
      currency
    }
  }
}

// ============================================================================
// SHIPPING RULE BUILDER
// ============================================================================

/**
 * Helper to build shipping zones and rates
 */
export class ShippingRuleBuilder {
  private zone: Partial<ShippingZone> = {
    rates: [],
    countries: [],
    states: [],
    postalCodes: [],
    cities: [],
    isDefault: false,
    isActive: true,
    priority: 0
  }
  
  constructor(tenantId: string, name: string) {
    this.zone.tenantId = tenantId
    this.zone.name = name
    this.zone.id = generateShippingId('zone')
  }

  /**
   * Add countries to zone
   */
  forCountries(...countries: string[]): this {
    this.zone.countries = countries.map(c => c.toUpperCase())
    return this
  }

  /**
   * Add states to zone
   */
  forStates(...states: string[]): this {
    this.zone.states = states.map(s => s.toUpperCase())
    return this
  }

  /**
   * Add cities to zone
   */
  forCities(...cities: string[]): this {
    this.zone.cities = cities
    return this
  }

  /**
   * Add postal codes to zone (supports prefix with *)
   */
  forPostalCodes(...postalCodes: string[]): this {
    this.zone.postalCodes = postalCodes
    return this
  }

  /**
   * Set as default fallback zone
   */
  asDefault(): this {
    this.zone.isDefault = true
    return this
  }

  /**
   * Set priority (higher = checked first)
   */
  withPriority(priority: number): this {
    this.zone.priority = priority
    return this
  }

  /**
   * Add a flat rate
   */
  addFlatRate(
    name: string, 
    fee: number, 
    options?: Partial<ShippingRate>
  ): this {
    this.zone.rates!.push({
      id: generateShippingId('rate'),
      zoneId: this.zone.id!,
      name,
      rateType: 'FLAT',
      flatRate: fee,
      isActive: true,
      priority: this.zone.rates!.length,
      ...options
    })
    return this
  }

  /**
   * Add a weight-based rate
   */
  addWeightRate(
    name: string,
    ratePerUnit: number,
    baseFee: number = 0,
    options?: Partial<ShippingRate>
  ): this {
    this.zone.rates!.push({
      id: generateShippingId('rate'),
      zoneId: this.zone.id!,
      name,
      rateType: 'WEIGHT_BASED',
      weightRate: ratePerUnit,
      baseWeightFee: baseFee,
      isActive: true,
      priority: this.zone.rates!.length,
      ...options
    })
    return this
  }

  /**
   * Add a price-based rate (percentage)
   */
  addPercentageRate(
    name: string,
    percentage: number, // 0.05 = 5%
    options?: Partial<ShippingRate>
  ): this {
    this.zone.rates!.push({
      id: generateShippingId('rate'),
      zoneId: this.zone.id!,
      name,
      rateType: 'PRICE_BASED',
      percentageRate: percentage,
      isActive: true,
      priority: this.zone.rates!.length,
      ...options
    })
    return this
  }

  /**
   * Add a per-item rate
   */
  addPerItemRate(
    name: string,
    feePerItem: number,
    options?: Partial<ShippingRate>
  ): this {
    this.zone.rates!.push({
      id: generateShippingId('rate'),
      zoneId: this.zone.id!,
      name,
      rateType: 'ITEM_BASED',
      perItemRate: feePerItem,
      isActive: true,
      priority: this.zone.rates!.length,
      ...options
    })
    return this
  }

  /**
   * Add free shipping
   */
  addFreeShipping(name: string = 'Free Shipping', options?: Partial<ShippingRate>): this {
    this.zone.rates!.push({
      id: generateShippingId('rate'),
      zoneId: this.zone.id!,
      name,
      rateType: 'FLAT',
      flatRate: 0,
      isActive: true,
      priority: this.zone.rates!.length,
      ...options
    })
    return this
  }

  /**
   * Build the zone
   */
  build(): ShippingZone {
    return this.zone as ShippingZone
  }
}

// ============================================================================
// SHIPPING SERVICE
// ============================================================================

/**
 * Service for managing shipping rules and calculations
 */
export class SVMShippingService {
  private engine: ShippingEngine
  private zonesStore: Map<string, ShippingZone[]> = new Map() // tenantId -> zones
  
  constructor() {
    this.engine = new ShippingEngine()
  }

  /**
   * Load zones for a tenant (from database in production)
   */
  loadTenantZones(tenantId: string, zones: ShippingZone[]): void {
    this.zonesStore.set(tenantId, zones)
  }

  /**
   * Calculate shipping options
   */
  calculateShipping(request: ShippingCalculationRequest): ShippingCalculationResult {
    const tenantZones = this.zonesStore.get(request.tenantId) || []
    this.engine.loadZones(tenantZones)
    return this.engine.calculate(request)
  }

  /**
   * Get available zones for a tenant
   */
  getZones(tenantId: string): ShippingZone[] {
    return this.zonesStore.get(tenantId) || []
  }

  /**
   * Add a zone
   */
  addZone(zone: ShippingZone): void {
    const zones = this.zonesStore.get(zone.tenantId) || []
    zones.push(zone)
    this.zonesStore.set(zone.tenantId, zones)
  }

  /**
   * Update a zone
   */
  updateZone(zoneId: string, updates: Partial<ShippingZone>): ShippingZone | null {
    for (const [tenantId, zones] of this.zonesStore) {
      const index = zones.findIndex(z => z.id === zoneId)
      if (index >= 0) {
        zones[index] = { ...zones[index], ...updates }
        return zones[index]
      }
    }
    return null
  }

  /**
   * Delete a zone
   */
  deleteZone(tenantId: string, zoneId: string): boolean {
    const zones = this.zonesStore.get(tenantId)
    if (!zones) return false
    
    const index = zones.findIndex(z => z.id === zoneId)
    if (index >= 0) {
      zones.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Create default shipping zones for a new tenant
   */
  createDefaultZones(tenantId: string): ShippingZone[] {
    const zones: ShippingZone[] = [
      // US Domestic
      new ShippingRuleBuilder(tenantId, 'US Domestic')
        .forCountries('US')
        .withPriority(100)
        .addFlatRate('Standard Shipping', 5.99, {
          minDays: 5,
          maxDays: 7,
          carrier: 'USPS',
          freeAbove: 50
        })
        .addFlatRate('Express Shipping', 12.99, {
          minDays: 2,
          maxDays: 3,
          carrier: 'UPS',
          freeAbove: 100
        })
        .addFlatRate('Overnight', 24.99, {
          minDays: 1,
          maxDays: 1,
          carrier: 'FedEx'
        })
        .build(),
      
      // Canada
      new ShippingRuleBuilder(tenantId, 'Canada')
        .forCountries('CA')
        .withPriority(90)
        .addFlatRate('Standard Shipping', 9.99, {
          minDays: 7,
          maxDays: 14,
          carrier: 'USPS',
          freeAbove: 75
        })
        .addFlatRate('Express Shipping', 19.99, {
          minDays: 3,
          maxDays: 5,
          carrier: 'UPS'
        })
        .build(),
      
      // International (Default)
      new ShippingRuleBuilder(tenantId, 'International')
        .asDefault()
        .withPriority(0)
        .addFlatRate('International Standard', 19.99, {
          minDays: 14,
          maxDays: 21,
          carrier: 'USPS'
        })
        .addFlatRate('International Express', 39.99, {
          minDays: 5,
          maxDays: 10,
          carrier: 'DHL'
        })
        .build()
    ]
    
    this.zonesStore.set(tenantId, zones)
    return zones
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateShippingId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}${random}`
}

/**
 * Format shipping estimate for display
 */
export function formatDeliveryEstimate(
  minDays?: number, 
  maxDays?: number
): string {
  if (!minDays && !maxDays) return 'Delivery time varies'
  if (minDays === maxDays) return `${minDays} business day${minDays === 1 ? '' : 's'}`
  if (!minDays) return `Up to ${maxDays} business days`
  if (!maxDays) return `${minDays}+ business days`
  return `${minDays}-${maxDays} business days`
}

/**
 * Get estimated delivery date
 */
export function getEstimatedDeliveryDate(
  minDays?: number,
  maxDays?: number,
  fromDate: Date = new Date()
): { earliest?: Date; latest?: Date } {
  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    let added = 0
    while (added < days) {
      result.setDate(result.getDate() + 1)
      const dayOfWeek = result.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++
      }
    }
    return result
  }
  
  return {
    earliest: minDays ? addBusinessDays(fromDate, minDays) : undefined,
    latest: maxDays ? addBusinessDays(fromDate, maxDays) : undefined
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let shippingServiceInstance: SVMShippingService | null = null

export function getShippingService(): SVMShippingService {
  if (!shippingServiceInstance) {
    shippingServiceInstance = new SVMShippingService()
  }
  return shippingServiceInstance
}
