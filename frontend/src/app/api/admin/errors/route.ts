/**
 * ERROR LOG VIEWER API
 * 
 * Aggregated error logs for Super Admin diagnosis.
 * Masks PII and does not expose raw stack traces with secrets.
 * 
 * Enhanced: January 5, 2026 - Added structured logging integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { 
  getRecentErrors, 
  getAggregatedErrors, 
  getErrorSummary,
  type ErrorSeverity,
  type ErrorCategory 
} from '@/lib/error-logging'

// Error log entry type (combines structured and legacy)
interface ErrorLogEntry {
  id: string
  timestamp: string
  severity: ErrorSeverity
  category?: ErrorCategory
  service: string
  message: string
  count: number
  code?: string
  tenantId?: string
  tenantName?: string
  instanceId?: string
  instanceName?: string
  lastOccurrence: string
  resolved: boolean
  fingerprint?: string
}

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  const { searchParams } = new URL(request.url)
  const severity = searchParams.get('severity') as ErrorSeverity | null
  const category = searchParams.get('category') as ErrorCategory | null
  const service = searchParams.get('service')
  const timeRange = (searchParams.get('timeRange') || '24h') as '1h' | '6h' | '24h' | '7d'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const view = searchParams.get('view') || 'aggregated' // 'aggregated' | 'raw' | 'summary'

  try {
    // Calculate time range
    const now = new Date()
    let startTime: Date
    switch (timeRange) {
      case '1h': startTime = new Date(now.getTime() - 60 * 60 * 1000); break
      case '6h': startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break
      case '24h': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break
      case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
      default: startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // If summary view requested, return error summary
    if (view === 'summary') {
      const summary = getErrorSummary(timeRange)
      return NextResponse.json({
        success: true,
        view: 'summary',
        summary,
        timeRange,
      })
    }

    // Get structured errors from error logging service
    const structuredErrors = view === 'aggregated' 
      ? getAggregatedErrors({ timeRange, limit: 100 })
      : getRecentErrors({ 
          severity: severity || undefined, 
          category: category || undefined,
          service: service || undefined,
          since: startTime,
          limit: 200 
        })

    // Build error logs combining structured errors and legacy data sources
    const errorLogs: ErrorLogEntry[] = []

    // Add structured errors
    if (view === 'aggregated') {
      for (const agg of structuredErrors as any[]) {
        errorLogs.push({
          id: `struct-${agg.fingerprint}`,
          timestamp: agg.lastSeen,
          severity: agg.severity,
          category: agg.category,
          service: agg.service,
          message: agg.message,
          code: agg.code,
          count: agg.count,
          lastOccurrence: agg.lastSeen,
          resolved: false,
          fingerprint: agg.fingerprint,
        })
      }
    } else {
      for (const err of structuredErrors as any[]) {
        errorLogs.push({
          id: err.id,
          timestamp: err.timestamp,
          severity: err.severity,
          category: err.category,
          service: err.service,
          message: err.message,
          code: err.code,
          count: 1,
          tenantId: err.tenantId,
          lastOccurrence: err.timestamp,
          resolved: false,
          fingerprint: err.fingerprint,
        })
      }
    }

    // Also get platform health indicators from database
    // OTP failures
    const otpFailures = await prisma.otpCode.findMany({
      where: {
        createdAt: { gte: startTime },
        status: { in: ['EXPIRED', 'FAILED'] }
      },
      take: 100
    })

    const otpFailuresByStatus = otpFailures.reduce((acc, otp) => {
      const key = `OTP_${otp.status}`
      if (!acc[key]) {
        acc[key] = { count: 0, lastOccurrence: otp.createdAt }
      }
      acc[key].count++
      if (otp.createdAt > acc[key].lastOccurrence) {
        acc[key].lastOccurrence = otp.createdAt
      }
      return acc
    }, {} as Record<string, { count: number; lastOccurrence: Date }>)

    Object.entries(otpFailuresByStatus).forEach(([key, data], index) => {
      errorLogs.push({
        id: `err-otp-${index}`,
        timestamp: data.lastOccurrence.toISOString(),
        severity: data.count > 10 ? 'HIGH' : data.count > 5 ? 'MEDIUM' : 'LOW',
        category: 'AUTH',
        service: 'Authentication',
        message: key === 'OTP_EXPIRED' 
          ? `${data.count} OTP codes expired without verification`
          : `${data.count} OTP verification failures (max attempts)`,
        count: data.count,
        lastOccurrence: data.lastOccurrence.toISOString(),
        resolved: false
      })
    })

    // Check for suspended entities
    const [suspendedTenants, suspendedPartners] = await Promise.all([
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.partner.count({ where: { status: 'SUSPENDED' } })
    ])

    if (suspendedTenants > 0) {
      errorLogs.push({
        id: 'err-suspended-tenants',
        timestamp: now.toISOString(),
        severity: suspendedTenants > 5 ? 'HIGH' : 'MEDIUM',
        category: 'BUSINESS',
        service: 'Tenant Management',
        message: `${suspendedTenants} tenant(s) currently suspended`,
        count: suspendedTenants,
        lastOccurrence: now.toISOString(),
        resolved: false
      })
    }

    if (suspendedPartners > 0) {
      errorLogs.push({
        id: 'err-suspended-partners',
        timestamp: now.toISOString(),
        severity: suspendedPartners > 3 ? 'HIGH' : 'MEDIUM',
        category: 'BUSINESS',
        service: 'Partner Management',
        message: `${suspendedPartners} partner(s) currently suspended`,
        count: suspendedPartners,
        lastOccurrence: now.toISOString(),
        resolved: false
      })
    }

    // Check for failed subscriptions
    const failedSubs = await prisma.subscription.count({
      where: { status: { in: ['PAST_DUE', 'SUSPENDED'] } }
    })

    if (failedSubs > 0) {
      errorLogs.push({
        id: 'err-failed-subs',
        timestamp: now.toISOString(),
        severity: failedSubs > 10 ? 'CRITICAL' : failedSubs > 5 ? 'HIGH' : 'MEDIUM',
        category: 'BUSINESS',
        service: 'Billing',
        message: `${failedSubs} subscription(s) in failed/past-due state`,
        count: failedSubs,
        lastOccurrence: now.toISOString(),
        resolved: false
      })
    }

    // Apply filters
    let filteredLogs = errorLogs
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity)
    }
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }
    if (service) {
      filteredLogs = filteredLogs.filter(log => 
        log.service.toLowerCase().includes(service.toLowerCase())
      )
    }

    // Sort by severity and timestamp
    const severityOrder: Record<ErrorSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    filteredLogs.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Paginate
    const start = (page - 1) * limit
    const paginatedLogs = filteredLogs.slice(start, start + limit)

    // Get summary stats
    const summary = {
      total: filteredLogs.length,
      bySeverity: {
        CRITICAL: filteredLogs.filter(l => l.severity === 'CRITICAL').length,
        HIGH: filteredLogs.filter(l => l.severity === 'HIGH').length,
        MEDIUM: filteredLogs.filter(l => l.severity === 'MEDIUM').length,
        LOW: filteredLogs.filter(l => l.severity === 'LOW').length
      },
      byCategory: {
        AUTH: filteredLogs.filter(l => l.category === 'AUTH').length,
        DATABASE: filteredLogs.filter(l => l.category === 'DATABASE').length,
        API: filteredLogs.filter(l => l.category === 'API').length,
        VALIDATION: filteredLogs.filter(l => l.category === 'VALIDATION').length,
        BUSINESS: filteredLogs.filter(l => l.category === 'BUSINESS').length,
        INTEGRATION: filteredLogs.filter(l => l.category === 'INTEGRATION').length,
        PERMISSION: filteredLogs.filter(l => l.category === 'PERMISSION').length,
        SYSTEM: filteredLogs.filter(l => l.category === 'SYSTEM').length,
      },
      byService: filteredLogs.reduce((acc, log) => {
        acc[log.service] = (acc[log.service] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      view,
      logs: paginatedLogs,
      summary,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      },
      timeRange,
      services: ['Authentication', 'Billing', 'Tenant Management', 'Partner Management', 'API', 'Database'],
      categories: ['AUTH', 'DATABASE', 'API', 'VALIDATION', 'BUSINESS', 'INTEGRATION', 'PERMISSION', 'SYSTEM']
    })
  } catch (error) {
    console.error('Error logs fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error logs' },
      { status: 500 }
    )
  }
}
