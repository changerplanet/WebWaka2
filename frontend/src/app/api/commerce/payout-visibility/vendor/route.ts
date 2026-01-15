/**
 * Vendor Payout Visibility API
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Read-only visibility into vendor earnings and payment status.
 * NO payout execution - visibility only.
 * 
 * Authorization:
 * - Vendors/staff can only access their own vendor's payout data (via mvm_vendor_staff link)
 * - Tenant Admins can access any vendor's payout data within their tenant
 * - Super Admins can access any vendor's payout data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createVendorPayoutService, TimeFilter } from '@/lib/commerce/payout-visibility';

async function getSessionVendorId(userId: string, userEmail: string, tenantId: string): Promise<string | null> {
  const vendorStaff = await prisma.mvm_vendor_staff.findFirst({
    where: {
      email: userEmail,
      isActive: true,
      vendor: {
        tenantId,
      },
    },
    select: { vendorId: true },
  });

  if (vendorStaff) {
    return vendorStaff.vendorId;
  }

  const vendor = await prisma.mvm_vendor.findFirst({
    where: {
      tenantId,
      email: userEmail,
    },
    select: { id: true },
  });

  return vendor?.id || null;
}

async function authorizeVendorAccess(
  userId: string,
  userEmail: string,
  userGlobalRole: string | null,
  tenantId: string,
  requestedVendorId: string,
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

  if (tenantMembership.role === 'TENANT_ADMIN') {
    return { authorized: true };
  }

  const userVendorId = await getSessionVendorId(userId, userEmail, tenantId);

  if (!userVendorId) {
    return { authorized: false, error: 'No vendor association found for this user' };
  }

  if (userVendorId !== requestedVendorId) {
    return { authorized: false, error: 'Access denied to this vendor\'s payout data' };
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

    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendorId');
    const view = searchParams.get('view') || 'summary';
    const period = searchParams.get('period') as TimeFilter['period'] || '30d';
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod') as any;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const isAdmin = session.user.globalRole === 'SUPER_ADMIN' ||
      session.user.memberships?.some(m => m.tenantId === tenantId && m.role === 'TENANT_ADMIN' && m.isActive);

    if (!vendorId) {
      if (isAdmin) {
        return NextResponse.json({ error: 'Missing required parameter: vendorId' }, { status: 400 });
      }
      
      const userVendorId = await getSessionVendorId(session.user.id, session.user.email || '', tenantId);
      if (!userVendorId) {
        return NextResponse.json({ error: 'No vendor association found for this user' }, { status: 403 });
      }
      vendorId = userVendorId;
    }

    const authResult = await authorizeVendorAccess(
      session.user.id,
      session.user.email || '',
      session.user.globalRole,
      tenantId,
      vendorId,
      session.user.memberships || []
    );

    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 403 });
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
