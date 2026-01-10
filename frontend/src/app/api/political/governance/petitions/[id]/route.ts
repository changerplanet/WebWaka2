/**
 * Political Suite - Petition Detail API Route (Phase 4)
 * INTERNAL PARTY GRIEVANCE HANDLING ONLY
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPetition,
  updatePetition,
  submitPetition,
  transitionPetitionStatus,
  decidePetition,
  PolPetitionStatus,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _disclaimer1: 'INTERNAL PARTY GRIEVANCE',
  _disclaimer2: 'NOT A LEGAL PROCEEDING',
  _disclaimer3: 'NO OFFICIAL STANDING',
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/political/governance/petitions/[id] - Get petition
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const { id } = await context.params;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const petition = await getPetition(tenantId, id);
    if (!petition) {
      return NextResponse.json(
        { error: 'Petition not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...petition, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Get petition error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/governance/petitions/[id] - Update petition
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';
    const { id } = await context.params;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (body.incidentDate) body.incidentDate = new Date(body.incidentDate);

    const petition = await updatePetition(tenantId, id, body, actorId);
    return NextResponse.json({ ...petition, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Update petition error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('only') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/governance/petitions/[id] - Actions (submit, transition, decide)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const actorId = request.headers.get('x-user-id') || 'system';
    const { id } = await context.params;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    let result;
    switch (action) {
      case 'submit':
        result = await submitPetition(tenantId, id, actorId);
        break;
      case 'transition':
        if (!body.status) {
          return NextResponse.json(
            { error: 'status is required for transition', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        result = await transitionPetitionStatus(
          tenantId, id, body.status as PolPetitionStatus, actorId, body.note
        );
        break;
      case 'decide':
        if (!body.decision || body.isUpheld === undefined) {
          return NextResponse.json(
            { error: 'decision and isUpheld are required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        result = await decidePetition(tenantId, id, body.decision, body.isUpheld, actorId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: submit, transition, decide', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
    }

    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('Petition action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('Only') || message.includes('Invalid') || message.includes('must be') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
