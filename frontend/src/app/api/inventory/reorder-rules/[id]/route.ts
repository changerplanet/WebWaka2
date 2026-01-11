export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Single Reorder Rule API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReorderRuleService } from '@/lib/inventory/reorder-service';
import { getCurrentSession } from '@/lib/auth';

// PATCH /api/inventory/reorder-rules/[id] - Update rule
// DELETE /api/inventory/reorder-rules/[id] - Deactivate rule
export async function PATCH(
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

    const rule = await ReorderRuleService.update(session.activeTenantId, id, body);

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('[Reorder Rules API] Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await ReorderRuleService.deactivate(session.activeTenantId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Reorder Rules API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}
