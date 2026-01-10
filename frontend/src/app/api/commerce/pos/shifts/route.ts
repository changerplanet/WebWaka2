/**
 * POS Shifts API
 * 
 * GET  /api/commerce/pos/shifts        - List shifts or get active
 * POST /api/commerce/pos/shifts        - Open or close shift
 * 
 * All routes are tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { 
  openShift, 
  getActiveShift, 
  closeShift, 
  listShifts 
} from '@/lib/pos/shift-service'

// =============================================================================
// GET /api/commerce/pos/shifts - List shifts or get active
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'pos')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const active = searchParams.get('active') === 'true'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get active shift for location
    if (active && locationId) {
      const shift = await getActiveShift(tenantId, locationId)
      return NextResponse.json({ 
        success: true, 
        shift,
        hasActiveShift: !!shift 
      })
    }

    // List shifts with filtering
    const result = await listShifts(tenantId, {
      locationId: locationId || undefined,
      status: status as any || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/shifts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/commerce/pos/shifts - Open or close shift
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'pos')
    if (guardResult) return guardResult

    const body = await request.json()
    const { 
      action, 
      tenantId: bodyTenantId,
      locationId, 
      registerId, 
      openingFloat, 
      actualCash, 
      notes, 
      shiftId,
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
      return NextResponse.json({ error: 'Action is required (open/close)' }, { status: 400 })
    }

    // Open shift
    if (action === 'open') {
      if (!locationId) {
        return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
      }

      const shift = await openShift({
        tenantId,
        locationId,
        registerId,
        openedById: userId,
        openedByName: userName,
        openingFloat,
      })

      return NextResponse.json({
        success: true,
        message: `Shift ${shift.shiftNumber} opened`,
        shift,
      })
    }

    // Close shift
    if (action === 'close') {
      if (!shiftId) {
        return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
      }
      if (actualCash === undefined) {
        return NextResponse.json({ error: 'actualCash is required' }, { status: 400 })
      }

      const shift = await closeShift({
        tenantId,
        shiftId,
        closedById: userId,
        closedByName: userName,
        actualCash,
        notes,
      })

      return NextResponse.json({
        success: true,
        message: `Shift ${shift.shiftNumber} closed`,
        shift,
        variance: shift.cashVariance,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('POST /api/commerce/pos/shifts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process shift action' },
      { status: 500 }
    )
  }
}
