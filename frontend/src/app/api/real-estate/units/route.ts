export const dynamic = 'force-dynamic'

/**
 * REAL ESTATE MANAGEMENT — Units API
 * Phase 7A, S3 API Routes
 * 
 * REST API for unit management.
 */

import { NextResponse } from 'next/server';
import { 
  createUnit, 
  getUnits,
  getVacantUnits,
  getUnitStats,
  type CreateUnitInput,
  type UnitFilters 
} from '@/lib/real-estate';
import { getEnumParam } from '@/lib/utils/urlParams';

// Valid enum values
const UNIT_STATUSES = ['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'] as const;
const UNIT_TYPES = ['FLAT', 'ROOM', 'SHOP', 'OFFICE', 'WAREHOUSE', 'PARKING'] as const;

// GET /api/real-estate/units
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Special endpoint for vacant units
    if (searchParams.get('vacant') === 'true') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const units = await getVacantUnits(tenantId, limit);
      return NextResponse.json({ units });
    }

    // Special endpoint for stats
    if (searchParams.get('stats') === 'true') {
      const propertyId = searchParams.get('propertyId') || undefined;
      const stats = await getUnitStats(tenantId, propertyId);
      return NextResponse.json(stats);
    }

    const filters: UnitFilters = {
      propertyId: searchParams.get('propertyId') || undefined,
      status: getEnumParam(searchParams, 'status', UNIT_STATUSES),
      unitType: getEnumParam(searchParams, 'unitType', UNIT_TYPES),
      minRent: searchParams.get('minRent') ? parseFloat(searchParams.get('minRent')!) : undefined,
      maxRent: searchParams.get('maxRent') ? parseFloat(searchParams.get('maxRent')!) : undefined,
      bedrooms: searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getUnits(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/real-estate/units error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/units
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateUnitInput = await request.json();

    // Validate required fields
    if (!body.propertyId || !body.unitNumber || !body.unitType || body.monthlyRent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, unitNumber, unitType, monthlyRent' },
        { status: 400 }
      );
    }

    const unit = await createUnit(tenantId, body);

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error('POST /api/real-estate/units error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
