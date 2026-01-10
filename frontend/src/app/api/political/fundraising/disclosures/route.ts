/**
 * Political Suite - Disclosures API Route (Phase 2)
 * Reporting & Aggregation
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * 
 * All disclosures must include UNOFFICIAL disclaimers.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateDisclosure,
  queryDisclosures,
  PolDisclosureType,
  PolDisclosureStatus,
} from '@/lib/political';

const MANDATORY_DISCLAIMER = 'UNOFFICIAL - FOR INTERNAL PARTY USE ONLY. NOT AN OFFICIAL REGULATORY FILING.';

// GET /api/political/fundraising/disclosures - Query disclosures
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
      campaignId: searchParams.get('campaignId') || undefined,
      partyId: searchParams.get('partyId') || undefined,
      type: searchParams.get('type') as PolDisclosureType | undefined,
      status: searchParams.get('status') as PolDisclosureStatus | undefined,
      state: searchParams.get('state') || undefined,
      fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
      toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const result = await queryDisclosures(tenantId, filters);
    return NextResponse.json({
      ...result,
      _mandatory_notice: MANDATORY_DISCLAIMER,
    });
  } catch (error) {
    console.error('Query disclosures error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/political/fundraising/disclosures - Generate disclosure
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
    if ((!body.campaignId && !body.partyId) || !body.title || !body.type || 
        !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { 
          error: 'campaignId or partyId, title, type, periodStart, and periodEnd are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Parse dates
    body.periodStart = new Date(body.periodStart);
    body.periodEnd = new Date(body.periodEnd);

    const disclosure = await generateDisclosure(tenantId, body, actorId);
    return NextResponse.json(disclosure, { status: 201 });
  } catch (error) {
    console.error('Generate disclosure error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
