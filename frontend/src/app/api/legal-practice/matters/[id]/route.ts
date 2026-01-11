export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Matter Detail API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getMatterById, 
  updateMatter,
  closeMatter,
  reopenMatter,
  type UpdateMatterInput 
} from '@/lib/legal-practice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-practice/matters/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const matter = await getMatterById(tenantId, id);

    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    return NextResponse.json(matter);
  } catch (error) {
    console.error('GET /api/legal-practice/matters/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-practice/matters/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateMatterInput = await request.json();

    const matter = await updateMatter(tenantId, id, body);

    if (!matter) {
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }

    return NextResponse.json(matter);
  } catch (error) {
    console.error('PATCH /api/legal-practice/matters/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/matters/[id]?action=close|reopen
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'close') {
      const matter = await closeMatter(tenantId, id);
      if (!matter) {
        return NextResponse.json({ error: 'Matter not found or already closed' }, { status: 400 });
      }
      return NextResponse.json(matter);
    }

    if (action === 'reopen') {
      const matter = await reopenMatter(tenantId, id);
      if (!matter) {
        return NextResponse.json({ error: 'Matter not found or not closed' }, { status: 400 });
      }
      return NextResponse.json(matter);
    }

    return NextResponse.json({ error: 'Invalid action. Use: close, reopen' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/legal-practice/matters/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
