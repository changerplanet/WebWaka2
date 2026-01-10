/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Single Credit Note API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/credit-notes/[id] - Get credit note by ID
 * POST /api/commerce/billing/credit-notes/[id] - Credit note actions (approve, apply, cancel)
 * 
 * @module api/commerce/billing/credit-notes/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { CreditNoteService } from '@/lib/billing'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/commerce/billing/credit-notes/[id]
 * Get credit note by ID
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

    const creditNote = await CreditNoteService.getCreditNote(tenantId, id)

    if (!creditNote) {
      return NextResponse.json(
        { error: 'Credit note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ creditNote })
  } catch (error) {
    console.error('[Billing API] Get credit note error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing/credit-notes/[id]
 * Perform actions on credit note
 * 
 * Body:
 * - action: 'approve' | 'apply' | 'cancel'
 * - targetInvoiceId?: string (required for apply)
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
        { error: 'action is required (approve, apply, cancel)' },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'approve':
        const approved = await CreditNoteService.approveCreditNote(
          tenantId,
          id,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          message: 'Credit note approved',
          creditNote: approved
        })

      case 'apply':
        if (!body.targetInvoiceId) {
          return NextResponse.json(
            { error: 'targetInvoiceId is required for apply action' },
            { status: 400 }
          )
        }
        const applyResult = await CreditNoteService.applyCreditNote(
          tenantId,
          id,
          body.targetInvoiceId,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          message: 'Credit note applied to invoice',
          creditNote: applyResult.creditNote,
          invoice: applyResult.invoice
        })

      case 'cancel':
        const cancelled = await CreditNoteService.cancelCreditNote(
          tenantId,
          id,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          message: 'Credit note cancelled',
          creditNote: cancelled
        })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}. Valid actions: approve, apply, cancel` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Billing API] Credit note action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
