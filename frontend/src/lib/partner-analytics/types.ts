/**
 * PARTNER ANALYTICS: Types - Phase E1.4
 * 
 * Type definitions for partner analytics, metrics, and dashboard data.
 * READ-ONLY analytics layer - no automations, notifications, or payouts.
 */

export type TimeFilter = 'today' | '7d' | '30d' | 'all'

export interface PartnerOverview {
  partnerId: string
  partnerName: string
  timeFilter: TimeFilter
  
  tenants: {
    total: number
    active: number
    inactive: number
  }
  
  forms: {
    total: number
    active: number
    withPayments: number
    demo: number
    live: number
  }
  
  submissions: {
    total: number
    completed: number
    pending: number
    demo: number
    live: number
  }
  
  payments: {
    initiated: number
    successful: number
    failed: number
    pending: number
    demo: number
    live: number
    totalRevenue: number
    currency: string
  }
  
  generatedAt: Date
}

export interface TenantPerformance {
  tenantId: string
  tenantName: string
  tenantSlug: string
  isActive: boolean
  
  submissions: number
  paymentAttempts: number
  successfulPayments: number
  conversionRate: number
  revenue: number
  currency: string
  
  isDemo: boolean
}

export interface TenantPerformanceList {
  tenants: TenantPerformance[]
  totals: {
    submissions: number
    paymentAttempts: number
    successfulPayments: number
    revenue: number
  }
  topPerformer: TenantPerformance | null
  timeFilter: TimeFilter
}

export interface FormPerformance {
  formId: string
  formName: string
  formSlug: string
  tenantId: string
  tenantName: string
  status: string
  
  paymentEnabled: boolean
  paymentAmount: number | null
  
  totalSubmissions: number
  completedSubmissions: number
  pendingSubmissions: number
  
  revenueGenerated: number
  currency: string
  
  isDemo: boolean
  createdAt: Date
}

export interface FormPerformanceList {
  forms: FormPerformance[]
  totals: {
    totalForms: number
    paymentEnabledForms: number
    totalSubmissions: number
    totalRevenue: number
  }
  timeFilter: TimeFilter
}

export interface PaymentsAnalytics {
  timeFilter: TimeFilter
  
  summary: {
    totalTransactions: number
    pending: number
    success: number
    failed: number
    abandoned: number
    expired: number
    demo: number
    live: number
  }
  
  revenue: {
    total: number
    currency: string
    byStatus: {
      successful: number
      pending: number
    }
  }
  
  bySource: {
    sourceModule: string
    count: number
    revenue: number
  }[]
}

export interface AnalyticsFilters {
  timeFilter?: TimeFilter
  includeDemo?: boolean
  tenantId?: string
}

export function getDateRangeFromFilter(filter: TimeFilter): { from: Date | null; to: Date } {
  const now = new Date()
  const to = now
  
  switch (filter) {
    case 'today':
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      return { from: startOfDay, to }
    case '7d':
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return { from: sevenDaysAgo, to }
    case '30d':
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return { from: thirtyDaysAgo, to }
    case 'all':
    default:
      return { from: null, to }
  }
}
