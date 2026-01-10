/**
 * Political Suite - Members API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createMember,
  listMembers,
  getMemberStats,
  PolMemberStatus,
  PolMemberRole,
} from '@/lib/political';

// GET /api/political/members - List members
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
    
    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const partyId = searchParams.get('partyId') || undefined;
      const stats = await getMemberStats(tenantId, partyId);
      return NextResponse.json(stats);
    }

    const filters = {
      partyId: searchParams.get('partyId') || undefined,
      organId: searchParams.get('organId') || undefined,
      role: searchParams.get('role') as PolMemberRole | undefined,
      status: searchParams.get('status') as PolMemberStatus | undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
      isVerified: searchParams.get('isVerified') === 'true' ? true : 
                  searchParams.get('isVerified') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listMembers(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('List members error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/members - Create member
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
    if (!body.partyId || !body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        { error: 'Party ID, first name, last name, and phone are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const member = await createMember(tenantId, body, actorId);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Create member error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
