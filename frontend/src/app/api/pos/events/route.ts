/**
 * POS Events API
 * 
 * POST /api/pos/events - Receive events from POS module
 * 
 * This endpoint receives events from the POS module (either directly
 * or via the offline sync queue) and routes them to the appropriate handlers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handlePOSEvent } from '@/lib/pos-event-handlers'
import { checkCapabilityGuard } from '@/lib/capabilities'

export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'pos')
  if (guardResult) return guardResult

  try {
    const event = await request.json()

    // Validate event structure
    if (!event.eventType || !event.eventId || !event.idempotencyKey || !event.payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid event structure' },
        { status: 400 }
      )
    }

    // Process the event
    const result = await handlePOSEvent(event)

    if (result.success) {
      return NextResponse.json({
        success: true,
        eventId: event.eventId,
        processed: true
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing POS event:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
