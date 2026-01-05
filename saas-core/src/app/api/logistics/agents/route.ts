/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Agents API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { AgentService } from '@/lib/logistics/agent-service'
import { EntitlementsService } from '@/lib/logistics/entitlements-service'
import { ConfigurationService } from '@/lib/logistics/config-service'

/**
 * GET /api/logistics/agents
 * List delivery agents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | undefined
    const availability = searchParams.get('availability') as 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON_DELIVERY' | undefined
    const agentType = searchParams.get('agentType') as 'IN_HOUSE' | 'FREELANCE' | 'THIRD_PARTY' | undefined
    const zoneId = searchParams.get('zoneId') || undefined
    const search = searchParams.get('search') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const result = await AgentService.getAgents(tenantId, {
      status,
      availability,
      agentType,
      zoneId,
      search,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/agents
 * Create delivery agent
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
    
    // Check rider limit
    await EntitlementsService.enforceEntitlement(tenantId, 'create_rider')
    
    const body = await request.json()
    
    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        { error: 'First name, last name, and phone are required' },
        { status: 400 }
      )
    }

    const agent = await AgentService.createAgent(tenantId, body)

    return NextResponse.json({
      success: true,
      agent,
    })
  } catch (error) {
    console.error('Error creating agent:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not allowed') || error.message.includes('Maximum')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: 'Agent with this phone already exists' }, { status: 400 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
