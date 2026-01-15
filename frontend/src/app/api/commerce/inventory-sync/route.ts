/**
 * Inventory Sync API
 * Wave 2.4: Inventory Sync & Low Stock
 * 
 * Cross-channel stock visibility, low-stock detection, and traceability.
 * Read-only visibility only. NO automation, NO background jobs.
 * 
 * Authorization:
 * - Tenant Admins can access inventory data for their tenant
 * - Super Admins can access any tenant's inventory data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { ChannelType } from '@prisma/client';
import {
  createInventorySyncService,
  createLowStockService,
  createStockTraceabilityService,
  TimeFilter,
} from '@/lib/commerce/inventory-sync';

async function authorizeAccess(
  userGlobalRole: string | null,
  tenantId: string,
  memberships: Array<{ tenantId: string; role: string; isActive: boolean }>
): Promise<{ authorized: boolean; error?: string }> {
  if (userGlobalRole === 'SUPER_ADMIN') {
    return { authorized: true };
  }

  const tenantMembership = memberships.find(
    m => m.tenantId === tenantId && m.isActive
  );

  if (!tenantMembership) {
    return { authorized: false, error: 'Not a member of this tenant' };
  }

  if (tenantMembership.role !== 'TENANT_ADMIN') {
    return { authorized: false, error: 'Admin access required for inventory visibility' };
  }

  return { authorized: true };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const authResult = await authorizeAccess(
      session.user.globalRole,
      tenantId,
      session.user.memberships || []
    );

    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'stock';
    const period = searchParams.get('period') as TimeFilter['period'] || '30d';
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');
    const channel = searchParams.get('channel') as ChannelType | null;
    const locationId = searchParams.get('locationId');
    const severity = searchParams.get('severity') as 'CRITICAL' | 'WARNING' | 'ATTENTION' | null;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const filter: TimeFilter = { period };

    switch (view) {
      case 'stock': {
        const syncService = createInventorySyncService(tenantId);
        
        if (productId) {
          const stockView = await syncService.getProductStockView(productId);
          if (!stockView) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          }
          return NextResponse.json({ product: stockView });
        }

        const { products, total } = await syncService.getMultiProductStockViews({
          categoryId: categoryId || undefined,
          channelFilter: channel || undefined,
          lowStockOnly,
          limit,
          offset,
        });
        return NextResponse.json({ products, total, limit, offset });
      }

      case 'channel-summary': {
        if (!channel) {
          return NextResponse.json({ error: 'Missing required parameter: channel' }, { status: 400 });
        }
        const syncService = createInventorySyncService(tenantId);
        const summary = await syncService.getChannelStockSummary(channel);
        return NextResponse.json({ summary });
      }

      case 'movements': {
        if (!productId) {
          return NextResponse.json({ error: 'Missing required parameter: productId' }, { status: 400 });
        }
        const syncService = createInventorySyncService(tenantId);
        const { movements, total } = await syncService.getStockMovementHistory(
          productId,
          filter,
          { limit, offset }
        );
        return NextResponse.json({ movements, total, limit, offset });
      }

      case 'low-stock': {
        const lowStockService = createLowStockService(tenantId);
        const { products, total } = await lowStockService.getLowStockProducts({
          categoryId: categoryId || undefined,
          channelFilter: channel || undefined,
          severityFilter: severity || undefined,
          limit,
          offset,
        });
        return NextResponse.json({ products, total, limit, offset });
      }

      case 'low-stock-summary': {
        const lowStockService = createLowStockService(tenantId);
        const summary = await lowStockService.getLowStockSummary();
        return NextResponse.json({ summary });
      }

      case 'channel-low-stock': {
        if (!channel) {
          return NextResponse.json({ error: 'Missing required parameter: channel' }, { status: 400 });
        }
        const lowStockService = createLowStockService(tenantId);
        const result = await lowStockService.getChannelLowStock(channel);
        return NextResponse.json(result);
      }

      case 'category-low-stock': {
        if (!categoryId) {
          return NextResponse.json({ error: 'Missing required parameter: categoryId' }, { status: 400 });
        }
        const lowStockService = createLowStockService(tenantId);
        const result = await lowStockService.getCategoryLowStock(categoryId);
        return NextResponse.json(result);
      }

      case 'traceability': {
        if (!productId) {
          return NextResponse.json({ error: 'Missing required parameter: productId' }, { status: 400 });
        }
        const traceabilityService = createStockTraceabilityService(tenantId);
        const traceability = await traceabilityService.getProductTraceability(productId, filter);
        if (!traceability) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        return NextResponse.json({ traceability });
      }

      case 'channel-sales': {
        if (!channel) {
          return NextResponse.json({ error: 'Missing required parameter: channel' }, { status: 400 });
        }
        const traceabilityService = createStockTraceabilityService(tenantId);
        const result = await traceabilityService.getChannelSalesSummary(channel, filter, { limit, offset });
        return NextResponse.json(result);
      }

      case 'location-sales': {
        if (!locationId) {
          return NextResponse.json({ error: 'Missing required parameter: locationId' }, { status: 400 });
        }
        const traceabilityService = createStockTraceabilityService(tenantId);
        const result = await traceabilityService.getLocationSalesSummary(locationId, filter, { limit, offset });
        return NextResponse.json(result);
      }

      case 'cross-channel': {
        const traceabilityService = createStockTraceabilityService(tenantId);
        const comparison = await traceabilityService.getCrossChannelComparison(filter);
        return NextResponse.json({ comparison });
      }

      case 'reconciliation': {
        const syncService = createInventorySyncService(tenantId);
        const summary = await syncService.getReconciliationSummary();
        return NextResponse.json({ summary });
      }

      case 'offline-events': {
        const syncService = createInventorySyncService(tenantId);
        const events = await syncService.getOfflineStockEvents(locationId || undefined);
        return NextResponse.json({ events, count: events.length });
      }

      case 'sync-status': {
        const syncService = createInventorySyncService(tenantId);
        const statuses = await syncService.getLocationSyncStatus();
        return NextResponse.json({ locations: statuses });
      }

      default:
        return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Inventory Sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
