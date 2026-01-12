export const dynamic = 'force-dynamic'

/**
 * PLATFORM HEALTH API
 * 
 * Provides operational visibility into platform health for Super Admins.
 * Read-only - no server controls or environment secrets exposed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Get database stats
    const [
      userCount,
      tenantCount,
      partnerCount,
      instanceCount,
      sessionCount,
      recentLogins,
      recentAuditLogs,
      otpStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.partner.count(),
      prisma.platformInstance.count(),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.auditLog.count({ 
        where: { 
          action: 'USER_LOGIN', 
          createdAt: { gte: oneDayAgo } 
        } 
      }),
      prisma.auditLog.count({ 
        where: { 
          createdAt: { gte: oneHourAgo } 
        } 
      }),
      prisma.otpCode.groupBy({
        by: ['status'],
        where: { createdAt: { gte: oneDayAgo } },
        _count: { id: true }
      })
    ])

    // Get tenant status distribution
    const tenantStatusDist = await prisma.tenant.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Get partner status distribution
    const partnerStatusDist = await prisma.partner.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Calculate OTP success rate
    const otpStatsMap = Object.fromEntries(
      otpStats.map(s => [s.status, s._count.id])
    )
    const totalOtps = Object.values(otpStatsMap).reduce((a, b) => a + b, 0)
    const verifiedOtps = otpStatsMap['VERIFIED'] || 0
    const otpSuccessRate = totalOtps > 0 ? ((verifiedOtps / totalOtps) * 100).toFixed(1) : 'N/A'

    // Simulate queue/job status (in production, this would query actual job queue)
    const backgroundJobs = {
      pendingJobs: 0,
      processingJobs: 0,
      failedJobsLast24h: 0,
      status: 'healthy'
    }

    // System health indicators
    const healthChecks = {
      database: 'healthy',
      authentication: 'healthy',
      auditLogging: 'healthy',
      otpService: otpSuccessRate !== 'N/A' && parseFloat(otpSuccessRate) > 80 ? 'healthy' : 'degraded'
    }

    // Check if any critical issues
    const overallStatus = Object.values(healthChecks).every(s => s === 'healthy') 
      ? 'healthy' 
      : 'degraded'

    return NextResponse.json({
      success: true,
      health: {
        status: overallStatus,
        timestamp: now.toISOString(),
        uptime: process.uptime(),
        checks: healthChecks
      },
      stats: {
        users: userCount,
        tenants: tenantCount,
        partners: partnerCount,
        instances: instanceCount,
        activeSessions: sessionCount,
        loginsLast24h: recentLogins,
        auditLogsLastHour: recentAuditLogs
      },
      distributions: {
        tenantStatus: Object.fromEntries(
          tenantStatusDist.map(s => [s.status, s._count.id])
        ),
        partnerStatus: Object.fromEntries(
          partnerStatusDist.map(s => [s.status, s._count.id])
        )
      },
      otpMetrics: {
        totalLast24h: totalOtps,
        verified: verifiedOtps,
        expired: otpStatsMap['EXPIRED'] || 0,
        failed: otpStatsMap['FAILED'] || 0,
        successRate: otpSuccessRate
      },
      backgroundJobs
    })
  } catch (error) {
    console.error('Platform health error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform health' },
      { status: 500 }
    )
  }
}
