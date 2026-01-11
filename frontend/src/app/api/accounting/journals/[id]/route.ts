export const dynamic = 'force-dynamic'

/**
 * MODULE 2: Accounting & Finance
 * Single Journal Entry API
 * 
 * GET /api/accounting/journals/[id] - Get single journal entry with lines
 * POST /api/accounting/journals/[id]/void - Void a journal entry (creates reversal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { JournalEntryService } from '@/lib/accounting/journal-service';
import { checkCapabilityForSession } from '@/lib/capabilities';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;

    const journal = await JournalEntryService.getById(session.activeTenantId, id);

    if (!journal) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    // Transform for response
    const response = {
      id: journal.id,
      journalNumber: journal.journalNumber,
      entryDate: journal.entryDate,
      postDate: journal.postDate,
      description: journal.description,
      memo: journal.memo,
      sourceType: journal.sourceType,
      sourceId: journal.sourceId,
      sourceModule: journal.sourceModule,
      eventId: journal.eventId,
      status: journal.status,
      totalDebit: journal.totalDebit.toString(),
      totalCredit: journal.totalCredit.toString(),
      taxAmount: journal.taxAmount?.toString(),
      taxCode: journal.taxCode,
      isReversal: journal.isReversal,
      period: journal.acct_financial_periods ? {
        id: journal.acct_financial_periods.id,
        name: journal.acct_financial_periods.name,
        code: journal.acct_financial_periods.code,
        status: journal.acct_financial_periods.status,
      } : null,
      lines: journal.acct_ledger_entries.map((line: { id: string; lineNumber: number; acct_ledger_accounts: { acct_chart_of_accounts: { code: string; name: string; accountType: string } }; debitAmount: { toString: () => string }; creditAmount: { toString: () => string }; balanceAfter: { toString: () => string }; description: string | null; memo: string | null; referenceType: string | null; referenceId: string | null; referenceNumber: string | null }) => ({
        id: line.id,
        lineNumber: line.lineNumber,
        accountCode: line.acct_ledger_accounts.acct_chart_of_accounts.code,
        accountName: line.acct_ledger_accounts.acct_chart_of_accounts.name,
        accountType: line.acct_ledger_accounts.acct_chart_of_accounts.accountType,
        debitAmount: line.debitAmount.toString(),
        creditAmount: line.creditAmount.toString(),
        balanceAfter: line.balanceAfter.toString(),
        description: line.description,
        memo: line.memo,
        referenceType: line.referenceType,
        referenceId: line.referenceId,
        referenceNumber: line.referenceNumber,
      })),
      reversalOf: journal.isReversal && journal.reversedJournalId ? {
        id: journal.reversedJournalId,
        journalNumber: null,
      } : null,
      reversedJournal: null,
      attachmentUrls: journal.attachmentUrls,
      metadata: journal.metadata,
      createdBy: journal.createdBy,
      createdAt: journal.createdAt,
      postedAt: journal.postedAt,
      postedBy: journal.postedBy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Journals API] Get by ID error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounting/journals/[id] - Void a journal entry
 * Body: { reason: string }
 * 
 * Voiding creates a reversal entry that reverses all debits/credits
 * The original entry is marked as VOIDED
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'accounting');
    if (guardResult) return guardResult;

    const { id } = await params;
    const body = await request.json();

    // Check if this is a void action
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action !== 'void') {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=void to void a journal entry' },
        { status: 400 }
      );
    }

    if (!body.reason) {
      return NextResponse.json(
        { error: 'Reason is required for voiding a journal entry' },
        { status: 400 }
      );
    }

    const result = await JournalEntryService.void(
      session.activeTenantId,
      id,
      body.reason,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Journal entry voided successfully',
      reversalEntry: result.journalEntry,
    });
  } catch (error) {
    console.error('[Journals API] Void error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
