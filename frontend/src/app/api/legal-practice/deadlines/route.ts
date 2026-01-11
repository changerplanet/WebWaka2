export const dynamic = 'force-dynamic'

/**
 * LEGAL PRACTICE SUITE — Deadlines API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  createDeadline, 
  getDeadlines, 
  getDeadlineStats,
  getUpcomingDeadlines,
  getOverdueDeadlines,
  type CreateDeadlineInput,
  type DeadlineFilters 
} from '@/lib/legal-practice';

// GET /api/legal-practice/deadlines
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Stats endpoint
    if (searchParams.get('stats') === 'true') {
      const stats = await getDeadlineStats(tenantId);
      return NextResponse.json(stats);
    }

    // Upcoming endpoint
    if (searchParams.get('upcoming') === 'true') {
      const days = parseInt(searchParams.get('days') || '7');
      const deadlines = await getUpcomingDeadlines(tenantId, days);
      return NextResponse.json({ deadlines });
    }

    // Overdue endpoint
    if (searchParams.get('overdue') === 'true') {
      const deadlines = await getOverdueDeadlines(tenantId);
      return NextResponse.json({ deadlines });
    }

    const filters: DeadlineFilters = {
      matterId: searchParams.get('matterId') || undefined,
      deadlineType: searchParams.get('deadlineType') as any,
      status: searchParams.get('status') as any,
      assignedTo: searchParams.get('assignedTo') || undefined,
      dueDateFrom: searchParams.get('dueDateFrom') ? new Date(searchParams.get('dueDateFrom')!) : undefined,
      dueDateTo: searchParams.get('dueDateTo') ? new Date(searchParams.get('dueDateTo')!) : undefined,
      priority: searchParams.get('priority') ? parseInt(searchParams.get('priority')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getDeadlines(tenantId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/legal-practice/deadlines error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/legal-practice/deadlines
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    const body: CreateDeadlineInput = await request.json();

    if (!body.matterId || !body.deadlineType || !body.title || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: matterId, deadlineType, title, dueDate' },
        { status: 400 }
      );
    }

    const deadlineData = {
      ...body,
      dueDate: new Date(body.dueDate),
    };

    const deadline = await createDeadline(tenantId, deadlineData);
    return NextResponse.json(deadline, { status: 201 });
  } catch (error) {
    console.error('POST /api/legal-practice/deadlines error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
