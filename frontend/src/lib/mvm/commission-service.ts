/**
 * MVM Commission Service
 * 
 * Handles commission calculation, tracking, and clearing.
 * Nigeria-first with 7.5% VAT built-in.
 * 
 * @module lib/mvm/commission-service
 * @canonical PC-SCP Phase S3
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../prisma'
import { MvmCommissionStatus, Prisma } from '@prisma/client'
import { VendorService } from './vendor-service'

// ============================================================================
// CONSTANTS (Nigeria-First)
// ============================================================================

const NIGERIA_VAT_RATE = 0.075 // 7.5%
const DEFAULT_CLEARANCE_DAYS = 7 // Days after delivery before commission clears

// ============================================================================
// TYPES
// ============================================================================

export interface CommissionCalculation {
  saleAmount: number
  vatAmount: number
  commissionRate: number
  commissionAmount: number
  vendorPayout: number
}

export interface CommissionListFilters {
  tenantId?: string
  vendorId?: string
  status?: MvmCommissionStatus
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

export interface CommissionSummary {
  pending: number
  processing: number
  cleared: number
  paid: number
  disputed: number
  reversed: number
  total: number
}

// ============================================================================
// COMMISSION SERVICE
// ============================================================================

export const CommissionService = {
  /**
   * Calculate commission for a given sale amount
   */
  calculate(saleAmount: number, commissionRate: number): CommissionCalculation {
    // VAT is calculated on net sale
    const vatAmount = Math.round(saleAmount * NIGERIA_VAT_RATE * 100) / 100
    
    // Commission is calculated on sale amount (before VAT)
    const commissionAmount = Math.round(saleAmount * (commissionRate / 100) * 100) / 100
    
    // Vendor receives: sale + VAT - commission - VAT (VAT is pass-through)
    // Simplified: vendor receives sale - commission
    const vendorPayout = Math.round((saleAmount - commissionAmount) * 100) / 100
    
    return {
      saleAmount,
      vatAmount,
      commissionRate,
      commissionAmount,
      vendorPayout
    }
  },
  
  /**
   * Create commission record from a sub-order
   */
  async createFromSubOrder(subOrderId: string) {
    const subOrder = await prisma.mvm_sub_order.findUnique({
      where: { id: subOrderId },
      include: { vendor: true }
    })
    
    if (!subOrder) {
      throw new Error('Sub-order not found')
    }
    
    // Check if commission already exists
    const existing = await prisma.mvm_commission.findUnique({
      where: { subOrderId }
    })
    
    if (existing) {
      return existing
    }
    
    // Get marketplace config for clearance days
    const config = await prisma.mvm_marketplace_config.findUnique({
      where: { tenantId: subOrder.tenantId }
    })
    
    const clearanceDays = config?.clearanceDays ?? DEFAULT_CLEARANCE_DAYS
    const clearsAt = new Date()
    clearsAt.setDate(clearsAt.getDate() + clearanceDays)
    
    return prisma.mvm_commission.create({
      data: withPrismaDefaults({
        tenantId: subOrder.tenantId,
        subOrderId,
        vendorId: subOrder.vendorId,
        saleAmount: subOrder.subtotal,
        vatAmount: subOrder.taxTotal,
        commissionRate: subOrder.commissionRate,
        commissionAmount: subOrder.commissionAmount,
        vendorPayout: subOrder.vendorPayout,
        status: 'PENDING',
        clearsAt
      }) // AUTO-FIX: required by Prisma schema
    })
  },
  
  /**
   * Get commission by ID
   */
  async getById(commissionId: string) {
    return prisma.mvm_commission.findUnique({
      where: { id: commissionId },
      include: {
        vendor: { select: { id: true, name: true, slug: true } },
        subOrder: {
          select: {
            subOrderNumber: true,
            status: true,
            parentOrder: { select: { orderNumber: true } }
          }
        }
      }
    })
  },
  
  /**
   * Get commission by sub-order ID
   */
  async getBySubOrderId(subOrderId: string) {
    return prisma.mvm_commission.findUnique({
      where: { subOrderId }
    })
  },
  
  /**
   * List commissions with filters
   */
  async list(filters: CommissionListFilters) {
    const {
      tenantId,
      vendorId,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 50
    } = filters
    
    const where: Prisma.mvm_commissionWhereInput = {
      ...(tenantId && { tenantId }),
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      ...(startDate && { calculatedAt: { gte: startDate } }),
      ...(endDate && { calculatedAt: { lte: endDate } })
    }
    
    const [commissions, total] = await Promise.all([
      prisma.mvm_commission.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          subOrder: {
            select: {
              subOrderNumber: true,
              parentOrder: { select: { orderNumber: true } }
            }
          }
        },
        orderBy: { calculatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.mvm_commission.count({ where })
    ])
    
    return {
      commissions: commissions.map((c: any) => ({
        id: c.id,
        vendorId: c.vendorId,
        vendorName: c.vendor.name,
        subOrderNumber: c.subOrder.subOrderNumber,
        orderNumber: c.subOrder.parentOrder.orderNumber,
        saleAmount: c.saleAmount.toNumber(),
        vatAmount: c.vatAmount.toNumber(),
        commissionRate: c.commissionRate.toNumber(),
        commissionAmount: c.commissionAmount.toNumber(),
        vendorPayout: c.vendorPayout.toNumber(),
        status: c.status,
        clearsAt: c.clearsAt,
        clearedAt: c.clearedAt,
        paidAt: c.paidAt,
        calculatedAt: c.calculatedAt
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  },
  
  /**
   * Mark commission as cleared (after clearance period)
   */
  async markCleared(commissionId: string) {
    const commission = await prisma.mvm_commission.findUnique({
      where: { id: commissionId }
    })
    
    if (!commission) return null
    
    if (commission.status !== 'PENDING' && commission.status !== 'PROCESSING') {
      return commission
    }
    
    return prisma.mvm_commission.update({
      where: { id: commissionId },
      data: {
        status: 'CLEARED',
        clearedAt: new Date()
      }
    })
  },
  
  /**
   * Process clearance for all eligible commissions
   * Called by scheduled job (not implemented in S3 per guardrails)
   */
  async processClearances(tenantId: string): Promise<number> {
    const now = new Date()
    
    const result = await prisma.mvm_commission.updateMany({
      where: {
        tenantId,
        status: 'PENDING',
        clearsAt: { lte: now }
      },
      data: {
        status: 'CLEARED',
        clearedAt: now
      }
    })
    
    return result.count
  },
  
  /**
   * Link commission to payout
   */
  async linkToPayout(commissionId: string, payoutId: string) {
    return prisma.mvm_commission.update({
      where: { id: commissionId },
      data: {
        payoutId,
        status: 'PAID',
        paidAt: new Date()
      }
    })
  },
  
  /**
   * Dispute a commission
   */
  async dispute(
    commissionId: string,
    disputedBy: string,
    reason: string
  ) {
    return prisma.mvm_commission.update({
      where: { id: commissionId },
      data: {
        status: 'DISPUTED',
        disputedAt: new Date(),
        disputedBy,
        disputeReason: reason
      }
    })
  },
  
  /**
   * Resolve a disputed commission
   */
  async resolveDispute(
    commissionId: string,
    resolvedBy: string,
    notes: string,
    newStatus: 'CLEARED' | 'REVERSED'
  ) {
    return prisma.mvm_commission.update({
      where: { id: commissionId },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes: notes,
        ...(newStatus === 'CLEARED' && { clearedAt: new Date() }),
        ...(newStatus === 'REVERSED' && { reversedAt: new Date(), reversedBy: resolvedBy })
      }
    })
  },
  
  /**
   * Reverse a commission (order cancelled/refunded)
   */
  async reverse(
    subOrderId: string,
    reversedBy: string,
    reason: string
  ) {
    const commission = await prisma.mvm_commission.findUnique({
      where: { subOrderId }
    })
    
    if (!commission) return null
    
    // Can't reverse already paid commissions (need manual adjustment)
    if (commission.status === 'PAID') {
      throw new Error('Cannot reverse paid commission. Manual adjustment required.')
    }
    
    return prisma.mvm_commission.update({
      where: { id: commission.id },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversedBy,
        reversalReason: reason
      }
    })
  },
  
  /**
   * Get commission summary by status
   */
  async getSummary(tenantId: string, vendorId?: string): Promise<CommissionSummary> {
    const where: Prisma.mvm_commissionWhereInput = {
      tenantId,
      ...(vendorId && { vendorId })
    }
    
    const [pending, processing, cleared, paid, disputed, reversed] = await Promise.all([
      prisma.mvm_commission.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { vendorPayout: true }
      }),
      prisma.mvm_commission.aggregate({
        where: { ...where, status: 'PROCESSING' },
        _sum: { vendorPayout: true }
      }),
      prisma.mvm_commission.aggregate({
        where: { ...where, status: 'CLEARED' },
        _sum: { vendorPayout: true }
      }),
      prisma.mvm_commission.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { vendorPayout: true }
      }),
      prisma.mvm_commission.aggregate({
        where: { ...where, status: 'DISPUTED' },
        _sum: { vendorPayout: true }
      }),
      prisma.mvm_commission.aggregate({
        where: { ...where, status: 'REVERSED' },
        _sum: { vendorPayout: true }
      })
    ])
    
    const pendingAmount = pending._sum.vendorPayout?.toNumber() || 0
    const processingAmount = processing._sum.vendorPayout?.toNumber() || 0
    const clearedAmount = cleared._sum.vendorPayout?.toNumber() || 0
    const paidAmount = paid._sum.vendorPayout?.toNumber() || 0
    const disputedAmount = disputed._sum.vendorPayout?.toNumber() || 0
    const reversedAmount = reversed._sum.vendorPayout?.toNumber() || 0
    
    return {
      pending: pendingAmount,
      processing: processingAmount,
      cleared: clearedAmount,
      paid: paidAmount,
      disputed: disputedAmount,
      reversed: reversedAmount,
      total: pendingAmount + processingAmount + clearedAmount + paidAmount
    }
  },
  
  /**
   * Get payable commissions for a vendor (cleared but not paid)
   */
  async getPayable(vendorId: string) {
    const commissions = await prisma.mvm_commission.findMany({
      where: {
        vendorId,
        status: 'CLEARED',
        payoutId: null
      },
      include: {
        subOrder: {
          select: {
            subOrderNumber: true,
            parentOrder: { select: { orderNumber: true } }
          }
        }
      },
      orderBy: { clearedAt: 'asc' }
    })
    
    const total = commissions.reduce((sum: any, c: any) => sum + c.vendorPayout.toNumber(), 0)
    
    return {
      commissions: commissions.map((c: any) => ({
        id: c.id,
        subOrderNumber: c.subOrder.subOrderNumber,
        orderNumber: c.subOrder.parentOrder.orderNumber,
        vendorPayout: c.vendorPayout.toNumber(),
        clearedAt: c.clearedAt
      })),
      total,
      count: commissions.length
    }
  },
  
  /**
   * Get vendor earnings for a period
   */
  async getVendorEarnings(
    vendorId: string,
    startDate: Date,
    endDate: Date
  ) {
    const earnings = await prisma.mvm_commission.aggregate({
      where: {
        vendorId,
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        saleAmount: true,
        commissionAmount: true,
        vendorPayout: true
      },
      _count: true
    })
    
    return {
      totalSales: earnings._sum.saleAmount?.toNumber() || 0,
      totalCommission: earnings._sum.commissionAmount?.toNumber() || 0,
      totalPayout: earnings._sum.vendorPayout?.toNumber() || 0,
      orderCount: earnings._count
    }
  }
}
