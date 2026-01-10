/**
 * MVM Product Mapping Service
 * 
 * Maps Core catalog products to vendors with vendor-specific pricing.
 * 
 * @module lib/mvm/product-mapping-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProductMappingInput {
  tenantId: string
  vendorId: string
  productId: string
  variantId?: string
  vendorPrice?: number
  compareAtPrice?: number
  minPrice?: number
  maxPrice?: number
  allocatedStock?: number
  commissionOverride?: number
  isActive?: boolean
  isFeatured?: boolean
}

export interface UpdateProductMappingInput {
  vendorPrice?: number
  compareAtPrice?: number
  minPrice?: number
  maxPrice?: number
  allocatedStock?: number
  commissionOverride?: number
  isActive?: boolean
  isFeatured?: boolean
}

export interface ProductMappingListFilters {
  tenantId: string
  vendorId?: string
  productId?: string
  isActive?: boolean
  isFeatured?: boolean
  page?: number
  pageSize?: number
}

export interface PricingValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// PRODUCT MAPPING SERVICE
// ============================================================================

export const ProductMappingService = {
  /**
   * Create a new product mapping
   */
  async create(input: CreateProductMappingInput) {
    // Validate pricing
    const validation = this.validatePricing({
      vendorPrice: input.vendorPrice,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice
    })
    
    if (!validation.valid) {
      throw new Error(`Invalid pricing: ${validation.errors.join(', ')}`)
    }
    
    return prisma.mvm_product_mapping.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        vendorId: input.vendorId,
        productId: input.productId,
        variantId: input.variantId,
        vendorPrice: input.vendorPrice,
        compareAtPrice: input.compareAtPrice,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        allocatedStock: input.allocatedStock,
        commissionOverride: input.commissionOverride,
        isActive: input.isActive ?? true,
        isFeatured: input.isFeatured ?? false
      }) // AUTO-FIX: required by Prisma schema
    })
  },
  
  /**
   * Get mapping by ID
   */
  async getById(mappingId: string) {
    return prisma.mvm_product_mapping.findUnique({
      where: { id: mappingId },
      include: { vendor: { select: { id: true, name: true, slug: true } } }
    })
  },
  
  /**
   * Get mapping by vendor + product
   */
  async getByVendorProduct(vendorId: string, productId: string, variantId?: string) {
    return prisma.mvm_product_mapping.findFirst({
      where: {
        vendorId,
        productId,
        variantId: variantId || null
      }
    })
  },
  
  /**
   * Update a product mapping
   */
  async update(mappingId: string, input: UpdateProductMappingInput) {
    // Get current mapping for validation
    const current = await prisma.mvm_product_mapping.findUnique({
      where: { id: mappingId }
    })
    
    if (!current) {
      throw new Error('Product mapping not found')
    }
    
    // Merge current with updates for validation
    const validation = this.validatePricing({
      vendorPrice: input.vendorPrice ?? current.vendorPrice?.toNumber(),
      minPrice: input.minPrice ?? current.minPrice?.toNumber(),
      maxPrice: input.maxPrice ?? current.maxPrice?.toNumber()
    })
    
    if (!validation.valid) {
      throw new Error(`Invalid pricing: ${validation.errors.join(', ')}`)
    }
    
    return prisma.mvm_product_mapping.update({
      where: { id: mappingId },
      data: input
    })
  },
  
  /**
   * Delete a product mapping
   */
  async delete(mappingId: string) {
    return prisma.mvm_product_mapping.delete({
      where: { id: mappingId }
    })
  },
  
  /**
   * List product mappings with filters
   */
  async list(filters: ProductMappingListFilters) {
    const {
      tenantId,
      vendorId,
      productId,
      isActive,
      isFeatured,
      page = 1,
      pageSize = 50
    } = filters
    
    const where: Prisma.mvm_product_mappingWhereInput = {
      tenantId,
      ...(vendorId && { vendorId }),
      ...(productId && { productId }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured })
    }
    
    const [mappings, total] = await Promise.all([
      prisma.mvm_product_mapping.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_product_mapping.count({ where })
    ])
    
    return {
      mappings: mappings.map((m: any) => ({
        id: m.id,
        tenantId: m.tenantId,
        vendorId: m.vendorId,
        vendorName: m.vendor.name,
        vendorSlug: m.vendor.slug,
        productId: m.productId,
        variantId: m.variantId,
        vendorPrice: m.vendorPrice?.toNumber() || null,
        compareAtPrice: m.compareAtPrice?.toNumber() || null,
        minPrice: m.minPrice?.toNumber() || null,
        maxPrice: m.maxPrice?.toNumber() || null,
        allocatedStock: m.allocatedStock,
        commissionOverride: m.commissionOverride?.toNumber() || null,
        isActive: m.isActive,
        isFeatured: m.isFeatured,
        salesCount: m.salesCount,
        revenue: m.revenue.toNumber(),
        createdAt: m.createdAt
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * Get all vendors selling a specific product
   */
  async getVendorsForProduct(tenantId: string, productId: string, variantId?: string) {
    const mappings = await prisma.mvm_product_mapping.findMany({
      where: {
        tenantId,
        productId,
        variantId: variantId || undefined,
        isActive: true
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            isVerified: true,
            averageRating: true,
            reviewCount: true
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { vendor: { averageRating: 'desc' } }
      ]
    })
    
    // Filter out vendors that aren't approved
    return mappings
      .filter((m: any) => m.vendor.status === 'APPROVED')
      .map((m: any) => ({
        mappingId: m.id,
        vendorId: m.vendor.id,
        vendorName: m.vendor.name,
        vendorSlug: m.vendor.slug,
        isVerified: m.vendor.isVerified,
        averageRating: m.vendor.averageRating?.toNumber() || null,
        reviewCount: m.vendor.reviewCount,
        price: m.vendorPrice?.toNumber() || null,
        compareAtPrice: m.compareAtPrice?.toNumber() || null,
        isFeatured: m.isFeatured,
        inStock: m.allocatedStock === null || m.allocatedStock > 0
      }))
  },
  
  /**
   * Toggle active status
   */
  async toggleActive(mappingId: string) {
    const mapping = await prisma.mvm_product_mapping.findUnique({
      where: { id: mappingId }
    })
    
    if (!mapping) {
      throw new Error('Product mapping not found')
    }
    
    return prisma.mvm_product_mapping.update({
      where: { id: mappingId },
      data: { isActive: !mapping.isActive }
    })
  },
  
  /**
   * Toggle featured status
   */
  async toggleFeatured(mappingId: string) {
    const mapping = await prisma.mvm_product_mapping.findUnique({
      where: { id: mappingId }
    })
    
    if (!mapping) {
      throw new Error('Product mapping not found')
    }
    
    return prisma.mvm_product_mapping.update({
      where: { id: mappingId },
      data: { isFeatured: !mapping.isFeatured }
    })
  },
  
  /**
   * Validate pricing constraints
   */
  validatePricing(pricing: {
    vendorPrice?: number
    minPrice?: number
    maxPrice?: number
  }): PricingValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    const { vendorPrice, minPrice, maxPrice } = pricing
    
    // Check price constraints
    if (vendorPrice !== undefined) {
      if (vendorPrice < 0) {
        errors.push('Vendor price cannot be negative')
      }
      
      if (minPrice !== undefined && vendorPrice < minPrice) {
        errors.push(`Vendor price (₦${vendorPrice}) is below minimum (₦${minPrice})`)
      }
      
      if (maxPrice !== undefined && vendorPrice > maxPrice) {
        errors.push(`Vendor price (₦${vendorPrice}) exceeds maximum (₦${maxPrice})`)
      }
    }
    
    // Check min/max relationship
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      errors.push('Minimum price cannot be greater than maximum price')
    }
    
    // Warnings
    if (vendorPrice !== undefined && vendorPrice < 100) {
      warnings.push('Price below ₦100 may not be profitable after commission')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * Update mapping performance metrics (called after sale)
   */
  async recordSale(mappingId: string, quantity: number, revenue: number) {
    return prisma.mvm_product_mapping.update({
      where: { id: mappingId },
      data: {
        salesCount: { increment: quantity },
        revenue: { increment: revenue }
      }
    })
  },
  
  /**
   * Bulk activate/deactivate mappings for a vendor
   */
  async bulkUpdateStatus(vendorId: string, isActive: boolean) {
    return prisma.mvm_product_mapping.updateMany({
      where: { vendorId },
      data: { isActive }
    })
  },
  
  /**
   * Get mapping count for vendor
   */
  async getVendorMappingCount(vendorId: string) {
    const [total, active, featured] = await Promise.all([
      prisma.mvm_product_mapping.count({ where: { vendorId } }),
      prisma.mvm_product_mapping.count({ where: { vendorId, isActive: true } }),
      prisma.mvm_product_mapping.count({ where: { vendorId, isFeatured: true } })
    ])
    
    return { total, active, featured }
  },
  
  /**
   * Check if vendor can add more featured products (tier-based limit)
   */
  async canAddFeatured(vendorId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      include: { tier: true }
    })
    
    if (!vendor) {
      return { allowed: false, current: 0, limit: 0 }
    }
    
    const featuredLimit = vendor.tier?.featuredSlots ?? 0
    const currentFeatured = await prisma.mvm_product_mapping.count({
      where: { vendorId, isFeatured: true }
    })
    
    return {
      allowed: currentFeatured < featuredLimit,
      current: currentFeatured,
      limit: featuredLimit
    }
  }
}
