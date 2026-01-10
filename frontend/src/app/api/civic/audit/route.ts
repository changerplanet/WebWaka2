/**
 * CIVIC SUITE: Audit API
 * 
 * GET - Query audit logs, get entity trail, get actor activity, transparency stats
 * POST - Log audit event, update public status
 * 
 * Note: All audit logs are APPEND-ONLY for regulatory compliance.
 * No edits or deletions allowed.
 * 
 * @module api/civic/audit
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as AuditService from '@/lib/civic/services/audit-service'

// ============================================================================
// GET - Query audit logs or get stats
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_audit')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const actorId = searchParams.get('actorId')
    const trackingCode = searchParams.get('trackingCode')

    // Get public status by tracking code
    if (action === 'publicStatus' && trackingCode) {
      const status = await AuditService.getPublicStatus(trackingCode)
      if (!status) {
        return NextResponse.json({ error: 'Status not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, status })
    }

    // Get transparency stats
    if (action === 'transparencyStats') {
      const stats = await AuditService.getTransparencyStats(tenantId)
      return NextResponse.json({ success: true, stats })
    }

    // Get service performance metrics
    if (action === 'servicePerformance') {
      const metrics = await AuditService.getServicePerformanceMetrics(tenantId)
      return NextResponse.json({ success: true, metrics })
    }

    // Get entity audit trail
    if (action === 'entityTrail' && entityType && entityId) {
      const trail = await AuditService.getEntityAuditTrail(tenantId, entityType, entityId)
      return NextResponse.json({ success: true, trail })
    }

    // Get actor activity
    if (action === 'actorActivity' && actorId) {
      const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
      const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
      const activity = await AuditService.getActorActivity(tenantId, actorId, dateFrom, dateTo)
      return NextResponse.json({ success: true, activity })
    }

    // Export for FOI
    if (action === 'exportFOI') {
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')
      const redactPII = searchParams.get('redactPII') !== 'false'

      if (!dateFrom || !dateTo) {
        return NextResponse.json({ error: 'dateFrom and dateTo are required' }, { status: 400 })
      }

      const logs = await AuditService.exportForFOI(tenantId, {
        entityType: entityType || undefined,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        redactPII,
      })
      return NextResponse.json({ success: true, logs, count: logs.length })
    }

    // Query audit logs
    const auditAction = searchParams.get('auditAction') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const result = await AuditService.queryAuditLogs(tenantId, {
      action: auditAction,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      actorId: actorId || undefined,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Audit GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Log audit event or update public status
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_audit')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle update public status action
    if (body.action === 'updatePublicStatus') {
      if (!body.trackingCode || !body.requestId || !body.serviceName || !body.currentStatus) {
        return NextResponse.json({ error: 'trackingCode, requestId, serviceName, and currentStatus are required' }, { status: 400 })
      }

      const status = await AuditService.upsertPublicStatus(
        tenantId,
        body.trackingCode,
        body.requestId,
        {
          serviceName: body.serviceName,
          submittedDate: new Date(body.submittedDate),
          currentStatus: body.currentStatus,
          lastUpdateDate: new Date(),
          progressStage: body.progressStage || 1,
          progressNote: body.progressNote,
          estimatedCompletionDate: body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : undefined,
        }
      )

      return NextResponse.json({ success: true, status, message: 'Public status updated' })
    }

    // Handle log request action
    if (body.action === 'logRequest') {
      if (!body.requestId || !body.auditAction || !body.actorName) {
        return NextResponse.json({ error: 'requestId, auditAction, and actorName are required' }, { status: 400 })
      }

      const log = await AuditService.logRequestAction(
        tenantId,
        body.requestId,
        body.auditAction,
        session.user.id,
        body.actorName,
        body.description,
        body.changes
      )

      return NextResponse.json({ success: true, log })
    }

    // Handle log case action
    if (body.action === 'logCase') {
      if (!body.caseId || !body.auditAction || !body.actorName) {
        return NextResponse.json({ error: 'caseId, auditAction, and actorName are required' }, { status: 400 })
      }

      const log = await AuditService.logCaseAction(
        tenantId,
        body.caseId,
        body.auditAction,
        session.user.id,
        body.actorName,
        body.description,
        body.changes
      )

      return NextResponse.json({ success: true, log })
    }

    // Handle log inspection action
    if (body.action === 'logInspection') {
      if (!body.inspectionId || !body.auditAction || !body.actorName) {
        return NextResponse.json({ error: 'inspectionId, auditAction, and actorName are required' }, { status: 400 })
      }

      const log = await AuditService.logInspectionAction(
        tenantId,
        body.inspectionId,
        body.auditAction,
        session.user.id,
        body.actorName,
        body.description
      )

      return NextResponse.json({ success: true, log })
    }

    // Handle log approval action
    if (body.action === 'logApproval') {
      if (!body.approvalId || !body.auditAction || !body.actorName) {
        return NextResponse.json({ error: 'approvalId, auditAction, and actorName are required' }, { status: 400 })
      }

      const log = await AuditService.logApprovalAction(
        tenantId,
        body.approvalId,
        body.auditAction,
        session.user.id,
        body.actorName,
        body.description
      )

      return NextResponse.json({ success: true, log })
    }

    // Log generic audit event (APPEND-ONLY)
    if (!body.auditAction || !body.entityType || !body.entityId || !body.actorName) {
      return NextResponse.json({ error: 'auditAction, entityType, entityId, and actorName are required' }, { status: 400 })
    }

    const log = await AuditService.logAuditEvent({
      tenantId,
      action: body.auditAction,
      entityType: body.entityType,
      entityId: body.entityId,
      actorId: session.user.id,
      actorName: body.actorName,
      actorRole: body.actorRole,
      actorIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      description: body.description,
      changes: body.changes,
      metadata: body.metadata,
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Audit POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// NOTE: No PATCH or DELETE methods - audit logs are APPEND-ONLY for regulatory compliance
