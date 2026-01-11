export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Requests API
 * 
 * GET - List requests, get request by ID/number/trackingCode
 * POST - Create request, submit request
 * PATCH - Update request status, mark paid
 * 
 * @module api/civic/requests
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as RequestService from '@/lib/civic/services/request-service'
import { CivicRequestStatus } from '@prisma/client'

// ============================================================================
// GET - List requests or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_requests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const requestNumber = searchParams.get('requestNumber')
    const trackingCode = searchParams.get('trackingCode')
    const action = searchParams.get('action')

    // Get pending requests
    if (action === 'pending') {
      const requests = await RequestService.getPendingRequests(tenantId)
      return NextResponse.json({ success: true, requests })
    }

    // Get requests awaiting payment
    if (action === 'awaitingPayment') {
      const requests = await RequestService.getRequestsAwaitingPayment(tenantId)
      return NextResponse.json({ success: true, requests })
    }

    // Get expiring requests
    if (action === 'expiring') {
      const daysAhead = parseInt(searchParams.get('daysAhead') || '30')
      const requests = await RequestService.getExpiringRequests(tenantId, daysAhead)
      return NextResponse.json({ success: true, requests })
    }

    // Get request by ID
    if (id) {
      const civicRequest = await RequestService.getRequest(tenantId, id)
      if (!civicRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, request: civicRequest })
    }

    // Get request by number
    if (requestNumber) {
      const civicRequest = await RequestService.getRequestByNumber(tenantId, requestNumber)
      if (!civicRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, request: civicRequest })
    }

    // Get request by tracking code (public status)
    if (trackingCode) {
      const status = await RequestService.getRequestByTrackingCode(trackingCode)
      if (!status) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, status })
    }

    // List requests with filters
    const citizenId = searchParams.get('citizenId') || undefined
    const organizationId = searchParams.get('organizationId') || undefined
    const serviceId = searchParams.get('serviceId') || undefined
    const status = searchParams.get('status') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await RequestService.listRequests(tenantId, {
      citizenId,
      organizationId,
      serviceId,
      status: status as CivicRequestStatus | undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Requests GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create request
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_requests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle submit action
    if (body.action === 'submit') {
      if (!body.id) {
        return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
      }
      const civicRequest = await RequestService.submitRequest(tenantId, body.id)
      return NextResponse.json({ success: true, request: civicRequest, message: 'Request submitted' })
    }

    // Create request
    if (!body.applicantName || !body.serviceId || !body.serviceName) {
      return NextResponse.json({ error: 'applicantName, serviceId, and serviceName are required' }, { status: 400 })
    }

    const civicRequest = await RequestService.createRequest({
      tenantId,
      citizenId: body.citizenId,
      organizationId: body.organizationId,
      applicantName: body.applicantName,
      applicantPhone: body.applicantPhone,
      applicantEmail: body.applicantEmail,
      serviceId: body.serviceId,
      serviceName: body.serviceName,
      subject: body.subject,
      description: body.description,
      location: body.location,
      submittedDocuments: body.submittedDocuments,
    })

    return NextResponse.json({ success: true, request: civicRequest })
  } catch (error) {
    console.error('Requests POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update request status
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_requests')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Handle acknowledge action
    if (body.action === 'acknowledge') {
      const civicRequest = await RequestService.acknowledgeRequest(tenantId, body.id)
      return NextResponse.json({ success: true, request: civicRequest, message: 'Request acknowledged' })
    }

    // Handle mark paid action
    if (body.action === 'markPaid') {
      if (!body.paymentRef || body.totalAmount === undefined) {
        return NextResponse.json({ error: 'paymentRef and totalAmount are required' }, { status: 400 })
      }
      const civicRequest = await RequestService.markRequestPaid(
        tenantId,
        body.id,
        body.paymentRef,
        body.totalAmount
      )
      return NextResponse.json({ success: true, request: civicRequest, message: 'Request marked as paid' })
    }

    // Handle set validity action
    if (body.action === 'setValidity') {
      if (!body.validUntil) {
        return NextResponse.json({ error: 'validUntil is required' }, { status: 400 })
      }
      const civicRequest = await RequestService.setRequestValidity(
        tenantId,
        body.id,
        new Date(body.validUntil),
        body.certificateId
      )
      return NextResponse.json({ success: true, request: civicRequest, message: 'Request validity set' })
    }

    // Update status
    if (!body.status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const civicRequest = await RequestService.updateRequestStatus(
      tenantId,
      body.id,
      body.status,
      body.outcomeNote
    )

    return NextResponse.json({ success: true, request: civicRequest })
  } catch (error) {
    console.error('Requests PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
