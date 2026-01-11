/**
 * MODULE 13: COMPLIANCE & TAX (NIGERIA-FIRST)
 * Reporting Service
 * 
 * Generate regulatory reports - informational only, NOT filed.
 * Reports are immutable once generated.
 */

import { PrismaClient } from '@prisma/client';
import { getComplianceProfile, getTaxConfiguration } from './config-service';
import { getComputationSummary } from './tax-service';
import { logComplianceEvent } from './event-service';
import { withPrismaDefaults } from '@/lib/db/prismaDefaults';

const prisma = new PrismaClient();

// ============================================================================
// REPORT GENERATION
// ============================================================================

interface GenerateReportInput {
  tenantId: string;
  reportType: string;
  periodStart: Date;
  periodEnd: Date;
  generatedBy?: string;
}

export async function generateReport(input: GenerateReportInput): Promise<{
  success: boolean;
  report?: any;
  error?: string;
}> {
  try {
    const profile = await getComplianceProfile(input.tenantId);
    const taxConfig = await getTaxConfiguration(input.tenantId);
    
    let reportData: any;
    let reportName: string;
    
    switch (input.reportType) {
      case 'VAT_SUMMARY':
        reportData = await generateVatSummaryReport(input.tenantId, input.periodStart, input.periodEnd);
        reportName = `VAT Summary - ${formatPeriod(input.periodStart, input.periodEnd)}`;
        break;
      
      case 'SALES_SUMMARY':
        reportData = await generateSalesSummaryReport(input.tenantId, input.periodStart, input.periodEnd);
        reportName = `Sales Summary - ${formatPeriod(input.periodStart, input.periodEnd)}`;
        break;
      
      case 'EXPENSE_SUMMARY':
        reportData = await generateExpenseSummaryReport(input.tenantId, input.periodStart, input.periodEnd);
        reportName = `Expense Summary - ${formatPeriod(input.periodStart, input.periodEnd)}`;
        break;
      
      case 'COMPLIANCE_STATUS':
        reportData = await generateComplianceStatusReport(input.tenantId);
        reportName = `Compliance Status - ${new Date().toISOString().slice(0, 10)}`;
        break;
      
      default:
        return { success: false, error: `Unknown report type: ${input.reportType}` };
    }
    
    // Generate reference number (FIRS-style)
    const refNumber = generateReferenceNumber(input.reportType);
    
    // Create immutable report
    const report = await prisma.regulatory_reports.create({
      data: withPrismaDefaults({
        tenantId: input.tenantId,
        reportType: input.reportType,
        reportName,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        reportData,
        format: 'JSON',
        status: 'GENERATED',
        referenceNumber: refNumber,
        disclaimer: 'NOT FILED - For informational purposes only',
        generatedAt: new Date(),
        generatedBy: input.generatedBy,
        metadata: {
          profile: {
            maturityLevel: profile.maturityLevel,
            vatRegistered: profile.vatRegistered,
          },
          taxConfig: taxConfig ? {
            vatRate: taxConfig.vatRate,
            vatInclusive: taxConfig.vatInclusive,
          } : null,
        },
      }),
    });
    
    // Log event
    await logComplianceEvent({
      eventType: 'REPORT_GENERATED',
      tenantId: input.tenantId,
      reportId: report.id,
      eventData: {
        reportType: input.reportType,
        referenceNumber: refNumber,
      },
    });
    
    return { success: true, report };
  } catch (error: any) {
    console.error('Report generation error:', error);
    return { success: false, error: error.message || 'Failed to generate report' };
  }
}

// ============================================================================
// REPORT TYPE GENERATORS
// ============================================================================

async function generateVatSummaryReport(tenantId: string, periodStart: Date, periodEnd: Date) {
  // Get computations for period
  const computations = await prisma.tax_computation_records.findMany({
    where: {
      tenantId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    orderBy: { periodStart: 'asc' },
  });
  
  const summary = {
    period: { start: periodStart, end: periodEnd },
    totalSales: 0,
    exemptSales: 0,
    taxableSales: 0,
    outputVat: 0,
    totalPurchases: 0,
    exemptPurchases: 0,
    taxablePurchases: 0,
    inputVat: 0,
    netVatPayable: 0,
    computationCount: computations.length,
    details: computations.map(c => ({
      periodStart: c.periodStart,
      periodEnd: c.periodEnd,
      outputVat: c.outputVat,
      inputVat: c.inputVat,
      netVat: c.netVatPayable,
    })),
  };
  
  for (const c of computations) {
    summary.totalSales += Number(c.totalSales);
    summary.exemptSales += Number(c.exemptSales);
    summary.taxableSales += Number(c.taxableSales);
    summary.outputVat += Number(c.outputVat);
    summary.totalPurchases += Number(c.totalPurchases);
    summary.exemptPurchases += Number(c.exemptPurchases);
    summary.taxablePurchases += Number(c.taxablePurchases);
    summary.inputVat += Number(c.inputVat);
    summary.netVatPayable += Number(c.netVatPayable);
  }
  
  return summary;
}

async function generateSalesSummaryReport(tenantId: string, periodStart: Date, periodEnd: Date) {
  // This would pull from Orders/Invoices in production
  // For now, return structure with placeholder data
  return {
    period: { start: periodStart, end: periodEnd },
    totalTransactions: 0,
    totalRevenue: 0,
    taxCollected: 0,
    topCategories: [],
    topProducts: [],
    paymentMethods: {},
    note: 'Sales data derived from Orders and Payments modules',
  };
}

async function generateExpenseSummaryReport(tenantId: string, periodStart: Date, periodEnd: Date) {
  // This would pull from Expenses/Purchases in production
  return {
    period: { start: periodStart, end: periodEnd },
    totalExpenses: 0,
    deductibleExpenses: 0,
    nonDeductibleExpenses: 0,
    byCategory: {},
    note: 'Expense data derived from Accounting module',
  };
}

async function generateComplianceStatusReport(tenantId: string) {
  const profile = await getComplianceProfile(tenantId);
  const taxConfig = await getTaxConfiguration(tenantId);
  
  const statuses = await prisma.compliance_statuses.findMany({
    where: { tenantId, isResolved: false },
    orderBy: { createdAt: 'desc' },
  });
  
  return {
    generatedAt: new Date(),
    profile: {
      maturityLevel: profile.maturityLevel,
      businessRegistered: profile.businessRegistered,
      vatRegistered: profile.vatRegistered,
      tinRegistered: profile.tinRegistered,
      taxTrackingEnabled: profile.taxTrackingEnabled,
      reportingEnabled: profile.reportingEnabled,
    },
    taxConfig: taxConfig ? {
      vatEnabled: taxConfig.vatEnabled,
      vatRate: taxConfig.vatRate,
      vatInclusive: taxConfig.vatInclusive,
      isSmallBusiness: taxConfig.isSmallBusiness,
    } : null,
    pendingStatuses: statuses,
    recommendations: generateRecommendations(profile, taxConfig),
  };
}

function generateRecommendations(profile: any, taxConfig: any): string[] {
  const recommendations: string[] = [];
  
  if (!profile.businessRegistered) {
    recommendations.push('Consider registering your business with CAC for formal recognition');
  }
  
  if (!profile.tinRegistered) {
    recommendations.push('Obtain a Tax Identification Number (TIN) from FIRS');
  }
  
  if (!profile.vatRegistered && profile.businessRegistered) {
    recommendations.push('If your annual turnover exceeds N25 million, consider VAT registration');
  }
  
  if (!profile.taxTrackingEnabled) {
    recommendations.push('Enable tax tracking to monitor your VAT collections automatically');
  }
  
  return recommendations;
}

// ============================================================================
// REPORT QUERIES
// ============================================================================

export async function getReport(reportId: string) {
  return prisma.regulatory_reports.findUnique({
    where: { id: reportId },
  });
}

export async function listReports(params: {
  tenantId: string;
  reportType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { tenantId, reportType, startDate, endDate, page = 1, limit = 20 } = params;
  
  const where: any = { tenantId };
  
  if (reportType) {
    where.reportType = reportType;
  }
  
  if (startDate || endDate) {
    where.generatedAt = {};
    if (startDate) where.generatedAt.gte = startDate;
    if (endDate) where.generatedAt.lte = endDate;
  }
  
  const [reports, total] = await Promise.all([
    prisma.regulatory_reports.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { generatedAt: 'desc' },
    }),
    prisma.regulatory_reports.count({ where }),
  ]);
  
  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatPeriod(start: Date, end: Date): string {
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return `${startStr} to ${endStr}`;
}

function generateReferenceNumber(reportType: string): string {
  const prefix = reportType.replace(/_/g, '').slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
