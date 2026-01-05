/**
 * MODULE 1: Inventory & Warehouse Management
 * Reject Reorder Suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReorderSuggestionEngine } from '@/lib/inventory/reorder-service';
import { getCurrentSession } from '@/lib/auth';

// POST /api/inventory/reorder-suggestions/[id]/reject
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

    await ReorderSuggestionEngine.rejectSuggestion(
      session.activeTenantId,
      id,
      session.user.id,
      session.user.name || session.user.email || 'unknown',
      body.reason
    );

    return NextResponse.json({ success: true, message: 'Suggestion rejected' });
  } catch (error) {
    console.error('[Reorder Suggestions API] Reject error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}
