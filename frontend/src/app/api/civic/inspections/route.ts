/**
 * CIVIC SUITE: Inspections API
 * 
 * GET - List inspections, get inspection by ID/number, get findings
 * POST - Schedule inspection, add finding, start inspection
 * PATCH - Complete inspection, reschedule, cancel
 * 
 * Note: All findings are APPEND-ONLY for audit compliance.
 * 
 * @module api/civic/inspections
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as InspectionService from '@/lib/civic/services/inspection-service'

// ============================================================================
// GET - List inspections or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_inspections')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const inspectionNumber = searchParams.get('inspectionNumber')
    const action = searchParams.get('action')

    // Get today's inspections
    if (action === 'today') {
      const inspectorId = searchParams.get('inspectorId') || undefined
      const inspections = await InspectionService.getTodayInspections(tenantId, inspectorId)
      return NextResponse.json({ success: true, inspections })
    }

    // Get inspection by ID
    if (id) {
      // Get findings
      if (action === 'findings') {
        const findings = await InspectionService.getInspectionFindings(tenantId, id)
        return NextResponse.json({ success: true, findings })
      }

      const inspection = await InspectionService.getInspection(tenantId, id)
      if (!inspection) {
        return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, inspection })
    }

    // Get inspection by number
    if (inspectionNumber) {
      const inspection = await InspectionService.getInspectionByNumber(tenantId, inspectionNumber)
      if (!inspection) {
        return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, inspection })
    }

    // List inspections with filters
    const inspectorId = searchParams.get('inspectorId') || undefined
    const status = searchParams.get('status') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await InspectionService.listInspections(tenantId, {
      inspectorId,
      status: status as 'SCHEDULED' | 'RESCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Inspections GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Schedule inspection, add finding, or start
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_inspections')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle start action
    if (body.action === 'start') {
      if (!body.id) {
        return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 })
      }
      const inspection = await InspectionService.startInspection(tenantId, body.id)
      return NextResponse.json({ success: true, inspection, message: 'Inspection started' })
    }

    // Handle add finding action (APPEND-ONLY)
    if (body.action === 'addFinding') {
      if (!body.inspectionId || !body.category || !body.description) {
        return NextResponse.json({ error: 'inspectionId, category, and description are required' }, { status: 400 })
      }
      const finding = await InspectionService.addInspectionFinding({
        tenantId,
        inspectionId: body.inspectionId,
        category: body.category,
        description: body.description,
        severity: body.severity,
        photoUrls: body.photoUrls,
        notes: body.notes,
        recordedById: session.user.id,
        recordedByName: session.user.email || 'Unknown',
      })
      return NextResponse.json({ success: true, finding, message: 'Finding added' })
    }

    // Schedule inspection
    if (!body.caseId || !body.scheduledDate) {
      return NextResponse.json({ error: 'caseId and scheduledDate are required' }, { status: 400 })
    }

    const inspection = await InspectionService.scheduleInspection({
      tenantId,
      caseId: body.caseId,
      scheduledDate: new Date(body.scheduledDate),
      scheduledTime: body.scheduledTime,
      location: body.location,
      inspectorId: body.inspectorId,
      inspectorName: body.inspectorName,
    })

    return NextResponse.json({ success: true, inspection })
  } catch (error) {
    console.error('Inspections POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Complete, reschedule, or cancel inspection
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_inspections')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 })
    }

    // Handle complete action
    if (body.action === 'complete') {
      if (!body.result) {
        return NextResponse.json({ error: 'result is required' }, { status: 400 })
      }
      const inspection = await InspectionService.completeInspection(
        tenantId,
        body.id,
        body.result,
        body.resultNote
      )
      return NextResponse.json({ success: true, inspection, message: 'Inspection completed' })
    }

    // Handle reschedule action
    if (body.action === 'reschedule') {
      if (!body.newScheduledDate) {
        return NextResponse.json({ error: 'newScheduledDate is required' }, { status: 400 })
      }
      const inspection = await InspectionService.rescheduleInspection(
        tenantId,
        body.id,
        new Date(body.newScheduledDate),
        body.newScheduledTime,
        body.rescheduleNote
      )
      return NextResponse.json({ success: true, inspection, message: 'Inspection rescheduled' })
    }

    // Handle cancel action
    if (body.action === 'cancel') {
      const inspection = await InspectionService.cancelInspection(tenantId, body.id)
      return NextResponse.json({ success: true, inspection, message: 'Inspection cancelled' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Inspections PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
