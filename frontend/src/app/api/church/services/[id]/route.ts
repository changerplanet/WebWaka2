/**
 * Church Suite — Service Detail API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getService,
  updateService,
  createSchedule,
  getAttendanceHistory,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/services/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;
    const searchParams = req.nextUrl.searchParams;

    const service = await getService(tenantId, id);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    let attendanceHistory = null;
    if (searchParams.get('includeAttendance') === 'true') {
      attendanceHistory = await getAttendanceHistory(tenantId, service.churchId, id);
    }

    return NextResponse.json({
      service,
      attendanceHistory,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Service Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/church/services/[id]
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

    const service = await updateService(tenantId, id, body, actorId);

    return NextResponse.json({
      service,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Update Service Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}

// POST /api/church/services/[id] - Actions (createSchedule)
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
      case 'createSchedule': {
        if (!body.scheduledDate) {
          return NextResponse.json(
            { error: 'scheduledDate is required' },
            { status: 400 }
          );
        }
        const schedule = await createSchedule(tenantId, {
          serviceId: id,
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
    console.error('Service Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
