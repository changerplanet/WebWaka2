export const dynamic = 'force-dynamic'

/**
 * Political Suite - Results API Route (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT AN OFFICIAL ELECTION
 * 
 * CRITICAL: Results are APPEND-ONLY. Once declared, cannot be modified.
 * 
 * MANDATORY LABELS (Every Response):
 * - UNOFFICIAL RESULT
 * - INTERNAL PARTY USE ONLY
 * - NOT INEC-CERTIFIED - NO LEGAL STANDING
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  declareResults,
  getResults,
  getWinner,
  challengeResult,
  PolResultStatus,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _disclaimer1: 'UNOFFICIAL RESULT',
  _disclaimer2: 'INTERNAL PARTY USE ONLY',
  _disclaimer3: 'NOT INEC-CERTIFIED - NO LEGAL STANDING',
  _append_only: 'Results are APPEND-ONLY. Cannot be modified once declared.',
};

// GET /api/political/elections/results - Get results
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
    const primaryId = searchParams.get('primaryId');

    if (!primaryId) {
      return NextResponse.json(
        { error: 'primaryId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if requesting winner only
    if (searchParams.get('winner') === 'true') {
      const winner = await getWinner(tenantId, primaryId);
      return NextResponse.json({ ...winner, ...MANDATORY_NOTICE });
    }

    const filters = {
      primaryId,
      scope: searchParams.get('scope') || undefined,
      status: searchParams.get('status') as PolResultStatus | undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
    };

    const results = await getResults(tenantId, filters);
    return NextResponse.json({ ...results, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/elections/results - Declare results or challenge
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

    // Check for challenge action
    if (body.action === 'challenge') {
      if (!body.resultId || !body.challengeNote) {
        return NextResponse.json(
          { error: 'resultId and challengeNote are required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const challenged = await challengeResult(tenantId, body.resultId, actorId, body.challengeNote);
      return NextResponse.json({ ...challenged, ...MANDATORY_NOTICE });
    }

    // Declare results
    if (!body.primaryId || !body.scope) {
      return NextResponse.json(
        { 
          error: 'primaryId and scope are required',
          code: 'VALIDATION_ERROR',
          valid_scopes: ['OVERALL', 'STATE', 'LGA', 'WARD'],
        },
        { status: 400 }
      );
    }

    const results = await declareResults(tenantId, body, actorId);
    return NextResponse.json(
      { ...results, ...MANDATORY_NOTICE },
      { status: 201 }
    );
  } catch (error) {
    console.error('Declare results error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('already') || message.includes('must be') ||
                   message.includes('required') || message.includes('No votes') ? 400 : 500;
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
      error: 'Results are APPEND-ONLY. Modifications are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Result integrity requires immutability. Use challenge action instead.',
      ...MANDATORY_NOTICE,
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Results are APPEND-ONLY. Modifications are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Result integrity requires immutability. Use challenge action instead.',
      ...MANDATORY_NOTICE,
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Results are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Result integrity requires immutability.',
      ...MANDATORY_NOTICE,
    },
    { status: 403 }
  );
}
