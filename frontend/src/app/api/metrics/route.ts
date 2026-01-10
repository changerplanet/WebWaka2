/**
 * Metrics & Health Check API
 * 
 * GET /api/metrics - System metrics and health status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRateLimitStats } from '@/lib/rate-limiter'
import { getAuditStats } from '@/lib/audit-logger'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  message?: string
}

/**
 * GET /api/metrics
 * Returns system health and metrics
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const detailed = searchParams.get('detailed') === 'true'
  
  const startTime = Date.now()
  const checks: HealthCheck[] = []
  
  // Database health check
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    
    checks.push({
      name: 'database',
      status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'unhealthy',
      latency: dbLatency
    })
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed'
    })
  }

  // Memory usage check
  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

  checks.push({
    name: 'memory',
    status: heapPercent < 70 ? 'healthy' : heapPercent < 90 ? 'degraded' : 'unhealthy',
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent.toFixed(1)}%)`
  })

  // Overall status
  const overallStatus = checks.every(c => c.status === 'healthy')
    ? 'healthy'
    : checks.some(c => c.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded'

  const response: Record<string, unknown> = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks
  }

  // Detailed metrics (only if requested)
  if (detailed) {
    // Rate limiter stats
    const rateLimitStats = getRateLimitStats()
    
    // Audit stats
    const auditStats = getAuditStats()
    
    // Process stats
    response.metrics = {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      rateLimiter: rateLimitStats,
      audit: auditStats,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version
      }
    }

    // Database stats (if available)
    try {
      const [walletCount, orderCount, cartCount] = await Promise.all([
        prisma.commerce_wallets.count(),
        prisma.svm_orders.count(),
        prisma.svm_carts.count()
      ])
      
      response.metrics = {
        ...response.metrics as object,
        database: {
          wallets: walletCount,
          orders: orderCount,
          carts: cartCount
        }
      }
    } catch {
      // Skip if counts fail
    }
  }

  const totalLatency = Date.now() - startTime
  response.responseTime = totalLatency

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store',
      'X-Response-Time': `${totalLatency}ms`
    }
  })
}
