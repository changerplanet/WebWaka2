/**
 * MODULE 13: COMPLIANCE & TAX (NIGERIA-FIRST)
 * API Routes
 * 
 * Advisory and reporting focused - NO enforcement, NO remittance.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getComplianceModuleStatus,
  validateComplianceModule,
  getComplianceProfile,
  updateComplianceProfile,
  getTaxConfiguration,
  updateTaxConfiguration,
  COMPLIANCE_MODULE,
} from '@/lib/compliance/config-service';
import {
  computeTaxForPeriod,
  listComputations,
  getComputationRecord,
  getComputationSummary,
  calculateVatForAmount,
} from '@/lib/compliance/tax-service';
import {
  generateReport,
  getReport,
  listReports,
} from '@/lib/compliance/reporting-service';
import {
  createComplianceStatus,
  resolveComplianceStatus,
  dismissComplianceStatus,
  listComplianceStatuses,
  runComplianceHealthCheck,
} from '@/lib/compliance/status-service';
import { getComplianceEvents } from '@/lib/compliance/event-service';

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    const tenantId = searchParams.get('tenantId');
    
    switch (action) {
      // =====================================================================
      // MODULE STATUS
      // =====================================================================
      case 'status': {
        const status = await getComplianceModuleStatus(tenantId || undefined);
        return NextResponse.json(status);
      }
      
      case 'manifest': {
        return NextResponse.json(COMPLIANCE_MODULE);
      }
      
      case 'validate': {
        const validation = await validateComplianceModule();
        return NextResponse.json(validation);
      }
      
      // =====================================================================
      // COMPLIANCE PROFILE
      // =====================================================================
      case 'profile': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const profile = await getComplianceProfile(tenantId);
        return NextResponse.json({ profile });
      }
      
      case 'tax-config': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const taxConfig = await getTaxConfiguration(tenantId);
        return NextResponse.json({ taxConfig });
      }
      
      // =====================================================================
      // TAX COMPUTATIONS
      // =====================================================================
      case 'computations': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const periodType = searchParams.get('periodType') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listComputations({ tenantId, periodType, page, limit });
        return NextResponse.json(result);
      }
      
      case 'computation': {
        const computationId = searchParams.get('computationId');
        if (!computationId) {
          return NextResponse.json({ error: 'computationId required' }, { status: 400 });
        }
        const computation = await getComputationRecord(computationId);
        return NextResponse.json({ computation });
      }
      
      case 'computation-summary': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
        const summary = await getComputationSummary(tenantId, year);
        return NextResponse.json({ summary });
      }
      
      case 'calculate-vat': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const amount = parseFloat(searchParams.get('amount') || '0');
        if (!amount) {
          return NextResponse.json({ error: 'amount required' }, { status: 400 });
        }
        const calculation = await calculateVatForAmount(tenantId, amount);
        return NextResponse.json(calculation);
      }
      
      // =====================================================================
      // REPORTS
      // =====================================================================
      case 'reports': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const reportType = searchParams.get('reportType') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const result = await listReports({ tenantId, reportType, page, limit });
        return NextResponse.json(result);
      }
      
      case 'report': {
        const reportId = searchParams.get('reportId');
        if (!reportId) {
          return NextResponse.json({ error: 'reportId required' }, { status: 400 });
        }
        const report = await getReport(reportId);
        return NextResponse.json({ report });
      }
      
      // =====================================================================
      // COMPLIANCE STATUS
      // =====================================================================
      case 'statuses': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const statusType = searchParams.get('statusType') || undefined;
        const severity = searchParams.get('severity') || undefined;
        const includeResolved = searchParams.get('includeResolved') === 'true';
        
        const statuses = await listComplianceStatuses({
          tenantId,
          statusType,
          severity,
          includeResolved,
        });
        return NextResponse.json({ statuses });
      }
      
      case 'health-check': {
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const health = await runComplianceHealthCheck(tenantId);
        return NextResponse.json(health);
      }
      
      // =====================================================================
      // EVENTS
      // =====================================================================
      case 'events': {
        const eventType = searchParams.get('eventType') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const result = await getComplianceEvents({
          tenantId: tenantId || undefined,
          eventType,
          page,
          limit,
        });
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Compliance API GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      // =====================================================================
      // PROFILE MANAGEMENT
      // =====================================================================
      case 'update-profile': {
        const { tenantId, ...data } = body;
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const profile = await updateComplianceProfile(tenantId, data);
        return NextResponse.json({ success: true, profile });
      }
      
      case 'update-tax-config': {
        const { tenantId, ...data } = body;
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
        }
        const taxConfig = await updateTaxConfiguration(tenantId, data);
        return NextResponse.json({ success: true, taxConfig });
      }
      
      // =====================================================================
      // TAX COMPUTATION
      // =====================================================================
      case 'compute-tax': {
        const { tenantId, periodStart, periodEnd, totalSales, ...rest } = body;
        
        if (!tenantId || !periodStart || !periodEnd || totalSales === undefined) {
          return NextResponse.json(
            { error: 'tenantId, periodStart, periodEnd, and totalSales required' },
            { status: 400 }
          );
        }
        
        const result = await computeTaxForPeriod({
          tenantId,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          totalSales,
          ...rest,
        });
        
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      // =====================================================================
      // REPORT GENERATION
      // =====================================================================
      case 'generate-report': {
        const { tenantId, reportType, periodStart, periodEnd, generatedBy } = body;
        
        if (!tenantId || !reportType || !periodStart || !periodEnd) {
          return NextResponse.json(
            { error: 'tenantId, reportType, periodStart, and periodEnd required' },
            { status: 400 }
          );
        }
        
        const result = await generateReport({
          tenantId,
          reportType,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          generatedBy,
        });
        
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      // =====================================================================
      // STATUS MANAGEMENT
      // =====================================================================
      case 'create-status': {
        const result = await createComplianceStatus(body);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result, { status: 201 });
      }
      
      case 'resolve-status': {
        const { statusId } = body;
        if (!statusId) {
          return NextResponse.json({ error: 'statusId required' }, { status: 400 });
        }
        const result = await resolveComplianceStatus(statusId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      case 'dismiss-status': {
        const { statusId } = body;
        if (!statusId) {
          return NextResponse.json({ error: 'statusId required' }, { status: 400 });
        }
        const result = await dismissComplianceStatus(statusId);
        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Compliance API POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
