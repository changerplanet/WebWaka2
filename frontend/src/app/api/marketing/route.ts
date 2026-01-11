export const dynamic = 'force-dynamic'

/**
 * MODULE 8: MARKETING AUTOMATION
 * Main API Route
 * 
 * CRITICAL: This module defines automation logic only.
 * All message delivery is handled by SaaS Core Communication Engine.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { MktConfigService } from '@/lib/marketing/config-service'
import { WorkflowService } from '@/lib/marketing/workflow-service'
import { ExecutionService } from '@/lib/marketing/execution-service'
import { MktEntitlementsService, MktValidationService } from '@/lib/marketing/entitlements-service'

/**
 * GET /api/marketing
 * Get marketing automation status, workflows, or specific data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Status
    if (action === 'status' || !action) {
      const status = await MktConfigService.getStatus(tenantId)
      return NextResponse.json(status)
    }

    // List workflows
    if (action === 'workflows') {
      const status = searchParams.get('status')?.split(',') as ('DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED')[] | undefined
      const includeTemplates = searchParams.get('includeTemplates') === 'true'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      
      const result = await WorkflowService.listWorkflows(tenantId, { status, includeTemplates, page, limit })
      return NextResponse.json(result)
    }

    // Get single workflow
    if (action === 'workflow') {
      const id = searchParams.get('id')
      if (!id) {
        return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
      }
      const workflow = await WorkflowService.getWorkflow(tenantId, id)
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
      return NextResponse.json({ workflow })
    }

    // Get templates
    if (action === 'templates') {
      const templates = await WorkflowService.getTemplates(tenantId)
      return NextResponse.json({ templates })
    }

    // Run history
    if (action === 'run-history') {
      const workflowId = searchParams.get('workflowId')
      if (!workflowId) {
        return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
      }
      const limit = parseInt(searchParams.get('limit') || '50')
      const history = await ExecutionService.getRunHistory(tenantId, workflowId, limit)
      return NextResponse.json({ history })
    }

    // Run statistics
    if (action === 'run-statistics') {
      const days = parseInt(searchParams.get('days') || '30')
      const stats = await ExecutionService.getRunStatistics(tenantId, days)
      return NextResponse.json({ statistics: stats })
    }

    // Workflow statistics
    if (action === 'workflow-statistics') {
      const stats = await WorkflowService.getStatistics(tenantId)
      return NextResponse.json({ statistics: stats })
    }

    // Entitlements
    if (action === 'entitlements') {
      const entitlements = await MktEntitlementsService.getEntitlements(tenantId)
      return NextResponse.json(entitlements)
    }

    // Validation
    if (action === 'validate') {
      const result = await MktValidationService.validateModule(tenantId)
      return NextResponse.json(result)
    }

    // Manifest
    if (action === 'manifest') {
      const manifest = MktValidationService.getManifest()
      return NextResponse.json(manifest)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Marketing GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/marketing
 * Initialize, create workflows, process events, execute actions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Initialize
    if (body.action === 'initialize') {
      const config = await MktConfigService.initialize(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Create workflow
    if (body.action === 'create-workflow') {
      // Check entitlement
      const canCreate = await MktEntitlementsService.canCreateWorkflow(tenantId)
      if (!canCreate.allowed) {
        return NextResponse.json({ error: canCreate.reason }, { status: 403 })
      }

      const workflow = await WorkflowService.createWorkflow(tenantId, body.workflow, session.user.id)
      return NextResponse.json({ success: true, workflow })
    }

    // Create from template
    if (body.action === 'create-from-template') {
      const canCreate = await MktEntitlementsService.canCreateWorkflow(tenantId)
      if (!canCreate.allowed) {
        return NextResponse.json({ error: canCreate.reason }, { status: 403 })
      }

      const workflow = await WorkflowService.createFromTemplate(
        tenantId,
        body.templateKey,
        body.overrides,
        session.user.id
      )
      return NextResponse.json({ success: true, workflow })
    }

    // Activate workflow
    if (body.action === 'activate-workflow') {
      const workflow = await WorkflowService.activateWorkflow(tenantId, body.workflowId)
      return NextResponse.json({ success: true, workflow })
    }

    // Pause workflow
    if (body.action === 'pause-workflow') {
      const workflow = await WorkflowService.pauseWorkflow(tenantId, body.workflowId)
      return NextResponse.json({ success: true, workflow })
    }

    // Archive workflow
    if (body.action === 'archive-workflow') {
      await WorkflowService.archiveWorkflow(tenantId, body.workflowId)
      return NextResponse.json({ success: true })
    }

    // Process event (triggers matching workflows)
    if (body.action === 'process-event') {
      const results = await ExecutionService.processEvent(tenantId, body.eventName, body.eventData || {})
      return NextResponse.json({ success: true, results })
    }

    // Manual trigger
    if (body.action === 'manual-trigger') {
      const workflow = await WorkflowService.getWorkflow(tenantId, body.workflowId)
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      const result = await ExecutionService.executeWorkflow(
        tenantId,
        body.workflowId,
        body.customerId,
        'MANUAL',
        body.data || {},
        workflow.actions.map(a => ({
          id: a.id,
          type: a.type,
          config: a.config,
          delayMinutes: a.delayMinutes,
        }))
      )
      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Marketing POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/marketing
 * Update configuration or workflows
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Update config
    if (body.action === 'update-config') {
      const config = await MktConfigService.updateConfig(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Update workflow
    if (body.action === 'update-workflow') {
      const workflow = await WorkflowService.updateWorkflow(tenantId, body.workflowId, body.workflow)
      return NextResponse.json({ success: true, workflow })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Marketing PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
