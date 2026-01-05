/**
 * ERROR LOG VIEWER API
 * 
 * Aggregated error logs for Super Admin diagnosis.
 * Masks PII and does not expose raw stack traces with secrets.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'

// Simulated error log entry type
interface ErrorLogEntry {
  id: string
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  service: string
  message: string
  count: number
  tenantId?: string
  tenantName?: string
  instanceId?: string
  instanceName?: string
  lastOccurrence: string
  resolved: boolean
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
  const severity = searchParams.get('severity')
  const service = searchParams.get('service')
  const timeRange = searchParams.get('timeRange') || '24h'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

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

    // Get audit logs that might indicate errors (auth failures, etc.)
    const authFailures = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startTime },
        action: {
          in: [
            'USER_LOGIN',
            'SUBSCRIPTION_SUSPENDED',
            'TENANT_SUSPENDED',
            'PARTNER_SUSPENDED'
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get OTP failures
    const otpFailures = await prisma.otpCode.findMany({
      where: {
        createdAt: { gte: startTime },
        status: { in: ['EXPIRED', 'FAILED'] }
      },
      take: 100
    })

    // Build simulated error logs from actual platform data
    const errorLogs: ErrorLogEntry[] = []

    // Aggregate OTP failures by type
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
        service: 'Billing',
        message: `${failedSubs} subscription(s) in failed/past-due state`,
        count: failedSubs,
        lastOccurrence: now.toISOString(),
        resolved: false
      })
    }

    // Filter by severity if specified
    let filteredLogs = errorLogs
    if (severity) {
      filteredLogs = errorLogs.filter(log => log.severity === severity)
    }
    if (service) {
      filteredLogs = filteredLogs.filter(log => 
        log.service.toLowerCase().includes(service.toLowerCase())
      )
    }

    // Sort by severity and timestamp
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
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
      byService: filteredLogs.reduce((acc, log) => {
        acc[log.service] = (acc[log.service] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      summary,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      },
      timeRange,
      services: ['Authentication', 'Billing', 'Tenant Management', 'Partner Management', 'API']
    })
  } catch (error) {
    console.error('Error logs fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error logs' },
      { status: 500 }
    )
  }
}
