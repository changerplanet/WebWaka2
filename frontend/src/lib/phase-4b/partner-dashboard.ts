/**
 * PHASE 4B: Partner SaaS Dashboard Service
 * 
 * Provides business health metrics for partners:
 * - Revenue Overview (MRR, growth, churn indicators)
 * - Client Lifecycle stages
 * - Platform counts
 * 
 * READ-ONLY - No payout execution, no billing changes
 */

import { prisma } from '../prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface RevenueOverview {
  mrr: number                    // Monthly Recurring Revenue
  arr: number                    // Annual Recurring Revenue (MRR * 12)
  mrrGrowthPercent: number       // MoM growth %
  totalActiveClients: number     // Paying clients
  averageRevenuePerClient: number
  currency: string
}

export interface LifecycleStats {
  trial: number
  active: number
  suspended: number
  atRisk: number  // Active but low engagement or past due
  cancelled: number
  total: number
}

export interface PlatformCounts {
  totalTenants: number
  totalInstances: number
  avgInstancesPerTenant: number
  activeInstances: number
  suspendedInstances: number
}

export interface ChurnIndicator {
  type: 'subscription_cancelled' | 'instance_suspended' | 'low_activity'
  instanceId: string
  instanceName: string
  tenantName: string
  indicator: string
  severity: 'low' | 'medium' | 'high'
  occurredAt: Date
}

export interface PartnerDashboardData {
  revenue: RevenueOverview
  lifecycle: LifecycleStats
  platforms: PlatformCounts
  churnIndicators: ChurnIndicator[]
  lastUpdated: Date
}

// ============================================================================
// REVENUE OVERVIEW
// ============================================================================

/**
 * Calculate revenue metrics for a partner
 * MRR = Sum of all active monthly subscriptions
 */
export async function getRevenueOverview(partnerId: string): Promise<RevenueOverview> {
  // Get all active subscriptions for this partner's instances
  const subscriptions = await prisma.instanceSubscription.findMany({
    where: {
      partnerId,
      status: { in: ['ACTIVE', 'TRIAL'] }
    },
    select: {
      id: true,
      amount: true,
      billingInterval: true,
      currency: true,
    }
  })
  
  // Calculate MRR (normalize yearly to monthly)
  let mrr = 0
  for (const sub of subscriptions) {
    const amount = Number(sub.amount)
    if (sub.billingInterval === 'yearly') {
      mrr += amount / 12
    } else {
      mrr += amount
    }
  }
  
  // Get last month's subscriptions for growth calculation
  const lastMonthStart = new Date()
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  lastMonthStart.setDate(1)
  
  const lastMonthEnd = new Date()
  lastMonthEnd.setDate(0)
  
  const lastMonthSubs = await prisma.instanceSubscription.findMany({
    where: {
      partnerId,
      status: 'ACTIVE',
      createdAt: { lte: lastMonthEnd }
    },
    select: {
      amount: true,
      billingInterval: true,
    }
  })
  
  let lastMonthMrr = 0
  for (const sub of lastMonthSubs) {
    const amount = Number(sub.amount)
    if (sub.billingInterval === 'yearly') {
      lastMonthMrr += amount / 12
    } else {
      lastMonthMrr += amount
    }
  }
  
  // Calculate growth
  const mrrGrowthPercent = lastMonthMrr > 0 
    ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 
    : mrr > 0 ? 100 : 0
  
  const totalActiveClients = subscriptions.length
  const averageRevenuePerClient = totalActiveClients > 0 ? mrr / totalActiveClients : 0
  
  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    mrrGrowthPercent: Math.round(mrrGrowthPercent * 10) / 10,
    totalActiveClients,
    averageRevenuePerClient: Math.round(averageRevenuePerClient * 100) / 100,
    currency: subscriptions[0]?.currency || 'NGN',
  }
}

// ============================================================================
// LIFECYCLE STATS
// ============================================================================

/**
 * Get client lifecycle stage breakdown
 */
export async function getLifecycleStats(partnerId: string): Promise<LifecycleStats> {
  const subscriptions = await prisma.instanceSubscription.groupBy({
    by: ['status'],
    where: { partnerId },
    _count: { id: true }
  })
  
  const stats: LifecycleStats = {
    trial: 0,
    active: 0,
    suspended: 0,
    atRisk: 0,
    cancelled: 0,
    total: 0,
  }
  
  for (const sub of subscriptions) {
    const count = sub._count.id
    stats.total += count
    
    switch (sub.status) {
      case 'TRIAL':
        stats.trial = count
        break
      case 'ACTIVE':
        stats.active = count
        break
      case 'SUSPENDED':
        stats.suspended = count
        break
      case 'PAST_DUE':
        stats.atRisk = count
        break
      case 'CANCELLED':
        stats.cancelled = count
        break
    }
  }
  
  // Also check for instances with no activity in 30 days (at-risk)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const inactiveActive = await prisma.instanceSubscription.count({
    where: {
      partnerId,
      status: 'ACTIVE',
      updatedAt: { lt: thirtyDaysAgo }
    }
  })
  
  stats.atRisk += inactiveActive
  
  return stats
}

// ============================================================================
// PLATFORM COUNTS
// ============================================================================

/**
 * Get platform instance counts
 */
export async function getPlatformCounts(partnerId: string): Promise<PlatformCounts> {
  // Get all instances created by this partner
  const instances = await prisma.platformInstance.findMany({
    where: { createdByPartnerId: partnerId },
    select: {
      id: true,
      tenantId: true,
      isActive: true,
      suspendedAt: true,
    }
  })
  
  const totalInstances = instances.length
  const activeInstances = instances.filter(i => i.isActive && !i.suspendedAt).length
  const suspendedInstances = instances.filter(i => i.suspendedAt).length
  
  // Count unique tenants
  const tenantIds = new Set(instances.map(i => i.tenantId))
  const totalTenants = tenantIds.size
  
  const avgInstancesPerTenant = totalTenants > 0 
    ? Math.round((totalInstances / totalTenants) * 10) / 10 
    : 0
  
  return {
    totalTenants,
    totalInstances,
    avgInstancesPerTenant,
    activeInstances,
    suspendedInstances,
  }
}

// ============================================================================
// CHURN INDICATORS
// ============================================================================

/**
 * Get recent churn indicators and at-risk signals
 */
export async function getChurnIndicators(
  partnerId: string,
  limit = 10
): Promise<ChurnIndicator[]> {
  const indicators: ChurnIndicator[] = []
  
  // 1. Recently cancelled subscriptions
  const cancelledSubs = await prisma.instanceSubscription.findMany({
    where: {
      partnerId,
      status: 'CANCELLED',
      cancelledAt: { not: null }
    },
    include: {
      PlatformInstance: {
        select: {
          id: true,
          name: true,
          tenant: { select: { name: true } }
        }
      }
    },
    orderBy: { cancelledAt: 'desc' },
    take: limit
  })
  
  for (const sub of cancelledSubs) {
    indicators.push({
      type: 'subscription_cancelled',
      instanceId: sub.PlatformInstance.id,
      instanceName: sub.PlatformInstance.name,
      tenantName: sub.PlatformInstance.tenant?.name || 'Unknown',
      indicator: `Subscription cancelled${sub.cancelReason ? `: ${sub.cancelReason}` : ''}`,
      severity: 'high',
      occurredAt: sub.cancelledAt!,
    })
  }
  
  // 2. Recently suspended instances
  const suspendedInstances = await prisma.platformInstance.findMany({
    where: {
      createdByPartnerId: partnerId,
      suspendedAt: { not: null }
    },
    include: {
      tenant: { select: { name: true } }
    },
    orderBy: { suspendedAt: 'desc' },
    take: limit
  })
  
  for (const instance of suspendedInstances) {
    indicators.push({
      type: 'instance_suspended',
      instanceId: instance.id,
      instanceName: instance.name,
      tenantName: instance.tenant?.name || 'Unknown',
      indicator: instance.suspendedReason || 'Instance suspended',
      severity: 'medium',
      occurredAt: instance.suspendedAt!,
    })
  }
  
  // Sort by date and limit
  return indicators
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit)
}

// ============================================================================
// FULL DASHBOARD
// ============================================================================

/**
 * Get complete dashboard data in a single call
 */
export async function getPartnerDashboard(partnerId: string): Promise<PartnerDashboardData> {
  const [revenue, lifecycle, platforms, churnIndicators] = await Promise.all([
    getRevenueOverview(partnerId),
    getLifecycleStats(partnerId),
    getPlatformCounts(partnerId),
    getChurnIndicators(partnerId),
  ])
  
  return {
    revenue,
    lifecycle,
    platforms,
    churnIndicators,
    lastUpdated: new Date(),
  }
}
