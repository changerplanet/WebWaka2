/**
 * MODULE 2: Accounting & Finance
 * Journal Entries API
 * 
 * GET /api/accounting/journals - List journal entries
 * POST /api/accounting/journals - Create manual journal entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { JournalEntryService } from '@/lib/accounting/journal-service';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { AcctJournalStatus, AcctJournalSourceType } from '@prisma/client';

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
    const status = searchParams.get('status') as AcctJournalStatus | null;
    const sourceType = searchParams.get('sourceType') as AcctJournalSourceType | null;
    const periodId = searchParams.get('periodId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await JournalEntryService.list(session.activeTenantId, {
      status: status || undefined,
      sourceType: sourceType || undefined,
      periodId: periodId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    // Transform journals for response
    const journals = result.journals.map((j) => ({
      id: j.id,
      journalNumber: j.journalNumber,
      entryDate: j.entryDate,
      postDate: j.postDate,
      description: j.description,
      sourceType: j.sourceType,
      sourceModule: j.sourceModule,
      status: j.status,
      totalDebit: j.totalDebit.toString(),
      totalCredit: j.totalCredit.toString(),
      taxAmount: j.taxAmount?.toString(),
      taxCode: j.taxCode,
      period: j.period ? { id: j.period.id, name: j.period.name, code: j.period.code } : null,
      lineCount: j.lines.length,
      createdAt: j.createdAt,
    }));

    return NextResponse.json({
      journals,
      total: result.total,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  } catch (error) {
    console.error('[Journals API] List error:', error);
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

    // Validate required fields
    if (!body.entryDate || !body.description || !body.lines || !Array.isArray(body.lines)) {
      return NextResponse.json(
        { error: 'entryDate, description, and lines are required' },
        { status: 400 }
      );
    }

    if (body.lines.length < 2) {
      return NextResponse.json(
        { error: 'Journal entry must have at least 2 lines' },
        { status: 400 }
      );
    }

    const result = await JournalEntryService.createAndPost(
      session.activeTenantId,
      {
        entryDate: new Date(body.entryDate),
        description: body.description,
        memo: body.memo,
        sourceType: body.sourceType || 'MANUAL',
        sourceId: body.sourceId,
        sourceModule: body.sourceModule,
        eventId: body.eventId,
        idempotencyKey: body.idempotencyKey,
        taxAmount: body.taxAmount,
        taxCode: body.taxCode,
        lines: body.lines,
        metadata: body.metadata,
        attachmentUrls: body.attachmentUrls,
      },
      session.user.id,
      body.autoPost !== false // Default to auto-post
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[Journals API] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
