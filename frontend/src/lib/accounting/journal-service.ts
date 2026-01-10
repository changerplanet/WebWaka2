/**
 * MODULE 2: Accounting & Finance
 * Journal Entry Service
 * 
 * Implements double-entry accounting with event-sourced journal creation.
 * 
 * CONSTRAINTS:
 * - All entries must balance (debits = credits)
 * - Entries are APPEND-ONLY (no updates/deletes)
 * - Corrections via reversal entries only
 * - All postings are traceable via sourceType, sourceId, eventId
 */

import { prisma } from '@/lib/prisma';
import { 
  AcctJournalStatus, 
  AcctJournalSourceType,
  Prisma 
} from '@prisma/client';
import Decimal from 'decimal.js';
import { ChartOfAccountService } from './coa-service';

// ============================================================================
// TYPES
// ============================================================================

export interface JournalLineInput {
  accountCode: string;      // Chart of Account code (e.g., "1110")
  debitAmount?: number;     // Debit amount (mutually exclusive with credit)
  creditAmount?: number;    // Credit amount (mutually exclusive with debit)
  description?: string;     // Line-level description
  memo?: string;            // Additional notes
  referenceType?: string;   // e.g., "INVOICE", "RECEIPT"
  referenceId?: string;     // Document ID
  referenceNumber?: string; // Human-readable reference
}

export interface JournalEntryInput {
  entryDate: Date;
  description: string;
  memo?: string;
  sourceType: AcctJournalSourceType;
  sourceId?: string;
  sourceModule?: string;
  eventId?: string;
  idempotencyKey?: string;
  taxAmount?: number;
  taxCode?: string;
  lines: JournalLineInput[];
  metadata?: Record<string, unknown>;
  attachmentUrls?: string[];
}

export interface PostingResult {
  success: boolean;
  journalEntry?: {
    id: string;
    journalNumber: string;
    status: string;
    totalDebit: string;
    totalCredit: string;
  };
  error?: string;
}

// ============================================================================
// POSTING RULES - EVENT TO JOURNAL MAPPING
// ============================================================================

/**
 * Standard posting rules for event-to-journal mapping
 * Nigeria-first: All amounts in NGN, VAT 7.5%
 */
export const POSTING_RULES = {
  // POS Sale: Debit Cash, Credit Sales + VAT
  POS_SALE: {
    sourceType: 'POS_SALE' as AcctJournalSourceType,
    sourceModule: 'POS',
    defaultAccounts: {
      cashReceived: '1110',      // Cash on Hand
      salesRevenue: '4110',      // POS Sales
      vatPayable: '2120',        // VAT Payable
    },
  },

  // Online Sale (SVM): Debit Bank/Mobile Money, Credit Sales + VAT
  SVM_ORDER: {
    sourceType: 'SVM_ORDER' as AcctJournalSourceType,
    sourceModule: 'SVM',
    defaultAccounts: {
      bankReceived: '1120',      // Cash in Bank
      mobileMoneyReceived: '1130', // Mobile Money
      salesRevenue: '4120',      // Online Sales
      vatPayable: '2120',        // VAT Payable
    },
  },

  // Marketplace Sale (MVM): Debit Bank, Credit Sales + VAT
  MVM_ORDER: {
    sourceType: 'MVM_ORDER' as AcctJournalSourceType,
    sourceModule: 'MVM',
    defaultAccounts: {
      bankReceived: '1120',      // Cash in Bank
      salesRevenue: '4130',      // Marketplace Sales
      vatPayable: '2120',        // VAT Payable
    },
  },

  // Refund: Reverse of sale
  REFUND: {
    sourceType: 'REFUND' as AcctJournalSourceType,
    sourceModule: 'CORE',
    defaultAccounts: {
      salesReturns: '4400',      // Sales Returns
      cashPaid: '1110',          // Cash on Hand
      vatPayable: '2120',        // VAT Payable (reverse)
    },
  },

  // Expense: Debit Expense Account, Credit Cash/Bank/Payable
  EXPENSE: {
    sourceType: 'EXPENSE' as AcctJournalSourceType,
    sourceModule: 'ACCOUNTING',
    defaultAccounts: {
      accountsPayable: '2110',   // Accounts Payable
      cashPaid: '1110',          // Cash on Hand
      bankPaid: '1120',          // Cash in Bank
    },
  },

  // Inventory Adjustment
  INVENTORY_ADJUSTMENT: {
    sourceType: 'INVENTORY_ADJUSTMENT' as AcctJournalSourceType,
    sourceModule: 'INVENTORY',
    defaultAccounts: {
      inventory: '1300',         // Inventory
      inventoryAdjustment: '5300', // Inventory Adjustments (COGS)
    },
  },
};

// ============================================================================
// JOURNAL ENTRY SERVICE
// ============================================================================

export class JournalEntryService {
  /**
   * Create and post a journal entry
   * 
   * CONSTRAINTS:
   * - Debits must equal credits
   * - Idempotency key prevents duplicate postings
   * - All lines must reference valid accounts
   */
  static async createAndPost(
    tenantId: string,
    input: JournalEntryInput,
    createdBy?: string,
    autoPost: boolean = true
  ): Promise<PostingResult> {
    // Check idempotency
    if (input.idempotencyKey) {
      const existing = await prisma.acct_journal_entries.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });

      if (existing) {
        return {
          success: true,
          journalEntry: {
            id: existing.id,
            journalNumber: existing.journalNumber,
            status: existing.status,
            totalDebit: existing.totalDebit.toString(),
            totalCredit: existing.totalCredit.toString(),
          },
        };
      }
    }

    // Validate lines balance
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of input.lines) {
      if (line.debitAmount && line.creditAmount) {
        return {
          success: false,
          error: 'Line cannot have both debit and credit amounts',
        };
      }
      if (!line.debitAmount && !line.creditAmount) {
        return {
          success: false,
          error: 'Line must have either debit or credit amount',
        };
      }

      totalDebit = totalDebit.plus(line.debitAmount || 0);
      totalCredit = totalCredit.plus(line.creditAmount || 0);
    }

    // Double-entry validation: debits must equal credits
    if (!totalDebit.equals(totalCredit)) {
      return {
        success: false,
        error: `Journal entry does not balance. Debits: ${totalDebit}, Credits: ${totalCredit}`,
      };
    }

    // Get or create financial period
    const period = await this.getOrCreatePeriod(tenantId, input.entryDate);
    if (!period) {
      return {
        success: false,
        error: 'Could not determine financial period for entry date',
      };
    }

    // Check if period is open
    if (period.status !== 'OPEN') {
      return {
        success: false,
        error: `Financial period ${period.name} is ${period.status}. Cannot post entries.`,
      };
    }

    // Generate journal number
    const journalNumber = await this.generateJournalNumber(tenantId);

    // Resolve account codes to ledger accounts
    const accountMap = new Map<string, { chartOfAccountId: string; ledgerAccountId: string }>();
    
    for (const line of input.lines) {
      if (!accountMap.has(line.accountCode)) {
        const resolved = await this.resolveAccount(tenantId, line.accountCode);
        if (!resolved) {
          return {
            success: false,
            error: `Account code '${line.accountCode}' not found`,
          };
        }
        accountMap.set(line.accountCode, resolved);
      }
    }

    // Create journal entry with lines in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create journal entry
      const journal = await tx.acct_journal_entries.create({
        data: {
          tenantId,
          journalNumber,
          entryDate: input.entryDate,
          description: input.description,
          memo: input.memo,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          sourceModule: input.sourceModule,
          eventId: input.eventId,
          idempotencyKey: input.idempotencyKey,
          totalDebit: new Prisma.Decimal(totalDebit.toString()),
          totalCredit: new Prisma.Decimal(totalCredit.toString()),
          taxAmount: input.taxAmount ? new Prisma.Decimal(input.taxAmount) : null,
          taxCode: input.taxCode,
          periodId: period.id,
          status: autoPost ? 'POSTED' : 'DRAFT',
          postDate: autoPost ? new Date() : null,
          postedAt: autoPost ? new Date() : null,
          postedBy: autoPost ? createdBy : null,
          attachmentUrls: input.attachmentUrls || [],
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
          createdBy,
        } as any,
      });

      // Create ledger entries
      let lineNumber = 1;
      for (const line of input.lines) {
        const account = accountMap.get(line.accountCode)!;
        
        // Get current balance for the ledger account
        const ledgerAccount = await tx.acct_ledger_accounts.findUnique({
          where: { id: account.ledgerAccountId },
        });

        const currentBalance = new Decimal(ledgerAccount?.currentBalance.toString() || '0');
        const debitAmount = new Decimal(line.debitAmount || 0);
        const creditAmount = new Decimal(line.creditAmount || 0);

        // Calculate new balance based on account's normal balance
        // For DEBIT normal accounts: balance increases with debits
        // For CREDIT normal accounts: balance increases with credits
        const chartAccount = await tx.acct_chart_of_accounts.findUnique({
          where: { id: account.chartOfAccountId },
        });

        let balanceAfter: Decimal;
        if (chartAccount?.normalBalance === 'DEBIT') {
          balanceAfter = currentBalance.plus(debitAmount).minus(creditAmount);
        } else {
          balanceAfter = currentBalance.plus(creditAmount).minus(debitAmount);
        }

        // Create ledger entry (APPEND-ONLY)
        await tx.acct_ledger_entries.create({
          data: {
            tenantId,
            ledgerAccountId: account.ledgerAccountId,
            journalEntryId: journal.id,
            entryDate: input.entryDate,
            debitAmount: new Prisma.Decimal(debitAmount.toString()),
            creditAmount: new Prisma.Decimal(creditAmount.toString()),
            balanceAfter: new Prisma.Decimal(balanceAfter.toString()),
            description: line.description || input.description,
            memo: line.memo,
            referenceType: line.referenceType,
            referenceId: line.referenceId,
            referenceNumber: line.referenceNumber,
            periodId: period.id,
            lineNumber,
            createdBy,
          } as any,
        });

        // Update ledger account balance (cached balance)
        if (autoPost) {
          await tx.acct_ledger_accounts.update({
            where: { id: account.ledgerAccountId },
            data: {
              currentBalance: new Prisma.Decimal(balanceAfter.toString()),
              periodDebit: {
                increment: new Prisma.Decimal(debitAmount.toString()),
              },
              periodCredit: {
                increment: new Prisma.Decimal(creditAmount.toString()),
              },
            },
          });
        }

        lineNumber++;
      }

      return journal;
    });

    return {
      success: true,
      journalEntry: {
        id: result.id,
        journalNumber: result.journalNumber,
        status: result.status,
        totalDebit: result.totalDebit.toString(),
        totalCredit: result.totalCredit.toString(),
      },
    };
  }

  /**
   * Resolve account code to ledger account
   * Creates ledger account if it doesn't exist
   */
  private static async resolveAccount(
    tenantId: string,
    accountCode: string
  ): Promise<{ chartOfAccountId: string; ledgerAccountId: string } | null> {
    // Get chart of account
    const chartAccount = await ChartOfAccountService.getByCode(tenantId, accountCode);
    if (!chartAccount) {
      return null;
    }

    // Get or create ledger account
    let ledgerAccount = await prisma.acct_ledger_accounts.findFirst({
      where: {
        tenantId,
        chartOfAccountId: chartAccount.id,
      },
    });

    if (!ledgerAccount) {
      // Create ledger account
      ledgerAccount = await prisma.acct_ledger_accounts.create({
        data: {
          tenantId,
          chartOfAccountId: chartAccount.id,
          currency: 'NGN',
        } as any,
      });
    }

    return {
      chartOfAccountId: chartAccount.id,
      ledgerAccountId: ledgerAccount.id,
    };
  }

  /**
   * Get or create financial period for a date
   */
  private static async getOrCreatePeriod(tenantId: string, date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const code = `${year}-${String(month + 1).padStart(2, '0')}`;

    let period = await prisma.acct_financial_periods.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    });

    if (!period) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const name = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

      period = await prisma.acct_financial_periods.create({
        data: {
          tenantId,
          name,
          code,
          periodType: 'MONTHLY',
          startDate,
          endDate,
          fiscalYear: year,
          status: 'OPEN',
        } as any,
      });
    }

    return period;
  }

  /**
   * Generate unique journal number
   */
  private static async generateJournalNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `JE-${year}-`;

    const lastJournal = await prisma.acct_journal_entries.findFirst({
      where: {
        tenantId,
        journalNumber: { startsWith: prefix },
      },
      orderBy: { journalNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastJournal) {
      const lastNum = parseInt(lastJournal.journalNumber.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Void a journal entry (creates reversal)
   */
  static async void(
    tenantId: string,
    journalId: string,
    reason: string,
    voidedBy?: string
  ): Promise<PostingResult> {
    const journal = await prisma.acct_journal_entries.findFirst({
      where: { id: journalId, tenantId },
      include: { acct_ledger_entries: true },
    });

    if (!journal) {
      return { success: false, error: 'Journal entry not found' };
    }

    if (journal.status === 'VOIDED') {
      return { success: false, error: 'Journal entry is already voided' };
    }

    if (journal.isReversal) {
      return { success: false, error: 'Cannot void a reversal entry' };
    }

    const journalAny = journal as any;
    // Create reversal entry with opposite debits/credits
    const reversalLines: JournalLineInput[] = journalAny.acct_ledger_entries.map((line: any) => ({
      accountCode: '', // Will be resolved from ledger account
      debitAmount: line.creditAmount.toNumber(), // Swap debit/credit
      creditAmount: line.debitAmount.toNumber(),
      description: `Reversal: ${line.description || ''}`,
      referenceType: 'REVERSAL',
      referenceId: journal.id,
    }));

    // Get account codes for the reversal
    for (let i = 0; i < journalAny.acct_ledger_entries.length; i++) {
      const line = journalAny.acct_ledger_entries[i];
      const ledgerAccount = await prisma.acct_ledger_accounts.findUnique({
        where: { id: line.ledgerAccountId },
        include: { acct_chart_of_accounts: true },
      });
      if (ledgerAccount) {
        reversalLines[i].accountCode = (ledgerAccount as any).acct_chart_of_accounts.code;
      }
    }

    const reversalResult = await this.createAndPost(
      tenantId,
      {
        entryDate: new Date(),
        description: `Reversal of ${journal.journalNumber}: ${reason}`,
        sourceType: journal.sourceType,
        sourceId: journal.sourceId ?? undefined,
        sourceModule: journal.sourceModule ?? undefined,
        lines: reversalLines,
      },
      voidedBy,
      true
    );

    if (!reversalResult.success) {
      return reversalResult;
    }

    // Mark original as voided
    await prisma.acct_journal_entries.update({
      where: { id: journalId },
      data: {
        status: 'VOIDED',
        reversedJournalId: reversalResult.journalEntry!.id,
      },
    });

    return {
      success: true,
      journalEntry: reversalResult.journalEntry,
    };
  }

  /**
   * List journal entries
   */
  static async list(
    tenantId: string,
    options?: {
      status?: AcctJournalStatus;
      sourceType?: AcctJournalSourceType;
      periodId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.AcctJournalEntryWhereInput = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.sourceType) where.sourceType = options.sourceType;
    if (options?.periodId) where.periodId = options.periodId;
    if (options?.startDate || options?.endDate) {
      where.entryDate = {};
      if (options.startDate) where.entryDate.gte = options.startDate;
      if (options.endDate) where.entryDate.lte = options.endDate;
    }

    const [journals, total] = await Promise.all([
      prisma.acct_journal_entries.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
          period: true,
          lines: {
            include: {
              acct_ledger_accounts: {
                include: { acct_chart_of_accounts: true },
              },
            },
          },
        },
      }),
      prisma.acct_journal_entries.count({ where }),
    ]);

    return { journals, total };
  }

  /**
   * Get a single journal entry with details
   */
  static async getById(tenantId: string, journalId: string) {
    return prisma.acct_journal_entries.findFirst({
      where: { id: journalId, tenantId },
      include: {
        period: true,
        lines: {
          include: {
            acct_ledger_accounts: {
              include: { acct_chart_of_accounts: true },
            },
          },
          orderBy: { lineNumber: 'asc' },
        },
        reversalOf: true,
        reversedJournal: true,
      },
    });
  }
}

// ============================================================================
// EVENT POSTING HELPERS
// ============================================================================

/**
 * Create journal entry from POS sale event
 */
export async function postPOSSale(
  tenantId: string,
  saleData: {
    saleId: string;
    saleNumber: string;
    totalAmount: number;
    taxAmount: number;
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'TRANSFER';
    saleDate: Date;
  },
  eventId: string,
  userId?: string
): Promise<PostingResult> {
  const rules = POSTING_RULES.POS_SALE;
  const netAmount = saleData.totalAmount - saleData.taxAmount;

  // Determine cash account based on payment method
  let cashAccountCode = rules.defaultAccounts.cashReceived;
  if (saleData.paymentMethod === 'TRANSFER' || saleData.paymentMethod === 'CARD') {
    cashAccountCode = '1120'; // Cash in Bank
  } else if (saleData.paymentMethod === 'MOBILE_MONEY') {
    cashAccountCode = '1130'; // Mobile Money
  }

  const lines: JournalLineInput[] = [
    {
      accountCode: cashAccountCode,
      debitAmount: saleData.totalAmount,
      description: `Cash received - ${saleData.paymentMethod}`,
      referenceType: 'SALE',
      referenceId: saleData.saleId,
      referenceNumber: saleData.saleNumber,
    },
    {
      accountCode: rules.defaultAccounts.salesRevenue,
      creditAmount: netAmount,
      description: 'POS Sales Revenue',
      referenceType: 'SALE',
      referenceId: saleData.saleId,
      referenceNumber: saleData.saleNumber,
    },
  ];

  // Add VAT line if applicable
  if (saleData.taxAmount > 0) {
    lines.push({
      accountCode: rules.defaultAccounts.vatPayable,
      creditAmount: saleData.taxAmount,
      description: 'VAT Collected (7.5%)',
      referenceType: 'SALE',
      referenceId: saleData.saleId,
      referenceNumber: saleData.saleNumber,
    });
  }

  return JournalEntryService.createAndPost(
    tenantId,
    {
      entryDate: saleData.saleDate,
      description: `POS Sale ${saleData.saleNumber}`,
      sourceType: rules.sourceType,
      sourceId: saleData.saleId,
      sourceModule: rules.sourceModule,
      eventId,
      idempotencyKey: `POS_SALE_${saleData.saleId}`,
      taxAmount: saleData.taxAmount,
      taxCode: saleData.taxAmount > 0 ? 'VAT_7.5' : undefined,
      lines,
    },
    userId,
    true
  );
}

/**
 * Create journal entry from SVM order event
 */
export async function postSVMOrder(
  tenantId: string,
  orderData: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    taxAmount: number;
    paymentMethod: string;
    orderDate: Date;
  },
  eventId: string,
  userId?: string
): Promise<PostingResult> {
  const rules = POSTING_RULES.SVM_ORDER;
  const netAmount = orderData.totalAmount - orderData.taxAmount;

  // Online orders typically go to bank
  const cashAccountCode = rules.defaultAccounts.bankReceived;

  const lines: JournalLineInput[] = [
    {
      accountCode: cashAccountCode,
      debitAmount: orderData.totalAmount,
      description: `Payment received - ${orderData.paymentMethod}`,
      referenceType: 'ORDER',
      referenceId: orderData.orderId,
      referenceNumber: orderData.orderNumber,
    },
    {
      accountCode: rules.defaultAccounts.salesRevenue,
      creditAmount: netAmount,
      description: 'Online Sales Revenue',
      referenceType: 'ORDER',
      referenceId: orderData.orderId,
      referenceNumber: orderData.orderNumber,
    },
  ];

  if (orderData.taxAmount > 0) {
    lines.push({
      accountCode: rules.defaultAccounts.vatPayable,
      creditAmount: orderData.taxAmount,
      description: 'VAT Collected (7.5%)',
      referenceType: 'ORDER',
      referenceId: orderData.orderId,
      referenceNumber: orderData.orderNumber,
    });
  }

  return JournalEntryService.createAndPost(
    tenantId,
    {
      entryDate: orderData.orderDate,
      description: `Online Order ${orderData.orderNumber}`,
      sourceType: rules.sourceType,
      sourceId: orderData.orderId,
      sourceModule: rules.sourceModule,
      eventId,
      idempotencyKey: `SVM_ORDER_${orderData.orderId}`,
      taxAmount: orderData.taxAmount,
      taxCode: orderData.taxAmount > 0 ? 'VAT_7.5' : undefined,
      lines,
    },
    userId,
    true
  );
}

/**
 * Create journal entry from refund event
 */
export async function postRefund(
  tenantId: string,
  refundData: {
    refundId: string;
    refundNumber: string;
    originalSaleId: string;
    totalAmount: number;
    taxAmount: number;
    refundMethod: string;
    refundDate: Date;
  },
  eventId: string,
  userId?: string
): Promise<PostingResult> {
  const rules = POSTING_RULES.REFUND;
  const netAmount = refundData.totalAmount - refundData.taxAmount;

  const lines: JournalLineInput[] = [
    {
      accountCode: rules.defaultAccounts.salesReturns,
      debitAmount: netAmount,
      description: 'Sales Return',
      referenceType: 'REFUND',
      referenceId: refundData.refundId,
      referenceNumber: refundData.refundNumber,
    },
    {
      accountCode: rules.defaultAccounts.cashPaid,
      creditAmount: refundData.totalAmount,
      description: `Refund paid - ${refundData.refundMethod}`,
      referenceType: 'REFUND',
      referenceId: refundData.refundId,
      referenceNumber: refundData.refundNumber,
    },
  ];

  if (refundData.taxAmount > 0) {
    lines.push({
      accountCode: rules.defaultAccounts.vatPayable,
      debitAmount: refundData.taxAmount,
      description: 'VAT Reversed (7.5%)',
      referenceType: 'REFUND',
      referenceId: refundData.refundId,
      referenceNumber: refundData.refundNumber,
    });
  }

  return JournalEntryService.createAndPost(
    tenantId,
    {
      entryDate: refundData.refundDate,
      description: `Refund ${refundData.refundNumber} for sale ${refundData.originalSaleId}`,
      sourceType: rules.sourceType,
      sourceId: refundData.refundId,
      sourceModule: rules.sourceModule,
      eventId,
      idempotencyKey: `REFUND_${refundData.refundId}`,
      taxAmount: refundData.taxAmount,
      taxCode: refundData.taxAmount > 0 ? 'VAT_7.5' : undefined,
      lines,
    },
    userId,
    true
  );
}

/**
 * Create journal entry from inventory adjustment event
 */
export async function postInventoryAdjustment(
  tenantId: string,
  adjustmentData: {
    adjustmentId: string;
    adjustmentNumber: string;
    adjustmentType: 'INCREASE' | 'DECREASE' | 'WRITE_OFF';
    totalValue: number;
    reason: string;
    adjustmentDate: Date;
  },
  eventId: string,
  userId?: string
): Promise<PostingResult> {
  const rules = POSTING_RULES.INVENTORY_ADJUSTMENT;

  const lines: JournalLineInput[] = [];

  if (adjustmentData.adjustmentType === 'INCREASE') {
    // Inventory increases
    lines.push(
      {
        accountCode: rules.defaultAccounts.inventory,
        debitAmount: adjustmentData.totalValue,
        description: `Inventory increase: ${adjustmentData.reason}`,
        referenceType: 'ADJUSTMENT',
        referenceId: adjustmentData.adjustmentId,
        referenceNumber: adjustmentData.adjustmentNumber,
      },
      {
        accountCode: rules.defaultAccounts.inventoryAdjustment,
        creditAmount: adjustmentData.totalValue,
        description: 'Inventory adjustment credit',
        referenceType: 'ADJUSTMENT',
        referenceId: adjustmentData.adjustmentId,
        referenceNumber: adjustmentData.adjustmentNumber,
      }
    );
  } else {
    // Inventory decreases or write-offs
    lines.push(
      {
        accountCode: rules.defaultAccounts.inventoryAdjustment,
        debitAmount: adjustmentData.totalValue,
        description: `Inventory ${adjustmentData.adjustmentType.toLowerCase()}: ${adjustmentData.reason}`,
        referenceType: 'ADJUSTMENT',
        referenceId: adjustmentData.adjustmentId,
        referenceNumber: adjustmentData.adjustmentNumber,
      },
      {
        accountCode: rules.defaultAccounts.inventory,
        creditAmount: adjustmentData.totalValue,
        description: 'Inventory reduction',
        referenceType: 'ADJUSTMENT',
        referenceId: adjustmentData.adjustmentId,
        referenceNumber: adjustmentData.adjustmentNumber,
      }
    );
  }

  return JournalEntryService.createAndPost(
    tenantId,
    {
      entryDate: adjustmentData.adjustmentDate,
      description: `Inventory Adjustment ${adjustmentData.adjustmentNumber}: ${adjustmentData.reason}`,
      sourceType: rules.sourceType,
      sourceId: adjustmentData.adjustmentId,
      sourceModule: rules.sourceModule,
      eventId,
      idempotencyKey: `INV_ADJ_${adjustmentData.adjustmentId}`,
      lines,
    },
    userId,
    true
  );
}
