/**
 * MVM Public Marketplace Resolver (Wave I.2)
 * 
 * Server-side resolution for public marketplace pages.
 * Validates tenant, vendor, and product access for public consumers.
 * Reuses existing MVM services for data access.
 * 
 * KNOWN GAPS (documented per spec "If a gap exists: Document it, DO NOT invent a workaround"):
 * 
 * 1. Multi-vendor customer cart: No existing component. OrderSplitService handles
 *    order decomposition post-order, not cart. Cart placeholder used for now.
 * 
 * 2. Public vendor listing API: VendorService.list() is designed for admin use,
 *    excludes public display fields (logo, banner, city, product count). This
 *    resolver queries Prisma directly using same patterns as VendorService.
 *    Uses VendorService.getBySlug() for individual vendor resolution.
 * 
 * @module lib/marketplace/marketplace-resolver
 */

import { prisma } from '@/lib/prisma'
import { VendorService } from '@/lib/mvm/vendor-service'

export interface MarketplaceTenant {
  id: string
  name: string
  slug: string
  appName: string
  logoUrl: string | null
  primaryColor: string
  status: string
}

export interface MarketplaceVendor {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  banner: string | null
  status: string
  isVerified: boolean
  city: string | null
  state: string | null
  averageRating: number | null
  totalRatings: number
  totalProducts: number
  scoreBand: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEW'
}

export interface MarketplaceProduct {
  id: string
  tenantId: string
  vendorId: string
  vendorName: string
  vendorSlug: string
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice: number | null
  imageUrl: string | null
  isActive: boolean
  stockQuantity: number | null
}

export type TenantResolutionResult = 
  | { success: true; tenant: MarketplaceTenant }
  | { success: false; reason: 'not_found' | 'suspended' | 'mvm_disabled' }

export type VendorResolutionResult =
  | { success: true; vendor: MarketplaceVendor; tenant: MarketplaceTenant }
  | { success: false; reason: 'tenant_invalid' | 'vendor_not_found' | 'vendor_not_approved' }

export type ProductResolutionResult =
  | { success: true; product: MarketplaceProduct; vendor: MarketplaceVendor; tenant: MarketplaceTenant }
  | { success: false; reason: 'tenant_invalid' | 'product_not_found' | 'product_unavailable' }

function extractFirstImageUrl(images: unknown): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && 'url' in first) return (first as { url: string }).url
  }
  if (typeof images === 'string') return images
  return null
}

function calculateScoreBand(averageRating: number | null, totalRatings: number): 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'NEW' {
  if (totalRatings < 3 || averageRating === null) return 'NEW'
  if (averageRating >= 4.5 && totalRatings >= 5) return 'EXCELLENT'
  if (averageRating >= 3.5 && totalRatings >= 3) return 'GOOD'
  if (averageRating < 3.0 && totalRatings >= 3) return 'NEEDS_ATTENTION'
  return 'NEW'
}

export async function resolveMarketplaceTenant(tenantSlug: string): Promise<TenantResolutionResult> {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      appName: true,
      logoUrl: true,
      primaryColor: true,
      status: true,
      activatedModules: true
    }
  })

  if (!tenant) {
    return { success: false, reason: 'not_found' }
  }

  if (tenant.status === 'SUSPENDED' || tenant.status !== 'ACTIVE') {
    return { success: false, reason: 'suspended' }
  }

  const mvmEnabled = tenant.activatedModules.includes('mvm') || 
                     tenant.activatedModules.includes('commerce') ||
                     tenant.activatedModules.includes('marketplace')

  if (!mvmEnabled) {
    return { success: false, reason: 'mvm_disabled' }
  }

  return {
    success: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      appName: tenant.appName,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      status: tenant.status
    }
  }
}

export async function resolveMarketplaceVendor(
  tenantSlug: string, 
  vendorSlug: string
): Promise<VendorResolutionResult> {
  const tenantResult = await resolveMarketplaceTenant(tenantSlug)
  
  if (!tenantResult.success) {
    return { success: false, reason: 'tenant_invalid' }
  }

  const tenant = tenantResult.tenant

  const vendorData = await VendorService.getBySlug(tenant.id, vendorSlug)

  if (!vendorData) {
    return { success: false, reason: 'vendor_not_found' }
  }

  if (vendorData.status !== 'APPROVED') {
    return { success: false, reason: 'vendor_not_approved' }
  }

  const productCount = await prisma.mvm_product_mapping.count({
    where: {
      vendorId: vendorData.id,
      isActive: true
    }
  })

  const avgRating = vendorData.averageRating?.toNumber() ?? null
  const totalRatings = vendorData.reviewCount
  
  const vendor = {
    ...vendorData,
    averageRating: avgRating,
    totalRatings,
    totalProducts: productCount,
    scoreBand: calculateScoreBand(avgRating, totalRatings)
  }

  return {
    success: true,
    vendor: {
      id: vendor.id,
      tenantId: vendor.tenantId,
      name: vendor.name,
      slug: vendor.slug,
      description: vendorData.description,
      logo: vendorData.logo,
      banner: vendorData.banner,
      status: vendorData.status,
      isVerified: vendorData.isVerified,
      city: vendorData.city,
      state: vendorData.state,
      averageRating: vendor.averageRating,
      totalRatings: vendor.totalRatings,
      totalProducts: vendor.totalProducts,
      scoreBand: vendor.scoreBand
    },
    tenant
  }
}

export async function resolveMarketplaceProduct(
  tenantSlug: string,
  productSlug: string
): Promise<ProductResolutionResult> {
  const tenantResult = await resolveMarketplaceTenant(tenantSlug)
  
  if (!tenantResult.success) {
    return { success: false, reason: 'tenant_invalid' }
  }

  const tenant = tenantResult.tenant

  const product = await prisma.product.findFirst({
    where: {
      tenantId: tenant.id,
      slug: productSlug,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      status: true,
      images: true
    }
  })

  if (!product) {
    return { success: false, reason: 'product_not_found' }
  }

  const productMapping = await prisma.mvm_product_mapping.findFirst({
    where: {
      tenantId: tenant.id,
      productId: product.id,
      isActive: true
    },
    include: {
      vendor: {
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          banner: true,
          status: true,
          isVerified: true,
          city: true,
          state: true,
          averageRating: true,
          reviewCount: true
        }
      }
    }
  })

  if (!productMapping || !productMapping.vendor) {
    return { success: false, reason: 'product_not_found' }
  }

  if (productMapping.vendor.status !== 'APPROVED') {
    return { success: false, reason: 'product_unavailable' }
  }

  const vendor = productMapping.vendor
  const avgRating = vendor.averageRating?.toNumber() ?? null
  const totalRatings = vendor.reviewCount

  const effectivePrice = productMapping.vendorPrice?.toNumber() ?? product.price.toNumber()

  return {
    success: true,
    product: {
      id: product.id,
      tenantId: tenant.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: effectivePrice,
      compareAtPrice: productMapping.compareAtPrice?.toNumber() ?? product.compareAtPrice?.toNumber() ?? null,
      imageUrl: extractFirstImageUrl(product.images),
      isActive: productMapping.isActive,
      stockQuantity: productMapping.allocatedStock
    },
    vendor: {
      id: vendor.id,
      tenantId: vendor.tenantId,
      name: vendor.name,
      slug: vendor.slug,
      description: vendor.description,
      logo: vendor.logo,
      banner: vendor.banner,
      status: vendor.status,
      isVerified: vendor.isVerified,
      city: vendor.city,
      state: vendor.state,
      averageRating: avgRating,
      totalRatings,
      totalProducts: 0,
      scoreBand: calculateScoreBand(avgRating, totalRatings)
    },
    tenant
  }
}

export async function listMarketplaceVendors(
  tenantId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ vendors: MarketplaceVendor[]; total: number; page: number; totalPages: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20

  const where = {
    tenantId,
    status: 'APPROVED' as const
  }

  const [vendors, total] = await Promise.all([
    prisma.mvm_vendor.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        banner: true,
        status: true,
        isVerified: true,
        city: true,
        state: true,
        averageRating: true,
        reviewCount: true,
        _count: {
          select: {
            productMappings: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: [
        { isVerified: 'desc' },
        { averageRating: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.mvm_vendor.count({ where })
  ])

  return {
    vendors: vendors.map(v => {
      const avgRating = v.averageRating?.toNumber() ?? null
      const totalRatings = v.reviewCount
      return {
        id: v.id,
        tenantId: v.tenantId,
        name: v.name,
        slug: v.slug,
        description: v.description,
        logo: v.logo,
        banner: v.banner,
        status: v.status,
        isVerified: v.isVerified,
        city: v.city,
        state: v.state,
        averageRating: avgRating,
        totalRatings,
        totalProducts: v._count.productMappings,
        scoreBand: calculateScoreBand(avgRating, totalRatings)
      }
    }),
    total,
    page,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function listVendorProducts(
  vendorId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ products: MarketplaceProduct[]; total: number; page: number; totalPages: number }> {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20

  const vendor = await prisma.mvm_vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, slug: true, tenantId: true }
  })

  if (!vendor) {
    return { products: [], total: 0, page, totalPages: 0 }
  }

  const where = {
    vendorId,
    isActive: true
  }

  const [mappings, total] = await Promise.all([
    prisma.mvm_product_mapping.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.mvm_product_mapping.count({ where })
  ])

  const productIds = mappings.map(m => m.productId)
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      images: true,
      status: true
    }
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  return {
    products: mappings
      .filter(m => productMap.has(m.productId))
      .map(m => {
        const product = productMap.get(m.productId)!
        return {
          id: product.id,
          tenantId: vendor.tenantId,
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorSlug: vendor.slug,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: m.vendorPrice?.toNumber() ?? product.price.toNumber(),
          compareAtPrice: m.compareAtPrice?.toNumber() ?? product.compareAtPrice?.toNumber() ?? null,
          imageUrl: extractFirstImageUrl(product.images),
          isActive: m.isActive,
          stockQuantity: m.allocatedStock
        }
      }),
    total,
    page,
    totalPages: Math.ceil(total / pageSize)
  }
}
