export const dynamic = 'force-dynamic'

/**
 * Political Suite - Governance Audit API Route (Phase 4)
 * APPEND-ONLY / IMMUTABLE AUDIT TRAIL
 * 
 * CRITICAL: Audit logs are READ-ONLY. They are created automatically by services.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listAuditLogs,
  getAuditLog,
  getEntityAuditTrail,
  verifyAuditIntegrity,
  exportAuditLogs,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _classification: 'GOVERNANCE AUDIT LOG',
  _immutability: 'Audit logs are APPEND-ONLY. Cannot be modified or deleted.',
  _integrity: 'Each record has a cryptographic hash for integrity verification.',
};

// GET /api/political/governance/audit - List audit logs (READ-ONLY)
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
    const auditId = searchParams.get('id');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    // Get single audit log
    if (auditId) {
      const audit = await getAuditLog(tenantId, auditId);
      if (!audit) {
        return NextResponse.json(
          { error: 'Audit log not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...audit, ...MANDATORY_NOTICE });
    }

    // Get entity audit trail
    if (entityType && entityId) {
      const trail = await getEntityAuditTrail(tenantId, entityType, entityId);
      return NextResponse.json({ ...trail, ...MANDATORY_NOTICE });
    }

    // List audit logs
    const filters = {
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      action: searchParams.get('action') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      partyId: searchParams.get('partyId') || undefined,
      state: searchParams.get('state') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listAuditLogs(tenantId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/governance/audit - Actions (verify, export)
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Verify audit log integrity
    if (action === 'verify') {
      if (!body.auditId) {
        return NextResponse.json(
          { error: 'auditId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const result = await verifyAuditIntegrity(tenantId, body.auditId);
      return NextResponse.json(result);
    }

    // Export audit logs
    if (action === 'export') {
      const filters = {
        entityType: body.entityType,
        entityId: body.entityId,
        action: body.filterAction,
        actorId: body.actorId,
        partyId: body.partyId,
        state: body.state,
        fromDate: body.fromDate ? new Date(body.fromDate) : undefined,
        toDate: body.toDate ? new Date(body.toDate) : undefined,
      };
      const format = body.format === 'csv' ? 'csv' : 'json';
      const result = await exportAuditLogs(tenantId, filters, format);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Valid actions: verify, export', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Audit action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Block all write operations - READ-ONLY
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Audit logs are READ-ONLY. Write operations are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Audit logs are created automatically by services.',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Audit logs are APPEND-ONLY. Modifications are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Audit integrity requires immutability.',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Audit logs are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Audit integrity requires permanent preservation.',
    },
    { status: 403 }
  );
}
