export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Audit Variance Summary Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/audits/[id]/variance - Get variance summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const summary = await InventoryAuditService.getVarianceSummary(
      session.activeTenantId,
      id
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[Audit API] Variance summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}
