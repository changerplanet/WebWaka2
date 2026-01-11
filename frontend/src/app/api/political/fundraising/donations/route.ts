export const dynamic = 'force-dynamic'

/**
 * Political Suite - Donations API Route (Phase 2)
 * FACTS ONLY — No payment processing
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: STRICTLY ENFORCED
 * 
 * CRITICAL: This API records DONATION FACTS only.
 * Records are APPEND-ONLY — no updates or deletes.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordDonationFact,
  queryDonationFacts,
  getDonationStats,
  PolDonationSource,
  PolDonationStatus,
} from '@/lib/political';

const COMMERCE_BOUNDARY_NOTICE = {
  _commerce_boundary: 'STRICTLY ENFORCED',
  _facts_only: 'Records FACTS only. Payment execution handled by Commerce suite.',
  _append_only: 'Records are APPEND-ONLY. No updates or deletes permitted.',
};

// GET /api/political/fundraising/donations - Query donation facts
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
      const partyId = searchParams.get('partyId') || undefined;
      const stats = await getDonationStats(tenantId, campaignId, partyId);
      return NextResponse.json({ ...stats, ...COMMERCE_BOUNDARY_NOTICE });
    }

    const filters = {
      campaignId: searchParams.get('campaignId') || undefined,
      partyId: searchParams.get('partyId') || undefined,
      source: searchParams.get('source') as PolDonationSource | undefined,
      status: searchParams.get('status') as PolDonationStatus | undefined,
      state: searchParams.get('state') || undefined,
      lga: searchParams.get('lga') || undefined,
      ward: searchParams.get('ward') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      requiresDisclosure: searchParams.get('requiresDisclosure') === 'true' ? true :
                          searchParams.get('requiresDisclosure') === 'false' ? false : undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await queryDonationFacts(tenantId, filters);
    return NextResponse.json({ ...result, ...COMMERCE_BOUNDARY_NOTICE });
  } catch (error) {
    console.error('Query donations error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/fundraising/donations - Record donation fact (APPEND-ONLY)
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
    if ((!body.campaignId && !body.partyId) || !body.amount || !body.source || !body.donationDate) {
      return NextResponse.json(
        { 
          error: 'campaignId or partyId, amount, source, and donationDate are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Parse date
    body.donationDate = new Date(body.donationDate);
    if (body.receiptDate) body.receiptDate = new Date(body.receiptDate);

    const fact = await recordDonationFact(tenantId, body, actorId);
    return NextResponse.json(
      { ...fact, ...COMMERCE_BOUNDARY_NOTICE },
      { status: 201 }
    );
  } catch (error) {
    console.error('Record donation fact error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Block updates - APPEND-ONLY
export async function PUT() {
  return NextResponse.json(
    {
      error: 'Donation facts are APPEND-ONLY. Updates are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Financial facts must remain immutable for audit purposes.',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Donation facts are APPEND-ONLY. Updates are not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Financial facts must remain immutable for audit purposes.',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Donation facts are IMMUTABLE. Deletion is not permitted.',
      code: 'FORBIDDEN',
      _reason: 'Financial facts must remain immutable for audit purposes.',
    },
    { status: 403 }
  );
}
