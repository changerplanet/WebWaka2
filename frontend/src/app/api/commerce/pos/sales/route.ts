/**
 * POS Sales API
 * 
 * GET  /api/commerce/pos/sales - List sales
 * POST /api/commerce/pos/sales - Create a new sale
 * 
 * Tenant-scoped via capability guard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuardLegacy, extractTenantId } from '@/lib/capabilities'
import { 
  createSale, 
  listSales,
  getSaleBySaleNumber
} from '@/lib/pos/sale-service'

// =============================================================================
// GET /api/commerce/pos/sales - List sales
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
    const shiftId = searchParams.get('shiftId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const saleNumber = searchParams.get('saleNumber')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get by sale number
    if (saleNumber) {
      const sale = await getSaleBySaleNumber(tenantId, saleNumber)
      if (!sale) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, sale })
    }

    // List sales with filtering
    const result = await listSales(tenantId, {
      locationId: locationId || undefined,
      shiftId: shiftId || undefined,
      staffId: staffId || undefined,
      status: status as any || undefined,
      paymentMethod: paymentMethod as any || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('GET /api/commerce/pos/sales error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/commerce/pos/sales - Create a new sale
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Capability guard
    const guardResult = await checkCapabilityGuardLegacy(request, 'pos')
    if (guardResult) return guardResult

    const body = await request.json()
    const { 
      tenantId: bodyTenantId, 
      locationId, 
      shiftId, 
      staffId,
      staffName,
      customerId, 
      customerName, 
      customerPhone, 
      offlineId 
    } = body

    const tenantId = bodyTenantId || request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
    }

    const saleId = await createSale({
      tenantId,
      locationId,
      shiftId,
      staffId: staffId || 'system',
      staffName: staffName || 'System',
      customerId,
      customerName,
      customerPhone,
      offlineId,
    })

    return NextResponse.json({
      success: true,
      message: 'Sale created',
      saleId,
    })
  } catch (error: any) {
    console.error('POST /api/commerce/pos/sales error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create sale' },
      { status: 500 }
    )
  }
}
