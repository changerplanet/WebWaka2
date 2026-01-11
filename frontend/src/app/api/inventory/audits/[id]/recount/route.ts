export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Request Recount Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/audits/[id]/recount - Request recount for items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.itemIds || !Array.isArray(body.itemIds) || body.itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds array is required' },
        { status: 400 }
      );
    }

    if (!body.reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const audit = await InventoryAuditService.requestRecount(
      session.activeTenantId,
      id,
      body.itemIds,
      body.reason
    );

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('[Audit API] Recount error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
