export const dynamic = 'force-dynamic'

/**
 * Political Suite - Regulators API Route (Phase 4)
 * READ-ONLY ACCESS FOR REGULATORS & OBSERVERS
 * 
 * MANDATORY LABELS:
 * - READ-ONLY ACCESS
 * - NO WRITE PERMISSIONS
 * - AUDIT LOGGED
 * 
 * CRITICAL: All regulator access is logged and auditable.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  grantAccess,
  revokeAccess,
  listAccess,
  getAccess,
  getAccessLogs,
  logAccessEvent,
  PolRegulatorAccessLevel,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _disclaimer1: 'READ-ONLY ACCESS',
  _disclaimer2: 'NO WRITE PERMISSIONS',
  _disclaimer3: 'ALL ACCESS IS LOGGED',
};

// GET /api/political/governance/regulators - List or get regulator access
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
    const accessId = searchParams.get('id');

    // Get access logs
    if (searchParams.get('logs') === 'true' && accessId) {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
      const logs = await getAccessLogs(tenantId, accessId, limit);
      return NextResponse.json({ ...logs, ...MANDATORY_NOTICE });
    }

    // Get single access record
    if (accessId) {
      const access = await getAccess(tenantId, accessId);
      if (!access) {
        return NextResponse.json(
          { error: 'Access record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...access, ...MANDATORY_NOTICE });
    }

    // List access records
    const filters = {
      partyId: searchParams.get('partyId') || undefined,
      regulatorType: searchParams.get('regulatorType') || undefined,
      accessLevel: searchParams.get('accessLevel') as PolRegulatorAccessLevel | undefined,
      isActive: searchParams.get('isActive') === 'true' ? true :
                searchParams.get('isActive') === 'false' ? false : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listAccess(tenantId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get regulators error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/governance/regulators - Grant access or actions
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Revoke access
    if (action === 'revoke') {
      if (!body.accessId || !body.revocationReason) {
        return NextResponse.json(
          { error: 'accessId and revocationReason are required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const access = await revokeAccess(tenantId, body.accessId, actorId, body.revocationReason);
      return NextResponse.json({ ...access, ...MANDATORY_NOTICE });
    }

    // Log access event
    if (action === 'log') {
      if (!body.accessId || !body.logAction || !body.resource) {
        return NextResponse.json(
          { error: 'accessId, logAction, and resource are required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const log = await logAccessEvent(
        tenantId, body.accessId, body.logAction, body.resource,
        body.resourceId, body.ipAddress, body.userAgent
      );
      return NextResponse.json({ ...log, _notice: 'Access logged' });
    }

    // Grant access
    if (!body.partyId || !body.regulatorName || !body.regulatorType || 
        !body.contactName || !body.contactEmail) {
      return NextResponse.json(
        { 
          error: 'partyId, regulatorName, regulatorType, contactName, and contactEmail are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

    const access = await grantAccess(tenantId, body, actorId);
    return NextResponse.json({ ...access, ...MANDATORY_NOTICE }, { status: 201 });
  } catch (error) {
    console.error('Regulator action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('already') || message.includes('expired') || message.includes('Invalid') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
