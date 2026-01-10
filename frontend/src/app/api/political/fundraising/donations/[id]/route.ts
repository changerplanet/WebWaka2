/**
 * Political Suite - Donation Fact Detail API Route (Phase 2)
 * FACTS ONLY — No payment processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDonationFact } from '@/lib/political';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const COMMERCE_BOUNDARY_NOTICE = {
  _commerce_boundary: 'STRICTLY ENFORCED',
  _facts_only: 'This is a FACT record. Payment execution handled by Commerce suite.',
  _append_only: 'This record is IMMUTABLE. No updates or deletes permitted.',
};

// GET /api/political/fundraising/donations/[id] - Get donation fact details
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

    const fact = await getDonationFact(tenantId, id);

    if (!fact) {
      return NextResponse.json(
        { error: 'Donation fact not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...fact, ...COMMERCE_BOUNDARY_NOTICE });
  } catch (error) {
    console.error('Get donation fact error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Block all modifications - APPEND-ONLY
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Donation facts are APPEND-ONLY. Updates are not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Donation facts are APPEND-ONLY. Updates are not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Donation facts are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Use /api/political/fundraising/donations to record new donation facts.',
      code: 'INVALID_ENDPOINT',
    },
    { status: 400 }
  );
}
