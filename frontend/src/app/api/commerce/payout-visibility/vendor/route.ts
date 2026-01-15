/**
 * Vendor Payout Visibility API
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Read-only visibility into vendor earnings and payment status.
 * NO payout execution - visibility only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createVendorPayoutService, TimeFilter } from '@/lib/commerce/payout-visibility';

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
    const view = searchParams.get('view') || 'summary';
    const period = searchParams.get('period') as TimeFilter['period'] || '30d';
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod') as any;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!vendorId) {
      return NextResponse.json({ error: 'Missing required parameter: vendorId' }, { status: 400 });
    }

    const payoutService = createVendorPayoutService(tenantId, vendorId);
    const filter: TimeFilter = { period };

    switch (view) {
      case 'summary': {
        const summary = await payoutService.getEarningsSummary(filter);
        return NextResponse.json({ summary });
      }

      case 'orders': {
        const { orders, total } = await payoutService.getOrderEarnings({
          filter,
          status: status || undefined,
          paymentMethod: paymentMethod || undefined,
          limit,
          offset,
        });
        return NextResponse.json({ orders, total, limit, offset });
      }

      case 'pending': {
        const pendingPayouts = await payoutService.getPendingPayouts();
        return NextResponse.json({ pendingPayouts, count: pendingPayouts.length });
      }

      case 'recent': {
        const recentPayouts = await payoutService.getRecentPayouts(limit);
        return NextResponse.json({ recentPayouts, count: recentPayouts.length });
      }

      default:
        return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Vendor Payout Visibility API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
