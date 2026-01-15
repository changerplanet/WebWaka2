/**
 * VENDOR PAYOUT VIEW API
 * Wave F2: Payout Execution Engine (MVM)
 * 
 * GET /api/commerce/payout-execution/vendor - Get vendor's payout history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createPayoutExecutionService } from '@/lib/commerce/payout-execution';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    let vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      const vendor = await prisma.mvm_vendor.findFirst({
        where: {
          tenantId,
          email: session.user.email,
        },
      });
      
      if (vendor) {
        vendorId = vendor.id;
      }
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const service = createPayoutExecutionService(tenantId);
    const payoutView = await service.getVendorPayouts(vendorId);

    return NextResponse.json({
      success: true,
      ...payoutView,
    });

  } catch (error) {
    console.error('Vendor payout view error:', error);
    return NextResponse.json(
      { error: 'Failed to get vendor payouts' },
      { status: 500 }
    );
  }
}
