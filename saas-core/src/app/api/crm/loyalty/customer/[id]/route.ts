/**
 * MODULE 3: CRM & Customer Engagement
 * Customer Loyalty API
 * 
 * GET /api/crm/loyalty/customer/[id] - Get customer loyalty summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { LoyaltyService } from '@/lib/crm/loyalty-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'transactions') {
      const limit = searchParams.get('limit');
      const offset = searchParams.get('offset');
      const transactionType = searchParams.get('transactionType');

      const transactions = await LoyaltyService.getCustomerTransactions(
        session.activeTenantId,
        id,
        {
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
          transactionType: transactionType as any,
        }
      );

      return NextResponse.json({ transactions });
    }

    const summary = await LoyaltyService.getCustomerSummary(session.activeTenantId, id);

    if (!summary) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Loyalty API] Customer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
