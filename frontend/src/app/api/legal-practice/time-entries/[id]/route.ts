export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Time Entry Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getTimeEntryById, 
  updateTimeEntry,
  approveTimeEntry,
  deleteTimeEntry,
  type UpdateTimeEntryInput 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/time-entries/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const entry = await getTimeEntryById(tenantId, id);

    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('GET /api/legal-practice/time-entries/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-practice/time-entries/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateTimeEntryInput = await request.json();

    const entry = await updateTimeEntry(tenantId, id, body);

    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('PATCH /api/legal-practice/time-entries/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/time-entries/[id]?action=approve
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'approve') {
      const entry = await approveTimeEntry(tenantId, id, userId || 'system');
      if (!entry) {
        return NextResponse.json({ error: 'Time entry not found or already approved' }, { status: 400 });
      }
      return NextResponse.json(entry);
    }

    return NextResponse.json({ error: 'Invalid action. Use: approve' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/legal-practice/time-entries/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal-practice/time-entries/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteTimeEntry(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Time entry deleted' });
  } catch (error) {
    console.error('DELETE /api/legal-practice/time-entries/[id] error:', error);
    
    if (error instanceof Error && error.message.includes('invoiced')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
