/**
 * Partner Dashboard Service
 * 
 * Provides read-only data for Partner dashboards.
 * 
 * KEY PRINCIPLES:
 * 1. Partners see ONLY their data
 * 2. NO tenant internals exposed
 * 3. NO module internals exposed
 * 4. Read-only visibility
 * 5. Performance metrics are aggregated, not detailed
 */

import { prisma } from './prisma'
import { requirePartnerAccess, requirePartnerUser } from './partner-authorization'
import { getPayableBalance, PayableBalance } from './payout-readiness'

// ============================================================================
// DATA CONTRACTS - Dashboard Response Types
// ============================================================================

/**
 * Partner Dashboard Overview
 * Main dashboard data contract
 */
export interface PartnerDashboardOverview {
  partner: PartnerInfo
  summary: DashboardSummary
  earnings: EarningsSummary
  referrals: ReferralsSummary
  recentActivity: ActivityItem[]
}

/**
 * Partner basic info (safe to display)
 */
export interface PartnerInfo {
  id: string
  name: string
  slug: string
  status: string
  tier: string
  joinedAt: Date
  
  // Agreement info
  currentAgreement: {
    version: number
    commissionRate: number
    commissionType: string
    effectiveFrom: Date
  } | null
}

/**
 * High-level dashboard summary
 */
export interface DashboardSummary {
  // Tenant counts
  totalReferrals: number
  activeReferrals: number
  pendingReferrals: number  // PENDING_ACTIVATION
  
  // Revenue metrics (aggregated)
  totalEarnings: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  
  // Balance
  currentBalance: number
  pendingClearance: number
  
  currency: string
}

/**
 * Earnings breakdown
 */
export interface EarningsSummary {
  // Balance breakdown
  balance: PayableBalance
  
  // Monthly trend (last 6 months)
  monthlyTrend: {
    month: string  // "2025-01"
    earned: number
    paid: number
  }[]
  
  // By status
  byStatus: {
    pending: number
    cleared: number
    approved: number
    paid: number
  }
  
  currency: string
}

/**
 * Referrals summary
 * IMPORTANT: Only shows LIMITED tenant data
 */
export interface ReferralsSummary {
  total: number
  
  // Breakdown by status
  byStatus: {
    active: number
    pending: number
    suspended: number
    churned: number
  }
  
  // Recent referrals (limited data)
  recent: ReferredTenantInfo[]
  
  // Top performers (by revenue)
  topPerformers: ReferredTenantInfo[]
}

/**
 * Referred tenant info - LIMITED DATA ONLY
 * No tenant internals exposed
 */
export interface ReferredTenantInfo {
  referralId: string
  
  // Limited tenant info (what partner is allowed to see)
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantStatus: string
  
  // Attribution info
  referredAt: Date
  attributionMethod: string
  isLifetime: boolean
  attributionExpiresAt: Date | null
  
  // Revenue info (aggregated)
  totalRevenue: number  // What partner earned from this tenant
  lastPaymentDate: Date | null
  
  // NO access to:
  // - Tenant users
  // - Tenant settings
  // - Tenant domains
  // - Module data
  // - Internal metrics
}

/**
 * Recent activity item
 */
export interface ActivityItem {
  id: string
  type: 'REFERRAL' | 'EARNING' | 'PAYOUT' | 'AGREEMENT'
  title: string
  description: string
  amount?: number
  currency?: string
  timestamp: Date
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Partner performance metrics
 */
export interface PartnerPerformanceMetrics {
  partnerId: string
  period: { start: Date; end: Date }
  
  // Conversion metrics
  conversionRate: number  // % of referrals that activated
  
  // Revenue metrics
  totalRevenue: number
  averageRevenuePerReferral: number
  
  // Retention metrics (of referred tenants)
  retentionRate: number  // % still active after 3 months
  churnRate: number
  
  // Growth
  newReferralsThisPeriod: number
  growthRate: number  // % change from previous period
  
  // Trends
  monthlyRevenue: { month: string; amount: number }[]
  monthlyReferrals: { month: string; count: number }[]
}

// ============================================================================
// DASHBOARD DATA FETCHING
// ============================================================================

/**
 * Get complete dashboard overview for a partner
 * 
 * This is the main entry point for the partner dashboard
 */
export async function getPartnerDashboard(
  partnerId: string
): Promise<PartnerDashboardOverview | null> {
  // Verify partner access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    return null
  }
  
  // Fetch all dashboard data in parallel
  const [
    partnerInfo,
    summary,
    earnings,
    referrals,
    recentActivity
  ] = await Promise.all([
    getPartnerInfo(partnerId),
    getDashboardSummary(partnerId),
    getEarningsSummary(partnerId),
    getReferralsSummary(partnerId),
    getRecentActivity(partnerId)
  ])
  
  if (!partnerInfo) return null
  
  return {
    partner: partnerInfo,
    summary,
    earnings,
    referrals,
    recentActivity
  }
}

/**
 * Get partner basic info
 */
async function getPartnerInfo(partnerId: string): Promise<PartnerInfo | null> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    include: {
      agreements: {
        where: {
          status: 'ACTIVE',
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        },
        orderBy: { version: 'desc' },
        take: 1
      }
    }
  })
  
  if (!partner) return null
  
  const currentAgreement = partner.agreements[0]
  
  return {
    id: partner.id,
    name: partner.name,
    slug: partner.slug,
    status: partner.status,
    tier: partner.tier,
    joinedAt: partner.createdAt,
    currentAgreement: currentAgreement ? {
      version: currentAgreement.version,
      commissionRate: Number(currentAgreement.commissionRate),
      commissionType: currentAgreement.commissionType,
      effectiveFrom: currentAgreement.effectiveFrom
    } : null
  }
}

/**
 * Get dashboard summary
 */
async function getDashboardSummary(partnerId: string): Promise<DashboardSummary> {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  
  // Get referral counts
  const referralCounts = await prisma.partnerReferral.groupBy({
    by: ['partnerId'],
    where: { partnerId },
    _count: true
  })
  
  const activeReferrals = await prisma.partnerReferral.count({
    where: {
      partnerId,
      Tenant: { status: 'ACTIVE' }
    }
  })
  
  const pendingReferrals = await prisma.partnerReferral.count({
    where: {
      partnerId,
      Tenant: { status: 'PENDING_ACTIVATION' }
    }
  })
  
  // Get earnings totals
  const totalEarnings = await prisma.partnerEarning.aggregate({
    where: {
      partnerId,
      entryType: 'CREDIT',
      status: { in: ['CLEARED', 'APPROVED', 'PAID'] }
    },
    _sum: { commissionAmount: true }
  })
  
  const thisMonthEarnings = await prisma.partnerEarning.aggregate({
    where: {
      partnerId,
      entryType: 'CREDIT',
      createdAt: { gte: thisMonthStart }
    },
    _sum: { commissionAmount: true }
  })
  
  const lastMonthEarnings = await prisma.partnerEarning.aggregate({
    where: {
      partnerId,
      entryType: 'CREDIT',
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
    },
    _sum: { commissionAmount: true }
  })
  
  // Get balance
  const balance = await getPayableBalance(partnerId)
  
  return {
    totalReferrals: referralCounts[0]?._count || 0,
    activeReferrals,
    pendingReferrals,
    totalEarnings: Number(totalEarnings._sum.commissionAmount || 0),
    thisMonthEarnings: Number(thisMonthEarnings._sum.commissionAmount || 0),
    lastMonthEarnings: Number(lastMonthEarnings._sum.commissionAmount || 0),
    currentBalance: balance.totalPayable,
    pendingClearance: balance.pending,
    currency: balance.currency
  }
}

/**
 * Get earnings summary
 */
async function getEarningsSummary(partnerId: string): Promise<EarningsSummary> {
  const balance = await getPayableBalance(partnerId)
  
  // Get monthly trend (last 6 months)
  const monthlyTrend: EarningsSummary['monthlyTrend'] = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
    
    const [earned, paid] = await Promise.all([
      prisma.partnerEarning.aggregate({
        where: {
          partnerId,
          entryType: 'CREDIT',
          createdAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { commissionAmount: true }
      }),
      prisma.partnerEarning.aggregate({
        where: {
          partnerId,
          entryType: 'CREDIT',
          status: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { commissionAmount: true }
      })
    ])
    
    monthlyTrend.push({
      month: monthKey,
      earned: Number(earned._sum.commissionAmount || 0),
      paid: Number(paid._sum.commissionAmount || 0)
    })
  }
  
  return {
    balance,
    monthlyTrend,
    byStatus: {
      pending: balance.pending,
      cleared: balance.cleared,
      approved: balance.approved,
      paid: balance.totalPaid
    },
    currency: balance.currency
  }
}

/**
 * Get referrals summary
 * IMPORTANT: Only returns LIMITED tenant data
 */
async function getReferralsSummary(partnerId: string): Promise<ReferralsSummary> {
  // Get counts by tenant status
  const statusCounts = await prisma.partnerReferral.groupBy({
    by: ['partnerId'],
    where: { partnerId },
    _count: true
  })
  
  const activeTenants = await prisma.partnerReferral.count({
    where: { partnerId, Tenant: { status: 'ACTIVE' } }
  })
  
  const pendingTenants = await prisma.partnerReferral.count({
    where: { partnerId, Tenant: { status: 'PENDING_ACTIVATION' } }
  })
  
  const suspendedTenants = await prisma.partnerReferral.count({
    where: { partnerId, Tenant: { status: 'SUSPENDED' } }
  })
  
  const churnedTenants = await prisma.partnerReferral.count({
    where: { partnerId, Tenant: { status: 'DEACTIVATED' } }
  })
  
  // Get recent referrals (last 10)
  const recentReferrals = await prisma.partnerReferral.findMany({
    where: { partnerId },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true
        }
      }
    },
    orderBy: { referredAt: 'desc' },
    take: 10
  })
  
  // Get top performers by revenue
  const referralsWithEarnings = await prisma.partnerReferral.findMany({
    where: { partnerId },
    include: {
      Tenant: {
        select: { id: true, name: true, slug: true, status: true }
      },
      PartnerEarning: {
        where: { entryType: 'CREDIT' },
        select: { commissionAmount: true, paidAt: true }
      }
    }
  })
  
  const topPerformers = referralsWithEarnings
    .map(r => ({
      referral: r,
      totalRevenue: r.PartnerEarning.reduce((sum, e) => sum + Number(e.commissionAmount), 0),
      lastPayment: r.PartnerEarning.filter(e => e.paidAt).sort((a, b) => 
        (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0)
      )[0]?.paidAt
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
  
  const mapToReferredTenantInfo = (
    referral: typeof recentReferrals[0],
    totalRevenue: number = 0,
    lastPaymentDate: Date | null = null
  ): ReferredTenantInfo => ({
    referralId: referral.id,
    tenantId: referral.Tenant.id,
    tenantName: referral.Tenant.name,
    tenantSlug: referral.Tenant.slug,
    tenantStatus: referral.Tenant.status,
    referredAt: referral.referredAt,
    attributionMethod: referral.attributionMethod,
    isLifetime: !referral.attributionWindowDays,
    attributionExpiresAt: referral.attributionExpiresAt,
    totalRevenue,
    lastPaymentDate
  })
  
  return {
    total: statusCounts[0]?._count || 0,
    byStatus: {
      active: activeTenants,
      pending: pendingTenants,
      suspended: suspendedTenants,
      churned: churnedTenants
    },
    recent: recentReferrals.map(r => mapToReferredTenantInfo(r)),
    topPerformers: topPerformers.map(p => 
      mapToReferredTenantInfo(p.referral, p.totalRevenue, p.lastPayment || null)
    )
  }
}

/**
 * Get recent activity
 */
async function getRecentActivity(partnerId: string): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = []
  
  // Recent earnings
  const recentEarnings = await prisma.partnerEarning.findMany({
    where: { partnerId, entryType: 'CREDIT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      referral: {
        include: {
          Tenant: { select: { name: true } }
        }
      }
    }
  })
  
  for (const earning of recentEarnings) {
    activities.push({
      id: earning.id,
      type: 'EARNING',
      title: 'Commission Earned',
      description: `Commission from ${earning.referral.tenant.name}`,
      amount: Number(earning.commissionAmount),
      currency: earning.currency,
      timestamp: earning.createdAt
    })
  }
  
  // Recent referrals
  const recentReferrals = await prisma.partnerReferral.findMany({
    where: { partnerId },
    orderBy: { referredAt: 'desc' },
    take: 5,
    include: {
      Tenant: { select: { name: true } }
    }
  })
  
  for (const referral of recentReferrals) {
    activities.push({
      id: referral.id,
      type: 'REFERRAL',
      title: 'New Referral',
      description: `${referral.tenant.name} was referred`,
      timestamp: referral.referredAt
    })
  }
  
  // Recent payouts
  const recentPayouts = await prisma.payoutBatch.findMany({
    where: { partnerId },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  
  for (const payout of recentPayouts) {
    activities.push({
      id: payout.id,
      type: 'PAYOUT',
      title: `Payout ${payout.status}`,
      description: `Batch ${payout.batchNumber}`,
      amount: Number(payout.netAmount),
      currency: payout.currency,
      timestamp: payout.createdAt
    })
  }
  
  // Sort by timestamp and return top 10
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10)
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Get partner performance metrics
 */
export async function getPartnerPerformance(
  partnerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PartnerPerformanceMetrics> {
  // Verify access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    throw new Error('Unauthorized')
  }
  
  // Get referrals in period
  const referralsInPeriod = await prisma.partnerReferral.findMany({
    where: {
      partnerId,
      referredAt: { gte: periodStart, lte: periodEnd }
    },
    include: {
      Tenant: { select: { status: true } }
    }
  })
  
  const newReferrals = referralsInPeriod.length
  const activatedReferrals = referralsInPeriod.filter(
    r => r.tenant.status === 'ACTIVE'
  ).length
  
  // Conversion rate
  const conversionRate = newReferrals > 0 
    ? (activatedReferrals / newReferrals) * 100 
    : 0
  
  // Revenue in period
  const revenueInPeriod = await prisma.partnerEarning.aggregate({
    where: {
      partnerId,
      entryType: 'CREDIT',
      createdAt: { gte: periodStart, lte: periodEnd }
    },
    _sum: { commissionAmount: true }
  })
  
  const totalRevenue = Number(revenueInPeriod._sum.commissionAmount || 0)
  
  // Total referrals for avg calculation
  const totalReferrals = await prisma.partnerReferral.count({
    where: { partnerId }
  })
  
  const avgRevenuePerReferral = totalReferrals > 0 
    ? totalRevenue / totalReferrals 
    : 0
  
  // Retention (tenants active 3+ months after referral)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  
  const eligibleForRetention = await prisma.partnerReferral.count({
    where: {
      partnerId,
      referredAt: { lte: threeMonthsAgo }
    }
  })
  
  const retained = await prisma.partnerReferral.count({
    where: {
      partnerId,
      referredAt: { lte: threeMonthsAgo },
      tenant: { status: 'ACTIVE' }
    }
  })
  
  const retentionRate = eligibleForRetention > 0 
    ? (retained / eligibleForRetention) * 100 
    : 100
  
  const churnRate = 100 - retentionRate
  
  // Previous period for growth rate
  const periodLength = periodEnd.getTime() - periodStart.getTime()
  const prevPeriodStart = new Date(periodStart.getTime() - periodLength)
  const prevPeriodEnd = new Date(periodStart.getTime() - 1)
  
  const prevPeriodReferrals = await prisma.partnerReferral.count({
    where: {
      partnerId,
      referredAt: { gte: prevPeriodStart, lte: prevPeriodEnd }
    }
  })
  
  const growthRate = prevPeriodReferrals > 0
    ? ((newReferrals - prevPeriodReferrals) / prevPeriodReferrals) * 100
    : newReferrals > 0 ? 100 : 0
  
  // Monthly trends
  const monthlyRevenue: { month: string; amount: number }[] = []
  const monthlyReferrals: { month: string; count: number }[] = []
  
  let current = new Date(periodStart)
  while (current <= periodEnd) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`
    
    const [revenue, referrals] = await Promise.all([
      prisma.partnerEarning.aggregate({
        where: {
          partnerId,
          entryType: 'CREDIT',
          createdAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { commissionAmount: true }
      }),
      prisma.partnerReferral.count({
        where: {
          partnerId,
          referredAt: { gte: monthStart, lte: monthEnd }
        }
      })
    ])
    
    monthlyRevenue.push({ month: monthKey, amount: Number(revenue._sum.commissionAmount || 0) })
    monthlyReferrals.push({ month: monthKey, count: referrals })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return {
    partnerId,
    period: { start: periodStart, end: periodEnd },
    conversionRate,
    totalRevenue,
    averageRevenuePerReferral: avgRevenuePerReferral,
    retentionRate,
    churnRate,
    newReferralsThisPeriod: newReferrals,
    growthRate,
    monthlyRevenue,
    monthlyReferrals
  }
}

// ============================================================================
// REFERRED TENANTS LIST (with pagination)
// ============================================================================

/**
 * Get paginated list of referred tenants
 * Returns LIMITED data only
 */
export async function getReferredTenants(
  partnerId: string,
  options?: {
    status?: string[]
    limit?: number
    offset?: number
    sortBy?: 'referredAt' | 'revenue'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<{ tenants: ReferredTenantInfo[]; total: number }> {
  // Verify access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    return { tenants: [], total: 0 }
  }
  
  const where: any = { partnerId }
  
  if (options?.status) {
    where.tenant = { status: { in: options.status } }
  }
  
  const [referrals, total] = await Promise.all([
    prisma.partnerReferral.findMany({
      where,
      include: {
        Tenant: {
          select: { id: true, name: true, slug: true, status: true }
        },
        earnings: {
          where: { entryType: 'CREDIT' },
          select: { commissionAmount: true, paidAt: true }
        }
      },
      orderBy: { referredAt: options?.sortOrder || 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0
    }),
    prisma.partnerReferral.count({ where })
  ])
  
  const tenants: ReferredTenantInfo[] = referrals.map(r => {
    const totalRevenue = r.earnings.reduce((sum, e) => sum + Number(e.commissionAmount), 0)
    const lastPayment = r.earnings
      .filter(e => e.paidAt)
      .sort((a, b) => (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0))[0]?.paidAt
    
    return {
      referralId: r.id,
      tenantId: r.tenant.id,
      tenantName: r.tenant.name,
      tenantSlug: r.tenant.slug,
      tenantStatus: r.tenant.status,
      referredAt: r.referredAt,
      attributionMethod: r.attributionMethod,
      isLifetime: !r.attributionWindowDays,
      attributionExpiresAt: r.attributionExpiresAt,
      totalRevenue,
      lastPaymentDate: lastPayment || null
    }
  })
  
  // Sort by revenue if requested
  if (options?.sortBy === 'revenue') {
    tenants.sort((a, b) => 
      options.sortOrder === 'asc' 
        ? a.totalRevenue - b.totalRevenue 
        : b.totalRevenue - a.totalRevenue
    )
  }
  
  return { tenants, total }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DASHBOARD_DATA_POLICY = {
  // Partner can only see their own data
  PARTNER_SCOPED: true,
  
  // No tenant internals exposed
  TENANT_DATA_LIMITED: true,
  LIMITED_TENANT_FIELDS: ['id', 'name', 'slug', 'status', 'createdAt'],
  
  // No module data exposed
  NO_MODULE_DATA: true,
  
  // Read-only
  READ_ONLY: true,
  
  // Aggregation levels
  EARNINGS_AGGREGATED: true,
  METRICS_AGGREGATED: true
} as const
