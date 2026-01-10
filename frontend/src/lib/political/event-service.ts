/**
 * Political Suite - Event Service
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateEventInput,
  UpdateEventInput,
  EventQueryFilters,
  PolEventStatus,
} from './types';
import { logCreate, logUpdate, logStatusChange } from './audit-service';

// ----------------------------------------------------------------------------
// EVENT CRUD
// ----------------------------------------------------------------------------

export async function createEvent(
  tenantId: string,
  input: CreateEventInput,
  actorId: string
) {
  // Verify campaign exists
  const campaign = await prisma.pol_campaign.findFirst({
    where: { id: input.campaignId, tenantId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const event = await prisma.pol_event.create({
    data: withPrismaDefaults({
      tenantId,
      campaignId: input.campaignId,
      name: input.name,
      description: input.description,
      type: input.type,
      venue: input.venue,
      address: input.address,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      coordinates: input.coordinates,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      expectedAttendance: input.expectedAttendance,
      organizerId: input.organizerId,
      organizerName: input.organizerName,
      organizerPhone: input.organizerPhone,
      notes: input.notes,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'event', event.id, actorId, undefined, {
    campaignId: input.campaignId,
    name: event.name,
    type: event.type,
    state: event.state,
    startDateTime: event.startDateTime,
  });

  return event;
}

export async function updateEvent(
  tenantId: string,
  eventId: string,
  input: UpdateEventInput,
  actorId: string
) {
  const existing = await prisma.pol_event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  // Prevent updates if event is completed
  if (existing.status === PolEventStatus.COMPLETED) {
    throw new Error('Cannot update a completed event');
  }

  // Track changes
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && (existing as Record<string, unknown>)[key] !== value) {
      changes[key] = {
        old: (existing as Record<string, unknown>)[key],
        new: value,
      };
    }
  }

  const event = await prisma.pol_event.update({
    where: { id: eventId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        'event',
        eventId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, 'event', eventId, actorId, changes);
    }
  }

  return event;
}

export async function getEvent(tenantId: string, eventId: string) {
  const event = await prisma.pol_event.findFirst({
    where: { id: eventId, tenantId },
    include: {
      campaign: {
        include: {
          party: true,
        },
      },
      _count: {
        select: {
          volunteers: true,
        },
      },
    },
  });

  return event;
}

export async function listEvents(tenantId: string, filters: EventQueryFilters = {}) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;

  if (filters.fromDate || filters.toDate) {
    where.startDateTime = {};
    if (filters.fromDate) (where.startDateTime as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.startDateTime as Record<string, Date>).lte = filters.toDate;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { venue: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pol_event.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        _count: {
          select: { volunteers: true },
        },
      },
      orderBy: { startDateTime: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_event.count({ where }),
  ]);

  return { data, total, limit: filters.limit || 50, offset: filters.offset || 0 };
}

export async function startEvent(
  tenantId: string,
  eventId: string,
  actorId: string
) {
  const existing = await prisma.pol_event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  if (existing.status !== PolEventStatus.SCHEDULED) {
    throw new Error('Only scheduled events can be started');
  }

  const event = await prisma.pol_event.update({
    where: { id: eventId },
    data: { status: PolEventStatus.IN_PROGRESS },
  });

  await logStatusChange(
    tenantId,
    'event',
    eventId,
    actorId,
    PolEventStatus.SCHEDULED,
    PolEventStatus.IN_PROGRESS
  );

  return event;
}

export async function completeEvent(
  tenantId: string,
  eventId: string,
  actorId: string,
  actualAttendance?: number
) {
  const existing = await prisma.pol_event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  if (existing.status !== PolEventStatus.IN_PROGRESS) {
    throw new Error('Only in-progress events can be completed');
  }

  const event = await prisma.pol_event.update({
    where: { id: eventId },
    data: {
      status: PolEventStatus.COMPLETED,
      actualAttendance: actualAttendance ?? existing.actualAttendance,
    },
  });

  await logStatusChange(
    tenantId,
    'event',
    eventId,
    actorId,
    PolEventStatus.IN_PROGRESS,
    PolEventStatus.COMPLETED
  );

  return event;
}

export async function cancelEvent(
  tenantId: string,
  eventId: string,
  actorId: string,
  reason?: string
) {
  const existing = await prisma.pol_event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  if (existing.status === PolEventStatus.COMPLETED) {
    throw new Error('Cannot cancel a completed event');
  }

  const event = await prisma.pol_event.update({
    where: { id: eventId },
    data: {
      status: PolEventStatus.CANCELLED,
      statusNote: reason,
    },
  });

  await logStatusChange(
    tenantId,
    'event',
    eventId,
    actorId,
    existing.status,
    PolEventStatus.CANCELLED
  );

  return event;
}

export async function getUpcomingEvents(
  tenantId: string,
  campaignId?: string,
  limit: number = 10
) {
  const where: Record<string, unknown> = {
    tenantId,
    status: PolEventStatus.SCHEDULED,
    startDateTime: { gte: new Date() },
  };

  if (campaignId) where.campaignId = campaignId;

  const events = await prisma.pol_event.findMany({
    where,
    include: {
      campaign: { select: { id: true, name: true } },
      _count: {
        select: { volunteers: true },
      },
    },
    orderBy: { startDateTime: 'asc' },
    take: limit,
  });

  return events;
}

export async function getEventStats(
  tenantId: string,
  campaignId?: string
) {
  const where: Record<string, unknown> = { tenantId };
  if (campaignId) where.campaignId = campaignId;

  const [total, byStatus, byType, upcoming] = await Promise.all([
    prisma.pol_event.count({ where }),
    prisma.pol_event.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.pol_event.groupBy({
      by: ['type'],
      where,
      _count: true,
    }),
    prisma.pol_event.count({
      where: {
        ...where,
        status: PolEventStatus.SCHEDULED,
        startDateTime: { gte: new Date() },
      },
    }),
  ]);

  return {
    total,
    upcoming,
    byStatus: byStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byType: byType.reduce((acc: any, item: any) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}
