/**
 * MVM Payout Calculation Service
 * 
 * Calculates and prepares vendor payouts. Does NOT execute actual payments.
 * Nigeria-first with NGN currency and Nigerian bank fields.
 * 
 * @module lib/mvm/payout-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'
import { MvmPayoutStatus, MvmPayoutMethod, Prisma } from '@prisma/client'
import { CommissionService } from './commission-service'

// ============================================================================
// CONSTANTS (Nigeria-First)
// ============================================================================

const DEFAULT_MIN_PAYOUT = 5000 // ₦5,000 minimum payout
const DEFAULT_PAYOUT_CYCLE_DAYS = 14 // Bi-weekly

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePayoutInput {
  tenantId: string
  vendorId: string
  commissionIds: string[]
  payoutMethod?: MvmPayoutMethod
}

export interface PayoutListFilters {
  tenantId?: string
  vendorId?: string
  status?: MvmPayoutStatus
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

export interface PayoutEligibility {
  eligible: boolean
  reason?: string
  availableAmount: number
  minPayoutAmount: number
  pendingCommissions: number
}

// ============================================================================
// PAYOUT NUMBER GENERATION
// ============================================================================

function generatePayoutNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `PAY-${dateStr}-${random}`
}

// ============================================================================
// PAYOUT SERVICE
// ============================================================================

export const PayoutService = {
  /**
   * Check if vendor is eligible for payout
   */
  async checkEligibility(tenantId: string, vendorId: string): Promise<PayoutEligibility> {
    // Get vendor with bank details
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: vendorId },
      select: {
        status: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true
      }
    })
    
    if (!vendor) {
      return {
        eligible: false,
        reason: 'Vendor not found',
        availableAmount: 0,
        minPayoutAmount: DEFAULT_MIN_PAYOUT,
        pendingCommissions: 0
      }
    }
    
    if (vendor.status !== 'APPROVED') {
      return {
        eligible: false,
        reason: 'Vendor is not approved',
        availableAmount: 0,
        minPayoutAmount: DEFAULT_MIN_PAYOUT,
        pendingCommissions: 0
      }
    }
    
    // Check bank details
    if (!vendor.bankName || !vendor.bankCode || !vendor.accountNumber || !vendor.accountName) {
      return {
        eligible: false,
        reason: 'Bank details incomplete',
        availableAmount: 0,
        minPayoutAmount: DEFAULT_MIN_PAYOUT,
        pendingCommissions: 0
      }
    }
    
    // Get payable commissions
    const payable = await CommissionService.getPayable(vendorId)
    
    // Get marketplace config
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId }
    })
    
    const minPayout = config?.minPayoutAmount?.toNumber() ?? DEFAULT_MIN_PAYOUT
    
    if (payable.total < minPayout) {
      return {
        eligible: false,
        reason: `Minimum payout is ₦${minPayout.toLocaleString()}. Available: ₦${payable.total.toLocaleString()}`,
        availableAmount: payable.total,
        minPayoutAmount: minPayout,
        pendingCommissions: payable.count
      }
    }
    
    return {
      eligible: true,
      availableAmount: payable.total,
      minPayoutAmount: minPayout,
      pendingCommissions: payable.count
    }
  },
  
  /**
   * Create a payout from cleared commissions
   */
  async create(input: CreatePayoutInput) {
    // Validate commissions exist and are cleared
    const commissions = await prisma.mvm_commission.findMany({
      where: {
        id: { in: input.commissionIds },
        vendorId: input.vendorId,
        status: 'CLEARED',
        payoutId: null
      }
    })
    
    if (commissions.length !== input.commissionIds.length) {
      throw new Error('Some commissions are not eligible for payout')
    }
    
    // Get vendor bank details
    const vendor = await prisma.mvm_vendor.findUnique({
      where: { id: input.vendorId },
      select: {
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true
      }
    })
    
    if (!vendor?.bankName || !vendor?.accountNumber) {
      throw new Error('Vendor bank details incomplete')
    }
    
    // Calculate totals
    const grossAmount = commissions.reduce((sum: any, c: any) => sum + c.vendorPayout.toNumber(), 0)
    const netAmount = grossAmount // No deductions for now
    
    // Determine period
    const periodStart = new Date(Math.min(...commissions.map((c: any) => c.calculatedAt.getTime())))
    const periodEnd = new Date(Math.max(...commissions.map((c: any) => c.calculatedAt.getTime())))
    
    // Create payout
    const payout = await prisma.mvm_payout.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        vendorId: input.vendorId,
        payoutNumber: generatePayoutNumber(),
        periodStart,
        periodEnd,
        currency: 'NGN',
        grossAmount,
        deductions: 0,
        netAmount,
        status: 'PENDING',
        payoutMethod: input.payoutMethod || 'BANK_TRANSFER',
        bankName: vendor.bankName,
        bankCode: vendor.bankCode,
        accountNumber: vendor.accountNumber,
        accountName: vendor.accountName
      }) // AUTO-FIX: required by Prisma schema
    })
    
    // Link commissions to payout
    await prisma.mvm_commission.updateMany({
      where: { id: { in: input.commissionIds } },
      data: { payoutId: payout.id }
    })
    
    return payout
  },
  
  /**
   * Create payout for all cleared commissions for a vendor
   */
  async createFromAllCleared(tenantId: string, vendorId: string) {
    const payable = await CommissionService.getPayable(vendorId)
    
    if (payable.count === 0) {
      throw new Error('No cleared commissions available')
    }
    
    const eligibility = await this.checkEligibility(tenantId, vendorId)
    
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible for payout')
    }
    
    return this.create({
      tenantId,
      vendorId,
      commissionIds: payable.commissions.map((c: any) => c.id)
    })
  },
  
  /**
   * Get payout by ID
   */
  async getById(payoutId: string) {
    return prisma.mvm_payout.findUnique({
      where: { id: payoutId },
      include: {
        vendor: { select: { id: true, name: true, slug: true } },
        commissions: {
          select: {
            id: true,
            vendorPayout: true,
            subOrder: { select: { subOrderNumber: true } }
          }
        }
      }
    })
  },
  
  /**
   * Get payout by number
   */
  async getByNumber(payoutNumber: string) {
    return prisma.mvm_payout.findUnique({
      where: { payoutNumber }
    })
  },
  
  /**
   * List payouts with filters
   */
  async list(filters: PayoutListFilters) {
    const {
      tenantId,
      vendorId,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 20
    } = filters
    
    const where: Prisma.mvm_payoutWhereInput = {
      ...(tenantId && { tenantId }),
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } })
    }
    
    const [payouts, total] = await Promise.all([
      prisma.mvm_payout.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          _count: { select: { commissions: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_payout.count({ where })
    ])
    
    return {
      payouts: payouts.map((p: any) => ({
        id: p.id,
        payoutNumber: p.payoutNumber,
        vendorId: p.vendorId,
        vendorName: p.vendor.name,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        grossAmount: p.grossAmount.toNumber(),
        deductions: p.deductions.toNumber(),
        netAmount: p.netAmount.toNumber(),
        status: p.status,
        payoutMethod: p.payoutMethod,
        commissionCount: p._count.commissions,
        createdAt: p.createdAt,
        completedAt: p.completedAt
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * Approve a payout (marks ready for processing)
   */
  async approve(payoutId: string, approvedBy: string) {
    const payout = await prisma.mvm_payout.findUnique({
      where: { id: payoutId }
    })
    
    if (!payout) {
      throw new Error('Payout not found')
    }
    
    if (payout.status !== 'PENDING') {
      throw new Error(`Cannot approve payout with status ${payout.status}`)
    }
    
    return prisma.mvm_payout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        approvedAt: new Date(),
        approvedBy,
        processedAt: new Date()
      }
    })
  },
  
  /**
   * Mark payout as completed (after bank transfer)
   */
  async markCompleted(payoutId: string, paymentRef?: string) {
    const payout = await prisma.mvm_payout.findUnique({
      where: { id: payoutId }
    })
    
    if (!payout) {
      throw new Error('Payout not found')
    }
    
    if (payout.status !== 'PROCESSING') {
      throw new Error(`Cannot complete payout with status ${payout.status}`)
    }
    
    // Update payout
    await prisma.mvm_payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        paymentRef
      }
    })
    
    // Mark all linked commissions as paid
    await prisma.mvm_commission.updateMany({
      where: { payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    })
    
    return this.getById(payoutId)
  },
  
  /**
   * Mark payout as failed
   */
  async markFailed(payoutId: string, reason: string) {
    const payout = await prisma.mvm_payout.findUnique({
      where: { id: payoutId }
    })
    
    if (!payout) {
      throw new Error('Payout not found')
    }
    
    // Unlink commissions (make them available for next payout)
    await prisma.mvm_commission.updateMany({
      where: { payoutId },
      data: { payoutId: null }
    })
    
    return prisma.mvm_payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: reason
      }
    })
  },
  
  /**
   * Cancel a pending payout
   */
  async cancel(payoutId: string) {
    const payout = await prisma.mvm_payout.findUnique({
      where: { id: payoutId }
    })
    
    if (!payout) {
      throw new Error('Payout not found')
    }
    
    if (payout.status !== 'PENDING') {
      throw new Error(`Cannot cancel payout with status ${payout.status}`)
    }
    
    // Unlink commissions
    await prisma.mvm_commission.updateMany({
      where: { payoutId },
      data: { payoutId: null }
    })
    
    return prisma.mvm_payout.update({
      where: { id: payoutId },
      data: { status: 'CANCELLED' }
    })
  },
  
  /**
   * Get payout summary for vendor
   */
  async getVendorPayoutSummary(vendorId: string) {
    const [pending, completed, failed] = await Promise.all([
      prisma.mvm_payout.aggregate({
        where: { vendorId, status: { in: ['PENDING', 'PROCESSING'] } },
        _sum: { netAmount: true },
        _count: true
      }),
      prisma.mvm_payout.aggregate({
        where: { vendorId, status: 'COMPLETED' },
        _sum: { netAmount: true },
        _count: true
      }),
      prisma.mvm_payout.aggregate({
        where: { vendorId, status: 'FAILED' },
        _count: true
      })
    ])
    
    // Get available (cleared but not in payout)
    const available = await CommissionService.getPayable(vendorId)
    
    return {
      available: available.total,
      pending: pending._sum.netAmount?.toNumber() || 0,
      pendingCount: pending._count,
      totalPaid: completed._sum.netAmount?.toNumber() || 0,
      paidCount: completed._count,
      failedCount: failed._count
    }
  },
  
  /**
   * Get recent payouts for vendor dashboard
   */
  async getRecentPayouts(vendorId: string, limit = 5) {
    const payouts = await prisma.mvm_payout.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    return payouts.map((p: any) => ({
      id: p.id,
      payoutNumber: p.payoutNumber,
      netAmount: p.netAmount.toNumber(),
      status: p.status,
      payoutMethod: p.payoutMethod,
      createdAt: p.createdAt,
      completedAt: p.completedAt
    }))
  },
  
  /**
   * Get vendors eligible for payout in a tenant
   */
  async getEligibleVendors(tenantId: string) {
    // Get marketplace config
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId }
    })
    
    const minPayout = config?.minPayoutAmount?.toNumber() ?? DEFAULT_MIN_PAYOUT
    
    // Get all approved vendors with cleared commissions
    const vendors = await prisma.mvm_vendor.findMany({
      where: {
        tenantId,
        status: 'APPROVED',
        bankName: { not: null },
        accountNumber: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        commissions: {
          where: {
            status: 'CLEARED',
            payoutId: null
          },
          select: { vendorPayout: true }
        }
      }
    })
    
    // Filter to those meeting minimum
    return vendors
      .map((v: string) => ({
        vendorId: v.id,
        vendorName: v.name,
        email: v.email,
        availableAmount: v.commissions.reduce((sum: any, c: any) => sum + c.vendorPayout.toNumber(), 0),
        commissionCount: v.commissions.length
      }))
      .filter((v: string) => v.availableAmount >= minPayout)
  }
}
