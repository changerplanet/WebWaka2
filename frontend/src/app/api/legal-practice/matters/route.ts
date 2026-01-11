export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Matters API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createMatter, 
  getMatters, 
  getMatterStats,
  checkConflict,
  type CreateMatterInput,
  type MatterFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/matters
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Stats endpoint
    if (searchParams.get('stats') === 'true') {
      const stats = await getMatterStats(tenantId);
      return NextResponse.json(stats);
    }

    // Conflict check endpoint
    if (searchParams.get('conflictCheck')) {
      const partyName = searchParams.get('conflictCheck')!;
      const excludeMatterId = searchParams.get('excludeMatterId') || undefined;
      const conflicts = await checkConflict(tenantId, partyName, excludeMatterId);
      return NextResponse.json({ conflicts });
    }

    const filters: MatterFilters = {
      status: searchParams.get('status') as any,
      matterType: searchParams.get('matterType') as any,
      clientId: searchParams.get('clientId') || undefined,
      leadLawyerId: searchParams.get('leadLawyerId') || undefined,
      court: searchParams.get('court') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await getMatters(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/matters error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/matters
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateMatterInput = await request.json();

    if (!body.title || !body.matterType || !body.clientId || !body.clientName) {
      return NextResponse.json(
        { error: 'Missing required fields: title, matterType, clientId, clientName' },
        { status: 400 }
      );
    }

    const matter = await createMatter(tenantId, body, platformInstanceId || undefined, userId || undefined);
    return NextResponse.json(matter, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/matters error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
