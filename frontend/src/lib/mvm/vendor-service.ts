/**
 * MVM Vendor Service
 * 
 * Core domain service for vendor lifecycle management.
 * Handles CRUD operations, status transitions, and vendor queries.
 * 
 * @module lib/mvm/vendor-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'
import { 
  MvmVendorStatus, 
  MvmOnboardingStep,
  Prisma 
} from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateVendorInput {
  tenantId: string
  platformInstanceId?: string
  name: string
  email: string
  phone?: string
  legalName?: string
  taxId?: string
  businessType?: string
  description?: string
  logo?: string
  banner?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  metadata?: Record<string, unknown>
}

export interface UpdateVendorInput {
  name?: string
  phone?: string
  legalName?: string
  taxId?: string
  businessType?: string
  description?: string
  logo?: string
  banner?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  bankName?: string
  bankCode?: string
  accountNumber?: string
  accountName?: string
  metadata?: Record<string, unknown>
}

export interface VendorListFilters {
  tenantId: string
  platformInstanceId?: string
  status?: MvmVendorStatus
  tierId?: string
  isVerified?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export interface VendorListResult {
  vendors: VendorSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface VendorSummary {
  id: string
  name: string
  slug: string
  email: string
  status: MvmVendorStatus
  isVerified: boolean
  tierName: string | null
  commissionRate: number
  totalSales: number
  totalOrders: number
  averageRating: number | null
  createdAt: Date
}

// ============================================================================
// SLUG GENERATION
// ============================================================================

/**
 * Generate URL-friendly slug from vendor name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Ensure slug is unique within tenant
 */
async function ensureUniqueSlug(
  tenantId: string, 
  baseSlug: string, 
  excludeVendorId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await prisma.mvm_vendor.findFirst({
      where: {
        tenantId,
        slug,
        ...(excludeVendorId ? { NOT: { id: excludeVendorId } } : {})
      }
    })
    
    if (!existing) return slug
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// ============================================================================
// VENDOR SERVICE
// ============================================================================

export const VendorService = {
  /**
   * Create a new vendor
   */
  async create(input: CreateVendorInput): Promise<{ id: string; slug: string }> {
    const baseSlug = generateSlug(input.name)
    const slug = await ensureUniqueSlug(input.tenantId, baseSlug)
    
    // Find default tier for this tenant
    const defaultTier = await prisma.mvm_vendor_tier.findFirst({
      where: {
        tenantId: input.tenantId,
        isDefault: true,
        isActive: true
      }
    })
    
    const vendor = await prisma.mvm_vendor.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        platformInstanceId: input.platformInstanceId,
        name: input.name,
        slug,
        email: input.email.toLowerCase(),
        phone: input.phone,
        legalName: input.legalName,
        taxId: input.taxId,
        businessType: input.businessType,
        description: input.description,
        logo: input.logo,
        banner: input.banner,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country || 'NG',
        status: 'PENDING_APPROVAL',
        onboardingStep: 'REGISTERED',
        tierId: defaultTier?.id,
        metadata: input.metadata as Prisma.JsonValue
      }),
      select: { id: true, slug: true }
    })
    
    return vendor
  },
  
  /**
   * Get vendor by ID
   */
  async getById(tenantId: string, vendorId: string) {
    return prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId },
      include: {
        tier: {
          select: {
            id: true,
            name: true,
            code: true,
            commissionRate: true,
            priorityLevel: true,
            featuredSlots: true,
            supportLevel: true
          }
        }
      }
    })
  },
  
  /**
   * Get vendor by slug
   */
  async getBySlug(tenantId: string, slug: string) {
    return prisma.mvm_vendor.findFirst({
      where: { slug, tenantId },
      include: {
        tier: {
          select: {
            id: true,
            name: true,
            code: true,
            commissionRate: true
          }
        }
      }
    })
  },
  
  /**
   * Get vendor by email
   */
  async getByEmail(tenantId: string, email: string) {
    return prisma.mvm_vendor.findFirst({
      where: { 
        tenantId, 
        email: email.toLowerCase() 
      }
    })
  },
  
  /**
   * Update vendor profile
   */
  async update(tenantId: string, vendorId: string, input: UpdateVendorInput) {
    // If name changed, update slug
    let slugUpdate: { slug?: string } = {}
    if (input.name) {
      const baseSlug = generateSlug(input.name)
      slugUpdate.slug = await ensureUniqueSlug(tenantId, baseSlug, vendorId)
    }
    
    return prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: {
        ...input,
        ...slugUpdate,
        metadata: input.metadata as Prisma.JsonValue
      }
    })
  },
  
  /**
   * List vendors with filters
   */
  async list(filters: VendorListFilters): Promise<VendorListResult> {
    const { 
      tenantId, 
      platformInstanceId,
      status, 
      tierId, 
      isVerified, 
      search,
      page = 1, 
      pageSize = 20 
    } = filters
    
    const where: Prisma.mvm_vendorWhereInput = {
      tenantId,
      ...(platformInstanceId && { platformInstanceId }),
      ...(status && { status }),
      ...(tierId && { tierId }),
      ...(isVerified !== undefined && { isVerified }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } }
        ]
      })
    }
    
    const [vendors, total] = await Promise.all([
      prisma.mvm_vendor.findMany({
        where,
        include: {
          tier: { select: { name: true, commissionRate: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_vendor.count({ where })
    ])
    
    return {
      vendors: vendors.map((v: string) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        email: v.email,
        status: v.status,
        isVerified: v.isVerified,
        tierName: v.tier?.name || null,
        commissionRate: v.commissionOverride?.toNumber() ?? v.tier?.commissionRate?.toNumber() ?? 15,
        totalSales: v.totalSales.toNumber(),
        totalOrders: v.totalOrders,
        averageRating: v.averageRating?.toNumber() || null,
        createdAt: v.createdAt
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * Get effective commission rate for vendor
   */
  async getEffectiveCommissionRate(tenantId: string, vendorId: string): Promise<number> {
    const vendor = await prisma.mvm_vendor.findFirst({
      where: { id: vendorId, tenantId },
      include: { tier: true }
    })
    
    if (!vendor) {
      // Fall back to marketplace default
      const config = await prisma.mvm_marketplace_config.findUnique({
        where: { tenantId }
      })
      return config?.defaultCommissionRate?.toNumber() ?? 15
    }
    
    // Priority: vendor override > tier rate > marketplace default
    if (vendor.commissionOverride) {
      return vendor.commissionOverride.toNumber()
    }
    
    if (vendor.tier?.commissionRate) {
      return vendor.tier.commissionRate.toNumber()
    }
    
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId }
    })
    return config?.defaultCommissionRate?.toNumber() ?? 15
  },
  
  /**
   * Update vendor performance metrics (called after order completion)
   */
  async updateMetrics(
    vendorId: string, 
    metrics: { 
      addSales?: number
      addOrders?: number 
      newRating?: number
      newReviewCount?: number
    }
  ) {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId }
    })
    
    if (!vendor) return null
    
    const updates: Prisma.mvm_vendorUpdateInput = {}
    
    if (metrics.addSales) {
      updates.totalSales = { increment: metrics.addSales }
    }
    
    if (metrics.addOrders) {
      updates.totalOrders = { increment: metrics.addOrders }
    }
    
    if (metrics.newRating !== undefined) {
      updates.averageRating = metrics.newRating
    }
    
    if (metrics.newReviewCount !== undefined) {
      updates.reviewCount = metrics.newReviewCount
    }
    
    return prisma.mvm_vendor.update({
      where: { id: vendorId },
      data: updates
    })
  },
  
  /**
   * Check if vendor has required bank details for payout
   */
  async hasBankDetails(vendorId: string): Promise<boolean> {
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: { bankName: true, bankCode: true, accountNumber: true, accountName: true }
    })
    
    return !!(
      vendor?.bankName && 
      vendor?.bankCode && 
      vendor?.accountNumber && 
      vendor?.accountName
    )
  },
  
  /**
   * Get vendor dashboard summary
   */
  async getDashboardSummary(tenantId: string, vendorId: string) {
    const vendor = await this.getById(tenantId, vendorId)
    if (!vendor) return null
    
    // Get pending commission total
    const pendingCommissions = await prisma.mvm_commission.aggregate({
      where: { vendorId, status: { in: ['PENDING', 'PROCESSING', 'CLEARED'] } },
      _sum: { vendorPayout: true }
    })
    
    // Get recent sub-orders
    const recentOrders = await prisma.mvm_sub_order.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { inv_audit_items: true }
    })
    
    // Get top products by revenue
    const topProducts = await prisma.mvm_product_mapping.findMany({
      where: { vendorId, isActive: true },
      orderBy: { revenue: 'desc' },
      take: 5
    })
    
    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        status: vendor.status,
        isVerified: vendor.isVerified,
        tierName: vendor.tier?.name || null,
        commissionRate: vendor.commissionOverride?.toNumber() ?? vendor.tier?.commissionRate?.toNumber() ?? 15
      },
      metrics: {
        totalSales: vendor.totalSales.toNumber(),
        totalOrders: vendor.totalOrders,
        averageRating: vendor.averageRating?.toNumber() || null,
        reviewCount: vendor.reviewCount,
        pendingPayout: pendingCommissions._sum.vendorPayout?.toNumber() || 0
      },
      recentOrders: recentOrders.map((o: any) => ({
        id: o.id,
        subOrderNumber: o.subOrderNumber,
        status: o.status,
        grandTotal: o.grandTotal.toNumber(),
        vendorPayout: o.vendorPayout.toNumber(),
        createdAt: o.createdAt
      })),
      topProducts: topProducts.map((p: any) => ({
        id: p.id,
        productId: p.productId,
        salesCount: p.salesCount,
        revenue: p.revenue.toNumber(),
        isActive: p.isActive
      }))
    }
  }
}
