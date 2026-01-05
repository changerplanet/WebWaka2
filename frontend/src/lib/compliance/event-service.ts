/**
 * MODULE 13: COMPLIANCE & TAX (NIGERIA-FIRST)
 * Event Service
 * 
 * Event logging and processing for compliance module.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// EVENT LOGGING
// ============================================================================

interface LogEventInput {
  eventType: string;
  tenantId?: string;
  profileId?: string;
  reportId?: string;
  artifactId?: string;
  actorId?: string;
  actorType?: string;
  eventData: Record<string, any>;
}

export async function logComplianceEvent(input: LogEventInput): Promise<void> {
  try {
    await prisma.complianceEventLog.create({
      data: {
        eventType: input.eventType,
        tenantId: input.tenantId,
        profileId: input.profileId,
        reportId: input.reportId,
        artifactId: input.artifactId,
        actorId: input.actorId,
        actorType: input.actorType,
        eventData: input.eventData,
        occurredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log compliance event:', error);
  }
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

export async function getComplianceEvents(params: {
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
    prisma.complianceEventLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { occurredAt: 'desc' },
    }),
    prisma.complianceEventLog.count({ where }),
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
