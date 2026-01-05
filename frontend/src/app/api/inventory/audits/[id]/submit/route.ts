/**
 * MODULE 1: Inventory & Warehouse Management
 * Submit Audit for Review Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/audits/[id]/submit - Submit for review
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

    const audit = await InventoryAuditService.submitForReview(
      session.activeTenantId,
      id
    );

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('[Audit API] Submit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Cannot') ? 400 : 500 }
    );
  }
}
