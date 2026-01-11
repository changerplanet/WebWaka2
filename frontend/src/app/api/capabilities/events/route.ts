export const dynamic = 'force-dynamic'

/**
 * GET /api/capabilities/events
 * 
 * Get capability activation event log for the current tenant.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { CapabilityActivationService } from '@/lib/capabilities/activation-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user || !session?.activeTenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const capabilityKey = searchParams.get('capability') || undefined;
    const eventType = searchParams.get('eventType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await CapabilityActivationService.getEventLog(
      session.activeTenantId,
      {
        capabilityKey,
        eventType,
        limit: Math.min(limit, 100), // Cap at 100
        offset,
      }
    );

    return NextResponse.json({
      events: result.events,
      total: result.total,
      limit,
      offset,
      hasMore: offset + limit < result.total,
    });
  } catch (error) {
    console.error('Error fetching capability events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capability events' },
      { status: 500 }
    );
  }
}
