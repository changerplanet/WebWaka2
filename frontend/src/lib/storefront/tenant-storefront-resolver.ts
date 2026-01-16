import { prisma } from '../prisma'
import { TenantStatus } from '@prisma/client'
import { TenantContextResolver, type TenantContext } from '../tenant-context'

export interface StorefrontTenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  activatedModules: string[]
}

export interface StorefrontProduct {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: number
  compareAtPrice: number | null
  images: { url: string; altText?: string }[]
  status: string
  categoryId: string | null
  categoryName?: string
}

export type StorefrontResolutionResult = 
  | { success: true; tenant: StorefrontTenant }
  | { success: false; reason: 'not_found' | 'store_disabled' | 'suspended' }

export type ProductResolutionResult = 
  | { success: true; product: StorefrontProduct; tenant: StorefrontTenant }
  | { success: false; reason: 'tenant_not_found' | 'product_not_found' | 'store_disabled' | 'suspended' }

function contextToStorefrontTenant(ctx: TenantContext): StorefrontTenant {
  return {
    id: ctx.tenantId,
    name: ctx.tenantName,
    slug: ctx.tenantSlug,
    status: 'ACTIVE' as TenantStatus,
    appName: ctx.appName,
    logoUrl: ctx.logoUrl,
    faviconUrl: ctx.faviconUrl,
    primaryColor: ctx.primaryColor,
    secondaryColor: ctx.secondaryColor,
    activatedModules: ctx.enabledModules,
  }
}

export async function resolveStorefrontBySlug(tenantSlug: string): Promise<StorefrontResolutionResult> {
  const result = await TenantContextResolver.resolveForSVM(tenantSlug)

  if (!result.success) {
    if (result.reason === 'not_found') {
      return { success: false, reason: 'not_found' }
    }
    if (result.reason === 'suspended') {
      return { success: false, reason: 'suspended' }
    }
    if (result.reason === 'module_disabled') {
      return { success: false, reason: 'store_disabled' }
    }
    return { success: false, reason: 'suspended' }
  }

  return { success: true, tenant: contextToStorefrontTenant(result.context) }
}

export async function resolveProductBySlug(
  tenantSlug: string, 
  productSlug: string
): Promise<ProductResolutionResult> {
  const tenantResult = await resolveStorefrontBySlug(tenantSlug)
  
  if (!tenantResult.success) {
    if (tenantResult.reason === 'not_found') {
      return { success: false, reason: 'tenant_not_found' }
    }
    return { success: false, reason: tenantResult.reason }
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
      tenantId: true,
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      price: true,
      compareAtPrice: true,
      images: true,
      status: true,
      categoryId: true,
      ProductCategory: {
        select: {
          name: true
        }
      }
    }
  })

  if (!product) {
    return { success: false, reason: 'product_not_found' }
  }

  let images: { url: string; altText?: string }[] = []
  if (product.images && typeof product.images === 'object') {
    if (Array.isArray(product.images)) {
      images = product.images.map((img: any) => ({
        url: img.url || img,
        altText: img.altText || img.alt
      }))
    }
  }

  return {
    success: true,
    product: {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      images,
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.ProductCategory?.name
    },
    tenant
  }
}

export async function getStorefrontProducts(tenantId: string, limit = 50): Promise<StorefrontProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      price: true,
      compareAtPrice: true,
      images: true,
      status: true,
      categoryId: true,
      ProductCategory: {
        select: {
          name: true
        }
      }
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  })

  return products.map(product => {
    let images: { url: string; altText?: string }[] = []
    if (product.images && typeof product.images === 'object') {
      if (Array.isArray(product.images)) {
        images = product.images.map((img: any) => ({
          url: img.url || img,
          altText: img.altText || img.alt
        }))
      }
    }

    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      images,
      status: product.status,
      categoryId: product.categoryId,
      categoryName: product.ProductCategory?.name
    }
  })
}
