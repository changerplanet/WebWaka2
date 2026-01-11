export const dynamic = 'force-dynamic'

/**
 * Political Suite - Fundraising API Route (Phase 2)
 * FACTS ONLY — No payment processing
 * 
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: HIGH-RISK VERTICAL
 * Commerce Boundary: STRICTLY ENFORCED
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDonationStats,
  getExpenseStats,
} from '@/lib/political';

const COMMERCE_BOUNDARY_NOTICE = {
  _commerce_boundary: 'STRICTLY ENFORCED',
  _facts_only: 'This API records FACTS only. All payment execution handled by Commerce suite.',
  _no_payments: 'No payment processing, wallets, balances, or invoices.',
};

// GET /api/political/fundraising - Fundraising summary stats
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required', code: 'TENANT_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const partyId = searchParams.get('partyId') || undefined;

    const [donationStats, expenseStats] = await Promise.all([
      getDonationStats(tenantId, campaignId, partyId),
      getExpenseStats(tenantId, campaignId, partyId),
    ]);

    return NextResponse.json({
      donations: donationStats,
      expenses: expenseStats,
      summary: {
        totalDonations: donationStats.totalAmount,
        totalExpenses: expenseStats.totalAmount,
        netBalance: donationStats.totalAmount - expenseStats.totalAmount,
      },
      ...COMMERCE_BOUNDARY_NOTICE,
      disclaimer: 'UNOFFICIAL STATISTICS — Facts only, no payment verification',
    });
  } catch (error) {
    console.error('Fundraising stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
