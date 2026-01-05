/**
 * MODULE 1: Inventory & Warehouse Management
 * Single Transfer API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockTransferService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/transfers/[id] - Get transfer
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
    const transfer = await StockTransferService.getById(session.activeTenantId, id);

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('[Transfer API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
