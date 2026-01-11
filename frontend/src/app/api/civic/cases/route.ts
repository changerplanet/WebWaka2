export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Cases API
 * 
 * GET - List cases, get case by ID/number, get audit trail
 * POST - Create case, assign case, add note
 * PATCH - Update case status, escalate
 * 
 * Note: All status changes and notes are APPEND-ONLY for audit compliance.
 * 
 * @module api/civic/cases
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as CaseService from '@/lib/civic/services/case-service'
import { CivicCaseStatus, CivicCasePriority } from '@prisma/client'

// ============================================================================
// GET - List cases or get by ID
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
    const caseNumber = searchParams.get('caseNumber')
    const action = searchParams.get('action')

    // Get my assigned cases
    if (action === 'myAssigned') {
      const staffId = searchParams.get('staffId')
      if (!staffId) {
        return NextResponse.json({ error: 'staffId is required' }, { status: 400 })
      }
      const cases = await CaseService.getMyAssignedCases(tenantId, staffId)
      return NextResponse.json({ success: true, cases })
    }

    // Get cases at risk (SLA)
    if (action === 'atRisk') {
      const hoursAhead = parseInt(searchParams.get('hoursAhead') || '24')
      const cases = await CaseService.getCasesAtRisk(tenantId, hoursAhead)
      return NextResponse.json({ success: true, cases })
    }

    // Check SLA breaches
    if (action === 'checkSlaBreaches') {
      const result = await CaseService.checkSlaBreaches(tenantId)
      return NextResponse.json({ success: true, breached: result.count })
    }

    // Get case by ID
    if (id) {
      // Get audit trail
      if (action === 'auditTrail') {
        const trail = await CaseService.getCaseAuditTrail(tenantId, id)
        return NextResponse.json({ success: true, trail })
      }

      // Get case notes
      if (action === 'notes') {
        const includeInternal = searchParams.get('includeInternal') !== 'false'
        const notes = await CaseService.getCaseNotes(tenantId, id, includeInternal)
        return NextResponse.json({ success: true, notes })
      }

      const civicCase = await CaseService.getCase(tenantId, id)
      if (!civicCase) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, case: civicCase })
    }

    // Get case by number
    if (caseNumber) {
      const civicCase = await CaseService.getCaseByNumber(tenantId, caseNumber)
      if (!civicCase) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, case: civicCase })
    }

    // List cases with filters
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const assigneeId = searchParams.get('assigneeId') || undefined
    const isEscalated = searchParams.get('isEscalated') === 'true' ? true : searchParams.get('isEscalated') === 'false' ? false : undefined
    const slaBreached = searchParams.get('slaBreached') === 'true' ? true : searchParams.get('slaBreached') === 'false' ? false : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await CaseService.listCases(tenantId, {
      status: status as CivicCaseStatus | undefined,
      priority: priority as CivicCasePriority | undefined,
      assigneeId,
      isEscalated,
      slaBreached,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Cases GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create case, assign, or add note
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

    // Handle assign action
    if (body.action === 'assign') {
      if (!body.caseId || !body.staffId) {
        return NextResponse.json({ error: 'caseId and staffId are required' }, { status: 400 })
      }
      const assignment = await CaseService.assignCase(
        tenantId,
        body.caseId,
        body.staffId,
        session.user.id,
        body.assignerNote
      )
      return NextResponse.json({ success: true, assignment, message: 'Case assigned' })
    }

    // Handle add note action (APPEND-ONLY)
    if (body.action === 'addNote') {
      if (!body.caseId || !body.content) {
        return NextResponse.json({ error: 'caseId and content are required' }, { status: 400 })
      }
      const note = await CaseService.addCaseNote(
        tenantId,
        body.caseId,
        body.content,
        session.user.id,
        session.user.email || 'Unknown',
        body.noteType || 'INTERNAL',
        body.isInternal !== false // Default to internal
      )
      return NextResponse.json({ success: true, note, message: 'Note added' })
    }

    // Create case
    if (!body.requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
    }

    const civicCase = await CaseService.createCase({
      tenantId,
      requestId: body.requestId,
      priority: body.priority,
      slaDeadline: body.slaDeadline ? new Date(body.slaDeadline) : undefined,
    })

    return NextResponse.json({ success: true, case: civicCase })
  } catch (error) {
    console.error('Cases POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update case status or escalate
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
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Handle escalate action
    if (body.action === 'escalate') {
      if (!body.escalationNote) {
        return NextResponse.json({ error: 'escalationNote is required' }, { status: 400 })
      }
      const civicCase = await CaseService.escalateCase(
        tenantId,
        body.id,
        session.user.id,
        body.escalationNote
      )
      return NextResponse.json({ success: true, case: civicCase, message: 'Case escalated' })
    }

    // Update status (creates audit trail via APPEND-ONLY status change)
    if (!body.status || !body.reason) {
      return NextResponse.json({ error: 'status and reason are required' }, { status: 400 })
    }

    const civicCase = await CaseService.updateCaseStatus(
      tenantId,
      body.id,
      body.status,
      body.reason,
      session.user.id,
      session.user.email || 'Unknown'
    )

    return NextResponse.json({ success: true, case: civicCase })
  } catch (error) {
    console.error('Cases PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
