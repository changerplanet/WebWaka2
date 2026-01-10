/**
 * LEGAL PRACTICE SUITE — Dashboard API
 * Phase 7B.1, S4 API Routes
 */

import { NextResponse } from 'next/server';
import { 
  getMatterStats,
  getTimeStats,
  getDeadlineStats,
  getRetainerStats,
  getUpcomingDeadlines,
} from '@/lib/legal-practice';

// GET /api/legal-practice/dashboard
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Tenant context required' }, { status: 401 });
    }

    // Fetch all dashboard stats in parallel
    const [
      matterStats,
      timeStats,
      deadlineStats,
      retainerStats,
      upcomingDeadlines,
    ] = await Promise.all([
      getMatterStats(tenantId),
      getTimeStats(tenantId),
      getDeadlineStats(tenantId),
      getRetainerStats(tenantId),
      getUpcomingDeadlines(tenantId, 7),
    ]);

    return NextResponse.json({
      matters: matterStats,
      time: timeStats,
      deadlines: deadlineStats,
      retainers: retainerStats,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
    });
  } catch (error) {
    console.error('GET /api/legal-practice/dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
