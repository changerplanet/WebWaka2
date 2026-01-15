/**
 * Vendor Mobile Dashboard API
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first API for vendor dashboard data.
 * Read-only endpoints optimized for low-bandwidth scenarios.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createVendorDashboardService } from '@/lib/commerce/vendor-dashboard';

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

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const dashboardService = createVendorDashboardService(tenantId, vendorId);
    const dashboard = await dashboardService.getDashboard();

    if (!dashboard) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error('[Vendor Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { action, vendorId, ...params } = body;

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const dashboardService = createVendorDashboardService(tenantId, vendorId);

    switch (action) {
      case 'get_orders': {
        const result = await dashboardService.getOrders({
          status: params.status || 'ALL',
          limit: params.limit || 20,
          offset: params.offset || 0,
          sortBy: params.sortBy || 'date',
          sortOrder: params.sortOrder || 'desc',
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'get_order_details': {
        if (!params.subOrderId) {
          return NextResponse.json({ error: 'Sub-order ID required' }, { status: 400 });
        }
        const order = await dashboardService.getOrderDetails(params.subOrderId);
        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, order });
      }

      case 'get_fulfillment_queue': {
        const result = await dashboardService.getFulfillmentQueue({
          priority: params.priority,
          limit: params.limit || 50,
          offset: params.offset || 0,
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'get_earnings': {
        const result = await dashboardService.getEarnings({
          period: params.period || '30d',
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'get_profile': {
        const profile = await dashboardService.getProfile();
        if (!profile) {
          return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, profile });
      }

      case 'get_stats': {
        const stats = await dashboardService.getDashboardStats();
        return NextResponse.json({ success: true, stats });
      }

      case 'get_payout_info': {
        const payoutInfo = await dashboardService.getPayoutInfo();
        return NextResponse.json({ success: true, payoutInfo });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: get_orders, get_order_details, get_fulfillment_queue, get_earnings, get_profile, get_stats, get_payout_info' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Vendor Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
