export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Tax API
 * 
 * GET /api/accounting/tax?action=codes - Get available tax codes
 * POST /api/accounting/tax (action=calculate) - Calculate tax amount
 * GET /api/accounting/tax?action=vat-summary - Get VAT summary for period
 * POST /api/accounting/tax (action=generate-vat-summary) - Generate and save VAT summary
 * POST /api/accounting/tax (action=finalize-vat) - Finalize VAT summary for filing
 * GET /api/accounting/tax?action=vat-history - Get VAT summary history
 * GET /api/accounting/tax?action=vat-annual - Get annual VAT summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { TaxService } from '@/lib/accounting/tax-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'codes': {
        const codes = TaxService.getTaxCodes();
        const defaultCode = TaxService.getDefaultTaxCode();
        return NextResponse.json({
          codes,
          defaultCode: defaultCode.code,
        });
      }

      case 'vat-summary': {
        const periodCode = searchParams.get('periodCode');
        if (!periodCode) {
          return NextResponse.json(
            { error: 'periodCode is required' },
            { status: 400 }
          );
        }

        const summary = await TaxService.generateVATSummary(
          session.activeTenantId,
          periodCode
        );
        return NextResponse.json(summary);
      }

      case 'vat-history': {
        const year = searchParams.get('year');
        const limit = searchParams.get('limit');

        const history = await TaxService.getVATHistory(
          session.activeTenantId,
          {
            year: year ? parseInt(year) : undefined,
            limit: limit ? parseInt(limit) : undefined,
          }
        );
        return NextResponse.json({ history });
      }

      case 'vat-annual': {
        const year = searchParams.get('year');
        if (!year) {
          return NextResponse.json(
            { error: 'year is required' },
            { status: 400 }
          );
        }

        const annual = await TaxService.getAnnualVATSummary(
          session.activeTenantId,
          parseInt(year)
        );
        return NextResponse.json(annual);
      }

      default:
        // Default to returning tax codes
        const codes = TaxService.getTaxCodes();
        return NextResponse.json({ codes });
    }
  } catch (error) {
    console.error('[Tax API] Error:', error);
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

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'calculate': {
        const { amount, taxCode, isInclusive } = body;
        if (amount === undefined) {
          return NextResponse.json(
            { error: 'amount is required' },
            { status: 400 }
          );
        }

        const calculation = isInclusive
          ? TaxService.calculateFromGross(amount, taxCode)
          : TaxService.calculateFromNet(amount, taxCode);

        return NextResponse.json(calculation);
      }

      case 'generate-vat-summary': {
        const { periodCode } = body;
        if (!periodCode) {
          return NextResponse.json(
            { error: 'periodCode is required' },
            { status: 400 }
          );
        }

        // Generate summary
        const summary = await TaxService.generateVATSummary(
          session.activeTenantId,
          periodCode
        );

        // Save to database
        await TaxService.saveVATSummary(
          session.activeTenantId,
          periodCode,
          summary,
          session.user.id
        );

        return NextResponse.json({
          success: true,
          message: 'VAT summary generated and saved',
          summary,
        });
      }

      case 'finalize-vat': {
        const { periodCode } = body;
        if (!periodCode) {
          return NextResponse.json(
            { error: 'periodCode is required' },
            { status: 400 }
          );
        }

        const result = await TaxService.finalizeVATSummary(
          session.activeTenantId,
          periodCode,
          session.user.id
        );

        return NextResponse.json({
          success: true,
          message: 'VAT summary finalized',
          summary: {
            id: result.id,
            reportGeneratedAt: result.reportGeneratedAt,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Tax API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
