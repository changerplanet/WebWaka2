/**
 * POS Refunds API
 * 
 * POST /api/pos/refunds - Create a refund
 * GET /api/pos/refunds - List refunds
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  type POSStaffContext 
} from '../../../lib/permissions'

// Generate refund number
function generateRefundNumber(tenantId: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `R-${dateStr}-${seq}`
}

/**
 * POST /api/pos/refunds
 * Create a refund
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      tenantId,
      staffId,
      originalSaleId, // Required unless refund without receipt
      items, // Array of { lineItemId, quantity, reason }
      refundMethod,
      reason,
      notes,
      restockItems,
      approverStaffId // Required for approval scenarios
    } = body

    if (!tenantId || !staffId || !reason || !refundMethod) {
      return NextResponse.json(
        { success: false, error: 'tenantId, staffId, reason, and refundMethod are required' },
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

    // Determine required permission
    let requiredPermission: 'pos.refund.create' | 'pos.refund.without_receipt'

    if (!originalSaleId) {
      requiredPermission = 'pos.refund.without_receipt'
    } else {
      requiredPermission = 'pos.refund.create'
    }

    const permCheck = hasPermission(staff, requiredPermission)
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

    // Generate refund ID and number
    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const refundNumber = generateRefundNumber(tenantId)

    // Calculate totals (mock - would use actual line items)
    const subtotal = items?.reduce((sum: number, i: any) => sum + (i.refundAmount || 0), 0) || 0
    const taxRefunded = subtotal * 0.0825 // Mock tax rate
    const totalRefunded = subtotal + taxRefunded

    const refund = {
      id: refundId,
      tenantId,
      refundNumber,
      originalSaleId: originalSaleId || null,
      staffId,
      approvedByStaffId: approverStaffId || null,
      subtotal,
      taxRefunded,
      totalRefunded,
      refundMethod,
      reason,
      notes: notes || null,
      restockItems: restockItems !== false,
      processedAt: new Date().toISOString(),
      items: items || []
    }

    return NextResponse.json({
      success: true,
      refund,
      events: [
        {
          eventType: 'pos.refund.created',
          timestamp: new Date().toISOString()
        },
        ...(restockItems !== false ? [{
          eventType: 'pos.inventory.restore_requested',
          timestamp: new Date().toISOString(),
          note: 'Core will process inventory restore'
        }] : [])
      ]
    })

  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/refunds
 * List refunds
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const originalSaleId = searchParams.get('originalSaleId')
    const staffId = searchParams.get('staffId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    return NextResponse.json({
      success: true,
      refunds: [],
      filters: {
        tenantId,
        originalSaleId: originalSaleId || null,
        staffId: staffId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        limit
      }
    })

  } catch (error) {
    console.error('Error listing refunds:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
