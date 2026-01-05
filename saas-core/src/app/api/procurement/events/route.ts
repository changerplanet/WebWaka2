/**
 * MODULE 6: PROCUREMENT & SUPPLIER MANAGEMENT
 * Events API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { ProcEventService } from '@/lib/procurement/event-service'
import { ProcValidationService } from '@/lib/procurement/validation-service'
import { ProcEntitlementsService } from '@/lib/procurement/entitlements-service'

/**
 * GET /api/procurement/events
 * Get procurement events
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams

    // Get statistics
    if (searchParams.get('statistics') === 'true') {
      const days = parseInt(searchParams.get('days') || '30')
      const stats = await ProcEventService.getStatistics(tenantId, days)
      return NextResponse.json(stats)
    }

    // Get validation result
    if (searchParams.get('validate') === 'true') {
      const result = await ProcValidationService.validateModule(tenantId)
      return NextResponse.json(result)
    }

    // Get manifest
    if (searchParams.get('manifest') === 'true') {
      const manifest = ProcValidationService.getManifest()
      return NextResponse.json(manifest)
    }

    // Get entitlements
    if (searchParams.get('entitlements') === 'true') {
      const entitlements = await ProcEntitlementsService.getEntitlements(tenantId)
      return NextResponse.json(entitlements)
    }

    // Get usage
    if (searchParams.get('usage') === 'true') {
      const usage = await ProcEntitlementsService.getUsage(tenantId)
      return NextResponse.json(usage)
    }

    // Get events
    const events = await ProcEventService.getEvents(tenantId, {
      ...(searchParams.get('eventType') && { eventType: searchParams.get('eventType')!.split(',') }),
      ...(searchParams.get('entityType') && { entityType: searchParams.get('entityType')! }),
      ...(searchParams.get('entityId') && { entityId: searchParams.get('entityId')! }),
      ...(searchParams.get('fromDate') && { fromDate: new Date(searchParams.get('fromDate')!) }),
      ...(searchParams.get('toDate') && { toDate: new Date(searchParams.get('toDate')!) }),
    }, parseInt(searchParams.get('limit') || '50'))

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error getting events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/events
 * Process external events
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Process INVENTORY_LOW event
    if (body.eventType === 'INVENTORY_LOW') {
      const result = await ProcEventService.processInventoryLowEvent(tenantId, body.data)
      return NextResponse.json({ success: true, ...result })
    }

    // Process SUPPLIER_UPDATED event
    if (body.eventType === 'SUPPLIER_UPDATED') {
      const result = await ProcEventService.processSupplierUpdatedEvent(tenantId, body.data)
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json(
      { error: 'Unknown event type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
