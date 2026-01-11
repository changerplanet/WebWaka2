export const dynamic = 'force-dynamic'

/**
 * REAL ESTATE MANAGEMENT — Leases API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createLease, 
  getLeases,
  getLeaseStats,
  getExpiringLeases,
  type CreateLeaseInput,
  type LeaseFilters 
} from '@/lib/real-estate';

// GET /api/real-estate/leases
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Special endpoint for stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getLeaseStats(tenantId);
      return NextResponse.json(stats);
    }

    // Special endpoint for expiring leases
    if (searchParams.get('expiring') === 'true') {
      const days = parseInt(searchParams.get('days') || '30');
      const leases = await getExpiringLeases(tenantId, days);
      return NextResponse.json({ leases });
    }

    const filters: LeaseFilters = {
      status: searchParams.get('status') as any,
      unitId: searchParams.get('unitId') || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      tenantSearch: searchParams.get('tenantSearch') || undefined,
      expiringWithinDays: searchParams.get('expiringWithinDays') 
        ? parseInt(searchParams.get('expiringWithinDays')!) 
        : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getLeases(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/real-estate/leases error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/leases
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateLeaseInput = await request.json();

    // Validate required fields
    if (!body.unitId || !body.tenantName || !body.tenantPhone || !body.startDate || !body.endDate || body.monthlyRent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: unitId, tenantName, tenantPhone, startDate, endDate, monthlyRent' },
        { status: 400 }
      );
    }

    // Parse dates
    const leaseData = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    };

    const lease = await createLease(tenantId, leaseData, userId || undefined);

    return NextResponse.json(lease, { status: 201 });
  } catch (error) {
    console.error('POST /api/real-estate/leases error:', error);
    
    if (error instanceof Error && (error.message.includes('not available') || error.message.includes('active lease'))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
