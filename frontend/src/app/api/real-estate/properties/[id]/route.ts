/**
 * REAL ESTATE MANAGEMENT — Property Detail API
 * Phase 7A, S3 API Routes
 * 
 * Single property operations (GET, PATCH, DELETE).
 */

import { NextResponse } from 'next/server';
import { 
  getPropertyById, 
  updateProperty, 
  deleteProperty,
  type UpdatePropertyInput 
} from '@/lib/real-estate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/properties/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const property = await getPropertyById(tenantId, id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('GET /api/real-estate/properties/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/real-estate/properties/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdatePropertyInput = await request.json();

    const property = await updateProperty(tenantId, id, body);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('PATCH /api/real-estate/properties/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/real-estate/properties/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteProperty(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Property deleted' });
  } catch (error) {
    console.error('DELETE /api/real-estate/properties/[id] error:', error);
    
    // Handle specific errors
    if (error instanceof Error && error.message.includes('active leases')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
