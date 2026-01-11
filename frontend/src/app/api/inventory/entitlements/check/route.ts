export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Entitlements Check API - Check specific entitlement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  InventoryEntitlementsService,
  INVENTORY_ENTITLEMENTS,
  InventoryEntitlement,
} from '@/lib/inventory/entitlements-service';

// POST /api/inventory/entitlements/check - Check a specific entitlement
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entitlement, value, currentUsage } = body;

    if (!entitlement) {
      return NextResponse.json(
        { error: 'entitlement is required' },
        { status: 400 }
      );
    }

    // Validate entitlement key exists
    const validEntitlements = Object.values(INVENTORY_ENTITLEMENTS);
    if (!validEntitlements.includes(entitlement)) {
      return NextResponse.json(
        { error: `Invalid entitlement: ${entitlement}` },
        { status: 400 }
      );
    }

    let result;

    // Check based on entitlement type
    if (value !== undefined) {
      // Check if value is allowed
      result = await InventoryEntitlementsService.checkAllowedValue(
        session.activeTenantId,
        entitlement as InventoryEntitlement,
        value
      );
    } else if (currentUsage !== undefined) {
      // Check limit
      result = await InventoryEntitlementsService.checkLimit(
        session.activeTenantId,
        entitlement as InventoryEntitlement,
        currentUsage
      );
    } else {
      // Check feature
      result = await InventoryEntitlementsService.checkFeature(
        session.activeTenantId,
        entitlement as InventoryEntitlement
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[Entitlements API] Check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
