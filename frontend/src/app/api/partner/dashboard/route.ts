/**
 * PHASE 4B: Partner SaaS Dashboard API
 * 
 * GET /api/partner/dashboard - Full dashboard data
 * GET /api/partner/dashboard?section=revenue - Revenue only
 * GET /api/partner/dashboard?section=lifecycle - Lifecycle stats only
 * GET /api/partner/dashboard?section=platforms - Platform counts only
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getPartnerDashboard,
  getRevenueOverview,
  getLifecycleStats,
  getPlatformCounts,
  getChurnIndicators,
} from '@/lib/phase-4b/partner-dashboard'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    // Get partner for this user
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id },
      include: { partner: true }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const partnerId = partnerUser.partnerId
    const section = request.nextUrl.searchParams.get('section')
    
    // Return specific section if requested
    if (section) {
      switch (section) {
        case 'revenue':
          const revenue = await getRevenueOverview(partnerId)
          return NextResponse.json({ success: true, revenue })
        
        case 'lifecycle':
          const lifecycle = await getLifecycleStats(partnerId)
          return NextResponse.json({ success: true, lifecycle })
        
        case 'platforms':
          const platforms = await getPlatformCounts(partnerId)
          return NextResponse.json({ success: true, platforms })
        
        case 'churn':
          const churn = await getChurnIndicators(partnerId)
          return NextResponse.json({ success: true, churnIndicators: churn })
        
        default:
          return NextResponse.json(
            { error: 'Invalid section' },
            { status: 400 }
          )
      }
    }
    
    // Return full dashboard
    const dashboard = await getPartnerDashboard(partnerId)
    
    return NextResponse.json({
      success: true,
      dashboard,
      partner: {
        id: partnerUser.partner.id,
        name: partnerUser.partner.name,
        slug: partnerUser.partner.slug,
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
