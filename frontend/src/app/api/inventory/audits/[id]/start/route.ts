/**
 * MODULE 1: Inventory & Warehouse Management
 * Start Audit Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/audits/[id]/start - Start audit
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

    const audit = await InventoryAuditService.start(
      session.activeTenantId,
      id,
      session.user.id,
      session.user.name || session.user.email || 'unknown'
    );

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('[Audit API] Start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Cannot') ? 400 : 500 }
    );
  }
}
