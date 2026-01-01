/**
 * POS Sale Payments API
 * 
 * POST /api/pos/sales/:saleId/payments - Add payment to sale
 * GET /api/pos/sales/:saleId/payments - List payments for sale
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  hasPermission, 
  hasAllPermissions,
  type POSStaffContext 
} from '../../../../../lib/permissions'
import type { PaymentMethod } from '../../../../../lib/sale-engine'

interface RouteParams {
  params: Promise<{ saleId: string }>
}

/**
 * POST /api/pos/sales/:saleId/payments
 * Add payment to sale
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { saleId } = await context.params
    const body = await request.json()

    const {
      tenantId,
      staffId,
      method,
      amount,
      tipAmount,
      cashReceived,
      cardLastFour,
      cardBrand,
      authCode,
      giftCardNumber,
      storeCreditId,
      corePaymentId,
      offlineId
    } = body

    if (!saleId || !tenantId || !staffId || !method || amount === undefined) {
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

    // Check permission based on payment method
    let requiredPermission: string

    switch (method as PaymentMethod) {
      case 'CASH':
        requiredPermission = 'pos.payment.cash'
        break
      case 'CARD':
      case 'MOBILE_PAYMENT':
        requiredPermission = 'pos.payment.card'
        break
      case 'SPLIT':
        requiredPermission = 'pos.payment.split'
        break
      default:
        requiredPermission = 'pos.payment.other'
    }

    const permCheck = hasPermission(staff, requiredPermission as any)
    if (!permCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: permCheck.reason,
          requiresApproval: permCheck.requiresApproval
        },
        { status: 403 }
      )
    }

    // Generate payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculate totals
    const totalAmount = amount + (tipAmount || 0)
    
    // Calculate change for cash
    let changeGiven = 0
    if (method === 'CASH' && cashReceived && cashReceived > amount) {
      changeGiven = cashReceived - amount
    }

    const payment = {
      id: paymentId,
      saleId,
      method,
      status: 'COMPLETED',
      amount,
      tipAmount: tipAmount || 0,
      totalAmount,
      cashReceived: method === 'CASH' ? cashReceived : null,
      changeGiven: method === 'CASH' ? changeGiven : null,
      cardLastFour,
      cardBrand,
      authCode,
      giftCardNumber,
      storeCreditId,
      corePaymentId,
      offlineId,
      processedAt: new Date().toISOString(),
      processedByStaffId: staffId
    }

    return NextResponse.json({
      success: true,
      payment,
      // Return updated sale totals (mock)
      saleTotals: {
        amountPaid: amount,
        amountDue: 0, // Would be calculated from actual sale
        changeGiven
      }
    })

  } catch (error) {
    console.error('Error adding payment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pos/sales/:saleId/payments
 * List payments for sale
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
      payments: [],
      totals: {
        amountPaid: 0,
        amountDue: 0,
        changeGiven: 0
      }
    })

  } catch (error) {
    console.error('Error listing payments:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
