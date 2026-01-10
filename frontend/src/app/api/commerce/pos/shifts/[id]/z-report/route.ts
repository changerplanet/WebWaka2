/**
 * POS Shift Z-Report API
 * 
 * GET  /api/commerce/pos/shifts/[id]/z-report - Generate Z-report for shift
 * POST /api/commerce/pos/shifts/[id]/z-report - Reconcile shift
 * 
 * Tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { generateZReport, getShift, reconcileShift } from '@/lib/pos/shift-service'

// =============================================================================
// GET /api/commerce/pos/shifts/[id]/z-report - Generate Z-report
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const shiftId = params.id

    // Verify shift exists and belongs to tenant
    const shift = await getShift(tenantId, shiftId)
    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.status === 'OPEN') {
      return NextResponse.json(
        { error: 'Cannot generate Z-report for open shift. Close the shift first.' },
        { status: 400 }
      )
    }

    const zReport = await generateZReport(tenantId, shiftId)

    return NextResponse.json({
      success: true,
      zReport,
    })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/shifts/[id]/z-report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate Z-report' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/commerce/pos/shifts/[id]/z-report - Reconcile shift
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuard(request, 'pos')
    if (guardResult) return guardResult

    const body = await request.json()
    const { tenantId: bodyTenantId, varianceReason, notes } = body

    const tenantId = bodyTenantId || request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const shiftId = params.id

    const shift = await reconcileShift({
      tenantId,
      shiftId,
      varianceReason,
      notes,
    })

    return NextResponse.json({
      success: true,
      message: `Shift ${shift.shiftNumber} reconciled`,
      shift,
    })
  } catch (error: any) {
    console.error('POST /api/commerce/pos/shifts/[id]/z-report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reconcile shift' },
      { status: 500 }
    )
  }
}
