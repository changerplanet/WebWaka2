export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Transfer Cancel Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockTransferService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/transfers/[id]/cancel - Cancel transfer
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

    if (!body.reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const transfer = await StockTransferService.cancel(
      session.activeTenantId,
      id,
      session.user.id,
      session.user.name || session.user.email || 'unknown',
      body.reason
    );

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('[Transfer API] Cancel error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Cannot') ? 400 : 500 }
    );
  }
}
