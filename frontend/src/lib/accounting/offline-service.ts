/**
 * MODULE 2: Accounting & Finance
 * Offline Support Service
 * 
 * Defines offline-safe actions and sync behavior for accounting module.
 * 
 * OFFLINE-SAFE ACTIONS:
 * - Expense entry (queued)
 * - Receipt capture (queued)
 * 
 * READ-ONLY OFFLINE:
 * - Reports (cached)
 * - COA (cached)
 * - Recent transactions (cached)
 * 
 * SYNC CONSTRAINTS:
 * - Idempotent posting (no duplicates)
 * - Conflict resolution via timestamp
 * - Journal entries are server-authoritative
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineExpense {
  clientId: string;           // Client-generated UUID
  expenseDate: string;        // ISO date string
  accountCode: string;
  categoryName?: string;
  amount: number;
  currency?: string;
  taxAmount?: number;
  paymentMethod: string;
  vendorName?: string;
  description: string;
  receiptNumber?: string;
  attachmentUrls?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;          // Client timestamp
}

export interface SyncRequest {
  clientId: string;           // Device/session identifier
  lastSyncAt?: string;        // Last successful sync timestamp
  offlineExpenses: OfflineExpense[];
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  results: Array<{
    clientId: string;
    status: 'created' | 'duplicate' | 'error';
    serverId?: string;
    expenseNumber?: string;
    error?: string;
  }>;
  conflicts: Array<{
    clientId: string;
    reason: string;
  }>;
}

export interface OfflineDataPackage {
  lastUpdated: string;
  chartOfAccounts: Array<{
    code: string;
    name: string;
    accountType: string;
    isActive: boolean;
  }>;
  expenseCategories: Array<{
    name: string;
    accountCode: string;
  }>;
  recentExpenses: Array<{
    id: string;
    expenseNumber: string;
    expenseDate: string;
    amount: string;
    description: string;
    status: string;
  }>;
  currentPeriod: {
    code: string;
    name: string;
    status: string;
  } | null;
}

// ============================================================================
// EXPENSE CATEGORIES FOR OFFLINE
// ============================================================================

const OFFLINE_EXPENSE_CATEGORIES = [
  { name: 'Transport', accountCode: '6700' },
  { name: 'Fuel', accountCode: '6210' },
  { name: 'Office Supplies', accountCode: '6600' },
  { name: 'Utilities', accountCode: '6200' },
  { name: 'Food & Refreshments', accountCode: '6950' },
  { name: 'Communication', accountCode: '6220' },
  { name: 'Repairs', accountCode: '6800' },
  { name: 'Other', accountCode: '6950' },
];

// ============================================================================
// OFFLINE SERVICE
// ============================================================================

export class OfflineService {
  /**
   * Get offline data package for caching
   */
  static async getOfflinePackage(tenantId: string): Promise<OfflineDataPackage> {
    // Get COA
    const coa = await prisma.acct_chart_of_accounts.findMany({
      where: { tenantId, isActive: true },
      select: {
        code: true,
        name: true,
        accountType: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });

    // Get recent expenses (last 50)
    const expenses = await prisma.acct_expense_records.findMany({
      where: { tenantId },
      select: {
        id: true,
        expenseNumber: true,
        expenseDate: true,
        amount: true,
        description: true,
        status: true,
      },
      orderBy: { expenseDate: 'desc' },
      take: 50,
    });

    // Get current period
    const now = new Date();
    const periodCode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentPeriod = await prisma.acct_financial_periods.findUnique({
      where: { tenantId_code: { tenantId, code: periodCode } },
      select: { code: true, name: true, status: true },
    });

    return {
      lastUpdated: new Date().toISOString(),
      chartOfAccounts: coa,
      expenseCategories: OFFLINE_EXPENSE_CATEGORIES,
      recentExpenses: expenses.map(e => ({
        id: e.id,
        expenseNumber: e.expenseNumber,
        expenseDate: e.expenseDate.toISOString(),
        amount: e.amount.toString(),
        description: e.description,
        status: e.status,
      })),
      currentPeriod: currentPeriod ? {
        code: currentPeriod.code,
        name: currentPeriod.name,
        status: currentPeriod.status,
      } : null,
    };
  }

  /**
   * Sync offline expenses to server
   * Idempotent - prevents duplicate entries
   */
  static async syncExpenses(
    tenantId: string,
    request: SyncRequest,
    userId: string
  ): Promise<SyncResult> {
    const results: SyncResult['results'] = [];
    const conflicts: SyncResult['conflicts'] = [];

    for (const offlineExpense of request.offlineExpenses) {
      try {
        // Check for duplicate by clientId (idempotency)
        const existing = await prisma.acct_expense_records.findFirst({
          where: {
            tenantId,
            metadata: {
              path: ['offlineClientId'],
              equals: offlineExpense.clientId,
            },
          },
        });

        if (existing) {
          results.push({
            clientId: offlineExpense.clientId,
            status: 'duplicate',
            serverId: existing.id,
            expenseNumber: existing.expenseNumber,
          });
          continue;
        }

        // Validate account code
        const account = await prisma.acct_chart_of_accounts.findFirst({
          where: { tenantId, code: offlineExpense.accountCode, isActive: true },
        });

        if (!account) {
          results.push({
            clientId: offlineExpense.clientId,
            status: 'error',
            error: `Invalid account code: ${offlineExpense.accountCode}`,
          });
          continue;
        }

        // Get or create ledger account
        let ledgerAccount = await prisma.acct_ledger_accounts.findFirst({
          where: { tenantId, chartOfAccountId: account.id },
        });

        if (!ledgerAccount) {
          ledgerAccount = await prisma.acct_ledger_accounts.create({
            data: {
              tenantId,
              chartOfAccountId: account.id,
              currency: offlineExpense.currency || 'NGN',
            } as any,
          });
        }

        // Generate expense number
        const expenseNumber = await this.generateExpenseNumber(tenantId);

        // Get financial period
        const expenseDate = new Date(offlineExpense.expenseDate);
        const periodCode = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        let period = await prisma.acct_financial_periods.findUnique({
          where: { tenantId_code: { tenantId, code: periodCode } },
        });

        if (!period) {
          const startDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
          const endDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0, 23, 59, 59, 999);
          period = await prisma.acct_financial_periods.create({
            data: {
              tenantId,
              name: expenseDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
              code: periodCode,
              periodType: 'MONTHLY',
              startDate,
              endDate,
              fiscalYear: expenseDate.getFullYear(),
              status: 'OPEN',
            } as any,
          });
        }

        // Check if period is open
        if (period.status !== 'OPEN') {
          conflicts.push({
            clientId: offlineExpense.clientId,
            reason: `Financial period ${period.name} is ${period.status}`,
          });
          continue;
        }

        // Create expense
        const expense = await prisma.acct_expense_records.create({
          data: {
            tenantId,
            expenseNumber,
            expenseDate,
            ledgerAccountId: ledgerAccount.id,
            categoryName: offlineExpense.categoryName,
            amount: new Prisma.Decimal(offlineExpense.amount),
            currency: offlineExpense.currency || 'NGN',
            taxAmount: offlineExpense.taxAmount 
              ? new Prisma.Decimal(offlineExpense.taxAmount) 
              : null,
            paymentMethod: offlineExpense.paymentMethod as any,
            vendorName: offlineExpense.vendorName,
            description: offlineExpense.description,
            receiptNumber: offlineExpense.receiptNumber,
            attachmentUrls: offlineExpense.attachmentUrls || [],
            periodId: period.id,
            status: 'DRAFT',
            metadata: {
              offlineClientId: offlineExpense.clientId,
              offlineCreatedAt: offlineExpense.createdAt,
              syncedAt: new Date().toISOString(),
              syncClientId: request.clientId,
            } as Prisma.InputJsonValue,
            createdBy: userId,
          } as any,
        });

        results.push({
          clientId: offlineExpense.clientId,
          status: 'created',
          serverId: expense.id,
          expenseNumber: expense.expenseNumber,
        });

      } catch (error) {
        results.push({
          clientId: offlineExpense.clientId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      syncedAt: new Date().toISOString(),
      results,
      conflicts,
    };
  }

  /**
   * Get changes since last sync
   */
  static async getChangesSince(
    tenantId: string,
    lastSyncAt: Date
  ) {
    // Get expenses created/updated since last sync
    const expenses = await prisma.acct_expense_records.findMany({
      where: {
        tenantId,
        updatedAt: { gt: lastSyncAt },
      },
      select: {
        id: true,
        expenseNumber: true,
        expenseDate: true,
        amount: true,
        description: true,
        status: true,
        updatedAt: true,
        metadata: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get any period changes
    const periods = await prisma.acct_financial_periods.findMany({
      where: {
        tenantId,
        updatedAt: { gt: lastSyncAt },
      },
      select: {
        code: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      lastSyncAt: lastSyncAt.toISOString(),
      currentTime: new Date().toISOString(),
      changes: {
        expenses: expenses.map(e => ({
          id: e.id,
          expenseNumber: e.expenseNumber,
          expenseDate: e.expenseDate.toISOString(),
          amount: e.amount.toString(),
          description: e.description,
          status: e.status,
          updatedAt: e.updatedAt.toISOString(),
          offlineClientId: (e.metadata as any)?.offlineClientId,
        })),
        periods: periods.map(p => ({
          code: p.code,
          name: p.name,
          status: p.status,
          updatedAt: p.updatedAt.toISOString(),
        })),
      },
    };
  }

  private static async generateExpenseNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EXP-${year}-`;

    const lastExpense = await prisma.acct_expense_records.findFirst({
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
}
