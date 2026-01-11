export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Approve Audit Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/audits/[id]/approve - Approve audit
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
    const body = await request.json().catch(() => ({}));

    const audit = await InventoryAuditService.approve(
      session.activeTenantId,
      id,
      session.user.id,
      session.user.name || session.user.email || 'unknown',
      body.itemIds // Optional: specific items to approve
    );

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('[Audit API] Approve error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Cannot') ? 400 : 500 }
    );
  }
}
