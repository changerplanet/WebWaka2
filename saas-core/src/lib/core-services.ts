/**
 * Core Inventory Service
 * 
 * Implements the InventoryReader interface expected by POS, SVM, and MVM modules.
 * This is the SINGLE SOURCE OF TRUTH for product and inventory data.
 * 
 * Modules consume this service - they do NOT mutate data directly.
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES (Match the module expectations)
// ============================================================================

export interface ProductInventory {
  productId: string
  variantId?: string
  sku: string
  name: string
  barcode?: string
  
  // Pricing
  price: number
  costPrice?: number
  compareAtPrice?: number
  
  // Inventory levels
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  
  // Thresholds
  lowStockThreshold: number
  outOfStockThreshold: number
  
  // Flags
  isInStock: boolean
  isLowStock: boolean
  allowNegative: boolean
  trackInventory: boolean
  
  // Location
  locationId?: string
  locationName?: string
  
  // Category
  categoryId?: string
  categoryName?: string
  
  // Timestamps
  lastUpdated: Date
  lastSoldAt?: Date
}

export interface InventoryCheckResult {
  productId: string
  variantId?: string
  requestedQuantity: number
  availableQuantity: number
  
  canFulfill: boolean
  shortfall: number
  
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'RESERVED' | 'BACKORDERED' | 'NOT_TRACKED'
  message: string
  
  alternatives?: ProductInventory[]
}

export interface BatchInventoryCheck {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
  }>
}

export interface BatchInventoryResult {
  allAvailable: boolean
  results: InventoryCheckResult[]
  unavailableItems: InventoryCheckResult[]
}

// ============================================================================
// HELPERS
// ============================================================================

function decimalToNumber(val: Prisma.Decimal | null): number {
  return val ? Number(val) : 0
}

function mapProductToInventory(
  product: any,
  inventoryLevel?: any,
  location?: any
): ProductInventory {
  const quantityOnHand = inventoryLevel?.quantityOnHand ?? 0
  const quantityReserved = inventoryLevel?.quantityReserved ?? 0
  const quantityAvailable = inventoryLevel?.quantityAvailable ?? quantityOnHand - quantityReserved
  const reorderPoint = inventoryLevel?.reorderPoint ?? 10
  
  return {
    productId: product.id,
    variantId: undefined,
    sku: product.sku || '',
    name: product.name,
    barcode: product.barcode || undefined,
    
    price: decimalToNumber(product.price),
    costPrice: product.costPrice ? decimalToNumber(product.costPrice) : undefined,
    compareAtPrice: product.compareAtPrice ? decimalToNumber(product.compareAtPrice) : undefined,
    
    quantityOnHand,
    quantityReserved,
    quantityAvailable,
    
    lowStockThreshold: reorderPoint,
    outOfStockThreshold: 0,
    
    isInStock: quantityAvailable > 0,
    isLowStock: quantityAvailable > 0 && quantityAvailable <= reorderPoint,
    allowNegative: product.allowBackorder || false,
    trackInventory: product.trackInventory ?? true,
    
    locationId: location?.id,
    locationName: location?.name,
    
    categoryId: product.categoryId || undefined,
    categoryName: product.category?.name || undefined,
    
    lastUpdated: inventoryLevel?.updatedAt || product.updatedAt,
    lastSoldAt: undefined // TODO: Track from sales
  }
}

function mapVariantToInventory(
  variant: any,
  product: any,
  inventoryLevel?: any,
  location?: any
): ProductInventory {
  const quantityOnHand = inventoryLevel?.quantityOnHand ?? 0
  const quantityReserved = inventoryLevel?.quantityReserved ?? 0
  const quantityAvailable = inventoryLevel?.quantityAvailable ?? quantityOnHand - quantityReserved
  const reorderPoint = inventoryLevel?.reorderPoint ?? 10
  
  return {
    productId: product.id,
    variantId: variant.id,
    sku: variant.sku || product.sku || '',
    name: `${product.name} - ${variant.name}`,
    barcode: variant.barcode || product.barcode || undefined,
    
    price: variant.price ? decimalToNumber(variant.price) : decimalToNumber(product.price),
    costPrice: variant.costPrice ? decimalToNumber(variant.costPrice) : 
               product.costPrice ? decimalToNumber(product.costPrice) : undefined,
    compareAtPrice: variant.compareAtPrice ? decimalToNumber(variant.compareAtPrice) : 
                    product.compareAtPrice ? decimalToNumber(product.compareAtPrice) : undefined,
    
    quantityOnHand,
    quantityReserved,
    quantityAvailable,
    
    lowStockThreshold: reorderPoint,
    outOfStockThreshold: 0,
    
    isInStock: quantityAvailable > 0,
    isLowStock: quantityAvailable > 0 && quantityAvailable <= reorderPoint,
    allowNegative: product.allowBackorder || false,
    trackInventory: product.trackInventory ?? true,
    
    locationId: location?.id,
    locationName: location?.name,
    
    categoryId: product.categoryId || undefined,
    categoryName: product.category?.name || undefined,
    
    lastUpdated: inventoryLevel?.updatedAt || variant.updatedAt,
    lastSoldAt: undefined
  }
}

// ============================================================================
// CORE INVENTORY SERVICE (Implements InventoryReader interface)
// ============================================================================

export class CoreInventoryService {
  /**
   * Get inventory for a single product or variant
   */
  async getProductInventory(
    tenantId: string,
    productId: string,
    variantId?: string,
    locationId?: string
  ): Promise<ProductInventory | null> {
    // If variant specified, get variant inventory
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
        include: {
          product: {
            include: { category: true }
          },
          inventoryLevels: locationId ? {
            where: { locationId }
          } : true
        }
      })
      
      if (!variant) return null
      
      const inventoryLevel = variant.inventoryLevels[0]
      const location = inventoryLevel ? await prisma.location.findUnique({
        where: { id: inventoryLevel.locationId }
      }) : null
      
      return mapVariantToInventory(variant, variant.product, inventoryLevel, location)
    }
    
    // Get product inventory
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        category: true,
        inventoryLevels: locationId ? {
          where: { locationId, variantId: null }
        } : {
          where: { variantId: null }
        }
      }
    })
    
    if (!product) return null
    
    const inventoryLevel = product.inventoryLevels[0]
    const location = inventoryLevel ? await prisma.location.findUnique({
      where: { id: inventoryLevel.locationId }
    }) : null
    
    return mapProductToInventory(product, inventoryLevel, location)
  }

  /**
   * Get inventory for multiple products
   */
  async getMultipleProductInventory(
    tenantId: string,
    productIds: Array<{ productId: string; variantId?: string }>,
    locationId?: string
  ): Promise<Map<string, ProductInventory>> {
    const result = new Map<string, ProductInventory>()
    
    // Batch fetch all products
    const productIdList = [...new Set(productIds.map(p => p.productId))]
    
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIdList },
        tenantId 
      },
      include: {
        category: true,
        variants: {
          include: {
            inventoryLevels: locationId ? {
              where: { locationId }
            } : true
          }
        },
        inventoryLevels: locationId ? {
          where: { locationId }
        } : true
      }
    })
    
    const location = locationId ? await prisma.location.findUnique({
      where: { id: locationId }
    }) : null
    
    for (const req of productIds) {
      const product = products.find(p => p.id === req.productId)
      if (!product) continue
      
      const key = req.variantId ? `${req.productId}:${req.variantId}` : req.productId
      
      if (req.variantId) {
        const variant = product.variants.find(v => v.id === req.variantId)
        if (variant) {
          const invLevel = variant.inventoryLevels[0]
          result.set(key, mapVariantToInventory(variant, product, invLevel, location))
        }
      } else {
        const invLevel = product.inventoryLevels.find(il => !il.variantId)
        result.set(key, mapProductToInventory(product, invLevel, location))
      }
    }
    
    return result
  }

  /**
   * Check if quantity is available
   */
  async checkAvailability(
    tenantId: string,
    productId: string,
    quantity: number,
    variantId?: string,
    locationId?: string
  ): Promise<InventoryCheckResult> {
    const inventory = await this.getProductInventory(tenantId, productId, variantId, locationId)
    
    if (!inventory) {
      return {
        productId,
        variantId,
        requestedQuantity: quantity,
        availableQuantity: 0,
        canFulfill: false,
        shortfall: quantity,
        status: 'OUT_OF_STOCK',
        message: 'Product not found'
      }
    }
    
    if (!inventory.trackInventory) {
      return {
        productId,
        variantId,
        requestedQuantity: quantity,
        availableQuantity: Infinity,
        canFulfill: true,
        shortfall: 0,
        status: 'NOT_TRACKED',
        message: 'Inventory not tracked for this product'
      }
    }
    
    const available = inventory.quantityAvailable
    const canFulfill = available >= quantity || inventory.allowNegative
    
    let status: InventoryCheckResult['status'] = 'IN_STOCK'
    if (available <= 0) status = 'OUT_OF_STOCK'
    else if (available < quantity) status = 'LOW_STOCK'
    else if (inventory.isLowStock) status = 'LOW_STOCK'
    
    return {
      productId,
      variantId,
      requestedQuantity: quantity,
      availableQuantity: available,
      canFulfill,
      shortfall: canFulfill ? 0 : quantity - available,
      status,
      message: canFulfill 
        ? `${available} units available`
        : `Only ${available} units available, need ${quantity}`
    }
  }

  /**
   * Batch availability check
   */
  async checkBatchAvailability(
    tenantId: string,
    items: BatchInventoryCheck,
    locationId?: string
  ): Promise<BatchInventoryResult> {
    const results = await Promise.all(
      items.items.map(item => 
        this.checkAvailability(tenantId, item.productId, item.quantity, item.variantId, locationId)
      )
    )
    
    const unavailable = results.filter(r => !r.canFulfill)
    
    return {
      allAvailable: unavailable.length === 0,
      results,
      unavailableItems: unavailable
    }
  }

  /**
   * Search products with inventory
   */
  async searchProducts(
    tenantId: string,
    query: string,
    options?: {
      inStockOnly?: boolean
      categoryId?: string
      limit?: number
      locationId?: string
    }
  ): Promise<ProductInventory[]> {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } }
      ]
    }
    
    if (options?.categoryId) {
      where.categoryId = options.categoryId
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        inventoryLevels: options?.locationId ? {
          where: { locationId: options.locationId, variantId: null }
        } : {
          where: { variantId: null }
        }
      },
      take: options?.limit || 50
    })
    
    const location = options?.locationId ? await prisma.location.findUnique({
      where: { id: options.locationId }
    }) : null
    
    let results = products.map(product => {
      const invLevel = product.inventoryLevels[0]
      return mapProductToInventory(product, invLevel, location)
    })
    
    if (options?.inStockOnly) {
      results = results.filter(p => p.isInStock || !p.trackInventory)
    }
    
    return results
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(
    tenantId: string,
    locationId?: string
  ): Promise<ProductInventory[]> {
    const inventoryLevels = await prisma.inventoryLevel.findMany({
      where: {
        tenantId,
        ...(locationId && { locationId }),
        quantityAvailable: {
          lte: prisma.inventoryLevel.fields.reorderPoint
        }
      },
      include: {
        product: {
          include: { category: true }
        },
        variant: true,
        location: true
      }
    })
    
    return inventoryLevels.map(il => {
      if (il.variant) {
        return mapVariantToInventory(il.variant, il.product, il, il.location)
      }
      return mapProductToInventory(il.product, il, il.location)
    })
  }

  /**
   * Get inventory snapshot for offline cache
   */
  async getInventorySnapshot(
    tenantId: string,
    options?: {
      productIds?: string[]
      includeZeroStock?: boolean
      locationId?: string
    }
  ): Promise<ProductInventory[]> {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      status: 'ACTIVE',
      ...(options?.productIds && { id: { in: options.productIds } })
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          include: {
            inventoryLevels: options?.locationId ? {
              where: { locationId: options.locationId }
            } : true
          }
        },
        inventoryLevels: options?.locationId ? {
          where: { locationId: options.locationId }
        } : true
      }
    })
    
    const location = options?.locationId ? await prisma.location.findUnique({
      where: { id: options.locationId }
    }) : null
    
    const results: ProductInventory[] = []
    
    for (const product of products) {
      // Add product-level inventory
      const productInv = product.inventoryLevels.find(il => !il.variantId)
      const inv = mapProductToInventory(product, productInv, location)
      
      if (options?.includeZeroStock || inv.quantityAvailable > 0 || !inv.trackInventory) {
        results.push(inv)
      }
      
      // Add variant-level inventory
      for (const variant of product.variants) {
        const variantInv = variant.inventoryLevels[0]
        const vInv = mapVariantToInventory(variant, product, variantInv, location)
        
        if (options?.includeZeroStock || vInv.quantityAvailable > 0 || !vInv.trackInventory) {
          results.push(vInv)
        }
      }
    }
    
    return results
  }
}

// ============================================================================
// CUSTOMER SERVICE (For module consumption)
// ============================================================================

export interface CustomerData {
  id: string
  tenantId: string
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  fullName?: string
  company?: string
  taxId?: string
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  defaultAddressId?: string
  tags: string[]
  notes?: string
  totalOrders: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

export class CoreCustomerService {
  /**
   * Get customer by ID
   */
  async getCustomer(tenantId: string, customerId: string): Promise<CustomerData | null> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    })
    
    if (!customer) return null
    
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      firstName: customer.firstName || undefined,
      lastName: customer.lastName || undefined,
      fullName: customer.fullName || undefined,
      company: customer.company || undefined,
      taxId: customer.taxId || undefined,
      status: customer.status,
      defaultAddressId: customer.defaultAddressId || undefined,
      tags: customer.tags || [],
      notes: customer.notes || undefined,
      totalOrders: customer.totalOrders,
      totalSpent: decimalToNumber(customer.totalSpent),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }
  }
  
  /**
   * Search customers
   */
  async searchCustomers(
    tenantId: string,
    query: string,
    limit?: number
  ): Promise<CustomerData[]> {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit || 20
    })
    
    return customers.map(c => ({
      id: c.id,
      tenantId: c.tenantId,
      email: c.email || undefined,
      phone: c.phone || undefined,
      firstName: c.firstName || undefined,
      lastName: c.lastName || undefined,
      fullName: c.fullName || undefined,
      company: c.company || undefined,
      taxId: c.taxId || undefined,
      status: c.status,
      defaultAddressId: c.defaultAddressId || undefined,
      tags: c.tags || [],
      notes: c.notes || undefined,
      totalOrders: c.totalOrders,
      totalSpent: decimalToNumber(c.totalSpent),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
  }
}

// ============================================================================
// LOCATION SERVICE (For module consumption)
// ============================================================================

export interface LocationData {
  id: string
  tenantId: string
  name: string
  code?: string
  type: string
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED'
  address?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  phone?: string
  email?: string
  isDefault: boolean
  allowsPickup: boolean
  allowsShipping: boolean
  timezone?: string
  operatingHours?: Record<string, unknown>
}

export class CoreLocationService {
  /**
   * Get location by ID
   */
  async getLocation(tenantId: string, locationId: string): Promise<LocationData | null> {
    const location = await prisma.location.findFirst({
      where: { id: locationId, tenantId }
    })
    
    if (!location) return null
    
    return {
      id: location.id,
      tenantId: location.tenantId,
      name: location.name,
      code: location.code || undefined,
      type: location.type,
      status: location.status,
      address: {
        street1: location.addressLine1 || undefined,
        street2: location.addressLine2 || undefined,
        city: location.city || undefined,
        state: location.state || undefined,
        postalCode: location.postalCode || undefined,
        country: location.country || undefined
      },
      phone: location.phone || undefined,
      email: location.email || undefined,
      isDefault: location.isDefaultLocation,
      allowsPickup: location.allowsPickup,
      allowsShipping: location.allowsShipping,
      operatingHours: location.operatingHours as Record<string, unknown> || undefined
    }
  }
  
  /**
   * Get all locations for tenant
   */
  async getLocations(tenantId: string, activeOnly?: boolean): Promise<LocationData[]> {
    const locations = await prisma.location.findMany({
      where: {
        tenantId,
        ...(activeOnly && { status: 'ACTIVE' })
      },
      orderBy: [
        { isDefaultLocation: 'desc' },
        { name: 'asc' }
      ]
    })
    
    return locations.map(l => ({
      id: l.id,
      tenantId: l.tenantId,
      name: l.name,
      code: l.code || undefined,
      type: l.type,
      status: l.status,
      address: {
        street1: l.addressLine1 || undefined,
        street2: l.addressLine2 || undefined,
        city: l.city || undefined,
        state: l.state || undefined,
        postalCode: l.postalCode || undefined,
        country: l.country || undefined
      },
      phone: l.phone || undefined,
      email: l.email || undefined,
      isDefault: l.isDefaultLocation,
      allowsPickup: l.allowsPickup,
      allowsShipping: l.allowsShipping,
      operatingHours: l.operatingHours as Record<string, unknown> || undefined
    }))
  }
  
  /**
   * Get default location for tenant
   */
  async getDefaultLocation(tenantId: string): Promise<LocationData | null> {
    const location = await prisma.location.findFirst({
      where: { tenantId, isDefaultLocation: true, status: 'ACTIVE' }
    })
    
    if (!location) return null
    
    return {
      id: location.id,
      tenantId: location.tenantId,
      name: location.name,
      code: location.code || undefined,
      type: location.type,
      status: location.status,
      address: {
        street1: location.addressLine1 || undefined,
        street2: location.addressLine2 || undefined,
        city: location.city || undefined,
        state: location.state || undefined,
        postalCode: location.postalCode || undefined,
        country: location.country || undefined
      },
      phone: location.phone || undefined,
      email: location.email || undefined,
      isDefault: location.isDefaultLocation,
      allowsPickup: location.allowsPickup,
      allowsShipping: location.allowsShipping,
      operatingHours: location.operatingHours as Record<string, unknown> || undefined
    }
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const coreInventoryService = new CoreInventoryService()
export const coreCustomerService = new CoreCustomerService()
export const coreLocationService = new CoreLocationService()
