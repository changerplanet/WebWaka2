/**
 * MODULE 2: Accounting & Finance
 * Expense Tracking Service
 * 
 * Implements manual expense entry with automatic journal posting.
 * Nigeria-first: Supports cash purchases and informal expenses.
 * 
 * WORKFLOW:
 * 1. DRAFT → User creates expense
 * 2. SUBMITTED → User submits for approval (optional)
 * 3. APPROVED → Expense approved by manager
 * 4. POSTED → Journal entry created, expense finalized
 * 
 * CONSTRAINTS:
 * - Expenses create journal entries on posting
 * - No payment execution (accounting only)
 * - Cash vs bank marking for cash flow tracking
 */

import { prisma } from '@/lib/prisma';
import { 
  AcctExpenseStatus, 
  AcctExpensePaymentMethod,
  Prisma 
} from '@prisma/client';
import Decimal from 'decimal.js';
import { JournalEntryService, POSTING_RULES } from './journal-service';
import { ChartOfAccountService } from './coa-service';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpenseInput {
  expenseDate: Date;
  accountCode: string;          // Expense account code from COA
  categoryName?: string;        // Human-readable category
  amount: number;
  currency?: string;
  taxAmount?: number;
  taxCode?: string;
  isVatInclusive?: boolean;
  paymentMethod: AcctExpensePaymentMethod;
  paidFrom?: string;            // Cash drawer, bank account name
  vendorName?: string;
  vendorId?: string;
  vendorContact?: string;
  vendorPhone?: string;
  description: string;
  memo?: string;
  receiptNumber?: string;
  receiptDate?: Date;
  attachmentUrls?: string[];
  metadata?: Record<string, unknown>;
}

export interface ExpenseUpdate {
  expenseDate?: Date;
  accountCode?: string;
  categoryName?: string;
  amount?: number;
  taxAmount?: number;
  taxCode?: string;
  isVatInclusive?: boolean;
  paymentMethod?: AcctExpensePaymentMethod;
  paidFrom?: string;
  vendorName?: string;
  vendorContact?: string;
  vendorPhone?: string;
  description?: string;
  memo?: string;
  receiptNumber?: string;
  receiptDate?: Date;
  attachmentUrls?: string[];
  metadata?: Record<string, unknown>;
}

export interface ExpenseListOptions {
  status?: AcctExpenseStatus;
  paymentMethod?: AcctExpensePaymentMethod;
  periodId?: string;
  startDate?: Date;
  endDate?: Date;
  vendorName?: string;
  accountCode?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// EXPENSE CATEGORIES (Nigeria SME Common)
// ============================================================================

export const EXPENSE_CATEGORIES = [
  // Operational
  { name: 'Rent & Lease', accountCode: '6100', icon: 'home' },
  { name: 'Utilities - Electricity', accountCode: '6210', icon: 'zap' },
  { name: 'Utilities - Internet & Data', accountCode: '6220', icon: 'wifi' },
  { name: 'Utilities - Water', accountCode: '6200', icon: 'droplet' },
  
  // Personnel
  { name: 'Salaries & Wages', accountCode: '6300', icon: 'users' },
  { name: 'Staff Welfare', accountCode: '6950', icon: 'heart' },
  
  // Business Operations
  { name: 'Transport & Logistics', accountCode: '6700', icon: 'truck' },
  { name: 'Fuel & Generator', accountCode: '6210', icon: 'fuel' },
  { name: 'Office Supplies', accountCode: '6600', icon: 'package' },
  { name: 'Marketing & Advertising', accountCode: '6400', icon: 'megaphone' },
  
  // Financial
  { name: 'Bank Charges', accountCode: '6500', icon: 'credit-card' },
  { name: 'POS Transaction Fees', accountCode: '6510', icon: 'smartphone' },
  { name: 'Interest Expense', accountCode: '7510', icon: 'percent' },
  
  // Maintenance
  { name: 'Repairs & Maintenance', accountCode: '6800', icon: 'wrench' },
  { name: 'Equipment Purchase', accountCode: '1510', icon: 'tool' },
  
  // Other
  { name: 'Miscellaneous', accountCode: '6950', icon: 'more-horizontal' },
];

// ============================================================================
// EXPENSE SERVICE
// ============================================================================

export class ExpenseService {
  /**
   * Create a new expense record
   */
  static async create(
    tenantId: string,
    input: ExpenseInput,
    createdBy?: string
  ) {
    // Validate expense account exists
    const account = await ChartOfAccountService.getByCode(tenantId, input.accountCode);
    if (!account) {
      throw new Error(`Account code '${input.accountCode}' not found`);
    }

    // Get or create ledger account
    let ledgerAccount = await prisma.acctLedgerAccount.findFirst({
      where: { tenantId, chartOfAccountId: account.id },
    });

    if (!ledgerAccount) {
      ledgerAccount = await prisma.acctLedgerAccount.create({
        data: {
          tenantId,
          chartOfAccountId: account.id,
          currency: input.currency || 'NGN',
        },
      });
    }

    // Generate expense number
    const expenseNumber = await this.generateExpenseNumber(tenantId);

    // Get financial period
    const period = await this.getOrCreatePeriod(tenantId, input.expenseDate);

    return prisma.acctExpenseRecord.create({
      data: {
        tenantId,
        expenseNumber,
        expenseDate: input.expenseDate,
        ledgerAccountId: ledgerAccount.id,
        categoryName: input.categoryName,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency || 'NGN',
        taxAmount: input.taxAmount ? new Prisma.Decimal(input.taxAmount) : null,
        taxCode: input.taxCode,
        isVatInclusive: input.isVatInclusive || false,
        paymentMethod: input.paymentMethod,
        paidFrom: input.paidFrom,
        vendorName: input.vendorName,
        vendorId: input.vendorId,
        vendorContact: input.vendorContact,
        vendorPhone: input.vendorPhone,
        description: input.description,
        memo: input.memo,
        receiptNumber: input.receiptNumber,
        receiptDate: input.receiptDate,
        attachmentUrls: input.attachmentUrls || [],
        periodId: period?.id,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        createdBy,
        status: 'DRAFT',
      },
      include: {
        period: true,
      },
    });
  }

  /**
   * Update an expense record (only DRAFT or REJECTED)
   */
  static async update(
    tenantId: string,
    expenseId: string,
    input: ExpenseUpdate,
    updatedBy?: string
  ) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
      throw new Error(`Cannot update expense in ${expense.status} status`);
    }

    // If account code is changing, validate it
    let ledgerAccountId = expense.ledgerAccountId;
    if (input.accountCode) {
      const account = await ChartOfAccountService.getByCode(tenantId, input.accountCode);
      if (!account) {
        throw new Error(`Account code '${input.accountCode}' not found`);
      }

      let ledgerAccount = await prisma.acctLedgerAccount.findFirst({
        where: { tenantId, chartOfAccountId: account.id },
      });

      if (!ledgerAccount) {
        ledgerAccount = await prisma.acctLedgerAccount.create({
          data: {
            tenantId,
            chartOfAccountId: account.id,
            currency: input.amount !== undefined ? (expense.currency) : 'NGN',
          },
        });
      }
      ledgerAccountId = ledgerAccount.id;
    }

    // Update period if date changed
    let periodId = expense.periodId;
    if (input.expenseDate) {
      const period = await this.getOrCreatePeriod(tenantId, input.expenseDate);
      periodId = period?.id || null;
    }

    return prisma.acctExpenseRecord.update({
      where: { id: expenseId },
      data: {
        expenseDate: input.expenseDate,
        ledgerAccountId,
        categoryName: input.categoryName,
        amount: input.amount !== undefined ? new Prisma.Decimal(input.amount) : undefined,
        taxAmount: input.taxAmount !== undefined ? new Prisma.Decimal(input.taxAmount) : undefined,
        taxCode: input.taxCode,
        isVatInclusive: input.isVatInclusive,
        paymentMethod: input.paymentMethod,
        paidFrom: input.paidFrom,
        vendorName: input.vendorName,
        vendorContact: input.vendorContact,
        vendorPhone: input.vendorPhone,
        description: input.description,
        memo: input.memo,
        receiptNumber: input.receiptNumber,
        receiptDate: input.receiptDate,
        attachmentUrls: input.attachmentUrls,
        periodId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        // Reset rejection if previously rejected
        status: expense.status === 'REJECTED' ? 'DRAFT' : expense.status,
        rejectedAt: expense.status === 'REJECTED' ? null : expense.rejectedAt,
        rejectedBy: expense.status === 'REJECTED' ? null : expense.rejectedBy,
        rejectionReason: expense.status === 'REJECTED' ? null : expense.rejectionReason,
      },
      include: {
        period: true,
      },
    });
  }

  /**
   * Submit expense for approval
   */
  static async submit(
    tenantId: string,
    expenseId: string,
    submittedBy: string
  ) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'DRAFT') {
      throw new Error(`Cannot submit expense in ${expense.status} status`);
    }

    return prisma.acctExpenseRecord.update({
      where: { id: expenseId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy,
      },
    });
  }

  /**
   * Approve expense
   */
  static async approve(
    tenantId: string,
    expenseId: string,
    approvedBy: string
  ) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'SUBMITTED') {
      throw new Error(`Cannot approve expense in ${expense.status} status`);
    }

    return prisma.acctExpenseRecord.update({
      where: { id: expenseId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy,
      },
    });
  }

  /**
   * Reject expense
   */
  static async reject(
    tenantId: string,
    expenseId: string,
    rejectedBy: string,
    reason: string
  ) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'SUBMITTED') {
      throw new Error(`Cannot reject expense in ${expense.status} status`);
    }

    return prisma.acctExpenseRecord.update({
      where: { id: expenseId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason: reason,
      },
    });
  }

  /**
   * Post expense to journal
   * Creates journal entry: Debit Expense, Credit Cash/Bank/Payable
   */
  static async post(
    tenantId: string,
    expenseId: string,
    postedBy: string
  ) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
      include: {
        period: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Allow posting from DRAFT (skip approval) or APPROVED
    if (expense.status !== 'DRAFT' && expense.status !== 'APPROVED') {
      throw new Error(`Cannot post expense in ${expense.status} status`);
    }

    // Check period is open
    if (expense.period && expense.period.status !== 'OPEN') {
      throw new Error(`Financial period ${expense.period.name} is ${expense.period.status}. Cannot post expenses.`);
    }

    // Get expense account details
    const ledgerAccount = await prisma.acctLedgerAccount.findUnique({
      where: { id: expense.ledgerAccountId },
      include: { chartOfAccount: true },
    });

    if (!ledgerAccount) {
      throw new Error('Expense account not found');
    }

    // Determine payment account based on payment method
    let paymentAccountCode: string;
    switch (expense.paymentMethod) {
      case 'CASH':
        paymentAccountCode = '1110'; // Cash on Hand
        break;
      case 'BANK_TRANSFER':
      case 'CARD':
        paymentAccountCode = '1120'; // Cash in Bank
        break;
      case 'MOBILE_MONEY':
        paymentAccountCode = '1130'; // Mobile Money
        break;
      case 'CREDIT':
        paymentAccountCode = '2110'; // Accounts Payable
        break;
      default:
        paymentAccountCode = '1110'; // Default to cash
    }

    const expenseAmount = new Decimal(expense.amount.toString());
    const taxAmount = expense.taxAmount ? new Decimal(expense.taxAmount.toString()) : new Decimal(0);
    const totalAmount = expenseAmount.plus(taxAmount);

    // Build journal lines with proper typing
    const journalLines: Array<{
      accountCode: string;
      debitAmount?: number;
      creditAmount?: number;
      description: string;
      referenceType: string;
      referenceId: string;
      referenceNumber: string;
    }> = [
      {
        accountCode: ledgerAccount.chartOfAccount.code,
        debitAmount: expenseAmount.toNumber(),
        description: `${expense.categoryName || ledgerAccount.chartOfAccount.name}: ${expense.description}`,
        referenceType: 'EXPENSE',
        referenceId: expense.id,
        referenceNumber: expense.expenseNumber,
      },
    ];

    // Add VAT input line if applicable
    if (taxAmount.greaterThan(0)) {
      journalLines.push({
        accountCode: '2120', // VAT Payable (recoverable VAT would be asset, but for SME we use payable)
        debitAmount: taxAmount.toNumber(),
        description: `VAT on expense: ${expense.description}`,
        referenceType: 'EXPENSE',
        referenceId: expense.id,
        referenceNumber: expense.expenseNumber,
      });
    }

    // Credit payment account
    journalLines.push({
      accountCode: paymentAccountCode,
      creditAmount: totalAmount.toNumber(),
      description: `Payment for: ${expense.description}`,
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      referenceNumber: expense.expenseNumber,
    });

    // Create journal entry
    const result = await JournalEntryService.createAndPost(
      tenantId,
      {
        entryDate: expense.expenseDate,
        description: `Expense: ${expense.expenseNumber} - ${expense.description}`,
        memo: expense.memo ?? undefined,
        sourceType: 'EXPENSE',
        sourceId: expense.id,
        sourceModule: 'ACCOUNTING',
        idempotencyKey: `EXPENSE_${expense.id}`,
        taxAmount: taxAmount.toNumber(),
        taxCode: expense.taxCode ?? undefined,
        lines: journalLines,
        metadata: {
          vendorName: expense.vendorName,
          paymentMethod: expense.paymentMethod,
          receiptNumber: expense.receiptNumber,
        },
      },
      postedBy,
      true
    );

    if (!result.success) {
      throw new Error(`Failed to create journal entry: ${result.error}`);
    }

    // Update expense record
    return prisma.acctExpenseRecord.update({
      where: { id: expenseId },
      data: {
        status: 'POSTED',
        journalEntryId: result.journalEntry!.id,
        postedAt: new Date(),
      },
      include: {
        period: true,
      },
    });
  }

  /**
   * Delete expense (only DRAFT)
   */
  static async delete(tenantId: string, expenseId: string) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.status !== 'DRAFT') {
      throw new Error(`Cannot delete expense in ${expense.status} status. Only DRAFT expenses can be deleted.`);
    }

    await prisma.acctExpenseRecord.delete({
      where: { id: expenseId },
    });

    return { success: true };
  }

  /**
   * List expenses with filters
   */
  static async list(tenantId: string, options?: ExpenseListOptions) {
    const where: Prisma.AcctExpenseRecordWhereInput = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.paymentMethod) where.paymentMethod = options.paymentMethod;
    if (options?.periodId) where.periodId = options.periodId;
    if (options?.vendorName) {
      where.vendorName = { contains: options.vendorName, mode: 'insensitive' };
    }
    if (options?.startDate || options?.endDate) {
      where.expenseDate = {};
      if (options.startDate) where.expenseDate.gte = options.startDate;
      if (options.endDate) where.expenseDate.lte = options.endDate;
    }
    if (options?.minAmount !== undefined || options?.maxAmount !== undefined) {
      where.amount = {};
      if (options.minAmount !== undefined) where.amount.gte = options.minAmount;
      if (options.maxAmount !== undefined) where.amount.lte = options.maxAmount;
    }

    const [expenses, total] = await Promise.all([
      prisma.acctExpenseRecord.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          period: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.acctExpenseRecord.count({ where }),
    ]);

    // Get account details for each expense
    const ledgerAccountIds = [...new Set(expenses.map(e => e.ledgerAccountId))];
    const ledgerAccounts = await prisma.acctLedgerAccount.findMany({
      where: { id: { in: ledgerAccountIds } },
      include: { chartOfAccount: { select: { code: true, name: true, accountType: true } } },
    });
    const accountMap = new Map(ledgerAccounts.map(a => [a.id, a]));

    return {
      expenses: expenses.map(e => ({
        ...e,
        amount: e.amount.toString(),
        taxAmount: e.taxAmount?.toString(),
        account: accountMap.get(e.ledgerAccountId) ? {
          code: accountMap.get(e.ledgerAccountId)!.chartOfAccount.code,
          name: accountMap.get(e.ledgerAccountId)!.chartOfAccount.name,
          type: accountMap.get(e.ledgerAccountId)!.chartOfAccount.accountType,
        } : null,
      })),
      total,
    };
  }

  /**
   * Get single expense by ID
   */
  static async getById(tenantId: string, expenseId: string) {
    const expense = await prisma.acctExpenseRecord.findFirst({
      where: { id: expenseId, tenantId },
      include: {
        period: true,
      },
    });

    if (!expense) return null;

    // Get account details
    const ledgerAccount = await prisma.acctLedgerAccount.findUnique({
      where: { id: expense.ledgerAccountId },
      include: { chartOfAccount: true },
    });

    // Get journal entry if posted
    let journalEntry = null;
    if (expense.journalEntryId) {
      journalEntry = await prisma.acctJournalEntry.findUnique({
        where: { id: expense.journalEntryId },
        select: {
          id: true,
          journalNumber: true,
          status: true,
          totalDebit: true,
          totalCredit: true,
        },
      });
    }

    return {
      ...expense,
      amount: expense.amount.toString(),
      taxAmount: expense.taxAmount?.toString(),
      account: ledgerAccount ? {
        id: ledgerAccount.id,
        code: ledgerAccount.chartOfAccount.code,
        name: ledgerAccount.chartOfAccount.name,
        type: ledgerAccount.chartOfAccount.accountType,
      } : null,
      journal: journalEntry ? {
        ...journalEntry,
        totalDebit: journalEntry.totalDebit.toString(),
        totalCredit: journalEntry.totalCredit.toString(),
      } : null,
    };
  }

  /**
   * Get expense summary by category
   */
  static async getSummaryByCategory(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.AcctExpenseRecordWhereInput = {
      tenantId,
      status: 'POSTED',
    };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const expenses = await prisma.acctExpenseRecord.findMany({
      where,
      include: {
        period: { select: { id: true, name: true, code: true } },
      },
    });

    // Get account details
    const ledgerAccountIds = [...new Set(expenses.map(e => e.ledgerAccountId))];
    const ledgerAccounts = await prisma.acctLedgerAccount.findMany({
      where: { id: { in: ledgerAccountIds } },
      include: { chartOfAccount: { select: { code: true, name: true } } },
    });
    const accountMap = new Map(ledgerAccounts.map(a => [a.id, a]));

    // Group by category/account
    const summary: Record<string, { count: number; total: Decimal; account: string }> = {};

    for (const expense of expenses) {
      const category = expense.categoryName || 
        accountMap.get(expense.ledgerAccountId)?.chartOfAccount.name || 
        'Uncategorized';
      
      if (!summary[category]) {
        summary[category] = {
          count: 0,
          total: new Decimal(0),
          account: accountMap.get(expense.ledgerAccountId)?.chartOfAccount.code || '',
        };
      }
      summary[category].count++;
      summary[category].total = summary[category].total.plus(expense.amount.toString());
    }

    // Convert to array and sort by total descending
    const categoryList = Object.entries(summary)
      .map(([category, data]) => ({
        category,
        accountCode: data.account,
        count: data.count,
        total: data.total.toString(),
      }))
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    // Calculate grand total
    const grandTotal = categoryList.reduce(
      (sum, item) => sum.plus(item.total),
      new Decimal(0)
    );

    return {
      categories: categoryList,
      grandTotal: grandTotal.toString(),
      expenseCount: expenses.length,
    };
  }

  /**
   * Get expense summary by payment method
   */
  static async getSummaryByPaymentMethod(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.AcctExpenseRecordWhereInput = {
      tenantId,
      status: 'POSTED',
    };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const expenses = await prisma.acctExpenseRecord.findMany({
      where,
      select: { paymentMethod: true, amount: true },
    });

    // Group by payment method
    const summary: Record<string, { count: number; total: Decimal }> = {};

    for (const expense of expenses) {
      const method = expense.paymentMethod;
      if (!summary[method]) {
        summary[method] = { count: 0, total: new Decimal(0) };
      }
      summary[method].count++;
      summary[method].total = summary[method].total.plus(expense.amount.toString());
    }

    return Object.entries(summary).map(([method, data]) => ({
      paymentMethod: method,
      count: data.count,
      total: data.total.toString(),
    }));
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static async generateExpenseNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EXP-${year}-`;

    const lastExpense = await prisma.acctExpenseRecord.findFirst({
      where: {
        tenantId,
        expenseNumber: { startsWith: prefix },
      },
      orderBy: { expenseNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastExpense) {
      const lastNum = parseInt(lastExpense.expenseNumber.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(6, '0')}`;
  }

  private static async getOrCreatePeriod(tenantId: string, date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const code = `${year}-${String(month + 1).padStart(2, '0')}`;

    let period = await prisma.acctFinancialPeriod.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });

    if (!period) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const name = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

      period = await prisma.acctFinancialPeriod.create({
        data: {
          tenantId,
          name,
          code,
          periodType: 'MONTHLY',
          startDate,
          endDate,
          fiscalYear: year,
          status: 'OPEN',
        },
      });
    }

    return period;
  }
}
