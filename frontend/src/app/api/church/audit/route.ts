export const dynamic = 'force-dynamic'

/**
 * Church Suite — Audit API
 * Phase 1: Registry & Membership
 * 
 * READ-ONLY: Audit logs are APPEND-ONLY and IMMUTABLE
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuditLogs,
  getEntityAuditTrail,
  verifyIntegrity,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/audit - Query audit logs
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;

    // Entity trail mode
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    if (entityType && entityId) {
      const trail = await getEntityAuditTrail(tenantId, entityType, entityId);
      return NextResponse.json({
        trail,
        total: trail.length,
        _audit: 'ENTITY_TRAIL — IMMUTABLE RECORDS',
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // General query mode
    const filters = {
      churchId: searchParams.get('churchId') || undefined,
      entityType: searchParams.get('filterEntityType') || undefined,
      action: searchParams.get('action') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      unitId: searchParams.get('unitId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getAuditLogs(tenantId, filters);

    return NextResponse.json({
      ...result,
      _audit: 'AUDIT_LOG — IMMUTABLE RECORDS',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Audit Query Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/audit - Actions (verifyIntegrity)
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'verifyIntegrity': {
        if (!body.logId) {
          return NextResponse.json(
            { error: 'logId is required' },
            { status: 400 }
          );
        }
        const result = await verifyIntegrity(tenantId, body.logId);
        return NextResponse.json({
          ...result,
          _audit: 'INTEGRITY_CHECK',
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Only 'verifyIntegrity' is allowed.` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Audit Action Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT/PATCH/DELETE - FORBIDDEN (APPEND-ONLY)
export async function PUT() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Audit logs are APPEND-ONLY and READ-ONLY. No modifications allowed.',
      _audit: 'IMMUTABLE — Audit logs cannot be modified',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Audit logs are APPEND-ONLY and READ-ONLY. No modifications allowed.',
      _audit: 'IMMUTABLE — Audit logs cannot be modified',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Audit logs are APPEND-ONLY and IMMUTABLE. Records cannot be deleted.',
      _audit: 'IMMUTABLE — Audit logs cannot be deleted',
    },
    { status: 403 }
  );
}
