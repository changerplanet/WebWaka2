/**
 * Political Suite - Evidence API Route (Phase 4)
 * APPEND-ONLY / IMMUTABLE EVIDENCE RECORDS
 * 
 * CRITICAL: Evidence is APPEND-ONLY. Once submitted, cannot be modified or deleted.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  submitEvidence,
  listEvidence,
  getEvidence,
  verifyEvidence,
  PolEvidenceType,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _classification: 'EVIDENCE RECORD - APPEND-ONLY',
  _immutability: 'Evidence cannot be modified or deleted once submitted',
};

// GET /api/political/governance/evidence - List evidence
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
    const petitionId = searchParams.get('petitionId');
    const evidenceId = searchParams.get('id');

    // Get single evidence by ID
    if (evidenceId) {
      const evidence = await getEvidence(tenantId, evidenceId);
      if (!evidence) {
        return NextResponse.json(
          { error: 'Evidence not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...evidence, ...MANDATORY_NOTICE });
    }

    // List evidence (requires petitionId)
    if (!petitionId) {
      return NextResponse.json(
        { error: 'petitionId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const filters = {
      type: searchParams.get('type') as PolEvidenceType | undefined,
      isVerified: searchParams.get('isVerified') === 'true' ? true : 
                  searchParams.get('isVerified') === 'false' ? false : undefined,
    };

    const result = await listEvidence(tenantId, petitionId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get evidence error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/governance/evidence - Submit evidence or verify
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

    // Verify action
    if (body.action === 'verify') {
      if (!body.evidenceId) {
        return NextResponse.json(
          { error: 'evidenceId is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const evidence = await verifyEvidence(tenantId, body.evidenceId, actorId, body.verificationNote);
      return NextResponse.json({ ...evidence, ...MANDATORY_NOTICE });
    }

    // Submit evidence
    if (!body.petitionId || !body.type || !body.title) {
      return NextResponse.json(
        { 
          error: 'petitionId, type, and title are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const evidence = await submitEvidence(tenantId, body, actorId);
    return NextResponse.json({ ...evidence, ...MANDATORY_NOTICE }, { status: 201 });
  } catch (error) {
    console.error('Evidence action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('Cannot') || message.includes('already') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// Block modifications - APPEND-ONLY
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Evidence is APPEND-ONLY. Modifications are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Evidence integrity requires immutability.',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Evidence is APPEND-ONLY. Only verification metadata can be added.',
      code: 'FORBIDDEN',
      _reason: 'Use POST with action: verify to verify evidence.',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Evidence is IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Evidence integrity requires permanent preservation.',
    },
    { status: 403 }
  );
}
