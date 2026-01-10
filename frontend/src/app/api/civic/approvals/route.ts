/**
 * CIVIC SUITE: Approvals API
 * 
 * GET - List approvals, get approval by ID, get case approvals
 * POST - Record approval decision (APPEND-ONLY)
 * 
 * Note: All approvals are APPEND-ONLY for audit compliance.
 * No edits or deletions allowed.
 * 
 * @module api/civic/approvals
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as InspectionService from '@/lib/civic/services/inspection-service'
import { CivicApprovalDecision } from '@prisma/client'

// ============================================================================
// GET - List approvals or get by ID
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
    const caseId = searchParams.get('caseId')

    // Get approval by ID
    if (id) {
      const approval = await InspectionService.getApproval(tenantId, id)
      if (!approval) {
        return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, approval })
    }

    // Get approvals for a case
    if (caseId) {
      const approvals = await InspectionService.getCaseApprovals(tenantId, caseId)
      return NextResponse.json({ success: true, approvals })
    }

    // List approvals with filters
    const decision = searchParams.get('decision') || undefined
    const approverId = searchParams.get('approverId') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await InspectionService.listApprovals(tenantId, {
      decision: decision as CivicApprovalDecision | undefined,
      approverId,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Approvals GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Record approval decision (APPEND-ONLY)
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

    if (!body.caseId || !body.decision || !body.approverName) {
      return NextResponse.json({ error: 'caseId, decision, and approverName are required' }, { status: 400 })
    }

    const approval = await InspectionService.recordApproval({
      tenantId,
      caseId: body.caseId,
      decision: body.decision,
      approverId: session.user.id,
      approverName: body.approverName,
      approverRole: body.approverRole,
      rationale: body.rationale,
      conditions: body.conditions,
      referenceNote: body.referenceNote,
    })

    return NextResponse.json({ success: true, approval, message: 'Approval recorded' })
  } catch (error) {
    console.error('Approvals POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// NOTE: No PATCH or DELETE methods - approvals are APPEND-ONLY for audit compliance
