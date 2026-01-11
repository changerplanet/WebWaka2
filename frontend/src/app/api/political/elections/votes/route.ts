export const dynamic = 'force-dynamic'

/**
 * Political Suite - Votes API Route (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT A PUBLIC ELECTION
 * 
 * CRITICAL: Votes are APPEND-ONLY. Once cast, cannot be modified or deleted.
 * 
 * CONFLICT-OF-INTEREST CONTROL:
 * - No actor may vote and administer the same primary.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  castVote,
  getVoteCounts,
  getVoteStatsByJurisdiction,
  challengeVote,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _classification: 'INTERNAL PARTY VOTE - NOT A PUBLIC ELECTION',
  _disclaimer1: 'UNOFFICIAL',
  _disclaimer2: 'INTERNAL / PARTY-LEVEL ONLY',
  _append_only: 'Votes are APPEND-ONLY. Cannot be modified or deleted.',
};

// GET /api/political/elections/votes - Get vote counts/stats
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

    // Check if requesting jurisdiction stats
    if (searchParams.get('byJurisdiction') === 'true') {
      const stats = await getVoteStatsByJurisdiction(tenantId, primaryId);
      return NextResponse.json({ ...stats, ...MANDATORY_NOTICE });
    }

    // Get vote counts, optionally scoped
    const scope = {
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
    };

    const counts = await getVoteCounts(tenantId, primaryId, scope);
    return NextResponse.json({ ...counts, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get votes error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/elections/votes - Cast vote (APPEND-ONLY)
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
      if (!body.voteId || !body.challengeNote) {
        return NextResponse.json(
          { error: 'voteId and challengeNote are required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      const challenged = await challengeVote(tenantId, body.voteId, actorId, body.challengeNote);
      return NextResponse.json({ ...challenged, ...MANDATORY_NOTICE });
    }

    // Validate required fields for casting vote
    if (!body.primaryId || !body.aspirantId || !body.voterId) {
      return NextResponse.json(
        { 
          error: 'primaryId, aspirantId, and voterId are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const vote = await castVote(tenantId, body, actorId);
    return NextResponse.json(
      { ...vote, ...MANDATORY_NOTICE },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cast vote error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('CONFLICT') || message.includes('not open') ||
                   message.includes('already') || message.includes('JURISDICTION') ||
                   message.includes('must be') ? 400 : 500;
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
      error: 'Votes are APPEND-ONLY. Modifications are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Vote integrity requires immutability.',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Votes are APPEND-ONLY. Modifications are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Vote integrity requires immutability.',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Votes are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Vote integrity requires immutability. Use challenge action instead.',
    },
    { status: 403 }
  );
}
