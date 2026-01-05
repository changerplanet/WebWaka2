/**
 * MODULE 1: Inventory & Warehouse Management
 * Single Audit API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { InventoryAuditService } from '@/lib/inventory/audit-service';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/audits/[id] - Get audit details
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
    const audit = await InventoryAuditService.getById(session.activeTenantId, id);

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({ audit });
  } catch (error) {
    console.error('[Audit API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
