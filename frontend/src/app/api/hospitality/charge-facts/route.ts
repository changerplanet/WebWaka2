/**
 * HOSPITALITY SUITE: Charge Facts API
 * 
 * COMMERCE BOUNDARY: This route handles billing facts only.
 * Flow: Hospitality [Charge Facts] → Billing [Invoice] → Payments → Accounting
 * 
 * Hospitality NEVER:
 * - Creates invoices
 * - Calculates VAT
 * - Records payments
 * - Touches accounting
 * 
 * GET - List charge facts, pending facts, billing summaries
 * POST - Create charge fact, generate charges
 * PATCH - Mark as billed (by Commerce), waive, cancel
 * 
 * @module api/hospitality/charge-facts
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as ChargeFactService from '@/lib/hospitality/services/charge-fact-service'
import { HospitalityChargeFactType, HospitalityChargeFactStatus } from '@prisma/client'

// ============================================================================
// GET - List charge facts or get summaries
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_folio')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    // Get charge fact by ID
    if (id) {
      const fact = await ChargeFactService.getChargeFact(tenantId, id)
      if (!fact) {
        return NextResponse.json({ error: 'Charge fact not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, fact })
    }

    // Billing summaries
    if (action === 'guestSummary') {
      const guestId = searchParams.get('guestId')
      if (!guestId) {
        return NextResponse.json({ error: 'guestId is required' }, { status: 400 })
      }
      const summary = await ChargeFactService.getGuestBillingSummary(tenantId, guestId)
      return NextResponse.json({ success: true, summary })
    }

    if (action === 'staySummary') {
      const stayId = searchParams.get('stayId')
      if (!stayId) {
        return NextResponse.json({ error: 'stayId is required' }, { status: 400 })
      }
      const summary = await ChargeFactService.getStayBillingSummary(tenantId, stayId)
      return NextResponse.json({ success: true, ...summary })
    }

    // Get pending charge facts (for billing)
    if (action === 'pending') {
      const guestId = searchParams.get('guestId') || undefined
      const stayId = searchParams.get('stayId') || undefined
      const facts = await ChargeFactService.getPendingChargeFacts(tenantId, guestId, stayId)
      return NextResponse.json({ success: true, facts })
    }

    // List charge facts
    const guestId = searchParams.get('guestId') || undefined
    const stayId = searchParams.get('stayId') || undefined
    const orderId = searchParams.get('orderId') || undefined
    const factType = searchParams.get('factType') as HospitalityChargeFactType | null
    const status = searchParams.get('status') as HospitalityChargeFactStatus | null
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const pending = searchParams.get('pending') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await ChargeFactService.listChargeFacts(tenantId, {
      guestId,
      stayId,
      orderId,
      factType: factType || undefined,
      status: status || undefined,
      dateFrom,
      dateTo,
      pending,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('ChargeFacts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create charge fact or generate charges
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_folio')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Generate room night charges
    if (body.action === 'generateRoomCharges') {
      if (!body.stayId) {
        return NextResponse.json({ error: 'stayId is required' }, { status: 400 })
      }
      const charges = await ChargeFactService.generateRoomNightCharges(tenantId, body.stayId)
      return NextResponse.json({ success: true, charges, count: charges.length })
    }

    // Generate order charges
    if (body.action === 'generateOrderCharges') {
      if (!body.orderId) {
        return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
      }
      const charges = await ChargeFactService.generateOrderCharges(tenantId, body.orderId)
      return NextResponse.json({ success: true, charges, count: charges.length })
    }

    // Generate service event charge
    if (body.action === 'generateServiceEventCharge') {
      if (!body.eventId) {
        return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
      }
      const charge = await ChargeFactService.generateServiceEventCharge(tenantId, body.eventId)
      return NextResponse.json({ success: true, charge })
    }

    // Create manual charge fact
    if (!body.factType || !body.description || body.unitAmount === undefined) {
      return NextResponse.json({ error: 'factType, description, and unitAmount are required' }, { status: 400 })
    }

    const fact = await ChargeFactService.createChargeFact({
      tenantId,
      guestId: body.guestId,
      stayId: body.stayId,
      orderId: body.orderId,
      factType: body.factType as HospitalityChargeFactType,
      description: body.description,
      quantity: body.quantity,
      unitAmount: body.unitAmount,
      serviceDate: body.serviceDate ? new Date(body.serviceDate) : undefined,
      servicedById: body.servicedById,
      servicedByName: body.servicedByName,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
    })

    return NextResponse.json({ success: true, fact })
  } catch (error: unknown) {
    console.error('ChargeFacts POST error:', error)
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Mark as billed, waive, cancel
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'hospitality_folio')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    // Mark as billed (called by Commerce Billing)
    if (body.action === 'markBilled') {
      if (!body.billingInvoiceId) {
        return NextResponse.json({ error: 'billingInvoiceId is required' }, { status: 400 })
      }

      // Single fact
      if (body.factId) {
        const fact = await ChargeFactService.markAsBilled(tenantId, body.factId, body.billingInvoiceId)
        return NextResponse.json({ success: true, fact })
      }

      // Multiple facts
      if (body.factIds && Array.isArray(body.factIds)) {
        await ChargeFactService.markMultipleAsBilled(tenantId, body.factIds, body.billingInvoiceId)
        return NextResponse.json({ success: true, message: `${body.factIds.length} facts marked as billed` })
      }

      return NextResponse.json({ error: 'factId or factIds is required' }, { status: 400 })
    }

    // Waive charge
    if (body.action === 'waive') {
      if (!body.factId || !body.waivedBy || !body.reason) {
        return NextResponse.json({ error: 'factId, waivedBy, and reason are required' }, { status: 400 })
      }
      const fact = await ChargeFactService.waiveChargeFact(tenantId, body.factId, body.waivedBy, body.reason)
      return NextResponse.json({ success: true, fact })
    }

    // Cancel charge
    if (body.action === 'cancel') {
      if (!body.factId) {
        return NextResponse.json({ error: 'factId is required' }, { status: 400 })
      }
      const fact = await ChargeFactService.cancelChargeFact(tenantId, body.factId)
      return NextResponse.json({ success: true, fact })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('ChargeFacts PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
