/**
 * Political Suite - Volunteers API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createVolunteer,
  listVolunteers,
  getVolunteerStats,
  PolVolunteerRole,
  PolVolunteerStatus,
} from '@/lib/political';

// GET /api/political/volunteers - List volunteers
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
    
    // Check for stats query
    if (searchParams.get('stats') === 'true') {
      const campaignId = searchParams.get('campaignId') || undefined;
      const stats = await getVolunteerStats(tenantId, campaignId);
      return NextResponse.json(stats);
    }

    const filters = {
      campaignId: searchParams.get('campaignId') || undefined,
      eventId: searchParams.get('eventId') || undefined,
      role: searchParams.get('role') as PolVolunteerRole | undefined,
      status: searchParams.get('status') as PolVolunteerStatus | undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await listVolunteers(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('List volunteers error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/volunteers - Create volunteer
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
    if (!body.campaignId || !body.firstName || !body.lastName || !body.phone || !body.role) {
      return NextResponse.json(
        { error: 'Campaign ID, first name, last name, phone, and role are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Parse dates if provided
    if (body.availableFrom) body.availableFrom = new Date(body.availableFrom);
    if (body.availableTo) body.availableTo = new Date(body.availableTo);

    const volunteer = await createVolunteer(tenantId, body, actorId);
    return NextResponse.json(volunteer, { status: 201 });
  } catch (error) {
    console.error('Create volunteer error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
