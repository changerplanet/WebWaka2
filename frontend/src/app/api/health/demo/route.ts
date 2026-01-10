/**
 * HEALTH SUITE: Demo API
 * 
 * Demo data seeding for Partner Demo Mode.
 * Creates Nigerian demo data for showcasing.
 * 
 * @module api/health/demo
 * @phase S4
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { seedHealthDemoData, clearHealthDemoData } from '@/lib/health/demo-data'

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const action = body.action || 'seed'

    switch (action) {
      case 'seed':
        const seedResult = await seedHealthDemoData(tenantId)
        return NextResponse.json({
          success: seedResult.success,
          message: seedResult.message,
          counts: seedResult.counts,
          phase: 'S4'
        })

      case 'clear':
        const clearResult = await clearHealthDemoData(tenantId)
        return NextResponse.json({
          success: clearResult.success,
          message: clearResult.message,
          phase: 'S4'
        })

      case 'reset':
        // Clear then seed
        const clearFirst = await clearHealthDemoData(tenantId)
        if (!clearFirst.success) {
          return NextResponse.json({
            success: false,
            message: `Failed to clear: ${clearFirst.message}`,
            phase: 'S4'
          })
        }
        const reseedResult = await seedHealthDemoData(tenantId)
        return NextResponse.json({
          success: reseedResult.success,
          message: reseedResult.message,
          counts: reseedResult.counts,
          phase: 'S4'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Health Demo API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
