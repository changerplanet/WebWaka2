/**
 * MODULE 2: Accounting & Finance
 * Journal Lookup by Source API
 * 
 * GET /api/accounting/journals/by-source - Find journal entries by source event
 * 
 * This endpoint allows other modules to check if a journal entry
 * already exists for a specific source (e.g., sale, order, refund).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';
import { AcctJournalSourceType } from '@prisma/client';

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
    const sourceType = searchParams.get('sourceType') as AcctJournalSourceType | null;
    const sourceId = searchParams.get('sourceId');
    const eventId = searchParams.get('eventId');
    const idempotencyKey = searchParams.get('idempotencyKey');

    // At least one lookup criteria is required
    if (!sourceId && !eventId && !idempotencyKey) {
      return NextResponse.json(
        { error: 'At least one of sourceId, eventId, or idempotencyKey is required' },
        { status: 400 }
      );
    }

    // Build query
    const where: Record<string, unknown> = {
      tenantId: session.activeTenantId,
    };

    if (sourceType) where.sourceType = sourceType;
    if (sourceId) where.sourceId = sourceId;
    if (eventId) where.eventId = eventId;
    if (idempotencyKey) where.idempotencyKey = idempotencyKey;

    const journals = await prisma.acct_journal_entries.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      take: 10,
      select: {
        id: true,
        journalNumber: true,
        entryDate: true,
        postDate: true,
        description: true,
        sourceType: true,
        sourceId: true,
        sourceModule: true,
        eventId: true,
        idempotencyKey: true,
        status: true,
        totalDebit: true,
        totalCredit: true,
        taxAmount: true,
        isReversal: true,
        createdAt: true,
      },
    });

    // Transform for response
    const response = journals.map((j) => ({
      id: j.id,
      journalNumber: j.journalNumber,
      entryDate: j.entryDate,
      postDate: j.postDate,
      description: j.description,
      sourceType: j.sourceType,
      sourceId: j.sourceId,
      sourceModule: j.sourceModule,
      eventId: j.eventId,
      idempotencyKey: j.idempotencyKey,
      status: j.status,
      totalDebit: j.totalDebit.toString(),
      totalCredit: j.totalCredit.toString(),
      taxAmount: j.taxAmount?.toString(),
      isReversal: j.isReversal,
      createdAt: j.createdAt,
    }));

    return NextResponse.json({
      found: response.length > 0,
      count: response.length,
      journals: response,
    });
  } catch (error) {
    console.error('[Journals API] Lookup by source error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
