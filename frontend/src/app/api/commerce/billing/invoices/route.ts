export const dynamic = 'force-dynamic'

/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Invoices API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/invoices - List invoices with filters
 * POST /api/commerce/billing/invoices - Create new invoice
 * 
 * @module api/commerce/billing/invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { InvoiceService } from '@/lib/billing'
import { BillInvoiceStatus } from '@prisma/client'

/**
 * GET /api/commerce/billing/invoices
 * List invoices with optional filters
 * 
 * Query params:
 * - customerId: Filter by customer
 * - status: Comma-separated status list (DRAFT,SENT,PAID,etc.)
 * - overdue: true/false - show only overdue
 * - fromDate: ISO date string
 * - toDate: ISO date string
 * - page: Page number (default 1)
 * - limit: Items per page (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)

    // Parse query params
    const customerId = searchParams.get('customerId') || undefined
    const statusParam = searchParams.get('status')
    const status = statusParam 
      ? statusParam.split(',') as BillInvoiceStatus[]
      : undefined
    const overdue = searchParams.get('overdue') === 'true'
    const fromDate = searchParams.get('fromDate') 
      ? new Date(searchParams.get('fromDate')!) 
      : undefined
    const toDate = searchParams.get('toDate')
      ? new Date(searchParams.get('toDate')!)
      : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await InvoiceService.listInvoices(tenantId, {
      customerId,
      status,
      overdue,
      fromDate,
      toDate,
      page,
      limit
    })

    return NextResponse.json({
      invoices: result.invoices,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    })
  } catch (error) {
    console.error('[Billing API] List invoices error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing/invoices
 * Create a new invoice
 * 
 * Body:
 * - customerName: string (required)
 * - customerId?: string
 * - customerType?: BillCustomerType
 * - customerEmail?: string
 * - customerPhone?: string
 * - customerAddress?: string
 * - customerCity?: string
 * - customerState?: string
 * - customerTIN?: string
 * - currency?: string (default NGN)
 * - vatInclusive?: boolean
 * - vatExempt?: boolean
 * - vatExemptReason?: string
 * - paymentTerms?: string
 * - paymentTermDays?: number
 * - orderId?: string
 * - orderNumber?: string
 * - subscriptionId?: string
 * - notes?: string
 * - items: Array<{
 *     description: string
 *     quantity: number
 *     unitPrice: number
 *     taxRate?: number
 *     taxExempt?: boolean
 *     discountAmount?: number
 *     discountPercent?: number
 *     productId?: string
 *     productName?: string
 *     sku?: string
 *   }>
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Validate required fields
    if (!body.customerName) {
      return NextResponse.json(
        { error: 'customerName is required' },
        { status: 400 }
      )
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each item
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i]
      if (!item.description || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        return NextResponse.json(
          { error: `Item ${i + 1}: description, quantity, and unitPrice are required` },
          { status: 400 }
        )
      }
    }

    const invoice = await InvoiceService.createInvoice(
      tenantId,
      body,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      invoice
    }, { status: 201 })
  } catch (error) {
    console.error('[Billing API] Create invoice error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
