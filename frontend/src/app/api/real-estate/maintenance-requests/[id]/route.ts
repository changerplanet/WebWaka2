/**
 * REAL ESTATE MANAGEMENT — Maintenance Request Detail API
 * Phase 7A, S3 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  assignRequest,
  startWork,
  completeRequest,
  cancelRequest,
  type UpdateMaintenanceRequestInput 
} from '@/lib/real-estate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/maintenance-requests/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const maintenanceRequest = await getMaintenanceRequestById(tenantId, id);

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('GET /api/real-estate/maintenance-requests/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/real-estate/maintenance-requests/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateMaintenanceRequestInput = await request.json();

    const maintenanceRequest = await updateMaintenanceRequest(tenantId, id, body);

    if (!maintenanceRequest) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    return NextResponse.json(maintenanceRequest);
  } catch (error) {
    console.error('PATCH /api/real-estate/maintenance-requests/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/real-estate/maintenance-requests/[id] - Status transitions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'assign') {
      const body = await request.json();
      if (!body.assignedTo || !body.assignedName) {
        return NextResponse.json({ error: 'assignedTo and assignedName required' }, { status: 400 });
      }
      const result = await assignRequest(
        tenantId, 
        id, 
        body.assignedTo, 
        body.assignedName,
        body.scheduledDate ? new Date(body.scheduledDate) : undefined
      );
      return NextResponse.json(result);
    }

    if (action === 'startWork') {
      const result = await startWork(tenantId, id);
      return NextResponse.json(result);
    }

    if (action === 'complete') {
      const body = await request.json().catch(() => ({}));
      const result = await completeRequest(tenantId, id, {
        actualCost: body.actualCost,
        costNotes: body.costNotes,
        photosAfter: body.photosAfter,
        resolutionNotes: body.resolutionNotes,
      });
      return NextResponse.json(result);
    }

    if (action === 'cancel') {
      const body = await request.json().catch(() => ({}));
      const result = await cancelRequest(tenantId, id, body.reason);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: assign, startWork, complete, cancel' }, 
      { status: 400 }
    );
  } catch (error) {
    console.error('POST /api/real-estate/maintenance-requests/[id] error:', error);
    
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not in'))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
