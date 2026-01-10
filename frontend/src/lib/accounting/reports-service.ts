/**
 * MODULE 2: Accounting & Finance
 * Financial Reports Service
 * 
 * Implements standard financial reports derived from ledger data.
 * 
 * REPORTS:
 * - Profit & Loss (Income Statement)
 * - Balance Sheet (Statement of Financial Position)
 * - Cash Flow Summary
 * - Trial Balance
 * - Expense Breakdown
 * 
 * CONSTRAINTS:
 * - Reports derived from ledger only
 * - Period-based filtering
 * - Nigeria-first formatting (NGN)
 */

import { prisma } from '@/lib/prisma';
import { AcctAccountType } from '@prisma/client';
import Decimal from 'decimal.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  periodId?: string;
  periodCode?: string;
  compareWithPrevious?: boolean;
}

export interface ReportLineItem {
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: string;
  debit: string;
  credit: string;
}

export interface ReportSection {
  title: string;
  accounts: ReportLineItem[];
  total: string;
}

export interface ProfitAndLossReport {
  reportType: 'PROFIT_AND_LOSS';
  title: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  
  revenue: ReportSection;
  costOfGoodsSold: ReportSection;
  grossProfit: string;
  
  operatingExpenses: ReportSection;
  operatingIncome: string;
  
  otherIncome: ReportSection;
  otherExpenses: ReportSection;
  
  netIncome: string;
  
  generatedAt: Date;
}

export interface BalanceSheetReport {
  reportType: 'BALANCE_SHEET';
  title: string;
  asOfDate: Date;
  currency: string;
  
  assets: {
    currentAssets: ReportSection;
    fixedAssets: ReportSection;
    totalAssets: string;
  };
  
  liabilities: {
    currentLiabilities: ReportSection;
    longTermLiabilities: ReportSection;
    totalLiabilities: string;
  };
  
  equity: ReportSection;
  totalLiabilitiesAndEquity: string;
  
  // Balance check
  isBalanced: boolean;
  difference: string;
  
  generatedAt: Date;
}

export interface CashFlowReport {
  reportType: 'CASH_FLOW';
  title: string;
  periodName: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  
  operatingActivities: {
    netIncome: string;
    adjustments: Array<{ description: string; amount: string }>;
    netCashFromOperations: string;
  };
  
  investingActivities: {
    items: Array<{ description: string; amount: string }>;
    netCashFromInvesting: string;
  };
  
  financingActivities: {
    items: Array<{ description: string; amount: string }>;
    netCashFromFinancing: string;
  };
  
  netChangeInCash: string;
  beginningCash: string;
  endingCash: string;
  
  generatedAt: Date;
}

export interface TrialBalanceReport {
  reportType: 'TRIAL_BALANCE';
  title: string;
  asOfDate: Date;
  currency: string;
  
  accounts: Array<{
    code: string;
    name: string;
    type: string;
    debit: string;
    credit: string;
  }>;
  
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
  difference: string;
  
  generatedAt: Date;
}

// ============================================================================
// REPORTS SERVICE
// ============================================================================

export class ReportsService {
  /**
   * Generate Profit & Loss (Income Statement)
   */
  static async generateProfitAndLoss(
    tenantId: string,
    filters: ReportFilters
  ): Promise<ProfitAndLossReport> {
    const { startDate, endDate, periodName } = await this.resolvePeriod(tenantId, filters);

    // Get all ledger accounts with activity
    const accounts = await this.getAccountBalances(tenantId, startDate, endDate);

    // Categorize accounts
    const revenue = this.filterAccountsByType(accounts, ['REVENUE']);
    const contraRevenue = this.filterAccountsByType(accounts, ['CONTRA_REVENUE']);
    const cogs = this.filterAccountsBySubType(accounts, ['COST_OF_GOODS']);
    const operatingExpenses = this.filterAccountsBySubType(accounts, [
      'OPERATING_EXPENSE', 'RENT_EXPENSE', 'UTILITIES_EXPENSE', 'PAYROLL_EXPENSE',
      'MARKETING_EXPENSE', 'DEPRECIATION_EXPENSE', 'OTHER_EXPENSE'
    ]).filter(a => !a.accountCode.startsWith('5') && !a.accountCode.startsWith('7'));
    const otherIncome = this.filterAccountsBySubType(accounts, ['OTHER_INCOME']);
    const otherExpenses = accounts.filter(a => 
      a.accountCode.startsWith('75') || a.accountCode.startsWith('76')
    );

    // Calculate totals
    const totalRevenue = this.sumBalances(revenue);
    const totalContraRevenue = this.sumBalances(contraRevenue);
    const netRevenue = totalRevenue.minus(totalContraRevenue);
    
    const totalCogs = this.sumBalances(cogs);
    const grossProfit = netRevenue.minus(totalCogs);
    
    const totalOpEx = this.sumBalances(operatingExpenses);
    const operatingIncome = grossProfit.minus(totalOpEx);
    
    const totalOtherIncome = this.sumBalances(otherIncome);
    const totalOtherExpenses = this.sumBalances(otherExpenses);
    
    const netIncome = operatingIncome.plus(totalOtherIncome).minus(totalOtherExpenses);

    return {
      reportType: 'PROFIT_AND_LOSS',
      title: 'Profit & Loss Statement',
      periodName,
      startDate,
      endDate,
      currency: 'NGN',
      
      revenue: {
        title: 'Revenue',
        accounts: [...revenue, ...contraRevenue.map(a => ({
          ...a,
          balance: `-${a.balance}`,
        }))],
        total: netRevenue.toFixed(2),
      },
      
      costOfGoodsSold: {
        title: 'Cost of Goods Sold',
        accounts: cogs,
        total: totalCogs.toFixed(2),
      },
      
      grossProfit: grossProfit.toFixed(2),
      
      operatingExpenses: {
        title: 'Operating Expenses',
        accounts: operatingExpenses,
        total: totalOpEx.toFixed(2),
      },
      
      operatingIncome: operatingIncome.toFixed(2),
      
      otherIncome: {
        title: 'Other Income',
        accounts: otherIncome,
        total: totalOtherIncome.toFixed(2),
      },
      
      otherExpenses: {
        title: 'Other Expenses',
        accounts: otherExpenses,
        total: totalOtherExpenses.toFixed(2),
      },
      
      netIncome: netIncome.toFixed(2),
      
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Balance Sheet
   */
  static async generateBalanceSheet(
    tenantId: string,
    asOfDate: Date = new Date()
  ): Promise<BalanceSheetReport> {
    // Get all account balances as of date
    const accounts = await this.getAccountBalances(tenantId, undefined, asOfDate);

    // Categorize accounts
    const currentAssets = accounts.filter(a => 
      a.accountType === 'ASSET' && 
      (a.accountCode.startsWith('11') || a.accountCode.startsWith('12') || 
       a.accountCode.startsWith('13') || a.accountCode.startsWith('14'))
    );
    
    const fixedAssets = accounts.filter(a => 
      a.accountType === 'ASSET' && a.accountCode.startsWith('15')
    );
    
    const contraAssets = accounts.filter(a => a.accountType === 'CONTRA_ASSET');
    
    const currentLiabilities = accounts.filter(a => 
      a.accountType === 'LIABILITY' && a.accountCode.startsWith('21')
    );
    
    const longTermLiabilities = accounts.filter(a => 
      a.accountType === 'LIABILITY' && a.accountCode.startsWith('25')
    );
    
    const equity = accounts.filter(a => 
      a.accountType === 'EQUITY' || a.accountType === 'CONTRA_EQUITY'
    );

    // Calculate totals
    const totalCurrentAssets = this.sumBalances(currentAssets);
    const totalFixedAssets = this.sumBalances(fixedAssets).minus(this.sumBalances(contraAssets));
    const totalAssets = totalCurrentAssets.plus(totalFixedAssets);
    
    const totalCurrentLiabilities = this.sumBalances(currentLiabilities);
    const totalLongTermLiabilities = this.sumBalances(longTermLiabilities);
    const totalLiabilities = totalCurrentLiabilities.plus(totalLongTermLiabilities);
    
    // Equity includes retained earnings (calculated)
    const totalEquity = this.sumBalances(equity);
    
    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);
    const difference = totalAssets.minus(totalLiabilitiesAndEquity);

    return {
      reportType: 'BALANCE_SHEET',
      title: 'Balance Sheet',
      asOfDate,
      currency: 'NGN',
      
      assets: {
        currentAssets: {
          title: 'Current Assets',
          accounts: currentAssets,
          total: totalCurrentAssets.toFixed(2),
        },
        fixedAssets: {
          title: 'Fixed Assets (Net)',
          accounts: [...fixedAssets, ...contraAssets],
          total: totalFixedAssets.toFixed(2),
        },
        totalAssets: totalAssets.toFixed(2),
      },
      
      liabilities: {
        currentLiabilities: {
          title: 'Current Liabilities',
          accounts: currentLiabilities,
          total: totalCurrentLiabilities.toFixed(2),
        },
        longTermLiabilities: {
          title: 'Long-term Liabilities',
          accounts: longTermLiabilities,
          total: totalLongTermLiabilities.toFixed(2),
        },
        totalLiabilities: totalLiabilities.toFixed(2),
      },
      
      equity: {
        title: 'Equity',
        accounts: equity,
        total: totalEquity.toFixed(2),
      },
      
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toFixed(2),
      
      isBalanced: difference.abs().lessThan(0.01),
      difference: difference.toFixed(2),
      
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Trial Balance
   */
  static async generateTrialBalance(
    tenantId: string,
    asOfDate: Date = new Date()
  ): Promise<TrialBalanceReport> {
    const accounts = await this.getAccountBalances(tenantId, undefined, asOfDate, true);

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const formattedAccounts = accounts.map(a => {
      const debit = new Decimal(a.debit);
      const credit = new Decimal(a.credit);
      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);

      return {
        code: a.accountCode,
        name: a.accountName,
        type: a.accountType,
        debit: debit.toFixed(2),
        credit: credit.toFixed(2),
      };
    });

    const difference = totalDebit.minus(totalCredit);

    return {
      reportType: 'TRIAL_BALANCE',
      title: 'Trial Balance',
      asOfDate,
      currency: 'NGN',
      accounts: formattedAccounts,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      isBalanced: difference.abs().lessThan(0.01),
      difference: difference.toFixed(2),
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Cash Flow Summary (simplified)
   */
  static async generateCashFlow(
    tenantId: string,
    filters: ReportFilters
  ): Promise<CashFlowReport> {
    const { startDate, endDate, periodName } = await this.resolvePeriod(tenantId, filters);

    // Get P&L for net income
    const pnl = await this.generateProfitAndLoss(tenantId, filters);
    const netIncome = new Decimal(pnl.netIncome);

    // Get cash account movements
    const cashAccounts = await prisma.acct_ledger_entries.findMany({
      where: {
        tenantId,
        entryDate: { gte: startDate, lte: endDate },
        ledgerAccount: {
          chartOfAccount: {
            code: { in: ['1110', '1120', '1130'] },
          },
        },
      },
      include: {
        acct_ledger_accounts: {
          include: { acct_chart_of_accounts: true },
        },
        journalEntry: true,
      },
    });

    // Calculate cash movements by category
    let operatingCash = new Decimal(0);
    let investingCash = new Decimal(0);
    let financingCash = new Decimal(0);

    for (const entry of cashAccounts) {
      const netAmount = new Decimal(entry.debitAmount.toString())
        .minus(entry.creditAmount.toString());
      
      const sourceType = entry.journalEntry?.sourceType;
      
      if (['POS_SALE', 'SVM_ORDER', 'MVM_ORDER', 'EXPENSE', 'REFUND'].includes(sourceType || '')) {
        operatingCash = operatingCash.plus(netAmount);
      } else if (entry.ledgerAccount.chartOfAccount.code.startsWith('15')) {
        investingCash = investingCash.plus(netAmount);
      } else {
        financingCash = financingCash.plus(netAmount);
      }
    }

    // Get beginning and ending cash
    const beginningCash = await this.getCashBalance(tenantId, startDate);
    const endingCash = await this.getCashBalance(tenantId, endDate);
    const netChange = endingCash.minus(beginningCash);

    return {
      reportType: 'CASH_FLOW',
      title: 'Cash Flow Statement',
      periodName,
      startDate,
      endDate,
      currency: 'NGN',
      
      operatingActivities: {
        netIncome: netIncome.toFixed(2),
        adjustments: [],
        netCashFromOperations: operatingCash.toFixed(2),
      },
      
      investingActivities: {
        items: [],
        netCashFromInvesting: investingCash.toFixed(2),
      },
      
      financingActivities: {
        items: [],
        netCashFromFinancing: financingCash.toFixed(2),
      },
      
      netChangeInCash: netChange.toFixed(2),
      beginningCash: beginningCash.toFixed(2),
      endingCash: endingCash.toFixed(2),
      
      generatedAt: new Date(),
    };
  }

  /**
   * Get expense breakdown by category
   */
  static async getExpenseBreakdown(
    tenantId: string,
    filters: ReportFilters
  ) {
    const { startDate, endDate, periodName } = await this.resolvePeriod(tenantId, filters);

    const accounts = await this.getAccountBalances(tenantId, startDate, endDate);
    
    const expenses = accounts.filter(a => 
      a.accountType === 'EXPENSE' || a.accountCode.startsWith('5') || a.accountCode.startsWith('6')
    );

    const total = this.sumBalances(expenses);

    // Sort by balance descending
    const sorted = expenses.sort((a, b) => 
      parseFloat(b.balance) - parseFloat(a.balance)
    );

    // Calculate percentages
    const breakdown = sorted.map(e => ({
      ...e,
      percentage: total.greaterThan(0) 
        ? new Decimal(e.balance).dividedBy(total).times(100).toFixed(1)
        : '0.0',
    }));

    return {
      periodName,
      startDate,
      endDate,
      currency: 'NGN',
      expenses: breakdown,
      total: total.toFixed(2),
      generatedAt: new Date(),
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static async resolvePeriod(
    tenantId: string,
    filters: ReportFilters
  ): Promise<{ startDate: Date; endDate: Date; periodName: string }> {
    if (filters.periodCode) {
      const period = await prisma.acct_financial_periods.findUnique({
        where: { tenantId_code: { tenantId, code: filters.periodCode } },
      });
      if (period) {
        return {
          startDate: period.startDate,
          endDate: period.endDate,
          periodName: period.name,
        };
      }
    }

    if (filters.periodId) {
      const period = await prisma.acct_financial_periods.findUnique({
        where: { id: filters.periodId },
      });
      if (period) {
        return {
          startDate: period.startDate,
          endDate: period.endDate,
          periodName: period.name,
        };
      }
    }

    // Default to current month
    const now = new Date();
    const startDate = filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = filters.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const periodName = `${startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;

    return { startDate, endDate, periodName };
  }

  private static async getAccountBalances(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    includeDebitCredit: boolean = false
  ): Promise<ReportLineItem[]> {
    // Get all ledger accounts with their chart of accounts
    const ledgerAccounts = await prisma.acct_ledger_accounts.findMany({
      where: { tenantId },
      include: {
        acct_chart_of_accounts: true,
        entries: {
          where: {
            entryDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: { chartOfAccount: { code: 'asc' } },
    });

    return ledgerAccounts
      .filter(la => la.entries.length > 0 || la.currentBalance.toNumber() !== 0)
      .map(la => {
        // Calculate period activity
        let periodDebit = new Decimal(0);
        let periodCredit = new Decimal(0);

        for (const entry of la.entries) {
          periodDebit = periodDebit.plus(entry.debitAmount.toString());
          periodCredit = periodCredit.plus(entry.creditAmount.toString());
        }

        // Calculate balance based on normal balance
        let balance: Decimal;
        if (la.chartOfAccount.normalBalance === 'DEBIT') {
          balance = periodDebit.minus(periodCredit);
        } else {
          balance = periodCredit.minus(periodDebit);
        }

        return {
          accountCode: la.chartOfAccount.code,
          accountName: la.chartOfAccount.name,
          accountType: la.chartOfAccount.accountType,
          balance: balance.abs().toFixed(2),
          debit: periodDebit.toFixed(2),
          credit: periodCredit.toFixed(2),
        };
      });
  }

  private static filterAccountsByType(
    accounts: ReportLineItem[],
    types: AcctAccountType[]
  ): ReportLineItem[] {
    return accounts.filter(a => types.includes(a.accountType as AcctAccountType));
  }

  private static filterAccountsBySubType(
    accounts: ReportLineItem[],
    subTypes: string[]
  ): ReportLineItem[] {
    // This is a simplified filter - in practice, you'd check accountSubType
    return accounts.filter(a => {
      // Map account codes to subtypes
      const code = a.accountCode;
      if (code.startsWith('51') || code.startsWith('52') || code.startsWith('53')) {
        return subTypes.includes('COST_OF_GOODS');
      }
      if (code.startsWith('61') || code.startsWith('62') || code.startsWith('63') ||
          code.startsWith('64') || code.startsWith('65') || code.startsWith('66') ||
          code.startsWith('67') || code.startsWith('68') || code.startsWith('69')) {
        return subTypes.includes('OPERATING_EXPENSE') || subTypes.includes('OTHER_EXPENSE');
      }
      if (code.startsWith('71')) {
        return subTypes.includes('OTHER_INCOME');
      }
      return false;
    });
  }

  private static sumBalances(accounts: ReportLineItem[]): Decimal {
    return accounts.reduce(
      (sum, a) => sum.plus(a.balance),
      new Decimal(0)
    );
  }

  private static async getCashBalance(tenantId: string, asOfDate: Date): Promise<Decimal> {
    const cashAccounts = await prisma.acct_ledger_accounts.findMany({
      where: {
        tenantId,
        chartOfAccount: {
          code: { in: ['1110', '1120', '1130'] },
        },
      },
      include: {
        entries: {
          where: {
            entryDate: { lte: asOfDate },
          },
        },
      },
    });

    let totalCash = new Decimal(0);
    for (const account of cashAccounts) {
      for (const entry of account.entries) {
        totalCash = totalCash
          .plus(entry.debitAmount.toString())
          .minus(entry.creditAmount.toString());
      }
    }

    return totalCash;
  }
}
