/**
 * POS Sales API
 * 
 * POST /api/pos/sales - Create a new sale
 * GET /api/pos/sales - List sales for the tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  SaleEngine, 
  createEventEmitter,
  type CreateSaleInput
} from '../../../lib'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../lib/permissions'

// Simulated sale number generator (in production, use database sequence)
function generateSaleNumber(tenantId: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `S-${dateStr}-${seq}`
}

/**
 * POST /api/pos/sales
 * Create a new sale (draft)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, staffId, registerId, sessionId, shiftId, customerId, offlineId } = body

    if (!tenantId || !staffId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and staffId are required' },
        { status: 400 }
      )
    }

    // Get staff context from request (in production, from session/auth)
    const staff: POSStaffContext = {
      userId: staffId,
      tenantId,
      email: body.staffEmail || 'staff@tenant.com',
      coreRole: body.coreRole || 'TENANT_USER',
      posRole: body.posRole || 'POS_CASHIER',
      sessionId,
      registerId,
      shiftId
    }

    // Check permission
    const permCheck = hasPermission(staff, 'pos.sale.create')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // Generate sale number
    const saleNumber = generateSaleNumber(tenantId)

    // Create event emitter
    const eventEmitter = createEventEmitter()

    // Create the sale
    const input: CreateSaleInput = {
      tenantId,
      staffId,
      registerId,
      sessionId,
      shiftId,
      customerId,
      offlineId
    }

    const engine = SaleEngine.create(input, saleNumber, eventEmitter)
    const state = engine.getState()

    return NextResponse.json({
      success: true,
      sale: {
        id: state.id,
        saleNumber: state.saleNumber,
        status: state.status,
        tenantId: state.tenantId,
        staffId: state.staffId,
        customerId: state.customerId,
        registerId: state.registerId,
        sessionId: state.sessionId,
        shiftId: state.shiftId,
        subtotal: state.subtotal.toNumber(),
        discountTotal: state.discountTotal.toNumber(),
        taxTotal: state.taxTotal.toNumber(),
        grandTotal: state.grandTotal.toNumber(),
        amountPaid: state.amountPaid.toNumber(),
        amountDue: state.amountDue.toNumber(),
        lineItems: [],
        discounts: [],
        payments: [],
        createdAt: state.createdAt.toISOString(),
        updatedAt: state.updatedAt.toISOString()
      },
      events: engine.getEvents().map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        timestamp: e.timestamp.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/sales
 * List sales for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status')
    const staffId = searchParams.get('staffId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // In production, this would query the database
    // For now, return mock structure
    return NextResponse.json({
      success: true,
      sales: [],
      pagination: {
        limit,
        offset,
        total: 0
      },
      filters: {
        tenantId,
        status: status || 'all',
        staffId: staffId || null
      }
    })

  } catch (error) {
    console.error('Error listing sales:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
