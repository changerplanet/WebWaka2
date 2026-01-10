/**
 * REAL ESTATE MANAGEMENT — Unit Detail API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getUnitById, 
  updateUnit, 
  deleteUnit,
  type UpdateUnitInput 
} from '@/lib/real-estate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/units/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const unit = await getUnitById(tenantId, id);

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('GET /api/real-estate/units/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/real-estate/units/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateUnitInput = await request.json();

    const unit = await updateUnit(tenantId, id, body);

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('PATCH /api/real-estate/units/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/real-estate/units/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteUnit(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Unit deleted' });
  } catch (error) {
    console.error('DELETE /api/real-estate/units/[id] error:', error);
    
    if (error instanceof Error && error.message.includes('active lease')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
