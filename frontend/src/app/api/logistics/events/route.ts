export const dynamic = 'force-dynamic'

/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Events API Route - Event processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { EventService } from '@/lib/logistics/event-service'

/**
 * POST /api/logistics/events
 * Process incoming event from POS/SVM/MVM
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      )
    }

    const result = await EventService.processEvent(body)

    return NextResponse.json({
      success: result,
      message: result ? 'Event processed' : 'Event processing failed',
    })
  } catch (error) {
    console.error('Error processing event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/logistics/events
 * Get event processing history (for debugging)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = EventService.getProcessedEvents()

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error getting events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
