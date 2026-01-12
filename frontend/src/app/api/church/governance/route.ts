export const dynamic = 'force-dynamic'

/**
 * Church Suite — Governance Records API
 * Phase 4: Governance, Audit & Transparency
 * 
 * APPEND-ONLY: Governance records are immutable once created
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createGovernanceRecord,
  getGovernanceRecords,
  getGovernanceRecord,
  approveGovernanceRecord,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/governance
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const recordId = searchParams.get('id');

    if (recordId) {
      const record = await getGovernanceRecord(tenantId, recordId);
      if (!record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      return NextResponse.json({
        record,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    const churchId = searchParams.get('churchId');
    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    const recordType = searchParams.get('recordType') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const records = await getGovernanceRecords(tenantId, churchId, recordType, status, limit);

    return NextResponse.json({
      records,
      total: records.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Governance Records Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/governance
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

    // Approve action
    if (action === 'approve') {
      if (!body.recordId) {
        return NextResponse.json(
          { error: 'recordId is required' },
          { status: 400 }
        );
      }
      const record = await approveGovernanceRecord(tenantId, body.recordId, actorId);
      return NextResponse.json({
        record,
        _append_only: 'Status change recorded immutably',
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create record
    if (!body.churchId || !body.recordType || !body.title) {
      return NextResponse.json(
        { error: 'churchId, recordType, and title are required' },
        { status: 400 }
      );
    }

    const record = await createGovernanceRecord(tenantId, body, actorId);

    return NextResponse.json({
      record,
      _append_only: 'Governance records are APPEND-ONLY',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Governance Record Error:', error);
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
      message: 'Governance records are APPEND-ONLY. Use POST with action: "approve" to change status.',
      _append_only: 'APPEND-ONLY: Cannot modify governance records',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Governance records are APPEND-ONLY. Use POST with action: "approve" to change status.',
      _append_only: 'APPEND-ONLY: Cannot modify governance records',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Governance records are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete governance records',
    },
    { status: 403 }
  );
}
