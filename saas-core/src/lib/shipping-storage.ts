/**
 * SVM Shipping Storage
 * 
 * Shared in-memory storage for shipping zones.
 * All route files import from this module to share the same storage instance.
 * 
 * In production, this would be replaced with database queries.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ShippingZone {
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
  createdAt?: string
  updatedAt?: string
}

export interface ShippingRate {
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

// ============================================================================
// SHARED STORAGE (Singleton using globalThis)
// ============================================================================

/**
 * Shared in-memory storage for shipping zones
 * Using globalThis to ensure single instance across all Next.js API routes
 * Key: tenantId, Value: array of zones
 */
const STORAGE_KEY = '__svm_shipping_zones_storage__'

function getZonesStorage(): Map<string, ShippingZone[]> {
  if (!(globalThis as any)[STORAGE_KEY]) {
    (globalThis as any)[STORAGE_KEY] = new Map<string, ShippingZone[]>()
  }
  return (globalThis as any)[STORAGE_KEY]
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get or create default zones for a tenant
 */
export function getOrCreateDefaultZones(tenantId: string): ShippingZone[] {
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
      rates: []
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
      rates: []
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
      rates: []
    }
  ]
  
  // Add rates to zones
  defaultZones[0].rates = [
    {
      id: generateId('rate'),
      zoneId: defaultZones[0].id,
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
      zoneId: defaultZones[0].id,
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
      zoneId: defaultZones[0].id,
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
  
  defaultZones[1].rates = [
    {
      id: generateId('rate'),
      zoneId: defaultZones[1].id,
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
      zoneId: defaultZones[1].id,
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
  
  defaultZones[2].rates = [
    {
      id: generateId('rate'),
      zoneId: defaultZones[2].id,
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
      zoneId: defaultZones[2].id,
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
  
  zonesStorage.set(tenantId, defaultZones)
  return defaultZones
}

/**
 * Get zones for a tenant
 */
export function getZones(tenantId: string): ShippingZone[] {
  return getOrCreateDefaultZones(tenantId)
}

/**
 * Get a specific zone by ID
 */
export function getZone(tenantId: string, zoneId: string): ShippingZone | null {
  const zones = getOrCreateDefaultZones(tenantId)
  return zones.find(z => z.id === zoneId) || null
}

/**
 * Add a zone
 */
export function addZone(zone: ShippingZone): void {
  const zones = getOrCreateDefaultZones(zone.tenantId)
  zones.push(zone)
}

/**
 * Update a zone
 */
export function updateZone(tenantId: string, zoneId: string, updates: Partial<ShippingZone>): ShippingZone | null {
  const zones = getOrCreateDefaultZones(tenantId)
  const index = zones.findIndex(z => z.id === zoneId)
  if (index < 0) return null
  
  zones[index] = { ...zones[index], ...updates }
  return zones[index]
}

/**
 * Delete a zone
 */
export function deleteZone(tenantId: string, zoneId: string): ShippingZone | null {
  const zones = getOrCreateDefaultZones(tenantId)
  const index = zones.findIndex(z => z.id === zoneId)
  if (index < 0) return null
  
  const [deleted] = zones.splice(index, 1)
  return deleted
}

/**
 * Get a rate by ID
 */
export function getRate(tenantId: string, zoneId: string, rateId: string): ShippingRate | null {
  const zone = getZone(tenantId, zoneId)
  if (!zone) return null
  return zone.rates.find(r => r.id === rateId) || null
}

/**
 * Add a rate to a zone
 */
export function addRate(tenantId: string, zoneId: string, rate: ShippingRate): ShippingRate | null {
  const zone = getZone(tenantId, zoneId)
  if (!zone) return null
  zone.rates.push(rate)
  return rate
}

/**
 * Update a rate
 */
export function updateRate(tenantId: string, zoneId: string, rateId: string, updates: Partial<ShippingRate>): ShippingRate | null {
  const zone = getZone(tenantId, zoneId)
  if (!zone) return null
  
  const index = zone.rates.findIndex(r => r.id === rateId)
  if (index < 0) return null
  
  zone.rates[index] = { ...zone.rates[index], ...updates }
  return zone.rates[index]
}

/**
 * Delete a rate
 */
export function deleteRate(tenantId: string, zoneId: string, rateId: string): ShippingRate | null {
  const zone = getZone(tenantId, zoneId)
  if (!zone) return null
  
  const index = zone.rates.findIndex(r => r.id === rateId)
  if (index < 0) return null
  
  const [deleted] = zone.rates.splice(index, 1)
  return deleted
}
