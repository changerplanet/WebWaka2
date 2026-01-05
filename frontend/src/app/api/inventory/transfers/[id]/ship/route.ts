/**
 * MODULE 1: Inventory & Warehouse Management
 * Transfer Ship Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { StockTransferService } from '@/lib/inventory';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/transfers/[id]/ship - Ship transfer items
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
        { error: 'items array is required with shipped quantities' },
        { status: 400 }
      );
    }

    const transfer = await StockTransferService.ship(
      session.activeTenantId,
      id,
      body,
      session.user.id,
      session.user.name || session.user.email || 'unknown'
    );

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('[Transfer API] Ship error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('Cannot') ? 400 : 500 }
    );
  }
}
