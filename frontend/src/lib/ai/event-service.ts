/**
 * MODULE 14: AI & AUTOMATION
 * Event Service
 * 
 * Event logging for AI module actions.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// EVENT LOGGING
// ============================================================================

interface LogEventInput {
  eventType: string;
  tenantId?: string;
  insightId?: string;
  recommendationId?: string;
  ruleId?: string;
  runId?: string;
  actorId?: string;
  actorType?: string;
  eventData: Record<string, any>;
}

export async function logAIEvent(input: LogEventInput): Promise<void> {
  try {
    await prisma.aIEventLog.create({
      data: {
        eventType: input.eventType,
        tenantId: input.tenantId,
        insightId: input.insightId,
        recommendationId: input.recommendationId,
        ruleId: input.ruleId,
        runId: input.runId,
        actorId: input.actorId,
        actorType: input.actorType,
        eventData: input.eventData,
        occurredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log AI event:', error);
  }
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

export async function getAIEvents(params: {
  tenantId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { tenantId, eventType, startDate, endDate, page = 1, limit = 50 } = params;
  
  const where: any = {};
  
  if (tenantId) where.tenantId = tenantId;
  if (eventType) where.eventType = eventType;
  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) where.occurredAt.gte = startDate;
    if (endDate) where.occurredAt.lte = endDate;
  }
  
  const [events, total] = await Promise.all([
    prisma.aIEventLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { occurredAt: 'desc' },
    }),
    prisma.aIEventLog.count({ where }),
  ]);
  
  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
