/**
 * Political Suite - Member Detail API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMember,
  updateMember,
  verifyMember,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/political/members/[id] - Get member details
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

    const member = await getMember(tenantId, id);

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Get member error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/members/[id] - Update member
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
    const member = await updateMember(tenantId, id, body, actorId);
    return NextResponse.json(member);
  } catch (error) {
    console.error('Update member error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Member not found' ? 404 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/members/[id] - Actions (verify)
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
    const { action } = body;

    switch (action) {
      case 'verify':
        const member = await verifyMember(tenantId, id, actorId);
        return NextResponse.json(member);

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Member action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
