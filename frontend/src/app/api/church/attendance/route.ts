export const dynamic = 'force-dynamic'

/**
 * Church Suite — Attendance API
 * Phase 2: Ministries, Services & Events
 * 
 * ⚠️ SAFEGUARDING: Attendance is AGGREGATED ONLY
 * - No individual attendance tracking for minors safety
 * - No pastoral notes exposed
 * - No minors attendance details exposed publicly
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/attendance
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const churchId = searchParams.get('churchId');

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    // Stats mode
    if (searchParams.get('stats') === 'true') {
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const stats = await getAttendanceStats(tenantId, churchId, startDate, endDate);
      return NextResponse.json({
        stats,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // History mode
    const serviceId = searchParams.get('serviceId') || undefined;
    const eventId = searchParams.get('eventId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const history = await getAttendanceHistory(tenantId, churchId, serviceId, eventId, limit);

    return NextResponse.json({
      history,
      total: history.length,
      _safeguarding: 'AGGREGATED_ONLY — No individual attendance tracking for minors safety',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/attendance - Record attendance (APPEND-ONLY)
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.churchId || !body.attendanceDate || body.totalCount === undefined) {
      return NextResponse.json(
        { error: 'churchId, attendanceDate, and totalCount are required' },
        { status: 400 }
      );
    }

    const attendance = await recordAttendance(tenantId, body, actorId);

    return NextResponse.json({
      attendance,
      _append_only: 'Attendance facts are APPEND-ONLY and cannot be modified',
      _safeguarding: 'AGGREGATED_ONLY — No individual attendance tracking',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Record Attendance Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PUT/PATCH/DELETE - FORBIDDEN (APPEND-ONLY)
export async function PUT() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Attendance facts are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify attendance records',
      _safeguarding: 'This protects data integrity for auditing',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Attendance facts are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify attendance records',
      _safeguarding: 'This protects data integrity for auditing',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Attendance facts are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete attendance records',
      _safeguarding: 'This protects data integrity for auditing',
    },
    { status: 403 }
  );
}
