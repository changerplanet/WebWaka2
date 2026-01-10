/**
 * Political Suite - Petitions API Route (Phase 4)
 * INTERNAL PARTY GRIEVANCE HANDLING ONLY
 * 
 * MANDATORY LABELS:
 * - INTERNAL PARTY GRIEVANCE
 * - NOT A LEGAL PROCEEDING
 * - NO OFFICIAL STANDING
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPetition,
  listPetitions,
  PolPetitionType,
  PolPetitionStatus,
} from '@/lib/political';

const MANDATORY_NOTICE = {
  _disclaimer1: 'INTERNAL PARTY GRIEVANCE',
  _disclaimer2: 'NOT A LEGAL PROCEEDING',
  _disclaimer3: 'NO OFFICIAL STANDING',
};

// GET /api/political/governance/petitions - List petitions
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
      partyId: searchParams.get('partyId') || undefined,
      type: searchParams.get('type') as PolPetitionType | undefined,
      status: searchParams.get('status') as PolPetitionStatus | undefined,
      petitionerId: searchParams.get('petitionerId') || undefined,
      state: searchParams.get('state') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listPetitions(tenantId, filters);
    return NextResponse.json({ ...result, ...MANDATORY_NOTICE });
  } catch (error) {
    console.error('List petitions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/governance/petitions - Create petition
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

    // Validate required fields
    if (!body.partyId || !body.type || !body.title || !body.description || !body.petitionerId || !body.petitionerName) {
      return NextResponse.json(
        { 
          error: 'partyId, type, title, description, petitionerId, and petitionerName are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Parse dates if provided
    if (body.incidentDate) body.incidentDate = new Date(body.incidentDate);

    const petition = await createPetition(tenantId, body, actorId);
    return NextResponse.json({ ...petition, ...MANDATORY_NOTICE }, { status: 201 });
  } catch (error) {
    console.error('Create petition error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 
                   message.includes('must be') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
