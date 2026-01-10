/**
 * REAL ESTATE MANAGEMENT — Properties API
 * Phase 7A, S3 API Routes
 * 
 * REST API for property management.
 * Tenant-scoped access only.
 */

import { NextResponse } from 'next/server';
import { 
  createProperty, 
  getProperties, 
  getPropertyStats,
  type CreatePropertyInput,
  type PropertyFilters 
} from '@/lib/real-estate';

// GET /api/real-estate/properties
export async function GET(request: Request) {
  try {
    // Extract tenant context from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters: PropertyFilters = {
      status: searchParams.get('status') as any,
      propertyType: searchParams.get('propertyType') as any,
      state: searchParams.get('state') || undefined,
      city: searchParams.get('city') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getProperties(tenantId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/real-estate/properties error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/properties
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreatePropertyInput = await request.json();

    // Validate required fields
    if (!body.name || !body.propertyType || !body.address || !body.city || !body.state) {
      return NextResponse.json(
        { error: 'Missing required fields: name, propertyType, address, city, state' },
        { status: 400 }
      );
    }

    const property = await createProperty(tenantId, body, platformInstanceId || undefined, userId || undefined);

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('POST /api/real-estate/properties error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
