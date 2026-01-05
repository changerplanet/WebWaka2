/**
 * MODULE 1: Inventory & Warehouse Management
 * Reorder Suggestions API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReorderSuggestionEngine } from '@/lib/inventory/reorder-service';
import { getCurrentSession } from '@/lib/auth';

// GET /api/inventory/reorder-suggestions - List suggestions
// POST /api/inventory/reorder-suggestions - Generate new suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const productId = searchParams.get('productId');
    const locationId = searchParams.get('locationId');
    const supplierId = searchParams.get('supplierId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await ReorderSuggestionEngine.listSuggestions(
      session.activeTenantId,
      {
        status: status || undefined,
        urgency: urgency || undefined,
        productId: productId || undefined,
        locationId: locationId || undefined,
        supplierId: supplierId || undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Reorder Suggestions API] List error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Generate suggestions based on active rules
    const suggestions = await ReorderSuggestionEngine.generateSuggestions(
      session.activeTenantId,
      {
        ruleId: body.ruleId,
        productId: body.productId,
        locationId: body.locationId,
      }
    );

    return NextResponse.json({
      suggestions,
      count: suggestions.length,
      message: `Generated ${suggestions.length} reorder suggestion(s)`,
    });
  } catch (error) {
    console.error('[Reorder Suggestions API] Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
