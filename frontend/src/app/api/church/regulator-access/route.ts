export const dynamic = 'force-dynamic'

/**
 * Church Suite — Regulator Access API
 * Phase 4: Governance, Audit & Transparency
 * 
 * APPEND-ONLY: All regulator access is logged immutably
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  logRegulatorAccess,
  getRegulatorAccessLogs,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/regulator-access
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

    const regulatorId = searchParams.get('regulatorId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const logs = await getRegulatorAccessLogs(tenantId, churchId, regulatorId, limit);

    return NextResponse.json({
      logs,
      total: logs.length,
      _read_only: 'Regulator access logs are READ-ONLY',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Regulator Access Logs Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/regulator-access - Log access (APPEND-ONLY)
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.churchId || !body.regulatorId || !body.accessType || !body.resourceType) {
      return NextResponse.json(
        { error: 'churchId, regulatorId, accessType, and resourceType are required' },
        { status: 400 }
      );
    }

    // Auto-capture IP and user agent
    body.ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    body.userAgent = req.headers.get('user-agent') || 'unknown';

    const log = await logRegulatorAccess(tenantId, body);

    return NextResponse.json({
      log,
      _append_only: 'Regulator access logged immutably',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Log Regulator Access Error:', error);
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
      message: 'Regulator access logs are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify regulator access logs',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Regulator access logs are APPEND-ONLY and cannot be modified.',
      _append_only: 'APPEND-ONLY: Cannot modify regulator access logs',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Regulator access logs are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete regulator access logs',
    },
    { status: 403 }
  );
}
