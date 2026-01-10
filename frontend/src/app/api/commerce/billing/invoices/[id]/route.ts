/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Single Invoice API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/invoices/[id] - Get invoice by ID
 * PATCH /api/commerce/billing/invoices/[id] - Update invoice (limited actions)
 * POST /api/commerce/billing/invoices/[id] - Invoice actions (send, view, cancel)
 * 
 * @module api/commerce/billing/invoices/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { InvoiceService } from '@/lib/billing'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/commerce/billing/invoices/[id]
 * Get invoice by ID with items
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const { id } = await params
    const tenantId = session.activeTenantId

    const invoice = await InvoiceService.getInvoice(tenantId, id)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('[Billing API] Get invoice error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing/invoices/[id]
 * Perform actions on invoice
 * 
 * Body:
 * - action: 'send' | 'view' | 'cancel'
 * - reason?: string (required for cancel)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'billing')
    if (guardResult) return guardResult

    const { id } = await params
    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'action is required (send, view, cancel)' },
        { status: 400 }
      )
    }

    let invoice
    switch (body.action) {
      case 'send':
        invoice = await InvoiceService.sendInvoice(tenantId, id)
        return NextResponse.json({
          success: true,
          message: 'Invoice sent',
          invoice
        })

      case 'view':
        invoice = await InvoiceService.markViewed(tenantId, id)
        return NextResponse.json({
          success: true,
          message: 'Invoice marked as viewed',
          invoice
        })

      case 'cancel':
        if (!body.reason) {
          return NextResponse.json(
            { error: 'reason is required for cancel action' },
            { status: 400 }
          )
        }
        invoice = await InvoiceService.cancelInvoice(
          tenantId,
          id,
          body.reason,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          message: 'Invoice cancelled',
          invoice
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}. Valid actions: send, view, cancel` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Billing API] Invoice action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
