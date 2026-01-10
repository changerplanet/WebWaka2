/**
 * Church Suite — Compliance Records API
 * Phase 4: Governance, Audit & Transparency
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createComplianceRecord,
  getComplianceRecords,
  getUpcomingCompliance,
  updateComplianceStatus,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/compliance
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

    // Upcoming mode
    if (searchParams.get('upcoming') === 'true') {
      const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;
      const records = await getUpcomingCompliance(tenantId, churchId, days);
      return NextResponse.json({
        records,
        total: records.length,
        _upcoming: `Items due within ${days} days`,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    const complianceType = searchParams.get('complianceType') || undefined;
    const status = searchParams.get('status') || undefined;

    const records = await getComplianceRecords(tenantId, churchId, complianceType, status);

    return NextResponse.json({
      records,
      total: records.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Compliance Records Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/compliance
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

    // Update status action
    if (action === 'updateStatus') {
      if (!body.recordId || !body.status) {
        return NextResponse.json(
          { error: 'recordId and status are required' },
          { status: 400 }
        );
      }
      const record = await updateComplianceStatus(tenantId, body.recordId, body.status, actorId);
      return NextResponse.json({
        record,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create record
    if (!body.churchId || !body.complianceType || !body.description) {
      return NextResponse.json(
        { error: 'churchId, complianceType, and description are required' },
        { status: 400 }
      );
    }

    const record = await createComplianceRecord(tenantId, body, actorId);

    return NextResponse.json({
      record,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Compliance Record Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
