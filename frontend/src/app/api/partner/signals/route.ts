/**
 * PHASE 4B: Partner Expansion Signals API
 * 
 * GET /api/partner/signals - Get all expansion signals
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  detectExpansionSignals,
  getSignalSummary,
} from '@/lib/phase-4b/expansion-signals'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const summaryOnly = request.nextUrl.searchParams.get('summary') === 'true'
    
    if (summaryOnly) {
      const summary = await getSignalSummary(partnerUser.partnerId)
      return NextResponse.json({
        success: true,
        summary,
      })
    }
    
    const signals = await detectExpansionSignals(partnerUser.partnerId)
    const summary = await getSignalSummary(partnerUser.partnerId)
    
    return NextResponse.json({
      success: true,
      signals,
      summary,
    })
  } catch (error) {
    console.error('Signals GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}
