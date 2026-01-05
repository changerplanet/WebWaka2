/**
 * SVM Events API
 * 
 * POST /api/svm/events - Receive events from SVM module
 * 
 * This endpoint receives events from the SVM module and routes them
 * to the appropriate handlers in the Core.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleSVMEvent } from '@/lib/svm-event-handlers'
import { checkCapabilityGuard } from '@/lib/capabilities'

export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'svm')
  if (guardResult) return guardResult

  try {
    const event = await request.json()

    // Validate event structure
    if (!event.eventType || !event.eventId || !event.idempotencyKey || !event.payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid event structure. Required: eventType, eventId, idempotencyKey, payload' },
        { status: 400 }
      )
    }

    // Process the event
    const result = await handleSVMEvent(event)

    if (result.success) {
      return NextResponse.json({
        success: true,
        eventId: event.eventId,
        processed: true,
        data: result.data || {}
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing SVM event:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
