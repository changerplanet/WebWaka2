/**
 * MVM Commissions API
 * 
 * Commission queries and calculations.
 * NOTE: Commission CALCULATION only - no wallet/payout mutations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard } from '@/lib/capabilities'

// Temporary storage for commission records
const commissionStore = new Map<string, any[]>()

function getTenantCommissions(tenantId: string) {
  if (!commissionStore.has(tenantId)) {
    commissionStore.set(tenantId, [])
  }
  return commissionStore.get(tenantId)!
}

/**
 * GET /api/mvm/commissions
 * List commission records
 */
export async function GET(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }
    
    let commissions = getTenantCommissions(tenantId)
    
    // Filter by vendor
    if (vendorId) {
      commissions = commissions.filter(c => c.vendorId === vendorId)
    }
    
    // Filter by status
    if (status) {
      commissions = commissions.filter(c => c.status === status)
    }
    
    // Paginate
    const total = commissions.length
    commissions = commissions.slice(offset, offset + limit)
    
    // Calculate totals
    const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0)
    const totalPending = commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
    
    return NextResponse.json({
      success: true,
      commissions,
      summary: {
        total,
        totalCommission,
        totalPending,
        filtered: vendorId ? `vendor:${vendorId}` : 'all'
      },
      hasMore: offset + commissions.length < total,
      module: 'MVM'
    })
    
  } catch (error) {
    console.error('[MVM] Error listing commissions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/mvm/commissions
 * Calculate commission for an order (recording only, no payout)
 */
export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const body = await request.json()
    const { tenantId, subOrderId, vendorId, saleAmount, commissionRate } = body
    
    if (!tenantId || !subOrderId || !vendorId || saleAmount === undefined || commissionRate === undefined) {
      return NextResponse.json(
        { success: false, error: 'tenantId, subOrderId, vendorId, saleAmount, and commissionRate are required' },
        { status: 400 }
      )
    }
    
    const commissions = getTenantCommissions(tenantId)
    
    // Check for duplicate
    if (commissions.some(c => c.subOrderId === subOrderId)) {
      return NextResponse.json(
        { success: false, error: 'Commission already recorded for this sub-order' },
        { status: 400 }
      )
    }
    
    const commissionAmount = (saleAmount * commissionRate) / 100
    const vendorPayout = saleAmount - commissionAmount
    
    const commission = {
      id: `comm_${Date.now().toString(36)}`,
      tenantId,
      subOrderId,
      vendorId,
      saleAmount,
      commissionRate,
      commissionAmount,
      vendorPayout,
      status: 'PENDING', // Not paid out
      calculatedAt: new Date().toISOString()
    }
    
    commissions.push(commission)
    
    return NextResponse.json({
      success: true,
      commission,
      message: 'Commission calculated and recorded (no payout executed)',
      module: 'MVM'
    }, { status: 201 })
    
  } catch (error) {
    console.error('[MVM] Error calculating commission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
