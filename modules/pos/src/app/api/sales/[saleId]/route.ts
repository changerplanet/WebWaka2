/**
 * POS Sale by ID API
 * 
 * GET /api/pos/sales/:saleId - Get sale details
 * PUT /api/pos/sales/:saleId - Update sale (add items, discounts)
 * DELETE /api/pos/sales/:saleId - Void sale
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../../lib/permissions'

interface RouteParams {
  params: Promise<{ saleId: string }>
}

/**
 * GET /api/pos/sales/:saleId
 * Get sale details
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
    // For now, return not found
    return NextResponse.json(
      { success: false, error: `Sale ${saleId} not found` },
      { status: 404 }
    )

  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pos/sales/:saleId
 * Update sale (add items, apply discounts, etc.)
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { saleId } = await context.params
    const body = await request.json()

    if (!saleId) {
      return NextResponse.json(
        { success: false, error: 'saleId is required' },
        { status: 400 }
      )
    }

    // Get staff context
    const staff: POSStaffContext = {
      userId: body.staffId,
      tenantId: body.tenantId,
      email: body.staffEmail || 'staff@tenant.com',
      coreRole: body.coreRole || 'TENANT_USER',
      posRole: body.posRole || 'POS_CASHIER'
    }

    // Determine permission based on action
    const action = body.action
    let requiredPermission: string

    switch (action) {
      case 'ADD_ITEM':
        requiredPermission = 'pos.sale.add_item'
        break
      case 'REMOVE_ITEM':
        requiredPermission = 'pos.sale.remove_item'
        break
      case 'UPDATE_QUANTITY':
        requiredPermission = 'pos.sale.update_quantity'
        break
      case 'APPLY_DISCOUNT':
        requiredPermission = body.discountType === 'CUSTOM' 
          ? 'pos.discount.apply_custom' 
          : 'pos.discount.apply_preset'
        break
      case 'REMOVE_DISCOUNT':
        requiredPermission = 'pos.discount.apply_preset'
        break
      case 'SUSPEND':
        requiredPermission = 'pos.sale.suspend'
        break
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    const permCheck = hasPermission(staff, requiredPermission as any)
    if (!permCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: permCheck.reason,
          requiresApproval: permCheck.requiresApproval,
          approverRole: permCheck.approverRole
        },
        { status: 403 }
      )
    }

    // In production, update the sale in database
    return NextResponse.json({
      success: true,
      message: `Sale ${saleId} updated with action: ${action}`,
      saleId,
      action
    })

  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pos/sales/:saleId
 * Void a sale
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { saleId } = await context.params
    const body = await request.json()
    const { tenantId, staffId, reason } = body

    if (!saleId || !tenantId || !staffId || !reason) {
      return NextResponse.json(
        { success: false, error: 'saleId, tenantId, staffId, and reason are required' },
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

    // Check void permission
    const permCheck = hasPermission(staff, 'pos.sale.void')
    if (!permCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: permCheck.reason,
          requiresApproval: permCheck.requiresApproval,
          approverRole: permCheck.approverRole
        },
        { status: 403 }
      )
    }

    // In production, void the sale in database
    return NextResponse.json({
      success: true,
      message: `Sale ${saleId} voided`,
      saleId,
      voidedAt: new Date().toISOString(),
      voidedBy: staffId,
      reason
    })

  } catch (error) {
    console.error('Error voiding sale:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
