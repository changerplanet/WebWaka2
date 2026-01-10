/**
 * Church Suite — Volunteer Logs API
 * Phase 2: Ministries, Services & Events
 * 
 * APPEND-ONLY: Volunteer service records cannot be modified
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  logVolunteerActivity,
  verifyVolunteerLog,
  getMemberVolunteerHistory,
  getVolunteerStats,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/volunteer-logs
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const churchId = searchParams.get('churchId');

    // Stats mode
    if (searchParams.get('stats') === 'true') {
      if (!churchId) {
        return NextResponse.json(
          { error: 'churchId is required for stats' },
          { status: 400 }
        );
      }
      const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
      const stats = await getVolunteerStats(tenantId, churchId, memberId || undefined, startDate, endDate);
      return NextResponse.json({
        stats,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Member history
    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const history = await getMemberVolunteerHistory(tenantId, memberId, limit);

    return NextResponse.json({
      history,
      total: history.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Volunteer Logs Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/volunteer-logs
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
    const { action } = body;

    // Verify action
    if (action === 'verify') {
      if (!body.logId) {
        return NextResponse.json(
          { error: 'logId is required for verification' },
          { status: 400 }
        );
      }
      const log = await verifyVolunteerLog(tenantId, body.logId, actorId);
      return NextResponse.json({
        log,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create log
    if (!body.churchId || !body.memberId || !body.activity || !body.serviceDate) {
      return NextResponse.json(
        { error: 'churchId, memberId, activity, and serviceDate are required' },
        { status: 400 }
      );
    }

    const log = await logVolunteerActivity(tenantId, body, actorId);

    return NextResponse.json({
      log,
      _append_only: 'Volunteer logs are APPEND-ONLY',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Volunteer Log Error:', error);
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
      message: 'Volunteer logs are APPEND-ONLY. Use POST with action: "verify" to mark as verified.',
      _append_only: 'APPEND-ONLY: Cannot modify volunteer logs',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Volunteer logs are APPEND-ONLY. Use POST with action: "verify" to mark as verified.',
      _append_only: 'APPEND-ONLY: Cannot modify volunteer logs',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Volunteer logs are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete volunteer logs',
    },
    { status: 403 }
  );
}
