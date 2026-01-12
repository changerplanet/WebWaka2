export const dynamic = 'force-dynamic'

/**
 * Church Suite — Event Detail API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChuEventStatus } from '@prisma/client';
import {
  getEvent,
  updateEvent,
  changeEventStatus,
  createSchedule,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/events/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;

    const event = await getEvent(tenantId, id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      event,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Event Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/events/[id]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const event = await updateEvent(tenantId, id, body, actorId);

    return NextResponse.json({
      event,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Event Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}

// POST /api/church/events/[id] - Actions (changeStatus, createSchedule)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'changeStatus': {
        if (!body.status) {
          return NextResponse.json(
            { error: 'status is required' },
            { status: 400 }
          );
        }
        const validStatuses = Object.values(ChuEventStatus);
        if (!validStatuses.includes(body.status)) {
          return NextResponse.json(
            { error: `Invalid status. Valid values: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }
        const event = await changeEventStatus(tenantId, id, body.status, body.note, actorId);
        return NextResponse.json({
          event,
          _event_log: 'Status change recorded in event log (APPEND-ONLY)',
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      case 'createSchedule': {
        if (!body.scheduledDate) {
          return NextResponse.json(
            { error: 'scheduledDate is required' },
            { status: 400 }
          );
        }
        const schedule = await createSchedule(tenantId, {
          eventId: id,
          scheduledDate: body.scheduledDate,
          startTime: body.startTime,
          endTime: body.endTime,
          location: body.location,
          preacherId: body.preacherId,
          topic: body.topic,
        }, actorId);
        return NextResponse.json({
          schedule,
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Event Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
