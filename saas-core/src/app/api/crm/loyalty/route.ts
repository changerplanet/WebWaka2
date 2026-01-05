/**
 * MODULE 3: CRM & Customer Engagement
 * Loyalty API
 * 
 * GET /api/crm/loyalty - Get loyalty program
 * POST /api/crm/loyalty - Initialize/update program
 * GET /api/crm/loyalty/rules - Get rules
 * POST /api/crm/loyalty/rules - Create rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { LoyaltyService } from '@/lib/crm/loyalty-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'rules') {
      const ruleType = searchParams.get('ruleType');
      const isActive = searchParams.get('isActive');

      const rules = await LoyaltyService.getRules(session.activeTenantId, {
        ruleType: ruleType || undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      return NextResponse.json({ rules });
    }

    const program = await LoyaltyService.getProgram(session.activeTenantId);

    if (!program) {
      return NextResponse.json({
        initialized: false,
        message: 'Loyalty program not initialized',
      });
    }

    return NextResponse.json({
      initialized: true,
      program: {
        ...program,
        pointsPerCurrency: program.pointsPerCurrency.toString(),
        currencyPerPoint: program.currencyPerPoint?.toString(),
      },
    });
  } catch (error) {
    console.error('[Loyalty API] Get error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'crm');
    if (guardResult) return guardResult;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'initialize': {
        const result = await LoyaltyService.initialize(
          session.activeTenantId,
          {
            name: body.name || 'Customer Rewards',
            description: body.description,
            pointsName: body.pointsName,
            pointsSymbol: body.pointsSymbol,
            pointsPerCurrency: body.pointsPerCurrency,
            currencyPerPoint: body.currencyPerPoint,
            pointsExpireMonths: body.pointsExpireMonths,
            tierConfig: body.tierConfig,
          },
          session.user.id
        );
        return NextResponse.json(result, { status: 201 });
      }

      case 'update': {
        const program = await LoyaltyService.updateProgram(session.activeTenantId, body);
        return NextResponse.json({ success: true, program });
      }

      case 'create-rule': {
        if (!body.name || !body.ruleType) {
          return NextResponse.json(
            { error: 'name and ruleType are required' },
            { status: 400 }
          );
        }
        const rule = await LoyaltyService.createRule(session.activeTenantId, body);
        return NextResponse.json(rule, { status: 201 });
      }

      case 'earn': {
        if (!body.customerId || body.points === undefined) {
          return NextResponse.json(
            { error: 'customerId and points are required' },
            { status: 400 }
          );
        }
        const transaction = await LoyaltyService.earnPoints(
          session.activeTenantId,
          body,
          session.user.id
        );
        return NextResponse.json(transaction, { status: 201 });
      }

      case 'redeem': {
        if (!body.customerId || body.points === undefined) {
          return NextResponse.json(
            { error: 'customerId and points are required' },
            { status: 400 }
          );
        }
        const transaction = await LoyaltyService.redeemPoints(
          session.activeTenantId,
          body,
          session.user.id
        );
        return NextResponse.json(transaction, { status: 201 });
      }

      case 'bonus': {
        if (!body.customerId || body.points === undefined || !body.reason) {
          return NextResponse.json(
            { error: 'customerId, points, and reason are required' },
            { status: 400 }
          );
        }
        const transaction = await LoyaltyService.awardBonus(
          session.activeTenantId,
          body.customerId,
          body.points,
          body.reason,
          session.user.id
        );
        return NextResponse.json(transaction, { status: 201 });
      }

      case 'adjust': {
        if (!body.customerId || body.points === undefined || !body.reason) {
          return NextResponse.json(
            { error: 'customerId, points, and reason are required' },
            { status: 400 }
          );
        }
        const transaction = await LoyaltyService.adjustPoints(
          session.activeTenantId,
          body.customerId,
          body.points,
          body.reason,
          session.user.id
        );
        return NextResponse.json(transaction, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Loyalty API] Action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
