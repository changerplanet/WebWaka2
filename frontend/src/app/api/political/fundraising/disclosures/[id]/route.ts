/**
 * Political Suite - Disclosure Detail API Route (Phase 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDisclosure, submitDisclosure } from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MANDATORY_DISCLAIMER = 'UNOFFICIAL - FOR INTERNAL PARTY USE ONLY. NOT AN OFFICIAL REGULATORY FILING.';

// GET /api/political/fundraising/disclosures/[id] - Get disclosure details
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

    const disclosure = await getDisclosure(tenantId, id);

    if (!disclosure) {
      return NextResponse.json(
        { error: 'Disclosure not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(disclosure);
  } catch (error) {
    console.error('Get disclosure error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/fundraising/disclosures/[id] - Submit disclosure
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
    const { action, submittedTo } = body;

    if (action !== 'submit') {
      return NextResponse.json(
        {
          error: 'Only "submit" action is permitted.',
          code: 'INVALID_ACTION',
          allowed_actions: ['submit'],
        },
        { status: 400 }
      );
    }

    if (!submittedTo) {
      return NextResponse.json(
        { error: 'submittedTo is required for submission', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const disclosure = await submitDisclosure(tenantId, id, actorId, submittedTo);
    return NextResponse.json({
      ...disclosure,
      _submission_notice: 'Disclosure submitted. Marked UNOFFICIAL per governance requirements.',
      _mandatory_notice: MANDATORY_DISCLAIMER,
    });
  } catch (error) {
    console.error('Submit disclosure error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 :
                   message.includes('Only draft') ? 400 : 500;
    return NextResponse.json(
      { error: message, code: status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_STATE' : 'INTERNAL_ERROR' },
      { status }
    );
  }
}
