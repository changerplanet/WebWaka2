/**
 * REAL ESTATE MANAGEMENT — Lease Detail API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getLeaseById, 
  updateLease,
  activateLease,
  terminateLease,
  type UpdateLeaseInput 
} from '@/lib/real-estate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/leases/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const lease = await getLeaseById(tenantId, id);

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error('GET /api/real-estate/leases/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/real-estate/leases/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateLeaseInput = await request.json();

    const lease = await updateLease(tenantId, id, body);

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error('PATCH /api/real-estate/leases/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/leases/[id] with action parameter
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'activate') {
      const lease = await activateLease(tenantId, id);
      return NextResponse.json(lease);
    }

    if (action === 'terminate') {
      const body = await request.json().catch(() => ({}));
      const lease = await terminateLease(tenantId, id, body.reason);
      return NextResponse.json(lease);
    }

    return NextResponse.json({ error: 'Invalid action. Use: activate, terminate' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/real-estate/leases/[id] error:', error);
    
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not in'))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
