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
