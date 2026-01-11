export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Billing Facts API
 * 
 * GET - List billing facts, get billing fact by ID, get summaries
 * POST - Create billing fact, generate request fees
 * PATCH - Mark as billed, waive, cancel (controlled actions only)
 * 
 * COMMERCE BOUNDARY:
 * This API ONLY emits billing facts. Commerce is responsible for:
 * - Creating invoices
 * - Calculating VAT
 * - Recording payments
 * - Posting to accounting
 * 
 * @module api/civic/billing-facts
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as BillingFactService from '@/lib/civic/services/billing-fact-service'
import { CivicBillingFactType, CivicBillingFactStatus } from '@prisma/client'

// ============================================================================
// GET - List billing facts or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const citizenId = searchParams.get('citizenId')
    const requestId = searchParams.get('requestId')
    const action = searchParams.get('action')

    // Get pending facts (for Commerce to bill)
    if (action === 'pending') {
      const facts = await BillingFactService.getPendingBillingFacts(
        tenantId,
        citizenId || undefined,
        requestId || undefined
      )
      return NextResponse.json({ success: true, facts })
    }

    // Get citizen billing summary
    if (action === 'citizenSummary' && citizenId) {
      const summary = await BillingFactService.getCitizenBillingSummary(tenantId, citizenId)
      return NextResponse.json({ success: true, summary })
    }

    // Get request billing summary
    if (action === 'requestSummary' && requestId) {
      const summary = await BillingFactService.getRequestBillingSummary(tenantId, requestId)
      return NextResponse.json({ success: true, summary })
    }

    // Get billing fact by ID
    if (id) {
      const fact = await BillingFactService.getBillingFact(tenantId, id)
      if (!fact) {
        return NextResponse.json({ error: 'Billing fact not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, fact })
    }

    // List billing facts with filters
    const factType = searchParams.get('factType') || undefined
    const status = searchParams.get('status') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const pending = searchParams.get('pending') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await BillingFactService.listBillingFacts(tenantId, {
      requestId: requestId || undefined,
      citizenId: citizenId || undefined,
      factType: factType as CivicBillingFactType | undefined,
      status: status as CivicBillingFactStatus | undefined,
      dateFrom,
      dateTo,
      pending,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Billing Facts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create billing fact or generate fees
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle generate request fees action
    if (body.action === 'generateRequestFees') {
      if (!body.requestId || !body.service) {
        return NextResponse.json({ error: 'requestId and service are required' }, { status: 400 })
      }
      const facts = await BillingFactService.generateRequestFees(
        tenantId,
        body.requestId,
        body.citizenId,
        body.service
      )
      return NextResponse.json({ success: true, facts, message: 'Fees generated' })
    }

    // Handle create service fee fact
    if (body.action === 'serviceFee') {
      if (!body.requestId || !body.description || body.amount === undefined) {
        return NextResponse.json({ error: 'requestId, description, and amount are required' }, { status: 400 })
      }
      const fact = await BillingFactService.createServiceFeeFact(
        tenantId,
        body.requestId,
        body.citizenId,
        body.description,
        body.amount,
        body.servicedByName
      )
      return NextResponse.json({ success: true, fact })
    }

    // Handle create inspection fee fact
    if (body.action === 'inspectionFee') {
      if (!body.requestId || !body.inspectionId || body.amount === undefined) {
        return NextResponse.json({ error: 'requestId, inspectionId, and amount are required' }, { status: 400 })
      }
      const fact = await BillingFactService.createInspectionFeeFact(
        tenantId,
        body.requestId,
        body.citizenId,
        body.inspectionId,
        body.amount,
        body.servicedByName
      )
      return NextResponse.json({ success: true, fact })
    }

    // Handle create penalty fact
    if (body.action === 'penalty') {
      if (!body.citizenId || !body.description || body.amount === undefined) {
        return NextResponse.json({ error: 'citizenId, description, and amount are required' }, { status: 400 })
      }
      const fact = await BillingFactService.createPenaltyFact(
        tenantId,
        body.citizenId,
        body.description,
        body.amount,
        body.dueDate ? new Date(body.dueDate) : undefined,
        body.referenceType,
        body.referenceId
      )
      return NextResponse.json({ success: true, fact })
    }

    // Handle create late fee fact
    if (body.action === 'lateFee') {
      if (!body.requestId || body.amount === undefined || !body.originalDueDate) {
        return NextResponse.json({ error: 'requestId, amount, and originalDueDate are required' }, { status: 400 })
      }
      const fact = await BillingFactService.createLateFeeFact(
        tenantId,
        body.requestId,
        body.citizenId,
        body.amount,
        new Date(body.originalDueDate)
      )
      return NextResponse.json({ success: true, fact })
    }

    // Create generic billing fact
    if (!body.factType || !body.description || body.unitAmount === undefined) {
      return NextResponse.json({ error: 'factType, description, and unitAmount are required' }, { status: 400 })
    }

    const fact = await BillingFactService.createBillingFact({
      tenantId,
      requestId: body.requestId,
      citizenId: body.citizenId,
      factType: body.factType,
      description: body.description,
      quantity: body.quantity,
      unitAmount: body.unitAmount,
      serviceDate: body.serviceDate ? new Date(body.serviceDate) : undefined,
      servicedById: body.servicedById,
      servicedByName: body.servicedByName,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
    })

    return NextResponse.json({ success: true, fact })
  } catch (error) {
    console.error('Billing Facts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Mark as billed, waive, or cancel
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_billing')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle mark as billed (called by Commerce)
    if (body.action === 'markBilled') {
      if (!body.billingInvoiceId) {
        return NextResponse.json({ error: 'billingInvoiceId is required' }, { status: 400 })
      }

      if (body.factIds && Array.isArray(body.factIds)) {
        // Bulk mark as billed
        const result = await BillingFactService.markMultipleAsBilled(
          tenantId,
          body.factIds,
          body.billingInvoiceId
        )
        return NextResponse.json({ success: true, count: result.count, message: 'Facts marked as billed' })
      }

      if (!body.id) {
        return NextResponse.json({ error: 'id or factIds is required' }, { status: 400 })
      }

      const fact = await BillingFactService.markAsBilled(
        tenantId,
        body.id,
        body.billingInvoiceId
      )
      return NextResponse.json({ success: true, fact, message: 'Fact marked as billed' })
    }

    // Handle waive
    if (body.action === 'waive') {
      if (!body.id || !body.waiverReason) {
        return NextResponse.json({ error: 'id and waiverReason are required' }, { status: 400 })
      }

      const fact = await BillingFactService.waiveBillingFact(
        tenantId,
        body.id,
        session.user.id,
        body.waiverReason
      )
      return NextResponse.json({ success: true, fact, message: 'Fact waived' })
    }

    // Handle cancel
    if (body.action === 'cancel') {
      if (!body.id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 })
      }

      const fact = await BillingFactService.cancelBillingFact(tenantId, body.id)
      return NextResponse.json({ success: true, fact, message: 'Fact cancelled' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Billing Facts PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
