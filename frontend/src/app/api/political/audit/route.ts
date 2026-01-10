/**
 * Political Suite - Audit Logs API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 * 
 * CRITICAL: This endpoint is READ-ONLY.
 * Audit logs are APPEND-ONLY and cannot be modified through any API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryAuditLogs, PolAuditAction } from '@/lib/political';

// GET /api/political/audit - Query audit logs (READ-ONLY)
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
    const filters = {
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      actorId: searchParams.get('actorId') || undefined,
      action: searchParams.get('action') as PolAuditAction | undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await queryAuditLogs(tenantId, filters);
    
    return NextResponse.json({
      ...result,
      _notice: 'Audit logs are READ-ONLY and APPEND-ONLY. No modifications permitted.',
    });
  } catch (error) {
    console.error('Query audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Block all write operations
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Audit logs are READ-ONLY. Direct writes are not permitted.',
      code: 'FORBIDDEN',
      _notice: 'Audit entries are automatically created by the system during operations.',
    },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Audit logs are APPEND-ONLY. Updates are not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { 
      error: 'Audit logs are APPEND-ONLY. Updates are not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Audit logs are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}
