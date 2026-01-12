export const dynamic = 'force-dynamic'

/**
 * MVM Events API
 * 
 * Receives events from the MVM (Multi Vendor Marketplace) module.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleMVMEvent } from '@/lib/mvm-event-handlers'
import { checkCapabilityGuard } from '@/lib/capabilities'

export async function POST(request: NextRequest) {
  // Capability guard
  const guardResult = await checkCapabilityGuard(request, 'mvm')
  if (guardResult) return guardResult

  try {
    const event = await request.json()
    
    // Validate event structure
    if (!event.eventId || !event.eventType || !event.tenantId) {
      return NextResponse.json(
        { error: 'Invalid event structure. Required: eventId, eventType, tenantId' },
        { status: 400 }
      )
    }
    
    // Process the event
    const result = await handleMVMEvent(event)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        eventId: event.eventId,
        processed: true
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          eventId: event.eventId,
          error: result.error 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[MVM Events API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
