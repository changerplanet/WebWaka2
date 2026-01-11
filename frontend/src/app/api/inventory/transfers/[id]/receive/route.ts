export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Transfer Receive Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockTransferService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/transfers/[id]/receive - Receive transfer items
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

    if (!body.items?.length) {
      return NextResponse.json(
        { error: 'items array is required with received quantities' },
        { status: 400 }
      );
    }

    const transfer = await StockTransferService.receive(
      session.activeTenantId,
      id,
      body,
      session.user.id,
      session.user.name || session.user.email || 'unknown'
    );

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('[Transfer API] Receive error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Cannot') ? 400 : 500 }
    );
  }
}
