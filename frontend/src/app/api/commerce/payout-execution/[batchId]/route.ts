/**
 * PAYOUT BATCH DETAILS API
 * Wave F2: Payout Execution Engine (MVM)
 * 
 * GET /api/commerce/payout-execution/[batchId] - Get batch details with payouts and logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createPayoutExecutionService } from '@/lib/commerce/payout-execution';

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const { batchId } = params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];

    const service = createPayoutExecutionService(tenantId);
    
    const batch = await service.getBatch(batchId);
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const result: any = { success: true, batch };

    if (include.includes('payouts')) {
      result.payouts = await service.getBatchPayouts(batchId);
    }

    if (include.includes('logs')) {
      result.logs = await service.getBatchLogs(batchId);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Payout batch details error:', error);
    return NextResponse.json(
      { error: 'Failed to get batch details' },
      { status: 500 }
    );
  }
}
