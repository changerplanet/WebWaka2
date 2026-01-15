/**
 * Partner Payout Overview API
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Read-only partner-level visibility into vendor earnings.
 * NO payout execution - visibility only.
 * 
 * Authorization:
 * - Tenant Admins can access payout overview for their tenant
 * - Super Admins can access any tenant's payout overview
 * - Partner operators (via tenant admin role) can access payout overview
 * - Vendors and regular users cannot access partner-level payout data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPartnerPayoutService, TimeFilter } from '@/lib/commerce/payout-visibility';

async function isVendorUser(userEmail: string, tenantId: string): Promise<boolean> {
  const vendorStaff = await prisma.mvm_vendor_staff.findFirst({
    where: {
      email: userEmail,
      isActive: true,
      vendor: {
        tenantId,
      },
    },
  });

  if (vendorStaff) return true;

  const vendor = await prisma.mvm_vendor.findFirst({
    where: {
      tenantId,
      email: userEmail,
    },
  });

  return !!vendor;
}

async function authorizePartnerAccess(
  userEmail: string,
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
    const isVendor = await isVendorUser(userEmail, tenantId);
    if (isVendor) {
      return { authorized: false, error: 'Vendors cannot access partner-level payout overview' };
    }
    return { authorized: false, error: 'Partner/Admin access required for payout overview' };
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

    const authResult = await authorizePartnerAccess(
      session.user.email || '',
      session.user.globalRole,
      tenantId,
      session.user.memberships || []
    );

    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
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
