/**
 * POS Sale Line Items API
 * 
 * POST /api/pos/sales/:saleId/items - Add item to sale
 * GET /api/pos/sales/:saleId/items - List items in sale
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../../../lib/permissions'

interface RouteParams {
  params: Promise<{ saleId: string }>
}

/**
 * POST /api/pos/sales/:saleId/items
 * Add item to sale
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { saleId } = await context.params
    const body = await request.json()

    const { 
      tenantId, 
      staffId, 
      productId, 
      variantId,
      productName, 
      productSku,
      variantName,
      unitPrice, 
      quantity, 
      taxRate,
      taxExempt,
      serialNumber,
      batchNumber,
      notes 
    } = body

    if (!saleId || !tenantId || !staffId || !productId || !productName || !unitPrice || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get staff context
    const staff: POSStaffContext = {
      userId: staffId,
      tenantId,
      email: body.staffEmail || 'staff@tenant.com',
      coreRole: body.coreRole || 'TENANT_USER',
      posRole: body.posRole || 'POS_CASHIER'
    }

    // Check permission
    const permCheck = hasPermission(staff, 'pos.sale.add_item')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.reason },
        { status: 403 }
      )
    }

    // Generate line item ID
    const lineItemId = `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculate line totals
    const lineSubtotal = unitPrice * quantity
    const taxAmount = taxExempt ? 0 : lineSubtotal * (taxRate || 0)
    const lineTotal = lineSubtotal

    const lineItem = {
      id: lineItemId,
      saleId,
      productId,
      variantId,
      productName,
      productSku,
      variantName,
      unitPrice,
      quantity,
      lineSubtotal,
      discountAmount: 0,
      taxAmount,
      lineTotal,
      taxRate: taxRate || null,
      taxExempt: taxExempt || false,
      serialNumber,
      batchNumber,
      notes,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      lineItem
    })

  } catch (error) {
    console.error('Error adding item to sale:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/sales/:saleId/items
 * List items in sale
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { saleId } = await context.params

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: 'saleId is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    return NextResponse.json({
      success: true,
      saleId,
      items: [],
      totals: {
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0
      }
    })

  } catch (error) {
    console.error('Error listing sale items:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
