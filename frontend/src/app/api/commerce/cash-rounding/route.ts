export const dynamic = 'force-dynamic';

/**
 * CASH ROUNDING API
 * Wave 1: Nigeria-First Modular Commerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { CashRoundingService, RoundingMode } from '@/lib/commerce/cash-rounding/cash-rounding-service';
import { getCurrentSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'calculate') {
      const amount = parseFloat(searchParams.get('amount') || '0');
      const mode = searchParams.get('mode') as RoundingMode;

      if (!amount || !mode) {
        return NextResponse.json(
          { error: 'amount and mode required' },
          { status: 400 }
        );
      }

      if (!CashRoundingService.isValidMode(mode)) {
        return NextResponse.json(
          { error: 'Invalid mode. Use N5, N10, or N50' },
          { status: 400 }
        );
      }

      const result = CashRoundingService.calculateRounding(amount, mode);
      return NextResponse.json({
        ...result,
        receiptLine: CashRoundingService.formatForReceipt(result),
        recommendedMode: CashRoundingService.getRecommendedMode(amount)
      });
    }

    if (action === 'recommend') {
      const amount = parseFloat(searchParams.get('amount') || '0');
      if (!amount) {
        return NextResponse.json({ error: 'amount required' }, { status: 400 });
      }
      const recommended = CashRoundingService.getRecommendedMode(amount);
      const result = CashRoundingService.calculateRounding(amount, recommended);
      return NextResponse.json({
        recommendedMode: recommended,
        ...result
      });
    }

    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const shiftId = searchParams.get('shiftId');
    const date = searchParams.get('date');

    if (action === 'shift-summary' && shiftId) {
      const summary = await CashRoundingService.getShiftRoundingSummary(shiftId);
      return NextResponse.json({ summary });
    }

    if (action === 'daily-report' && date) {
      const report = await CashRoundingService.getDailyRoundingReport(
        tenantId,
        new Date(date)
      );
      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: 'action required' }, { status: 400 });
  } catch (error) {
    console.error('Cash rounding GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
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
    const { amount, mode, saleId, shiftId } = body;

    if (!amount || !mode) {
      return NextResponse.json(
        { error: 'amount and mode required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!CashRoundingService.isValidMode(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use N5, N10, or N50' },
        { status: 400 }
      );
    }

    const result = await CashRoundingService.applyAndRecord(
      tenantId,
      amount,
      mode,
      { 
        saleId, 
        shiftId, 
        appliedById: session.user.id, 
        appliedByName: session.user.name || session.user.email || 'Staff'
      }
    );

    return NextResponse.json({
      ...result,
      receiptLine: CashRoundingService.formatForReceipt(result),
      recorded: result.roundingDiff !== 0
    });
  } catch (error) {
    console.error('Cash rounding POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
