export const dynamic = 'force-dynamic'

/**
 * MODULE 1: Inventory & Warehouse Management
 * Entitlements API - Get tenant entitlements and usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  InventoryEntitlementsService,
  INVENTORY_ENTITLEMENTS,
} from '@/lib/inventory/entitlements-service';

// GET /api/inventory/entitlements - Get tenant entitlements
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entitlements = await InventoryEntitlementsService.getAllEntitlements(
      session.activeTenantId
    );

    return NextResponse.json({
      entitlements,
      definitions: INVENTORY_ENTITLEMENTS,
    });
  } catch (error) {
    console.error('[Entitlements API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
