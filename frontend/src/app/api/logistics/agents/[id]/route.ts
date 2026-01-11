export const dynamic = 'force-dynamic'

/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Agent Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { AgentService } from '@/lib/logistics/agent-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/logistics/agents/[id]
 * Get agent by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const includePerformance = searchParams.get('performance') === 'true'

    const agent = await AgentService.getAgentById(tenantId, id)

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    let performance = null
    if (includePerformance) {
      performance = await AgentService.getAgentPerformance(tenantId, id)
    }

    return NextResponse.json({ agent, performance })
  } catch (error) {
    console.error('Error getting agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/logistics/agents/[id]
 * Update agent
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    const agent = await AgentService.updateAgent(tenantId, id, body)

    return NextResponse.json({
      success: true,
      agent,
    })
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/logistics/agents/[id]
 * Terminate agent
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    await AgentService.terminateAgent(tenantId, id)

    return NextResponse.json({
      success: true,
      message: 'Agent terminated',
    })
  } catch (error) {
    console.error('Error terminating agent:', error)
    
    if (error instanceof Error && error.message.includes('Cannot terminate')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/agents/[id]
 * Update agent availability or location
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    if (body.action === 'availability' && body.availability) {
      const agent = await AgentService.updateAvailability(tenantId, id, body.availability)
      return NextResponse.json({ success: true, agent })
    }

    if (body.action === 'location' && body.latitude !== undefined && body.longitude !== undefined) {
      const agent = await AgentService.updateLocation(tenantId, id, {
        latitude: body.latitude,
        longitude: body.longitude,
      })
      return NextResponse.json({ success: true, agent })
    }

    if (body.action === 'performance') {
      const performance = await AgentService.getAgentPerformance(tenantId, id)
      return NextResponse.json({ performance })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "availability", "location", or "performance"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
