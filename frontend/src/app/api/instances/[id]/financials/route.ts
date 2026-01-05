/**
 * PHASE 3: Instance Financials API
 * 
 * GET /api/instances/[id]/financials - Get financial summary for instance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getInstanceFinancials } from '@/lib/phase-3/instance-financials'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const financials = await getInstanceFinancials(params.id)
    
    if (!financials) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, financials })
  } catch (error) {
    console.error('Failed to get instance financials:', error)
    return NextResponse.json(
      { error: 'Failed to get financials' },
      { status: 500 }
    )
  }
}
