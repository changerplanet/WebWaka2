/**
 * MODULE 2: Accounting & Finance
 * Entitlements API
 * 
 * GET /api/accounting/entitlements - Get entitlement summary
 * GET /api/accounting/entitlements/check - Check specific feature entitlement
 * GET /api/accounting/entitlements/usage - Check usage against limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { AccountingEntitlementsService } from '@/lib/accounting/entitlements-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: We check capability but still return entitlement info even if not active
    // This allows UI to show upgrade prompts
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        const summary = await AccountingEntitlementsService.getEntitlementSummary(
          session.activeTenantId
        );
        return NextResponse.json(summary);
      }

      case 'check': {
        const feature = searchParams.get('feature');
        if (!feature) {
          return NextResponse.json(
            { error: 'feature parameter is required' },
            { status: 400 }
          );
        }

        const validFeatures = [
          'advancedReports', 'multiCurrency', 'taxReports', 
          'offlineSync', 'apiAccess', 'maxFinancialPeriods',
          'maxExpensesPerMonth', 'maxAttachmentsPerExpense'
        ];

        if (!validFeatures.includes(feature)) {
          return NextResponse.json(
            { error: `Invalid feature: ${feature}. Valid features: ${validFeatures.join(', ')}` },
            { status: 400 }
          );
        }

        const result = await AccountingEntitlementsService.checkFeature(
          session.activeTenantId,
          feature as any
        );
        return NextResponse.json(result);
      }

      case 'usage': {
        const resource = searchParams.get('resource') as 'expenses' | 'periods' | 'attachments';
        if (!resource || !['expenses', 'periods', 'attachments'].includes(resource)) {
          return NextResponse.json(
            { error: 'resource must be one of: expenses, periods, attachments' },
            { status: 400 }
          );
        }

        let currentCount = 0;
        if (resource === 'expenses') {
          currentCount = await AccountingEntitlementsService.getCurrentMonthExpenseCount(
            session.activeTenantId
          );
        } else if (resource === 'periods') {
          currentCount = await AccountingEntitlementsService.getFinancialPeriodCount(
            session.activeTenantId
          );
        }

        const result = await AccountingEntitlementsService.checkUsage(
          session.activeTenantId,
          resource,
          currentCount
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Entitlements API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
