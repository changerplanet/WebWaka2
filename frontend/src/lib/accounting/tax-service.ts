/**
 * MODULE 2: Accounting & Finance
 * Tax Handling Service (Nigeria-first)
 * 
 * Implements VAT computation and reporting for Nigerian SMEs.
 * 
 * NIGERIA TAX RULES:
 * - VAT Rate: 7.5% (effective Feb 2020)
 * - VAT Registration Threshold: ₦25 million annual turnover
 * - Filing: Monthly (by 21st of following month)
 * - Inclusive vs Exclusive pricing support
 * 
 * CONSTRAINTS:
 * - No tax filing or remittance (reporting only)
 * - No jurisdiction hardcoding beyond configuration
 * - Period-based summaries
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

// ============================================================================
// TYPES
// ============================================================================

export interface TaxConfig {
  code: string;
  name: string;
  rate: number;        // e.g., 0.075 for 7.5%
  isDefault: boolean;
  isActive: boolean;
}

export interface TaxCalculation {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  taxCode: string;
  taxRate: number;
  isInclusive: boolean;
}

export interface TaxSummaryInput {
  periodCode: string;  // e.g., "2026-01"
  startDate: Date;
  endDate: Date;
}

export interface VATSummary {
  periodCode: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  
  // Output VAT (collected from sales)
  outputVAT: {
    posSales: string;
    onlineSales: string;
    marketplaceSales: string;
    total: string;
  };
  
  // Input VAT (paid on expenses)
  inputVAT: {
    expenses: string;
    purchases: string;
    total: string;
  };
  
  // Net VAT position
  netVAT: string;        // Output - Input (positive = payable)
  vatPayable: string;    // If positive
  vatRefundable: string; // If negative
  
  // Transaction counts
  transactionCounts: {
    salesTransactions: number;
    expenseTransactions: number;
    totalTransactions: number;
  };
  
  // Status
  isReportGenerated: boolean;
  reportGeneratedAt?: Date;
  reportGeneratedBy?: string;
}

// ============================================================================
// TAX CODES (Nigeria-first)
// ============================================================================

export const NIGERIA_TAX_CODES: TaxConfig[] = [
  {
    code: 'VAT_7.5',
    name: 'Value Added Tax (7.5%)',
    rate: 0.075,
    isDefault: true,
    isActive: true,
  },
  {
    code: 'VAT_0',
    name: 'Zero-rated VAT',
    rate: 0,
    isDefault: false,
    isActive: true,
  },
  {
    code: 'EXEMPT',
    name: 'VAT Exempt',
    rate: 0,
    isDefault: false,
    isActive: true,
  },
  {
    code: 'WHT_5',
    name: 'Withholding Tax (5%)',
    rate: 0.05,
    isDefault: false,
    isActive: true,
  },
  {
    code: 'WHT_10',
    name: 'Withholding Tax (10%)',
    rate: 0.10,
    isDefault: false,
    isActive: true,
  },
];

// ============================================================================
// TAX SERVICE
// ============================================================================

export class TaxService {
  /**
   * Calculate tax from gross amount (tax-inclusive pricing)
   */
  static calculateFromGross(
    grossAmount: number,
    taxCode: string = 'VAT_7.5'
  ): TaxCalculation {
    const taxConfig = NIGERIA_TAX_CODES.find(t => t.code === taxCode);
    if (!taxConfig) {
      throw new Error(`Invalid tax code: ${taxCode}`);
    }

    const gross = new Decimal(grossAmount);
    const rate = new Decimal(taxConfig.rate);
    
    // For inclusive: net = gross / (1 + rate)
    const net = gross.dividedBy(rate.plus(1));
    const tax = gross.minus(net);

    return {
      netAmount: parseFloat(net.toFixed(2)),
      taxAmount: parseFloat(tax.toFixed(2)),
      grossAmount: grossAmount,
      taxCode: taxConfig.code,
      taxRate: taxConfig.rate,
      isInclusive: true,
    };
  }

  /**
   * Calculate tax from net amount (tax-exclusive pricing)
   */
  static calculateFromNet(
    netAmount: number,
    taxCode: string = 'VAT_7.5'
  ): TaxCalculation {
    const taxConfig = NIGERIA_TAX_CODES.find(t => t.code === taxCode);
    if (!taxConfig) {
      throw new Error(`Invalid tax code: ${taxCode}`);
    }

    const net = new Decimal(netAmount);
    const rate = new Decimal(taxConfig.rate);
    
    // For exclusive: tax = net * rate, gross = net + tax
    const tax = net.times(rate);
    const gross = net.plus(tax);

    return {
      netAmount: netAmount,
      taxAmount: parseFloat(tax.toFixed(2)),
      grossAmount: parseFloat(gross.toFixed(2)),
      taxCode: taxConfig.code,
      taxRate: taxConfig.rate,
      isInclusive: false,
    };
  }

  /**
   * Get available tax codes
   */
  static getTaxCodes(): TaxConfig[] {
    return NIGERIA_TAX_CODES.filter(t => t.isActive);
  }

  /**
   * Get default tax code
   */
  static getDefaultTaxCode(): TaxConfig {
    return NIGERIA_TAX_CODES.find(t => t.isDefault) || NIGERIA_TAX_CODES[0];
  }

  /**
   * Generate VAT summary for a period
   */
  static async generateVATSummary(
    tenantId: string,
    periodCode: string
  ): Promise<VATSummary> {
    // Get the financial period
    const period = await prisma.acct_financial_periods.findUnique({
      where: { tenantId_code: { tenantId, code: periodCode } },
    });

    if (!period) {
      throw new Error(`Financial period '${periodCode}' not found`);
    }

    // Get all journal entries for this period with VAT
    const journals = await prisma.acct_journal_entries.findMany({
      where: {
        tenantId,
        periodId: period.id,
        status: 'POSTED',
        taxCode: { not: null },
      },
      include: {
        acct_ledger_entries: {
          include: {
            acct_ledger_accounts: {
              include: { acct_chart_of_accounts: true },
            },
          },
        },
      },
    });

    // Initialize totals
    let outputVAT = {
      posSales: new Decimal(0),
      onlineSales: new Decimal(0),
      marketplaceSales: new Decimal(0),
    };
    let inputVAT = {
      expenses: new Decimal(0),
      purchases: new Decimal(0),
    };
    let salesCount = 0;
    let expenseCount = 0;

    // Process each journal entry
    for (const journal of journals) {
      const taxAmount = journal.taxAmount ? new Decimal(journal.taxAmount.toString()) : new Decimal(0);
      const journalAny = journal as any;

      switch (journal.sourceType) {
        case 'POS_SALE':
          outputVAT.posSales = outputVAT.posSales.plus(taxAmount);
          salesCount++;
          break;
        case 'SVM_ORDER':
          outputVAT.onlineSales = outputVAT.onlineSales.plus(taxAmount);
          salesCount++;
          break;
        case 'MVM_ORDER':
          outputVAT.marketplaceSales = outputVAT.marketplaceSales.plus(taxAmount);
          salesCount++;
          break;
        case 'EXPENSE':
          inputVAT.expenses = inputVAT.expenses.plus(taxAmount);
          expenseCount++;
          break;
        case 'REFUND':
          // Refunds reduce output VAT
          outputVAT.posSales = outputVAT.posSales.minus(taxAmount);
          salesCount++;
          break;
        default:
          // Other sources - check if it's an expense account
          for (const line of journalAny.acct_ledger_entries) {
            if (line.acct_ledger_accounts.acct_chart_of_accounts.accountType === 'EXPENSE') {
              inputVAT.expenses = inputVAT.expenses.plus(taxAmount);
              expenseCount++;
              break;
            }
          }
      }
    }

    // Calculate totals
    const totalOutputVAT = outputVAT.posSales
      .plus(outputVAT.onlineSales)
      .plus(outputVAT.marketplaceSales);
    
    const totalInputVAT = inputVAT.expenses.plus(inputVAT.purchases);
    
    const netVAT = totalOutputVAT.minus(totalInputVAT);
    const vatPayable = netVAT.greaterThan(0) ? netVAT : new Decimal(0);
    const vatRefundable = netVAT.lessThan(0) ? netVAT.abs() : new Decimal(0);

    // Check if summary already exists
    const existingSummary = await prisma.acct_tax_summaries.findFirst({
      where: { tenantId, periodId: period.id, taxCode: 'VAT_7.5' },
    });

    return {
      periodCode: period.code,
      periodName: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      outputVAT: {
        posSales: outputVAT.posSales.toFixed(2),
        onlineSales: outputVAT.onlineSales.toFixed(2),
        marketplaceSales: outputVAT.marketplaceSales.toFixed(2),
        total: totalOutputVAT.toFixed(2),
      },
      inputVAT: {
        expenses: inputVAT.expenses.toFixed(2),
        purchases: inputVAT.purchases.toFixed(2),
        total: totalInputVAT.toFixed(2),
      },
      netVAT: netVAT.toFixed(2),
      vatPayable: vatPayable.toFixed(2),
      vatRefundable: vatRefundable.toFixed(2),
      transactionCounts: {
        salesTransactions: salesCount,
        expenseTransactions: expenseCount,
        totalTransactions: salesCount + expenseCount,
      },
      isReportGenerated: !!existingSummary?.reportGeneratedAt,
      reportGeneratedAt: existingSummary?.reportGeneratedAt || undefined,
      reportGeneratedBy: existingSummary?.reportGeneratedBy || undefined,
    };
  }

  /**
   * Save/update VAT summary to database
   */
  static async saveVATSummary(
    tenantId: string,
    periodCode: string,
    summary: VATSummary,
    createdBy?: string
  ) {
    const period = await prisma.acct_financial_periods.findUnique({
      where: { tenantId_code: { tenantId, code: periodCode } },
    });

    if (!period) {
      throw new Error(`Financial period '${periodCode}' not found`);
    }

    // Check if already finalized
    const existing = await prisma.acct_tax_summaries.findFirst({
      where: { tenantId, periodId: period.id, taxCode: 'VAT_7.5' },
    });

    if (existing?.reportGeneratedAt) {
      throw new Error('Cannot update finalized tax summary');
    }

    const summaryData = {
      taxName: 'Value Added Tax',
      taxRate: new Prisma.Decimal(0.075),
      taxableAmount: new Prisma.Decimal(0), // Would need to calculate from journals
      taxCollected: new Prisma.Decimal(summary.outputVAT.total),
      taxPaid: new Prisma.Decimal(summary.inputVAT.total),
      netTaxLiability: new Prisma.Decimal(summary.netVAT),
      salesTaxAmount: new Prisma.Decimal(summary.outputVAT.total),
      expenseTaxAmount: new Prisma.Decimal(summary.inputVAT.total),
      notes: JSON.stringify({
        outputVAT: summary.outputVAT,
        inputVAT: summary.inputVAT,
        vatPayable: summary.vatPayable,
        vatRefundable: summary.vatRefundable,
        transactionCounts: summary.transactionCounts,
      }),
    };

    if (existing) {
      return prisma.acct_tax_summaries.update({
        where: { id: existing.id },
        data: summaryData,
      });
    } else {
      return prisma.acct_tax_summaries.create({
        data: {
          tenantId,
          periodId: period.id,
          taxCode: 'VAT_7.5',
          ...summaryData,
        } as any,
      });
    }
  }

  /**
   * Finalize VAT summary (lock for filing)
   */
  static async finalizeVATSummary(
    tenantId: string,
    periodCode: string,
    finalizedBy: string
  ) {
    const period = await prisma.acct_financial_periods.findUnique({
      where: { tenantId_code: { tenantId, code: periodCode } },
    });

    if (!period) {
      throw new Error(`Financial period '${periodCode}' not found`);
    }

    const existing = await prisma.acct_tax_summaries.findFirst({
      where: { tenantId, periodId: period.id, taxCode: 'VAT_7.5' },
    });

    if (!existing) {
      throw new Error('Tax summary must be generated before finalizing');
    }

    if (existing.reportGeneratedAt) {
      throw new Error('Tax summary is already finalized');
    }

    return prisma.acct_tax_summaries.update({
      where: { id: existing.id },
      data: {
        reportGeneratedAt: new Date(),
        reportGeneratedBy: finalizedBy,
      },
    });
  }

  /**
   * Get VAT summaries for multiple periods
   */
  static async getVATHistory(
    tenantId: string,
    options?: {
      year?: number;
      limit?: number;
    }
  ) {
    const where: Prisma.AcctTaxSummaryWhereInput = {
      tenantId,
      taxCode: 'VAT_7.5',
    };

    if (options?.year) {
      where.period = {
        fiscalYear: options.year,
      };
    }

    const summaries = await prisma.acct_tax_summaries.findMany({
      where,
      orderBy: { period: { startDate: 'desc' } },
      take: options?.limit || 12,
      include: {
        period: {
          select: {
            id: true,
            name: true,
            code: true,
            startDate: true,
            endDate: true,
            fiscalYear: true,
          },
        },
      },
    });

    return summaries.map(s => ({
      id: s.id,
      period: s.period,
      taxCollected: s.taxCollected.toString(),
      taxPaid: s.taxPaid.toString(),
      netTax: s.netTaxLiability.toString(),
      isReportGenerated: !!s.reportGeneratedAt,
      reportGeneratedAt: s.reportGeneratedAt,
      reportGeneratedBy: s.reportGeneratedBy,
      notes: s.notes,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Get annual VAT summary
   */
  static async getAnnualVATSummary(tenantId: string, year: number) {
    const summaries = await prisma.acct_tax_summaries.findMany({
      where: {
        tenantId,
        taxCode: 'VAT_7.5',
        period: { fiscalYear: year },
      },
      include: { acct_financial_periods: true },
      orderBy: { period: { startDate: 'asc' } },
    });

    let totalCollected = new Decimal(0);
    let totalPaid = new Decimal(0);

    const monthly = summaries.map(s => {
      totalCollected = totalCollected.plus(s.taxCollected.toString());
      totalPaid = totalPaid.plus(s.taxPaid.toString());

      return {
        month: s.acct_financial_periods.code,
        monthName: s.acct_financial_periods.name,
        taxCollected: s.taxCollected.toString(),
        taxPaid: s.taxPaid.toString(),
        netTax: s.netTaxLiability.toString(),
        isReportGenerated: !!s.reportGeneratedAt,
      };
    });

    const netTotal = totalCollected.minus(totalPaid);

    return {
      year,
      monthly,
      totals: {
        taxCollected: totalCollected.toFixed(2),
        taxPaid: totalPaid.toFixed(2),
        netTax: netTotal.toFixed(2),
        vatPayable: netTotal.greaterThan(0) ? netTotal.toFixed(2) : '0.00',
        vatRefundable: netTotal.lessThan(0) ? netTotal.abs().toFixed(2) : '0.00',
      },
      periodsCovered: summaries.length,
      periodsFinalized: summaries.filter(s => s.reportGeneratedAt).length,
    };
  }
}
