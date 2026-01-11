export const dynamic = 'force-dynamic'

/**
 * Political Suite - Volunteer Detail API Route
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getVolunteer,
  updateVolunteer,
  trainVolunteer,
  logVolunteerActivity,
} from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/political/volunteers/[id] - Get volunteer details
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

    const volunteer = await getVolunteer(tenantId, id);

    if (!volunteer) {
      return NextResponse.json(
        { error: 'Volunteer not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(volunteer);
  } catch (error) {
    console.error('Get volunteer error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/political/volunteers/[id] - Update volunteer
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
    
    // Parse dates if provided
    if (body.availableFrom) body.availableFrom = new Date(body.availableFrom);
    if (body.availableTo) body.availableTo = new Date(body.availableTo);

    const volunteer = await updateVolunteer(tenantId, id, body, actorId);
    return NextResponse.json(volunteer);
  } catch (error) {
    console.error('Update volunteer error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Volunteer not found' ? 404 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}

// POST /api/political/volunteers/[id] - Actions (train, log activity)
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
      case 'train':
        const trainedVolunteer = await trainVolunteer(tenantId, id, actorId);
        return NextResponse.json(trainedVolunteer);

      case 'logActivity':
        if (typeof data.hours !== 'number' || typeof data.tasksCompleted !== 'number') {
          return NextResponse.json(
            { error: 'Hours and tasks completed are required', code: 'VALIDATION_ERROR' },
            { status: 400 }
          );
        }
        const updatedVolunteer = await logVolunteerActivity(
          tenantId, id, data.hours, data.tasksCompleted, actorId
        );
        return NextResponse.json(updatedVolunteer);

      default:
        return NextResponse.json(
          { error: 'Unknown action', code: 'INVALID_ACTION' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Volunteer action error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Volunteer not found' ? 404 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
