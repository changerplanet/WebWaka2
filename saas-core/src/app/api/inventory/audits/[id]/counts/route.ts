/**
 * MODULE 1: Inventory & Warehouse Management
 * Record Audit Counts Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/audits/[id]/counts - Record counts
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

    if (!body.counts || !Array.isArray(body.counts) || body.counts.length === 0) {
      return NextResponse.json(
        { error: 'counts array is required' },
        { status: 400 }
      );
    }

    // Validate count entries
    for (const count of body.counts) {
      if (!count.productId || count.countedQuantity === undefined) {
        return NextResponse.json(
          { error: 'Each count must have productId and countedQuantity' },
          { status: 400 }
        );
      }
      if (count.countedQuantity < 0) {
        return NextResponse.json(
          { error: 'countedQuantity cannot be negative' },
          { status: 400 }
        );
      }
    }

    const audit = await InventoryAuditService.recordCount(
      session.activeTenantId,
      id,
      body.counts,
      session.user.id,
      session.user.name || session.user.email || 'unknown'
    );

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('[Audit API] Record counts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
