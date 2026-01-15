/**
 * Partner Payout Overview API
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Read-only partner-level visibility into vendor earnings.
 * NO payout execution - visibility only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createPartnerPayoutService, TimeFilter } from '@/lib/commerce/payout-visibility';

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
    const view = searchParams.get('view') || 'overview';
    const period = searchParams.get('period') as TimeFilter['period'] || '30d';
    const vendorId = searchParams.get('vendorId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const payoutService = createPartnerPayoutService(tenantId);
    const filter: TimeFilter = { period };

    switch (view) {
      case 'overview': {
        const overview = await payoutService.getPayoutOverview(filter);
        return NextResponse.json({ overview });
      }

      case 'breakdown': {
        const vendors = await payoutService.getVendorBreakdown(filter);
        return NextResponse.json({ vendors, count: vendors.length });
      }

      case 'top-vendors': {
        const topVendors = await payoutService.getTopVendors(limit, filter);
        return NextResponse.json({ topVendors, count: topVendors.length });
      }

      case 'vendor-detail': {
        if (!vendorId) {
          return NextResponse.json({ error: 'Missing required parameter: vendorId' }, { status: 400 });
        }
        const vendorDetail = await payoutService.getVendorPayoutDetails(vendorId, filter);
        if (!vendorDetail) {
          return NextResponse.json({ error: 'Vendor not found or no data' }, { status: 404 });
        }
        return NextResponse.json({ vendor: vendorDetail });
      }

      case 'payment-methods': {
        const breakdown = await payoutService.getPaymentMethodBreakdown(filter);
        return NextResponse.json({ paymentMethods: breakdown });
      }

      default:
        return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Partner Payout Overview API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
