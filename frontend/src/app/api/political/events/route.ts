export const dynamic = 'force-dynamic'

/**
 * Political Suite - Events API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createEvent,
  listEvents,
  getUpcomingEvents,
  getEventStats,
  PolEventType,
  PolEventStatus,
} from '@/lib/political';

// GET /api/political/events - List events
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check for special queries
    if (searchParams.get('upcoming') === 'true') {
      const campaignId = searchParams.get('campaignId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const events = await getUpcomingEvents(tenantId, campaignId, limit);
      return NextResponse.json({ data: events });
    }

    if (searchParams.get('stats') === 'true') {
      const campaignId = searchParams.get('campaignId') || undefined;
      const stats = await getEventStats(tenantId, campaignId);
      return NextResponse.json(stats);
    }

    const filters = {
      campaignId: searchParams.get('campaignId') || undefined,
      type: searchParams.get('type') as PolEventType | undefined,
      status: searchParams.get('status') as PolEventStatus | undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listEvents(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('List events error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/events - Create event
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.campaignId || !body.name || !body.type || !body.startDateTime) {
      return NextResponse.json(
        { error: 'Campaign ID, name, type, and start date/time are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Parse dates
    body.startDateTime = new Date(body.startDateTime);
    if (body.endDateTime) body.endDateTime = new Date(body.endDateTime);

    const event = await createEvent(tenantId, body, actorId);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
