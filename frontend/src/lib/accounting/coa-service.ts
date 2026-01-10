/**
 * MODULE 2: Accounting & Finance
 * Chart of Accounts Service
 * 
 * Manages the Chart of Accounts (COA) for tenants.
 * Nigeria-first: Pre-configured for Nigerian SMEs with VAT support.
 * 
 * CONSTRAINTS:
 * - COA changes do NOT affect historical entries
 * - System accounts cannot be deleted
 * - Account codes must be unique per tenant
 */

import { prisma } from '@/lib/prisma';
import { AcctAccountType, AcctAccountSubType, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ChartOfAccountInput {
  code: string;
  name: string;
  description?: string;
  accountType: AcctAccountType;
  accountSubType?: AcctAccountSubType;
  parentId?: string;
  normalBalance?: 'DEBIT' | 'CREDIT';
  isSystemAccount?: boolean;
  isBankAccount?: boolean;
  isControlAccount?: boolean;
  taxCode?: string;
  isTaxAccount?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface ChartOfAccountUpdate {
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// DEFAULT COA TEMPLATE - NIGERIA SME
// ============================================================================

/**
 * Default Chart of Accounts for Nigerian SMEs
 * 
 * Account Code Structure:
 * - 1xxx: Assets
 * - 2xxx: Liabilities
 * - 3xxx: Equity
 * - 4xxx: Revenue
 * - 5xxx: Cost of Goods Sold
 * - 6xxx: Operating Expenses
 * - 7xxx: Other Income/Expenses
 */
export const NIGERIA_SME_COA_TEMPLATE: ChartOfAccountInput[] = [
  // =========================================================================
  // ASSETS (1xxx)
  // =========================================================================
  {
    code: '1000',
    name: 'Assets',
    description: 'Resources owned by the business',
    accountType: 'ASSET',
    normalBalance: 'DEBIT',
    isSystemAccount: true,
    sortOrder: 1000,
  },
  
  // Current Assets
  {
    code: '1100',
    name: 'Current Assets',
    description: 'Assets expected to be converted to cash within one year',
    accountType: 'ASSET',
    normalBalance: 'DEBIT',
    isSystemAccount: true,
    sortOrder: 1100,
  },
  {
    code: '1110',
    name: 'Cash on Hand',
    description: 'Physical cash in registers and safe',
    accountType: 'ASSET',
    accountSubType: 'CASH',
    normalBalance: 'DEBIT',
    isSystemAccount: true,
    sortOrder: 1110,
  },
  {
    code: '1120',
    name: 'Cash in Bank',
    description: 'Funds in bank accounts',
    accountType: 'ASSET',
    accountSubType: 'BANK',
    normalBalance: 'DEBIT',
    isBankAccount: true,
    isSystemAccount: true,
    sortOrder: 1120,
  },
  {
    code: '1130',
    name: 'Mobile Money',
    description: 'Funds in mobile money accounts (OPay, PalmPay, etc.)',
    accountType: 'ASSET',
    accountSubType: 'BANK',
    normalBalance: 'DEBIT',
    isBankAccount: true,
    sortOrder: 1130,
  },
  {
    code: '1140',
    name: 'POS Terminal Float',
    description: 'Funds held in POS terminals pending settlement',
    accountType: 'ASSET',
    accountSubType: 'CASH',
    normalBalance: 'DEBIT',
    sortOrder: 1140,
  },
  {
    code: '1200',
    name: 'Accounts Receivable',
    description: 'Money owed by customers',
    accountType: 'ASSET',
    accountSubType: 'ACCOUNTS_RECEIVABLE',
    normalBalance: 'DEBIT',
    isControlAccount: true,
    sortOrder: 1200,
  },
  {
    code: '1300',
    name: 'Inventory',
    description: 'Goods held for sale',
    accountType: 'ASSET',
    accountSubType: 'INVENTORY',
    normalBalance: 'DEBIT',
    isSystemAccount: true,
    sortOrder: 1300,
  },
  {
    code: '1400',
    name: 'Prepaid Expenses',
    description: 'Expenses paid in advance',
    accountType: 'ASSET',
    accountSubType: 'PREPAID_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 1400,
  },
  
  // Fixed Assets
  {
    code: '1500',
    name: 'Fixed Assets',
    description: 'Long-term assets used in operations',
    accountType: 'ASSET',
    accountSubType: 'FIXED_ASSET',
    normalBalance: 'DEBIT',
    sortOrder: 1500,
  },
  {
    code: '1510',
    name: 'Equipment',
    description: 'Business equipment and machinery',
    accountType: 'ASSET',
    accountSubType: 'FIXED_ASSET',
    normalBalance: 'DEBIT',
    sortOrder: 1510,
  },
  {
    code: '1520',
    name: 'Furniture & Fixtures',
    description: 'Office furniture and store fixtures',
    accountType: 'ASSET',
    accountSubType: 'FIXED_ASSET',
    normalBalance: 'DEBIT',
    sortOrder: 1520,
  },
  {
    code: '1590',
    name: 'Accumulated Depreciation',
    description: 'Total depreciation on fixed assets',
    accountType: 'CONTRA_ASSET',
    normalBalance: 'CREDIT',
    sortOrder: 1590,
  },

  // =========================================================================
  // LIABILITIES (2xxx)
  // =========================================================================
  {
    code: '2000',
    name: 'Liabilities',
    description: 'Amounts owed to others',
    accountType: 'LIABILITY',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 2000,
  },
  
  // Current Liabilities
  {
    code: '2100',
    name: 'Current Liabilities',
    description: 'Obligations due within one year',
    accountType: 'LIABILITY',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 2100,
  },
  {
    code: '2110',
    name: 'Accounts Payable',
    description: 'Money owed to suppliers',
    accountType: 'LIABILITY',
    accountSubType: 'ACCOUNTS_PAYABLE',
    normalBalance: 'CREDIT',
    isControlAccount: true,
    sortOrder: 2110,
  },
  {
    code: '2120',
    name: 'VAT Payable',
    description: 'Value Added Tax collected from customers (7.5%)',
    accountType: 'LIABILITY',
    accountSubType: 'VAT_PAYABLE',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    isTaxAccount: true,
    taxCode: 'VAT_7.5',
    sortOrder: 2120,
  },
  {
    code: '2130',
    name: 'Withholding Tax Payable',
    description: 'WHT collected and due to FIRS',
    accountType: 'LIABILITY',
    accountSubType: 'OTHER_TAX_PAYABLE',
    normalBalance: 'CREDIT',
    isTaxAccount: true,
    taxCode: 'WHT',
    sortOrder: 2130,
  },
  {
    code: '2140',
    name: 'Accrued Expenses',
    description: 'Expenses incurred but not yet paid',
    accountType: 'LIABILITY',
    accountSubType: 'ACCRUED_EXPENSE',
    normalBalance: 'CREDIT',
    sortOrder: 2140,
  },
  {
    code: '2150',
    name: 'Customer Deposits',
    description: 'Advance payments from customers',
    accountType: 'LIABILITY',
    accountSubType: 'OTHER_LIABILITY',
    normalBalance: 'CREDIT',
    sortOrder: 2150,
  },
  
  // Long-term Liabilities
  {
    code: '2500',
    name: 'Long-term Liabilities',
    description: 'Obligations due after one year',
    accountType: 'LIABILITY',
    normalBalance: 'CREDIT',
    sortOrder: 2500,
  },
  {
    code: '2510',
    name: 'Bank Loans',
    description: 'Loans from financial institutions',
    accountType: 'LIABILITY',
    accountSubType: 'LONG_TERM_DEBT',
    normalBalance: 'CREDIT',
    sortOrder: 2510,
  },

  // =========================================================================
  // EQUITY (3xxx)
  // =========================================================================
  {
    code: '3000',
    name: 'Equity',
    description: "Owner's investment and retained profits",
    accountType: 'EQUITY',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 3000,
  },
  {
    code: '3100',
    name: "Owner's Capital",
    description: "Owner's investment in the business",
    accountType: 'EQUITY',
    accountSubType: 'OWNER_EQUITY',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 3100,
  },
  {
    code: '3200',
    name: 'Retained Earnings',
    description: 'Accumulated profits from prior periods',
    accountType: 'EQUITY',
    accountSubType: 'RETAINED_EARNINGS',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 3200,
  },
  {
    code: '3300',
    name: "Owner's Drawings",
    description: 'Withdrawals by owner',
    accountType: 'CONTRA_EQUITY',
    accountSubType: 'OWNER_DRAW',
    normalBalance: 'DEBIT',
    sortOrder: 3300,
  },

  // =========================================================================
  // REVENUE (4xxx)
  // =========================================================================
  {
    code: '4000',
    name: 'Revenue',
    description: 'Income from business operations',
    accountType: 'REVENUE',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 4000,
  },
  {
    code: '4100',
    name: 'Sales Revenue',
    description: 'Income from sale of goods',
    accountType: 'REVENUE',
    accountSubType: 'SALES_REVENUE',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 4100,
  },
  {
    code: '4110',
    name: 'POS Sales',
    description: 'In-store sales via Point of Sale',
    accountType: 'REVENUE',
    accountSubType: 'SALES_REVENUE',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 4110,
  },
  {
    code: '4120',
    name: 'Online Sales',
    description: 'Sales via online storefront',
    accountType: 'REVENUE',
    accountSubType: 'SALES_REVENUE',
    normalBalance: 'CREDIT',
    isSystemAccount: true,
    sortOrder: 4120,
  },
  {
    code: '4130',
    name: 'Marketplace Sales',
    description: 'Sales via multi-vendor marketplace',
    accountType: 'REVENUE',
    accountSubType: 'SALES_REVENUE',
    normalBalance: 'CREDIT',
    sortOrder: 4130,
  },
  {
    code: '4200',
    name: 'Service Revenue',
    description: 'Income from services provided',
    accountType: 'REVENUE',
    accountSubType: 'SERVICE_REVENUE',
    normalBalance: 'CREDIT',
    sortOrder: 4200,
  },
  {
    code: '4300',
    name: 'Sales Discounts',
    description: 'Discounts given to customers',
    accountType: 'CONTRA_REVENUE',
    normalBalance: 'DEBIT',
    sortOrder: 4300,
  },
  {
    code: '4400',
    name: 'Sales Returns',
    description: 'Goods returned by customers',
    accountType: 'CONTRA_REVENUE',
    normalBalance: 'DEBIT',
    sortOrder: 4400,
  },

  // =========================================================================
  // COST OF GOODS SOLD (5xxx)
  // =========================================================================
  {
    code: '5000',
    name: 'Cost of Goods Sold',
    description: 'Direct costs of products sold',
    accountType: 'EXPENSE',
    accountSubType: 'COST_OF_GOODS',
    normalBalance: 'DEBIT',
    isSystemAccount: true,
    sortOrder: 5000,
  },
  {
    code: '5100',
    name: 'Inventory Purchases',
    description: 'Cost of inventory purchased for resale',
    accountType: 'EXPENSE',
    accountSubType: 'COST_OF_GOODS',
    normalBalance: 'DEBIT',
    sortOrder: 5100,
  },
  {
    code: '5200',
    name: 'Freight & Shipping',
    description: 'Cost of shipping goods',
    accountType: 'EXPENSE',
    accountSubType: 'COST_OF_GOODS',
    normalBalance: 'DEBIT',
    sortOrder: 5200,
  },
  {
    code: '5300',
    name: 'Inventory Adjustments',
    description: 'Adjustments for damaged, lost, or expired inventory',
    accountType: 'EXPENSE',
    accountSubType: 'COST_OF_GOODS',
    normalBalance: 'DEBIT',
    sortOrder: 5300,
  },

  // =========================================================================
  // OPERATING EXPENSES (6xxx)
  // =========================================================================
  {
    code: '6000',
    name: 'Operating Expenses',
    description: 'Costs of running the business',
    accountType: 'EXPENSE',
    accountSubType: 'OPERATING_EXPENSE',
    normalBalance: 'DEBIT',
    isSystemAccount: true,
    sortOrder: 6000,
  },
  {
    code: '6100',
    name: 'Rent Expense',
    description: 'Shop/office rent',
    accountType: 'EXPENSE',
    accountSubType: 'RENT_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6100,
  },
  {
    code: '6200',
    name: 'Utilities',
    description: 'Electricity, water, internet',
    accountType: 'EXPENSE',
    accountSubType: 'UTILITIES_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6200,
  },
  {
    code: '6210',
    name: 'Electricity (NEPA/DISCO)',
    description: 'Electricity bills and generator fuel',
    accountType: 'EXPENSE',
    accountSubType: 'UTILITIES_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6210,
  },
  {
    code: '6220',
    name: 'Internet & Data',
    description: 'Internet and mobile data costs',
    accountType: 'EXPENSE',
    accountSubType: 'UTILITIES_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6220,
  },
  {
    code: '6300',
    name: 'Salaries & Wages',
    description: 'Employee compensation',
    accountType: 'EXPENSE',
    accountSubType: 'PAYROLL_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6300,
  },
  {
    code: '6400',
    name: 'Marketing & Advertising',
    description: 'Promotional costs',
    accountType: 'EXPENSE',
    accountSubType: 'MARKETING_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6400,
  },
  {
    code: '6500',
    name: 'Bank Charges',
    description: 'Bank fees and transaction charges',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6500,
  },
  {
    code: '6510',
    name: 'POS Transaction Fees',
    description: 'Fees charged by payment processors',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6510,
  },
  {
    code: '6600',
    name: 'Office Supplies',
    description: 'Stationery and office consumables',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6600,
  },
  {
    code: '6700',
    name: 'Transport & Logistics',
    description: 'Delivery and transportation costs',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6700,
  },
  {
    code: '6800',
    name: 'Repairs & Maintenance',
    description: 'Equipment and property maintenance',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6800,
  },
  {
    code: '6900',
    name: 'Depreciation Expense',
    description: 'Depreciation of fixed assets',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6900,
  },
  {
    code: '6950',
    name: 'Miscellaneous Expenses',
    description: 'Other operating costs',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 6950,
  },

  // =========================================================================
  // OTHER INCOME/EXPENSES (7xxx)
  // =========================================================================
  {
    code: '7000',
    name: 'Other Income',
    description: 'Non-operating income',
    accountType: 'REVENUE',
    accountSubType: 'OTHER_INCOME',
    normalBalance: 'CREDIT',
    sortOrder: 7000,
  },
  {
    code: '7100',
    name: 'Interest Income',
    description: 'Interest earned on deposits',
    accountType: 'REVENUE',
    accountSubType: 'OTHER_INCOME',
    normalBalance: 'CREDIT',
    sortOrder: 7100,
  },
  {
    code: '7500',
    name: 'Other Expenses',
    description: 'Non-operating expenses',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 7500,
  },
  {
    code: '7510',
    name: 'Interest Expense',
    description: 'Interest paid on loans',
    accountType: 'EXPENSE',
    accountSubType: 'OTHER_EXPENSE',
    normalBalance: 'DEBIT',
    sortOrder: 7510,
  },
];

// ============================================================================
// CHART OF ACCOUNTS SERVICE
// ============================================================================

export class ChartOfAccountService {
  /**
   * Initialize Chart of Accounts for a new tenant
   * Creates default Nigeria SME COA
   */
  static async initializeForTenant(
    tenantId: string,
    createdBy?: string
  ): Promise<{ success: boolean; accountCount: number }> {
    // Check if already initialized
    const existing = await prisma.acct_chart_of_accounts.findFirst({
      where: { tenantId },
    });

    if (existing) {
      return { success: true, accountCount: 0 }; // Already initialized
    }

    // Create all accounts from template
    const accounts = await prisma.$transaction(
      NIGERIA_SME_COA_TEMPLATE.map((template) =>
        prisma.acct_chart_of_accounts.create({
          data: {
            tenantId,
            code: template.code,
            name: template.name,
            description: template.description,
            accountType: template.accountType,
            accountSubType: template.accountSubType,
            normalBalance: template.normalBalance || 'DEBIT',
            isSystemAccount: template.isSystemAccount || false,
            isBankAccount: template.isBankAccount || false,
            isControlAccount: template.isControlAccount || false,
            taxCode: template.taxCode,
            isTaxAccount: template.isTaxAccount || false,
            sortOrder: template.sortOrder || 0,
            metadata: template.metadata as Prisma.InputJsonValue | undefined,
            createdBy,
          } as any,
        })
      )
    );

    return { success: true, accountCount: accounts.length };
  }

  /**
   * Get all accounts for a tenant
   */
  static async list(
    tenantId: string,
    options?: {
      accountType?: AcctAccountType;
      isActive?: boolean;
      includeChildren?: boolean;
    }
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (options?.accountType) {
      where.accountType = options.accountType;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const accounts = await prisma.acct_chart_of_accounts.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      include: options?.includeChildren
        ? {
            other_acct_chart_of_accounts: {
              orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
            },
          }
        : undefined,
    });

    return accounts;
  }

  /**
   * Get a single account by code
   */
  static async getByCode(tenantId: string, code: string) {
    return prisma.acct_chart_of_accounts.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    });
  }

  /**
   * Get a single account by ID
   */
  static async getById(tenantId: string, id: string) {
    return prisma.acct_chart_of_accounts.findFirst({
      where: { id, tenantId },
    });
  }

  /**
   * Create a custom account
   * 
   * CONSTRAINT: Cannot create system accounts
   */
  static async create(
    tenantId: string,
    input: ChartOfAccountInput,
    createdBy?: string
  ) {
    // Validate code uniqueness
    const existing = await prisma.acct_chart_of_accounts.findUnique({
      where: {
        tenantId_code: { tenantId, code: input.code },
      },
    });

    if (existing) {
      throw new Error(`Account code '${input.code}' already exists`);
    }

    // Validate parent exists if specified
    if (input.parentId) {
      const parent = await prisma.acct_chart_of_accounts.findFirst({
        where: { id: input.parentId, tenantId },
      });
      if (!parent) {
        throw new Error('Parent account not found');
      }
    }

    return prisma.acct_chart_of_accounts.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        description: input.description,
        accountType: input.accountType,
        accountSubType: input.accountSubType,
        parentId: input.parentId,
        normalBalance: input.normalBalance || 'DEBIT',
        isSystemAccount: false, // Custom accounts are never system accounts
        isBankAccount: input.isBankAccount || false,
        isControlAccount: input.isControlAccount || false,
        taxCode: input.taxCode,
        isTaxAccount: input.isTaxAccount || false,
        sortOrder: input.sortOrder || 0,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        createdBy,
      } as any,
    });
  }

  /**
   * Update an account
   * 
   * CONSTRAINTS:
   * - Cannot change code, accountType, or normalBalance (affects historical entries)
   * - System accounts cannot be deleted (only deactivated)
   */
  static async update(
    tenantId: string,
    accountId: string,
    input: ChartOfAccountUpdate,
    updatedBy?: string
  ) {
    const account = await prisma.acct_chart_of_accounts.findFirst({
      where: { id: accountId, tenantId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return prisma.acct_chart_of_accounts.update({
      where: { id: accountId },
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Deactivate an account
   * 
   * CONSTRAINT: Cannot deactivate if account has unposted entries
   */
  static async deactivate(tenantId: string, accountId: string) {
    const account = await prisma.acct_chart_of_accounts.findFirst({
      where: { id: accountId, tenantId },
      include: {
        acct_ledger_accounts: {
          include: {
            acct_ledger_entries: {
              where: {
                acct_journal_entries: {
                  status: 'DRAFT',
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check for unposted entries
    const hasUnpostedEntries = (account as any).acct_ledger_accounts.some(
      (la: any) => la.acct_ledger_entries.length > 0
    );

    if (hasUnpostedEntries) {
      throw new Error(
        'Cannot deactivate account with unposted journal entries'
      );
    }

    return prisma.acct_chart_of_accounts.update({
      where: { id: accountId },
      data: { isActive: false },
    });
  }

  /**
   * Delete an account
   * 
   * CONSTRAINTS:
   * - Cannot delete system accounts
   * - Cannot delete if account has any ledger entries
   */
  static async delete(tenantId: string, accountId: string) {
    const account = await prisma.acct_chart_of_accounts.findFirst({
      where: { id: accountId, tenantId },
      include: {
        acct_ledger_accounts: {
          include: {
            _count: {
              select: { entries: true },
            },
          },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.isSystemAccount) {
      throw new Error('Cannot delete system accounts');
    }

    // Check for any entries
    const hasEntries = account.acct_ledger_accounts.some(
      (la) => la._count.entries > 0
    );

    if (hasEntries) {
      throw new Error(
        'Cannot delete account with ledger entries. Deactivate instead.'
      );
    }

    // Delete ledger accounts first, then chart of account
    await prisma.$transaction([
      prisma.acct_ledger_accounts.deleteMany({
        where: { chartOfAccountId: accountId },
      }),
      prisma.acct_chart_of_accounts.delete({
        where: { id: accountId },
      }),
    ]);

    return { success: true };
  }

  /**
   * Get accounts by type for dropdowns
   */
  static async getByType(tenantId: string, accountType: AcctAccountType) {
    return prisma.acct_chart_of_accounts.findMany({
      where: {
        tenantId,
        accountType,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        accountSubType: true,
      },
    });
  }

  /**
   * Get tax accounts
   */
  static async getTaxAccounts(tenantId: string) {
    return prisma.acct_chart_of_accounts.findMany({
      where: {
        tenantId,
        isTaxAccount: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get bank accounts
   */
  static async getBankAccounts(tenantId: string) {
    return prisma.acct_chart_of_accounts.findMany({
      where: {
        tenantId,
        isBankAccount: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get account tree (hierarchical)
   */
  static async getTree(tenantId: string) {
    const accounts = await prisma.acct_chart_of_accounts.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });

    // Build tree structure
    const accountMap = new Map(accounts.map((a) => [a.id, { ...a, children: [] as typeof accounts }]));
    const roots: (typeof accounts[0] & { children: typeof accounts })[] = [];

    for (const account of accountMap.values()) {
      if (account.parentId && accountMap.has(account.parentId)) {
        accountMap.get(account.parentId)!.children.push(account);
      } else {
        roots.push(account);
      }
    }

    return roots;
  }
}
