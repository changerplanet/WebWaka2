/**
 * PARTNER ANALYTICS: Analytics Service - Phase E1.4
 * 
 * Core analytics aggregation service for partner dashboards.
 * Provides read-only metrics without automations, notifications, or payouts.
 * 
 * Coverage:
 * - Partner-level overview
 * - Tenant performance rollups
 * - Sites & Funnels (forms) analytics
 * - Payment visibility (read-only)
 */

import { prisma } from '../prisma'
import { TenantStatus, PaymentTransactionStatus } from '@prisma/client'
import type {
  TimeFilter,
  PartnerOverview,
  TenantPerformance,
  TenantPerformanceList,
  FormPerformance,
  FormPerformanceList,
  PaymentsAnalytics,
  AnalyticsFilters,
} from './types'
import { getDateRangeFromFilter } from './types'

type Transaction = {
  status: PaymentTransactionStatus
  amount: { toNumber: () => number } | number
  isDemo: boolean
  sourceModule?: string | null
}

type Form = {
  id: string
  name: string
  slug: string
  tenantId: string
  status: string
  paymentEnabled: boolean
  paymentAmount: { toNumber: () => number } | null
  paymentCurrency: string
  totalRevenue: { toNumber: () => number } | number
  isDemo: boolean
  createdAt: Date
  _count: { submissions: number }
}

type Submission = {
  status: string
  isDemo: boolean
}

export class PartnerAnalyticsService {
  /**
   * Get partner overview dashboard metrics
   */
  static async getOverview(
    partnerId: string,
    filters: AnalyticsFilters = {}
  ): Promise<PartnerOverview> {
    const timeFilter = filters.timeFilter || '30d'
    const { from: dateFrom } = getDateRangeFromFilter(timeFilter)
    
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { name: true },
    })

    if (!partner) {
      throw new Error('Partner not found')
    }

    const tenantIds = await this.getPartnerTenantIds(partnerId)

    const dateFilter = dateFrom ? { gte: dateFrom } : undefined

    const [
      tenantStats,
      formStats,
      submissionStats,
      paymentStats,
    ] = await Promise.all([
      this.getTenantStats(tenantIds),
      this.getFormStats(tenantIds, dateFilter, filters.includeDemo),
      this.getSubmissionStats(tenantIds, dateFilter, filters.includeDemo),
      this.getPaymentStats(partnerId, dateFilter, filters.includeDemo),
    ])

    return {
      partnerId,
      partnerName: partner.name,
      timeFilter,
      tenants: tenantStats,
      forms: formStats,
      submissions: submissionStats,
      payments: paymentStats,
      generatedAt: new Date(),
    }
  }

  /**
   * Get tenant performance breakdown
   */
  static async getTenantPerformance(
    partnerId: string,
    filters: AnalyticsFilters = {}
  ): Promise<TenantPerformanceList> {
    const timeFilter = filters.timeFilter || '30d'
    const { from: dateFrom } = getDateRangeFromFilter(timeFilter)
    
    const tenantIds = await this.getPartnerTenantIds(partnerId)
    
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    })

    const dateFilter = dateFrom ? { gte: dateFrom } : undefined

    const performances: TenantPerformance[] = await Promise.all(
      tenants.map(async (tenant) => {
        const [submissions, payments] = await Promise.all([
          prisma.sf_form_submissions.count({
            where: {
              tenantId: tenant.id,
              ...(dateFilter && { createdAt: dateFilter }),
              ...(filters.includeDemo === false && { isDemo: false }),
            },
          }),
          prisma.paymentTransaction.findMany({
            where: {
              tenantId: tenant.id,
              ...(dateFilter && { initiatedAt: dateFilter }),
              ...(filters.includeDemo === false && { isDemo: false }),
            },
            select: {
              status: true,
              amount: true,
              isDemo: true,
            },
          }),
        ])

        const paymentList = payments as Transaction[]
        const paymentAttempts = paymentList.length
        const successfulPayments = paymentList.filter(p => p.status === 'SUCCESS').length
        const revenue = paymentList
          .filter(p => p.status === 'SUCCESS')
          .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : p.amount.toNumber()), 0)
        const conversionRate = submissions > 0 
          ? (successfulPayments / submissions) * 100 
          : 0

        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          isActive: tenant.status === TenantStatus.ACTIVE,
          submissions,
          paymentAttempts,
          successfulPayments,
          conversionRate: Math.round(conversionRate * 100) / 100,
          revenue,
          currency: 'NGN',
          isDemo: false,
        }
      })
    )

    const totals = performances.reduce(
      (acc, t) => ({
        submissions: acc.submissions + t.submissions,
        paymentAttempts: acc.paymentAttempts + t.paymentAttempts,
        successfulPayments: acc.successfulPayments + t.successfulPayments,
        revenue: acc.revenue + t.revenue,
      }),
      { submissions: 0, paymentAttempts: 0, successfulPayments: 0, revenue: 0 }
    )

    const topPerformer = performances.length > 0
      ? performances.reduce((top, t) => (t.revenue > top.revenue ? t : top))
      : null

    return {
      tenants: performances.sort((a, b) => b.revenue - a.revenue),
      totals,
      topPerformer,
      timeFilter,
    }
  }

  /**
   * Get form performance analytics
   */
  static async getFormPerformance(
    partnerId: string,
    filters: AnalyticsFilters = {}
  ): Promise<FormPerformanceList> {
    const timeFilter = filters.timeFilter || '30d'
    const { from: dateFrom } = getDateRangeFromFilter(timeFilter)
    
    const tenantIds = await this.getPartnerTenantIds(partnerId)
    
    const dateFilter = dateFrom ? { gte: dateFrom } : undefined
    
    const tenantFilter = filters.tenantId 
      ? { tenantId: filters.tenantId }
      : { tenantId: { in: tenantIds } }

    const forms = await prisma.sf_forms.findMany({
      where: {
        ...tenantFilter,
        ...(filters.includeDemo === false && { isDemo: false }),
      },
      include: {
        _count: {
          select: {
            submissions: {
              where: dateFilter ? { createdAt: dateFilter } : undefined,
            },
          },
        },
      },
    })

    const tenantMap = new Map<string, string>()
    const tenantsData = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true },
    })
    tenantsData.forEach(t => tenantMap.set(t.id, t.name))

    const formPerformances: FormPerformance[] = await Promise.all(
      (forms as Form[]).map(async (form) => {
        const [completedCount, pendingCount] = await Promise.all([
          prisma.sf_form_submissions.count({
            where: {
              formId: form.id,
              status: { in: ['COMPLETED', 'PAYMENT_COMPLETED'] },
              ...(dateFilter && { createdAt: dateFilter }),
            },
          }),
          prisma.sf_form_submissions.count({
            where: {
              formId: form.id,
              status: { in: ['PENDING', 'PAYMENT_PENDING'] },
              ...(dateFilter && { createdAt: dateFilter }),
            },
          }),
        ])

        const totalRevenue = typeof form.totalRevenue === 'number' 
          ? form.totalRevenue 
          : form.totalRevenue.toNumber()

        return {
          formId: form.id,
          formName: form.name,
          formSlug: form.slug,
          tenantId: form.tenantId,
          tenantName: tenantMap.get(form.tenantId) || 'Unknown',
          status: form.status,
          paymentEnabled: form.paymentEnabled,
          paymentAmount: form.paymentAmount ? (typeof form.paymentAmount === 'number' ? form.paymentAmount : form.paymentAmount.toNumber()) : null,
          totalSubmissions: form._count.submissions,
          completedSubmissions: completedCount,
          pendingSubmissions: pendingCount,
          revenueGenerated: totalRevenue,
          currency: form.paymentCurrency,
          isDemo: form.isDemo,
          createdAt: form.createdAt,
        }
      })
    )

    const totals = {
      totalForms: formPerformances.length,
      paymentEnabledForms: formPerformances.filter(f => f.paymentEnabled).length,
      totalSubmissions: formPerformances.reduce((sum, f) => sum + f.totalSubmissions, 0),
      totalRevenue: formPerformances.reduce((sum, f) => sum + f.revenueGenerated, 0),
    }

    return {
      forms: formPerformances.sort((a, b) => b.totalSubmissions - a.totalSubmissions),
      totals,
      timeFilter,
    }
  }

  /**
   * Get payment analytics (read-only)
   */
  static async getPaymentsAnalytics(
    partnerId: string,
    filters: AnalyticsFilters = {}
  ): Promise<PaymentsAnalytics> {
    const timeFilter = filters.timeFilter || '30d'
    const { from: dateFrom } = getDateRangeFromFilter(timeFilter)
    
    const dateFilter = dateFrom ? { gte: dateFrom } : undefined

    const transactionsRaw = await prisma.paymentTransaction.findMany({
      where: {
        partnerId,
        ...(dateFilter && { initiatedAt: dateFilter }),
      },
      select: {
        status: true,
        amount: true,
        isDemo: true,
        sourceModule: true,
      },
    })

    const transactions = transactionsRaw as Transaction[]

    const summary = {
      totalTransactions: transactions.length,
      pending: transactions.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length,
      success: transactions.filter(t => t.status === 'SUCCESS').length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
      abandoned: transactions.filter(t => t.status === 'ABANDONED').length,
      expired: transactions.filter(t => t.status === 'EXPIRED' || t.status === 'CANCELLED').length,
      demo: transactions.filter(t => t.isDemo).length,
      live: transactions.filter(t => !t.isDemo).length,
    }

    const getAmount = (t: Transaction) => typeof t.amount === 'number' ? t.amount : t.amount.toNumber()
    
    const successfulTransactions = transactions.filter(t => t.status === 'SUCCESS')
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING')

    const revenue = {
      total: successfulTransactions.reduce((sum, t) => sum + getAmount(t), 0),
      currency: 'NGN',
      byStatus: {
        successful: successfulTransactions.reduce((sum, t) => sum + getAmount(t), 0),
        pending: pendingTransactions.reduce((sum, t) => sum + getAmount(t), 0),
      },
    }

    const sourceMap = new Map<string, { count: number; revenue: number }>()
    transactions.forEach(t => {
      const source = t.sourceModule || 'unknown'
      const existing = sourceMap.get(source) || { count: 0, revenue: 0 }
      existing.count++
      if (t.status === 'SUCCESS') {
        existing.revenue += getAmount(t)
      }
      sourceMap.set(source, existing)
    })

    const bySource = Array.from(sourceMap.entries()).map(([sourceModule, data]) => ({
      sourceModule,
      count: data.count,
      revenue: data.revenue,
    }))

    return {
      timeFilter,
      summary,
      revenue,
      bySource: bySource.sort((a, b) => b.revenue - a.revenue),
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async getPartnerTenantIds(partnerId: string): Promise<string[]> {
    const referrals = await prisma.partnerReferral.findMany({
      where: { partnerId },
      select: { tenantId: true },
    })
    return referrals.map(r => r.tenantId)
  }

  private static async getTenantStats(tenantIds: string[]): Promise<{
    total: number
    active: number
    inactive: number
  }> {
    if (tenantIds.length === 0) {
      return { total: 0, active: 0, inactive: 0 }
    }

    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { status: true },
    })

    return {
      total: tenants.length,
      active: tenants.filter(t => t.status === TenantStatus.ACTIVE).length,
      inactive: tenants.filter(t => t.status !== TenantStatus.ACTIVE).length,
    }
  }

  private static async getFormStats(
    tenantIds: string[],
    dateFilter?: { gte: Date },
    includeDemo?: boolean
  ): Promise<{
    total: number
    active: number
    withPayments: number
    demo: number
    live: number
  }> {
    if (tenantIds.length === 0) {
      return { total: 0, active: 0, withPayments: 0, demo: 0, live: 0 }
    }

    const forms = await prisma.sf_forms.findMany({
      where: {
        tenantId: { in: tenantIds },
        ...(dateFilter && { createdAt: dateFilter }),
      },
      select: {
        status: true,
        paymentEnabled: true,
        isDemo: true,
      },
    })

    return {
      total: forms.length,
      active: forms.filter(f => f.status === 'ACTIVE').length,
      withPayments: forms.filter(f => f.paymentEnabled).length,
      demo: forms.filter(f => f.isDemo).length,
      live: forms.filter(f => !f.isDemo).length,
    }
  }

  private static async getSubmissionStats(
    tenantIds: string[],
    dateFilter?: { gte: Date },
    includeDemo?: boolean
  ): Promise<{
    total: number
    completed: number
    pending: number
    demo: number
    live: number
  }> {
    if (tenantIds.length === 0) {
      return { total: 0, completed: 0, pending: 0, demo: 0, live: 0 }
    }

    const submissions = await prisma.sf_form_submissions.findMany({
      where: {
        tenantId: { in: tenantIds },
        ...(dateFilter && { createdAt: dateFilter }),
      },
      select: {
        status: true,
        isDemo: true,
      },
    })

    const submissionList = submissions as Submission[]

    return {
      total: submissionList.length,
      completed: submissionList.filter(s => 
        s.status === 'COMPLETED' || s.status === 'PAYMENT_COMPLETED'
      ).length,
      pending: submissionList.filter(s => 
        s.status === 'PENDING' || s.status === 'PAYMENT_PENDING'
      ).length,
      demo: submissionList.filter(s => s.isDemo).length,
      live: submissionList.filter(s => !s.isDemo).length,
    }
  }

  private static async getPaymentStats(
    partnerId: string,
    dateFilter?: { gte: Date },
    includeDemo?: boolean
  ): Promise<{
    initiated: number
    successful: number
    failed: number
    pending: number
    demo: number
    live: number
    totalRevenue: number
    currency: string
  }> {
    const transactionsRaw = await prisma.paymentTransaction.findMany({
      where: {
        partnerId,
        ...(dateFilter && { initiatedAt: dateFilter }),
      },
      select: {
        status: true,
        amount: true,
        isDemo: true,
      },
    })

    const transactions = transactionsRaw as Transaction[]
    const getAmount = (t: Transaction) => typeof t.amount === 'number' ? t.amount : t.amount.toNumber()
    const successful = transactions.filter(t => t.status === 'SUCCESS')
    
    return {
      initiated: transactions.length,
      successful: successful.length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
      pending: transactions.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length,
      demo: transactions.filter(t => t.isDemo).length,
      live: transactions.filter(t => !t.isDemo).length,
      totalRevenue: successful.reduce((sum, t) => sum + getAmount(t), 0),
      currency: 'NGN',
    }
  }
}
