/**
 * BILLING & SUBSCRIPTIONS SUITE
 * Credit Notes API Route
 * 
 * S4 - API Exposure & Guarding
 * 
 * GET /api/commerce/billing/credit-notes - List credit notes with filters
 * POST /api/commerce/billing/credit-notes - Create new credit note
 * 
 * @module api/commerce/billing/credit-notes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { CreditNoteService } from '@/lib/billing'
import { BillCreditStatus, BillCreditReason } from '@prisma/client'

/**
 * GET /api/commerce/billing/credit-notes
 * List credit notes with optional filters
 * 
 * Query params:
 * - customerId: Filter by customer
 * - invoiceId: Filter by original invoice
 * - status: Comma-separated status list (DRAFT,APPROVED,APPLIED,etc.)
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
    const invoiceId = searchParams.get('invoiceId') || undefined
    const statusParam = searchParams.get('status')
    const status = statusParam 
      ? statusParam.split(',') as BillCreditStatus[]
      : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await CreditNoteService.listCreditNotes(tenantId, {
      customerId,
      invoiceId,
      status,
      page,
      limit
    })

    return NextResponse.json({
      creditNotes: result.creditNotes,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    })
  } catch (error) {
    console.error('[Billing API] List credit notes error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/billing/credit-notes
 * Create a new credit note
 * 
 * Body:
 * - customerName: string (required)
 * - amount: number (required)
 * - reason: BillCreditReason (required) - RETURN, PRICING_ERROR, SERVICE_ISSUE, DUPLICATE_CHARGE, GOODWILL, OTHER
 * - invoiceId?: string
 * - invoiceNumber?: string
 * - customerId?: string
 * - currency?: string (default NGN)
 * - description?: string
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

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!body.reason) {
      return NextResponse.json(
        { error: 'reason is required (RETURN, PRICING_ERROR, SERVICE_ISSUE, DUPLICATE_CHARGE, GOODWILL, OTHER)' },
        { status: 400 }
      )
    }

    // Validate reason enum
    const validReasons: BillCreditReason[] = ['RETURN', 'PRICING_ERROR', 'SERVICE_ISSUE', 'DUPLICATE_CHARGE', 'GOODWILL', 'OTHER']
    if (!validReasons.includes(body.reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Valid options: ${validReasons.join(', ')}` },
        { status: 400 }
      )
    }

    const creditNote = await CreditNoteService.createCreditNote(
      tenantId,
      {
        customerName: body.customerName,
        amount: body.amount,
        reason: body.reason,
        invoiceId: body.invoiceId,
        invoiceNumber: body.invoiceNumber,
        customerId: body.customerId,
        currency: body.currency,
        description: body.description
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      creditNote
    }, { status: 201 })
  } catch (error) {
    console.error('[Billing API] Create credit note error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
