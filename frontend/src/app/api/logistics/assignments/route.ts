/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Assignments API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { AssignmentService } from '@/lib/logistics/assignment-service'
import { EntitlementsService } from '@/lib/logistics/entitlements-service'
import { ConfigurationService } from '@/lib/logistics/config-service'

/**
 * GET /api/logistics/assignments
 * List delivery assignments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get('status')?.split(',') as any
    const agentId = searchParams.get('agentId') || undefined
    const zoneId = searchParams.get('zoneId') || undefined
    const priority = searchParams.get('priority') as 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'NEXT_DAY' | undefined
    const orderId = searchParams.get('orderId') || undefined
    const customerId = searchParams.get('customerId') || undefined
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await AssignmentService.getAssignments(tenantId, {
      status,
      agentId,
      zoneId,
      priority,
      orderId,
      customerId,
      dateFrom,
      dateTo,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/assignments
 * Create delivery assignment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    
    // Check if logistics is initialized
    const { initialized } = await ConfigurationService.getConfiguration(tenantId)
    if (!initialized) {
      return NextResponse.json(
        { error: 'Logistics not initialized' },
        { status: 400 }
      )
    }
    
    // Check assignment limit
    await EntitlementsService.enforceEntitlement(tenantId, 'create_assignment')
    
    const body = await request.json()
    
    if (!body.orderId || !body.orderType) {
      return NextResponse.json(
        { error: 'orderId and orderType are required' },
        { status: 400 }
      )
    }

    // Check express delivery entitlement
    if (body.priority === 'EXPRESS' || body.priority === 'SAME_DAY') {
      await EntitlementsService.enforceEntitlement(tenantId, 'express_delivery_enabled')
    }

    const assignment = await AssignmentService.createAssignment(tenantId, {
      ...body,
      assignedBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      assignment,
    })
  } catch (error) {
    console.error('Error creating assignment:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('not allowed') || error.message.includes('limit')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
