export const dynamic = 'force-dynamic'

/**
 * PHASE 3: Partner Earnings API
 * 
 * GET /api/partner/earnings - Get all earnings for partner
 * GET /api/partner/earnings?instanceId=xxx - Get earnings for specific instance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPartnerEarnings, getPartnerFinancials } from '@/lib/phase-3/instance-financials'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's partner
    const partnerUser = await prisma.partnerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        partner: { select: { id: true, name: true } }
      }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')
    const status = searchParams.get('status')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Get earnings
    const earningsData = await getPartnerEarnings(partnerUser.partner.id, {
      platformInstanceId: instanceId || undefined,
      status,
      limit,
      offset,
    })
    
    // Get aggregate financials
    const financials = await getPartnerFinancials(partnerUser.partner.id)
    
    // STAFF FILTERING: PARTNER_STAFF gets summary-only data
    // Roles without canViewAllEarnings see totals but not line-item breakdown
    const isStaffRole = partnerUser.role === 'PARTNER_STAFF' || 
                        partnerUser.role === 'PARTNER_SALES' || 
                        partnerUser.role === 'PARTNER_SUPPORT'
    
    if (isStaffRole) {
      // Return summary-only response for STAFF roles
      // Omit: individual earnings records, instance-level breakdown
      return NextResponse.json({
        success: true,
        partner: {
          id: partnerUser.partner.id,
          name: partnerUser.partner.name,
        },
        earnings: [], // Empty - no line items for STAFF
        total: 0,
        summary: earningsData.summary, // Totals only
        financials: {
          totalRevenue: financials.totals.totalRevenue,
          currentMonthRevenue: financials.totals.currentMonthRevenue,
          // Omit profit and commission details
        },
        instances: [], // No instance breakdown for STAFF
      })
    }
    
    return NextResponse.json({
      success: true,
      partner: {
        id: partnerUser.partner.id,
        name: partnerUser.partner.name,
      },
      earnings: earningsData.earnings,
      total: earningsData.total,
      summary: earningsData.summary,
      financials: financials.totals,
      instances: financials.instances,
    })
  } catch (error) {
    console.error('Failed to get partner earnings:', error)
    return NextResponse.json(
      { error: 'Failed to get earnings' },
      { status: 500 }
    )
  }
}
