/**
 * MODULE 1: Inventory & Warehouse Management
 * Reorder Rules API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReorderRuleService } from '@/lib/inventory/reorder-service';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';

// GET /api/inventory/reorder-rules - List rules
// POST /api/inventory/reorder-rules - Create rule
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');
    const triggerType = searchParams.get('triggerType');
    const isActive = searchParams.get('isActive');

    const rules = await ReorderRuleService.list(session.activeTenantId, {
      productId: productId || undefined,
      categoryId: categoryId || undefined,
      locationId: locationId || undefined,
      triggerType: triggerType || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('[Reorder Rules API] List error:', error);
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

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
    if (guardResult) return guardResult;

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.triggerType) {
      return NextResponse.json(
        { error: 'name and triggerType are required' },
        { status: 400 }
      );
    }

    // Validate trigger type specific requirements
    if (body.triggerType === 'BELOW_THRESHOLD' && !body.reorderPoint) {
      return NextResponse.json(
        { error: 'reorderPoint is required for BELOW_THRESHOLD trigger' },
        { status: 400 }
      );
    }

    if (body.triggerType === 'VELOCITY_BASED' && !body.minDaysOfStock) {
      return NextResponse.json(
        { error: 'minDaysOfStock is required for VELOCITY_BASED trigger' },
        { status: 400 }
      );
    }

    const rule = await ReorderRuleService.create(session.activeTenantId, body);

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('[Reorder Rules API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
