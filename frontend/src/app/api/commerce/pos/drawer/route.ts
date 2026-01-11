export const dynamic = 'force-dynamic'

/**
 * POS Cash Drawer API
 * 
 * GET  /api/commerce/pos/drawer - Get drawer summary
 * POST /api/commerce/pos/drawer - Cash in/out/reconcile
 * 
 * Tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { 
  payIn,
  payOut,
  safeDrop,
  recordAdjustment,
  getCurrentDrawerBalance,
  getDrawerSummary,
  reconcileDrawer,
  listCashMovements
} from '@/lib/pos/drawer-service'

// =============================================================================
// GET /api/commerce/pos/drawer - Get drawer status
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')
    const includeMovements = searchParams.get('includeMovements') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
    }

    const summary = await getDrawerSummary(shiftId)

    let movements = undefined
    if (includeMovements) {
      const movementResult = await listCashMovements(shiftId, { limit, offset })
      movements = movementResult.movements
    }

    return NextResponse.json({
      success: true,
      summary,
      movements,
    })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/drawer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drawer status' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/commerce/pos/drawer - Cash operations
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const body = await request.json()
    const { 
      action, 
      tenantId: bodyTenantId,
      shiftId, 
      amount, 
      reason, 
      notes, 
      approvedById, 
      approvedByName, 
      actualCash, 
      direction,
      staffId,
      staffName
    } = body

    const tenantId = bodyTenantId || request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const userId = staffId || 'system'
    const userName = staffName || 'System'

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
    }

    // =========================================================================
    // PAY IN
    // =========================================================================
    if (action === 'in' || action === 'payIn') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
      }
      if (!reason) {
        return NextResponse.json({ error: 'reason is required' }, { status: 400 })
      }

      const movement = await payIn({
        tenantId,
        shiftId,
        amount,
        performedById: userId,
        performedByName: userName,
        reason,
        notes,
      })

      const currentBalance = await getCurrentDrawerBalance(shiftId)

      return NextResponse.json({
        success: true,
        message: `₦${amount.toFixed(2)} added to drawer`,
        movement,
        currentBalance,
      })
    }

    // =========================================================================
    // PAY OUT
    // =========================================================================
    if (action === 'out' || action === 'payOut') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
      }
      if (!reason) {
        return NextResponse.json({ error: 'reason is required' }, { status: 400 })
      }

      const movement = await payOut({
        tenantId,
        shiftId,
        amount,
        performedById: userId,
        performedByName: userName,
        approvedById,
        approvedByName,
        reason,
        notes,
      })

      const currentBalance = await getCurrentDrawerBalance(shiftId)

      return NextResponse.json({
        success: true,
        message: `₦${amount.toFixed(2)} removed from drawer`,
        movement,
        currentBalance,
      })
    }

    // =========================================================================
    // SAFE DROP
    // =========================================================================
    if (action === 'drop' || action === 'safeDrop') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
      }

      const movement = await safeDrop({
        tenantId,
        shiftId,
        amount,
        performedById: userId,
        performedByName: userName,
        approvedById,
        approvedByName,
        notes,
      })

      const currentBalance = await getCurrentDrawerBalance(shiftId)

      return NextResponse.json({
        success: true,
        message: `₦${amount.toFixed(2)} dropped to safe`,
        movement,
        currentBalance,
      })
    }

    // =========================================================================
    // ADJUSTMENT
    // =========================================================================
    if (action === 'adjustment' || action === 'adjust') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
      }
      if (!direction || !['IN', 'OUT'].includes(direction)) {
        return NextResponse.json({ error: 'direction must be IN or OUT' }, { status: 400 })
      }
      if (!reason) {
        return NextResponse.json({ error: 'reason is required' }, { status: 400 })
      }

      const movement = await recordAdjustment({
        tenantId,
        shiftId,
        amount,
        direction,
        performedById: userId,
        performedByName: userName,
        approvedById,
        approvedByName,
        reason,
        notes,
      })

      const currentBalance = await getCurrentDrawerBalance(shiftId)

      return NextResponse.json({
        success: true,
        message: `Adjustment recorded: ${direction === 'IN' ? '+' : '-'}₦${amount.toFixed(2)}`,
        movement,
        currentBalance,
      })
    }

    // =========================================================================
    // RECONCILE
    // =========================================================================
    if (action === 'reconcile') {
      if (actualCash === undefined) {
        return NextResponse.json({ error: 'actualCash is required' }, { status: 400 })
      }

      const result = await reconcileDrawer(shiftId, actualCash)

      return NextResponse.json({
        success: true,
        message: `Drawer reconciled: ${result.varianceStatus}`,
        ...result,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('POST /api/commerce/pos/drawer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process drawer operation' },
      { status: 500 }
    )
  }
}
