export const dynamic = 'force-dynamic'

/**
 * Political Suite - Event Detail API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEvent,
  updateEvent,
  startEvent,
  completeEvent,
  cancelEvent,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/political/events/[id] - Get event details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const event = await getEvent(tenantId, id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/events/[id] - Update event
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Parse dates if provided
    if (body.startDateTime) body.startDateTime = new Date(body.startDateTime);
    if (body.endDateTime) body.endDateTime = new Date(body.endDateTime);

    const event = await updateEvent(tenantId, id, body, actorId);
    return NextResponse.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('Cannot update') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/events/[id] - Actions (start, complete, cancel)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'start':
        const startedEvent = await startEvent(tenantId, id, actorId);
        return NextResponse.json(startedEvent);

      case 'complete':
        const completedEvent = await completeEvent(
          tenantId, id, actorId, data.actualAttendance
        );
        return NextResponse.json(completedEvent);

      case 'cancel':
        const cancelledEvent = await cancelEvent(
          tenantId, id, actorId, data.reason
        );
        return NextResponse.json(cancelledEvent);

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Event action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('Only') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
