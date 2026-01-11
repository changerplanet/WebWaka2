export const dynamic = 'force-dynamic'

/**
 * Political Suite - Candidates API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidate,
  updateCandidate,
  screenCandidate,
  clearCandidate,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/political/candidates/[id] - Get candidate details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const candidate = await getCandidate(tenantId, id);

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Get candidate error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/candidates/[id] - Update candidate
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (body.dateOfBirth) body.dateOfBirth = new Date(body.dateOfBirth);
    
    const candidate = await updateCandidate(tenantId, id, body, actorId);
    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Update candidate error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Candidate not found' ? 404 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/candidates/[id] - Actions (screen, clear)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'screen':
        if (typeof data.passed !== 'boolean') {
          return NextResponse.json(
            { error: 'Screening result (passed: true/false) is required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const screenedCandidate = await screenCandidate(
          tenantId, id, actorId, data.passed, data.screeningNote
        );
        return NextResponse.json(screenedCandidate);

      case 'clear':
        const clearedCandidate = await clearCandidate(
          tenantId, id, actorId, data.clearanceNote
        );
        return NextResponse.json(clearedCandidate);

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Candidate action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('Only') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
