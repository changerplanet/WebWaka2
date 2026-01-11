/**
 * PHASE 3: Instance Financials Service
 * 
 * Manages financial tracking per Platform Instance.
 * Soft financial isolation - shared infrastructure, separate accounting.
 * 
 * TRACKS:
 * - Revenue (what partner collects from client)
 * - Wholesale costs (what partner owes WebWaka)
 * - Partner profit (revenue - wholesale)
 * - Commissions (transaction-based earnings)
 */

import { prisma } from '../prisma'
import { v4 as uuidv4 } from 'uuid'
import { withPrismaDefaults } from '../db/prismaDefaults'

// ============================================================================
// TYPES
// ============================================================================

export interface InstanceFinancials {
  instanceId: string
  instanceName: string
  partnerId: string
  partnerName: string
  
  // Revenue
  totalRevenue: number
  currentMonthRevenue: number
  lastMonthRevenue: number
  
  // Wholesale costs
  totalWholesaleCost: number
  currentMonthWholesaleCost: number
  
  // Profit
  totalProfit: number
  currentMonthProfit: number
  
  // Outstanding
  outstandingBalance: number
  
  // Commissions
  totalCommissionEarned: number
  pendingCommission: number
  paidCommission: number
  
  // Timestamps
  lastCalculatedAt: Date
}

export interface RecordEarningInput {
  partnerId: string
  platformInstanceId: string
  earningType: string // "subscription" | "transaction" | "addon" | "bonus"
  description?: string
  referenceType?: string
  referenceId?: string
  grossAmount: number
  commissionRate: number
  currency?: string
  clearsInDays?: number
  metadata?: Record<string, any>
}

// ============================================================================
// GET INSTANCE FINANCIALS
// ============================================================================

/**
 * Get or create financial summary for an instance
 */
export async function getInstanceFinancials(
  platformInstanceId: string
): Promise<InstanceFinancials | null> {
  const instance = await prisma.platformInstance.findUnique({
    where: { id: platformInstanceId },
    include: {
      InstanceFinancialSummary: true,
      createdByPartner: {
        select: { id: true, name: true }
      }
    }
  })
  
  if (!instance) return null
  
  const partnerId = instance.createdByPartnerId || ''
  const summary = instance.InstanceFinancialSummary
  
  if (!summary) {
    // Return default values if no summary exists yet
    return {
      instanceId: platformInstanceId,
      instanceName: instance.name,
      partnerId,
      partnerName: instance.createdByPartner?.name || 'Unknown',
      totalRevenue: 0,
      currentMonthRevenue: 0,
      lastMonthRevenue: 0,
      totalWholesaleCost: 0,
      currentMonthWholesaleCost: 0,
      totalProfit: 0,
      currentMonthProfit: 0,
      outstandingBalance: 0,
      totalCommissionEarned: 0,
      pendingCommission: 0,
      paidCommission: 0,
      lastCalculatedAt: new Date(),
    }
  }
  
  return {
    instanceId: platformInstanceId,
    instanceName: instance.name,
    partnerId,
    partnerName: instance.createdByPartner?.name || 'Unknown',
    totalRevenue: Number(summary.totalRevenue),
    currentMonthRevenue: Number(summary.currentMonthRevenue),
    lastMonthRevenue: Number(summary.lastMonthRevenue),
    totalWholesaleCost: Number(summary.totalWholesaleCost),
    currentMonthWholesaleCost: Number(summary.currentMonthWholesaleCost),
    totalProfit: Number(summary.totalProfit),
    currentMonthProfit: Number(summary.currentMonthProfit),
    outstandingBalance: Number(summary.outstandingBalance),
    totalCommissionEarned: Number(summary.totalCommissionEarned),
    pendingCommission: Number(summary.pendingCommission),
    paidCommission: Number(summary.paidCommission),
    lastCalculatedAt: summary.lastCalculatedAt,
  }
}

/**
 * Get financials for all instances owned by a partner
 */
export async function getPartnerFinancials(
  partnerId: string
): Promise<{
  instances: InstanceFinancials[]
  totals: {
    totalRevenue: number
    currentMonthRevenue: number
    totalProfit: number
    currentMonthProfit: number
    outstandingBalance: number
    totalCommission: number
    pendingCommission: number
  }
}> {
  const summaries = await prisma.instanceFinancialSummary.findMany({
    where: { partnerId },
    include: {
      PlatformInstance: {
        select: { id: true, name: true, slug: true }
      }
    }
  })
  
  const instances: InstanceFinancials[] = summaries.map(s => ({
    instanceId: s.platformInstanceId,
    instanceName: s.PlatformInstance.name,
    partnerId: s.partnerId,
    partnerName: '',
    totalRevenue: Number(s.totalRevenue),
    currentMonthRevenue: Number(s.currentMonthRevenue),
    lastMonthRevenue: Number(s.lastMonthRevenue),
    totalWholesaleCost: Number(s.totalWholesaleCost),
    currentMonthWholesaleCost: Number(s.currentMonthWholesaleCost),
    totalProfit: Number(s.totalProfit),
    currentMonthProfit: Number(s.currentMonthProfit),
    outstandingBalance: Number(s.outstandingBalance),
    totalCommissionEarned: Number(s.totalCommissionEarned),
    pendingCommission: Number(s.pendingCommission),
    paidCommission: Number(s.paidCommission),
    lastCalculatedAt: s.lastCalculatedAt,
  }))
  
  // Calculate totals
  const totals = instances.reduce(
    (acc, i) => ({
      totalRevenue: acc.totalRevenue + i.totalRevenue,
      currentMonthRevenue: acc.currentMonthRevenue + i.currentMonthRevenue,
      totalProfit: acc.totalProfit + i.totalProfit,
      currentMonthProfit: acc.currentMonthProfit + i.currentMonthProfit,
      outstandingBalance: acc.outstandingBalance + i.outstandingBalance,
      totalCommission: acc.totalCommission + i.totalCommissionEarned,
      pendingCommission: acc.pendingCommission + i.pendingCommission,
    }),
    {
      totalRevenue: 0,
      currentMonthRevenue: 0,
      totalProfit: 0,
      currentMonthProfit: 0,
      outstandingBalance: 0,
      totalCommission: 0,
      pendingCommission: 0,
    }
  )
  
  return { instances, totals }
}

// ============================================================================
// RECORD SUBSCRIPTION PAYMENT
// ============================================================================

/**
 * Record a subscription payment and update financials
 */
export async function recordSubscriptionPayment(
  subscriptionId: string,
  paymentAmount: number,
  wholesaleAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await prisma.instanceSubscription.findUnique({
      where: { id: subscriptionId },
      include: { PlatformInstance: true }
    })
    
    if (!subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    const partnerId = subscription.partnerId
    const instanceId = subscription.platformInstanceId
    const profit = paymentAmount - wholesaleAmount
    
    // Update or create financial summary
    await prisma.instanceFinancialSummary.upsert({
      where: { platformInstanceId: instanceId },
      create: withPrismaDefaults({
        platformInstanceId: instanceId,
        partnerId,
        totalRevenue: paymentAmount,
        currentMonthRevenue: paymentAmount,
        totalWholesaleCost: wholesaleAmount,
        currentMonthWholesaleCost: wholesaleAmount,
        totalProfit: profit,
        currentMonthProfit: profit,
        lastCalculatedAt: new Date(),
      }),
      update: {
        totalRevenue: { increment: paymentAmount },
        currentMonthRevenue: { increment: paymentAmount },
        totalWholesaleCost: { increment: wholesaleAmount },
        currentMonthWholesaleCost: { increment: wholesaleAmount },
        totalProfit: { increment: profit },
        currentMonthProfit: { increment: profit },
        lastCalculatedAt: new Date(),
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Failed to record subscription payment:', error)
    return { success: false, error: 'Failed to record payment' }
  }
}

// ============================================================================
// RECORD EARNING
// ============================================================================

/**
 * Record an earning for a partner from an instance transaction
 */
export async function recordPartnerEarning(
  input: RecordEarningInput
): Promise<{ success: boolean; earningId?: string; error?: string }> {
  try {
    const commissionAmount = input.grossAmount * input.commissionRate
    
    // Calculate clearance date
    const clearsAt = new Date()
    clearsAt.setDate(clearsAt.getDate() + (input.clearsInDays || 30))
    
    const earning = await prisma.partnerInstanceEarning.create({
      data: withPrismaDefaults({
        partnerId: input.partnerId,
        platformInstanceId: input.platformInstanceId,
        earningType: input.earningType,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        grossAmount: input.grossAmount,
        commissionRate: input.commissionRate,
        commissionAmount,
        currency: input.currency || 'NGN',
        status: 'PENDING',
        clearsAt,
        metadata: input.metadata,
      })
    })
    
    // Update financial summary
    await prisma.instanceFinancialSummary.upsert({
      where: { platformInstanceId: input.platformInstanceId },
      create: withPrismaDefaults({
        platformInstanceId: input.platformInstanceId,
        partnerId: input.partnerId,
        totalCommissionEarned: commissionAmount,
        pendingCommission: commissionAmount,
        lastCalculatedAt: new Date(),
      }),
      update: {
        totalCommissionEarned: { increment: commissionAmount },
        pendingCommission: { increment: commissionAmount },
        lastCalculatedAt: new Date(),
      }
    })
    
    return { success: true, earningId: earning.id }
  } catch (error) {
    console.error('Failed to record earning:', error)
    return { success: false, error: 'Failed to record earning' }
  }
}

// ============================================================================
// GET PARTNER EARNINGS
// ============================================================================

/**
 * Get earnings for a partner, optionally filtered by instance
 */
export async function getPartnerEarnings(
  partnerId: string,
  options?: {
    platformInstanceId?: string
    status?: string[]
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<{ earnings: any[]; total: number; summary: any }> {
  const where: any = { partnerId }
  
  if (options?.platformInstanceId) {
    where.platformInstanceId = options.platformInstanceId
  }
  
  if (options?.status?.length) {
    where.status = { in: options.status }
  }
  
  if (options?.startDate || options?.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }
  
  const [earnings, total, aggregates] = await Promise.all([
    prisma.partnerInstanceEarning.findMany({
      where,
      include: {
        PlatformInstance: {
          select: { id: true, name: true, slug: true }
        }
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.partnerInstanceEarning.count({ where }),
    prisma.partnerInstanceEarning.groupBy({
      by: ['status'],
      where,
      _sum: { commissionAmount: true }
    })
  ])
  
  // Calculate summary
  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  }
  
  aggregates.forEach(agg => {
    const amount = Number(agg._sum.commissionAmount || 0)
    summary.total += amount
    
    switch (agg.status) {
      case 'PENDING':
        summary.pending = amount
        break
      case 'APPROVED':
        summary.approved = amount
        break
      case 'PAID':
        summary.paid = amount
        break
    }
  })
  
  return { earnings, total, summary }
}

// ============================================================================
// APPROVE EARNINGS (Clearance)
// ============================================================================

/**
 * Approve pending earnings that have passed clearance period
 */
export async function approveClaredEarnings(): Promise<{
  approved: number
  error?: string
}> {
  try {
    const now = new Date()
    
    const result = await prisma.partnerInstanceEarning.updateMany({
      where: {
        status: 'PENDING',
        clearsAt: { lte: now }
      },
      data: {
        status: 'APPROVED',
        clearedAt: now,
      }
    })
    
    return { approved: result.count }
  } catch (error) {
    console.error('Failed to approve cleared earnings:', error)
    return { approved: 0, error: 'Failed to approve earnings' }
  }
}

// ============================================================================
// RESET MONTHLY COUNTERS
// ============================================================================

/**
 * Reset monthly counters (run at month start)
 */
export async function resetMonthlyCounters(): Promise<{
  updated: number
  error?: string
}> {
  try {
    // Get all summaries and update them one by one
    // (Prisma doesn't support copying fields in updateMany)
    const summaries = await prisma.instanceFinancialSummary.findMany()
    
    for (const summary of summaries) {
      await prisma.instanceFinancialSummary.update({
        where: { id: summary.id },
        data: {
          lastMonthRevenue: summary.currentMonthRevenue,
          currentMonthRevenue: 0,
          currentMonthWholesaleCost: 0,
          currentMonthProfit: 0,
          lastCalculatedAt: new Date(),
        }
      })
    }
    
    return { updated: summaries.length }
  } catch (error) {
    console.error('Failed to reset monthly counters:', error)
    return { updated: 0, error: 'Failed to reset counters' }
  }
}
