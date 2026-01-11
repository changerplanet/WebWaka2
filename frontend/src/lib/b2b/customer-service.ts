/**
 * MODULE 9: B2B & WHOLESALE
 * Customer & Profile Service
 * 
 * PHASE 2: B2B Customer Classification
 * 
 * CRITICAL: Does NOT duplicate Customer entity from Core.
 * Only extends with B2B-specific data.
 */

import { prisma } from '@/lib/prisma'
import { B2BCustomerType, B2BProfileStatus, B2BCreditStatus, Prisma } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface B2BProfile {
  id: string
  tenantId: string
  customerId: string
  isB2B: boolean
  customerType: B2BCustomerType
  businessName: string | null
  businessRegNo: string | null
  taxId: string | null
  primaryContact: string | null
  primaryPhone: string | null
  primaryEmail: string | null
  priceTierId: string | null
  creditTermId: string | null
  creditLimit: number
  creditUsed: number
  creditAvailable: number
  creditStatus: B2BCreditStatus
  allowCashPurchase: boolean
  allowCreditPurchase: boolean
  status: B2BProfileStatus
  verifiedAt: Date | null
  createdAt: Date
}

export interface CreateB2BProfileInput {
  customerId: string
  customerType?: B2BCustomerType
  businessName?: string
  businessRegNo?: string
  taxId?: string
  primaryContact?: string
  primaryPhone?: string
  primaryEmail?: string
  priceTierId?: string
  creditTermId?: string
  creditLimit?: number
  allowCashPurchase?: boolean
  allowCreditPurchase?: boolean
}

// ============================================================================
// SERVICE
// ============================================================================

export class B2BCustomerService {
  /**
   * Get B2B profile for a customer
   */
  static async getProfile(tenantId: string, customerId: string): Promise<B2BProfile | null> {
    const profile = await prisma.b2b_customer_profiles.findUnique({
      where: { tenantId_customerId: { tenantId, customerId } },
    })

    if (!profile) return null

    return this.formatProfile(profile)
  }

  /**
   * Create B2B profile for existing Core customer
   * NOTE: Does NOT create a new Customer, only extends existing
   */
  static async createProfile(
    tenantId: string,
    input: CreateB2BProfileInput
  ): Promise<B2BProfile> {
    // Verify customer exists in Core
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, tenantId },
    })

    if (!customer) {
      throw new Error('Customer not found in Core. Cannot create B2B profile for non-existent customer.')
    }

    const customerName = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown'

    const profile = await prisma.b2b_customer_profiles.create({
      data: withPrismaDefaults({
        tenantId,
        customerId: input.customerId,
        customerType: input.customerType || 'RETAILER',
        businessName: input.businessName || customerName,
        businessRegNo: input.businessRegNo,
        taxId: input.taxId,
        primaryContact: input.primaryContact || customerName,
        primaryPhone: input.primaryPhone || customer.phone,
        primaryEmail: input.primaryEmail || customer.email,
        priceTierId: input.priceTierId,
        creditTermId: input.creditTermId,
        creditLimit: input.creditLimit || 0,
        allowCashPurchase: input.allowCashPurchase ?? true,
        allowCreditPurchase: input.allowCreditPurchase ?? false,
        status: 'ACTIVE',
      }),
    })

    // Log event
    await this.logEvent(tenantId, 'B2B_PROFILE_CREATED', {
      profileId: profile.id,
      customerId: input.customerId,
    })

    return this.formatProfile(profile)
  }

  /**
   * Update B2B profile
   */
  static async updateProfile(
    tenantId: string,
    profileId: string,
    updates: Partial<CreateB2BProfileInput>
  ): Promise<B2BProfile> {
    const profile = await prisma.b2b_customer_profiles.update({
      where: { id: profileId, tenantId },
      data: {
        customerType: updates.customerType,
        businessName: updates.businessName,
        businessRegNo: updates.businessRegNo,
        taxId: updates.taxId,
        primaryContact: updates.primaryContact,
        primaryPhone: updates.primaryPhone,
        primaryEmail: updates.primaryEmail,
        priceTierId: updates.priceTierId,
        creditTermId: updates.creditTermId,
        creditLimit: updates.creditLimit,
        allowCashPurchase: updates.allowCashPurchase,
        allowCreditPurchase: updates.allowCreditPurchase,
      },
    })

    return this.formatProfile(profile)
  }

  /**
   * List B2B profiles
   */
  static async listProfiles(
    tenantId: string,
    options?: {
      status?: B2BProfileStatus[]
      customerType?: B2BCustomerType[]
      priceTierId?: string
      page?: number
      limit?: number
    }
  ): Promise<{ profiles: B2BProfile[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      ...(options?.status && { status: { in: options.status } }),
      ...(options?.customerType && { customerType: { in: options.customerType } }),
      ...(options?.priceTierId && { priceTierId: options.priceTierId }),
    }

    const [profiles, total] = await Promise.all([
      prisma.b2b_customer_profiles.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.b2b_customer_profiles.count({ where }),
    ])

    return {
      profiles: profiles.map(p => this.formatProfile(p)),
      total,
    }
  }

  /**
   * Verify B2B profile
   */
  static async verifyProfile(
    tenantId: string,
    profileId: string,
    verifiedBy: string
  ): Promise<B2BProfile> {
    const profile = await prisma.b2b_customer_profiles.update({
      where: { id: profileId, tenantId },
      data: {
        status: 'ACTIVE',
        verifiedAt: new Date(),
        verifiedBy,
      },
    })

    await this.logEvent(tenantId, 'B2B_PROFILE_VERIFIED', {
      profileId,
      verifiedBy,
    })

    return this.formatProfile(profile)
  }

  /**
   * Update credit usage
   */
  static async updateCreditUsage(
    tenantId: string,
    profileId: string,
    amount: number,
    operation: 'ADD' | 'SUBTRACT'
  ): Promise<B2BProfile> {
    const profile = await prisma.b2b_customer_profiles.findUnique({
      where: { id: profileId, tenantId },
    })

    if (!profile) throw new Error('Profile not found')

    const currentUsed = profile.creditUsed.toNumber()
    const newUsed = operation === 'ADD'
      ? currentUsed + amount
      : Math.max(0, currentUsed - amount)

    // Check if exceeds limit
    const creditLimit = profile.creditLimit.toNumber()
    let newStatus = profile.creditStatus
    if (newUsed > creditLimit && creditLimit > 0) {
      newStatus = 'EXCEEDED'
    } else if (newUsed <= creditLimit) {
      newStatus = 'ACTIVE'
    }

    const updated = await prisma.b2b_customer_profiles.update({
      where: { id: profileId },
      data: {
        creditUsed: newUsed,
        creditStatus: newStatus,
      },
    })

    return this.formatProfile(updated)
  }

  /**
   * Get statistics
   */
  static async getStatistics(tenantId: string) {
    const [byStatus, byType, byTier, creditStats] = await Promise.all([
      prisma.b2b_customer_profiles.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.b2b_customer_profiles.groupBy({
        by: ['customerType'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.b2b_customer_profiles.groupBy({
        by: ['priceTierId'],
        where: { tenantId, priceTierId: { not: null } },
        _count: { id: true },
      }),
      prisma.b2b_customer_profiles.aggregate({
        where: { tenantId },
        _sum: { creditLimit: true, creditUsed: true },
      }),
    ])

    return {
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
      byType: byType.reduce((acc, t) => ({ ...acc, [t.customerType]: t._count.id }), {}),
      byTier: byTier,
      creditStats: {
        totalLimit: creditStats._sum.creditLimit?.toNumber() || 0,
        totalUsed: creditStats._sum.creditUsed?.toNumber() || 0,
      },
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private static formatProfile(profile: {
    id: string
    tenantId: string
    customerId: string
    isB2B: boolean
    customerType: B2BCustomerType
    businessName: string | null
    businessRegNo: string | null
    taxId: string | null
    primaryContact: string | null
    primaryPhone: string | null
    primaryEmail: string | null
    priceTierId: string | null
    creditTermId: string | null
    creditLimit: { toNumber: () => number }
    creditUsed: { toNumber: () => number }
    creditStatus: B2BCreditStatus
    allowCashPurchase: boolean
    allowCreditPurchase: boolean
    status: B2BProfileStatus
    verifiedAt: Date | null
    createdAt: Date
  }): B2BProfile {
    const creditLimit = profile.creditLimit.toNumber()
    const creditUsed = profile.creditUsed.toNumber()

    return {
      id: profile.id,
      tenantId: profile.tenantId,
      customerId: profile.customerId,
      isB2B: profile.isB2B,
      customerType: profile.customerType,
      businessName: profile.businessName,
      businessRegNo: profile.businessRegNo,
      taxId: profile.taxId,
      primaryContact: profile.primaryContact,
      primaryPhone: profile.primaryPhone,
      primaryEmail: profile.primaryEmail,
      priceTierId: profile.priceTierId,
      creditTermId: profile.creditTermId,
      creditLimit,
      creditUsed,
      creditAvailable: Math.max(0, creditLimit - creditUsed),
      creditStatus: profile.creditStatus,
      allowCashPurchase: profile.allowCashPurchase,
      allowCreditPurchase: profile.allowCreditPurchase,
      status: profile.status,
      verifiedAt: profile.verifiedAt,
      createdAt: profile.createdAt,
    }
  }

  private static async logEvent(tenantId: string, eventType: string, eventData: Record<string, unknown>) {
    await prisma.b2b_event_logs.create({
      data: withPrismaDefaults({
        tenantId,
        eventType,
        eventData: eventData as Prisma.InputJsonValue,
      }),
    })
  }
}
