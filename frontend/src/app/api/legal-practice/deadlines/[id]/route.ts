export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Deadline Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getDeadlineById, 
  updateDeadline,
  completeDeadline,
  extendDeadline,
  deleteDeadline,
  type UpdateDeadlineInput 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/deadlines/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deadline = await getDeadlineById(tenantId, id);

    if (!deadline) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    }

    return NextResponse.json(deadline);
  } catch (error) {
    console.error('GET /api/legal-practice/deadlines/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-practice/deadlines/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateDeadlineInput = await request.json();

    const deadline = await updateDeadline(tenantId, id, body);

    if (!deadline) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    }

    return NextResponse.json(deadline);
  } catch (error) {
    console.error('PATCH /api/legal-practice/deadlines/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/deadlines/[id]?action=complete|extend
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

    if (action === 'complete') {
      const deadline = await completeDeadline(tenantId, id, userId || undefined);
      if (!deadline) {
        return NextResponse.json({ error: 'Deadline not found or not pending' }, { status: 400 });
      }
      return NextResponse.json(deadline);
    }

    if (action === 'extend') {
      const body = await request.json();
      if (!body.newDueDate) {
        return NextResponse.json({ error: 'newDueDate required' }, { status: 400 });
      }
      const deadline = await extendDeadline(tenantId, id, new Date(body.newDueDate), body.notes);
      if (!deadline) {
        return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
      }
      return NextResponse.json(deadline);
    }

    return NextResponse.json({ error: 'Invalid action. Use: complete, extend' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/legal-practice/deadlines/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal-practice/deadlines/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteDeadline(tenantId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Deadline not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deadline deleted' });
  } catch (error) {
    console.error('DELETE /api/legal-practice/deadlines/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
