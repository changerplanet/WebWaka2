export const dynamic = 'force-dynamic'

/**
 * RECRUITMENT SUITE — Offers API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/offers - List offers with filters
 * POST /api/recruitment/offers - Create new offer
 */

import { NextResponse } from 'next/server';
import {
  createOffer,
  getOffers,
  getOfferByApplication,
  getOfferStats,
  type CreateOfferInput,
  type OfferFilters,
} from '@/lib/recruitment';

// GET /api/recruitment/offers
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Check if stats only
    if (searchParams.get('stats') === 'true') {
      const stats = await getOfferStats(tenantId);
      return NextResponse.json(stats);
    }

    // Check if by application
    const applicationId = searchParams.get('applicationId');
    if (applicationId && searchParams.get('single') === 'true') {
      const offer = await getOfferByApplication(tenantId, applicationId);
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
      }
      return NextResponse.json(offer);
    }

    const filters: OfferFilters = {
      applicationId: applicationId || undefined,
      status: searchParams.get('status') as any,
      startDateFrom: searchParams.get('startDateFrom') ? new Date(searchParams.get('startDateFrom')!) : undefined,
      startDateTo: searchParams.get('startDateTo') ? new Date(searchParams.get('startDateTo')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getOffers(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/recruitment/offers error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/offers
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id') || tenantId;
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body: CreateOfferInput = await request.json();

    if (!body.applicationId || !body.position || body.baseSalary === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, position, baseSalary' },
        { status: 400 }
      );
    }

    const offer = await createOffer(tenantId, platformInstanceId!, body, userId || undefined);
    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error('POST /api/recruitment/offers error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
