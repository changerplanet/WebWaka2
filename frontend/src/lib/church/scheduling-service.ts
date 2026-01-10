/**
 * Church Suite — Service & Event Scheduling Service
 * Phase 2: Ministries, Services & Events
 *
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: MEDIUM RISK
 * 
 * Rules:
 * - No pastoral notes exposed
 * - No minors attendance details exposed publicly
 * - Attendance is AGGREGATED only (no individual tracking for minors safety)
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { ChuServiceType, ChuEventStatus } from '@prisma/client';
import { logCreate, logUpdate, logStatusChange } from './audit-service';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateServiceInput {
  churchId: string;
  unitId?: string;
  name: string;
  type: ChuServiceType;
  description?: string;
  dayOfWeek?: number; // 0 = Sunday
  startTime?: string;
  endTime?: string;
  location?: string;
  defaultPreacherId?: string;
}

export interface UpdateServiceInput extends Partial<Omit<CreateServiceInput, 'churchId'>> {
  isActive?: boolean;
}

export interface ServiceQueryFilters {
  churchId?: string;
  unitId?: string;
  type?: ChuServiceType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateEventInput {
  churchId: string;
  unitId?: string;
  title: string;
  description?: string;
  type?: string;
  theme?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  requiresRegistration?: boolean;
  maxAttendees?: number;
  registrationUrl?: string;
  isFree?: boolean;
  suggestedDonation?: number;
  startDate: Date;
  endDate?: Date;
  bannerUrl?: string;
}

export interface UpdateEventInput extends Partial<Omit<CreateEventInput, 'churchId'>> {
  status?: ChuEventStatus;
}

export interface EventQueryFilters {
  churchId?: string;
  unitId?: string;
  status?: ChuEventStatus;
  type?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface CreateScheduleInput {
  serviceId?: string;
  eventId?: string;
  scheduledDate: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  preacherId?: string;
  topic?: string;
}

export interface CreateAttendanceInput {
  churchId: string;
  scheduleId?: string;
  serviceId?: string;
  eventId?: string;
  attendanceDate: Date;
  totalCount: number;
  adultCount?: number;
  childrenCount?: number; // ⚠️ Aggregated only
  maleCount?: number;
  femaleCount?: number;
  firstTimers?: number;
  visitors?: number;
  onlineCount?: number;
  notes?: string;
}

export interface CreateSpeakerInviteInput {
  churchId: string;
  serviceId?: string;
  eventId?: string;
  speakerName: string;
  title?: string;
  organization?: string;
  phone?: string;
  email?: string;
  topic?: string;
  scheduledDate: Date;
  notes?: string;
}

// ----------------------------------------------------------------------------
// CHURCH SERVICE CRUD
// ----------------------------------------------------------------------------

export async function createService(
  tenantId: string,
  input: CreateServiceInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const service = await prisma.chu_service.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      name: input.name,
      type: input.type,
      description: input.description,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      defaultPreacherId: input.defaultPreacherId,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'service', service.id, actorId, input.unitId, {
    name: service.name,
    type: service.type,
  });

  return service;
}

export async function updateService(
  tenantId: string,
  serviceId: string,
  input: UpdateServiceInput,
  actorId: string
) {
  const existing = await prisma.chu_service.findFirst({
    where: { id: serviceId, tenantId },
  });

  if (!existing) throw new Error('Service not found');

  const service = await prisma.chu_service.update({
    where: { id: serviceId },
    data: input,
  });

  await logUpdate(tenantId, existing.churchId, 'service', serviceId, actorId, {
    updated: { old: 'previous', new: 'updated' },
  }, existing.unitId || undefined);

  return service;
}

export async function getService(
  tenantId: string,
  serviceId: string
) {
  return prisma.chu_service.findFirst({
    where: { id: serviceId, tenantId },
    include: {
      schedules: {
        where: { isCancelled: false },
        orderBy: { scheduledDate: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          attendance: true,
          speakerInvites: true,
        },
      },
    },
  });
}

export async function listServices(
  tenantId: string,
  filters: ServiceQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.type) where.type = filters.type;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const services = await prisma.chu_service.findMany({
    where,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      _count: {
        select: { attendance: true },
      },
    },
  });

  const total = await prisma.chu_service.count({ where });

  return { services, total };
}

// ----------------------------------------------------------------------------
// EVENT CRUD
// ----------------------------------------------------------------------------

export async function createEvent(
  tenantId: string,
  input: CreateEventInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const startDate = new Date(input.startDate);
  const endDate = input.endDate ? new Date(input.endDate) : null;

  const event = await prisma.chu_event.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      title: input.title,
      description: input.description,
      type: input.type,
      theme: input.theme,
      venue: input.venue,
      address: input.address,
      city: input.city,
      state: input.state,
      requiresRegistration: input.requiresRegistration || false,
      maxAttendees: input.maxAttendees,
      registrationUrl: input.registrationUrl,
      isFree: input.isFree ?? true,
      suggestedDonation: input.suggestedDonation,
      startDate,
      endDate,
      bannerUrl: input.bannerUrl,
      createdBy: actorId,
    }),
  });

  // Create initial event log
  await prisma.chu_event_log.create({
    data: withPrismaDefaults({
      tenantId,
      eventId: event.id,
      previousStatus: null,
      newStatus: ChuEventStatus.DRAFT,
      changedBy: actorId,
      note: 'Event created',
    }),
  });

  await logCreate(tenantId, input.churchId, 'event', event.id, actorId, input.unitId, {
    title: event.title,
    type: event.type,
  });

  return event;
}

export async function updateEvent(
  tenantId: string,
  eventId: string,
  input: UpdateEventInput,
  actorId: string
) {
  const existing = await prisma.chu_event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!existing) throw new Error('Event not found');

  const updateData: Record<string, unknown> = { ...input };
  if (input.startDate) updateData.startDate = new Date(input.startDate);
  if (input.endDate) updateData.endDate = new Date(input.endDate);

  const event = await prisma.chu_event.update({
    where: { id: eventId },
    data: updateData,
  });

  // Log status change if status changed
  if (input.status && input.status !== existing.status) {
    await prisma.chu_event_log.create({
      data: withPrismaDefaults({
        tenantId,
        eventId: event.id,
        previousStatus: existing.status,
        newStatus: input.status,
        changedBy: actorId,
        note: `Status changed from ${existing.status} to ${input.status}`,
      }),
    });

    await logStatusChange(
      tenantId,
      existing.churchId,
      'event',
      eventId,
      actorId,
      existing.status,
      input.status,
      undefined,
      existing.unitId || undefined
    );
  } else {
    await logUpdate(tenantId, existing.churchId, 'event', eventId, actorId, {
      updated: { old: 'previous', new: 'updated' },
    }, existing.unitId || undefined);
  }

  return event;
}

export async function changeEventStatus(
  tenantId: string,
  eventId: string,
  newStatus: ChuEventStatus,
  note: string | undefined,
  actorId: string
) {
  const existing = await prisma.chu_event.findFirst({
    where: { id: eventId, tenantId },
  });

  if (!existing) throw new Error('Event not found');

  const event = await prisma.chu_event.update({
    where: { id: eventId },
    data: { status: newStatus },
  });

  // Create event log (APPEND-ONLY)
  await prisma.chu_event_log.create({
    data: withPrismaDefaults({
      tenantId,
      eventId: event.id,
      previousStatus: existing.status,
      newStatus,
      changedBy: actorId,
      note,
    }),
  });

  await logStatusChange(
    tenantId,
    existing.churchId,
    'event',
    eventId,
    actorId,
    existing.status,
    newStatus,
    note,
    existing.unitId || undefined
  );

  return event;
}

export async function getEvent(
  tenantId: string,
  eventId: string
) {
  return prisma.chu_event.findFirst({
    where: { id: eventId, tenantId },
    include: {
      schedules: { orderBy: { scheduledDate: 'asc' } },
      eventLogs: { orderBy: { changedAt: 'desc' }, take: 10 },
      speakerInvites: { orderBy: { scheduledDate: 'asc' } },
      _count: {
        select: { attendance: true },
      },
    },
  });
}

export async function listEvents(
  tenantId: string,
  filters: EventQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.startDateFrom || filters.startDateTo) {
    where.startDate = {};
    if (filters.startDateFrom) (where.startDate as Record<string, unknown>).gte = filters.startDateFrom;
    if (filters.startDateTo) (where.startDate as Record<string, unknown>).lte = filters.startDateTo;
  }

  const events = await prisma.chu_event.findMany({
    where,
    orderBy: { startDate: 'desc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      _count: {
        select: { attendance: true, speakerInvites: true },
      },
    },
  });

  const total = await prisma.chu_event.count({ where });

  return { events, total };
}

export async function getUpcomingEvents(
  tenantId: string,
  churchId: string,
  limit: number = 10
) {
  return prisma.chu_event.findMany({
    where: {
      tenantId,
      churchId,
      startDate: { gte: new Date() },
      status: { in: [ChuEventStatus.DRAFT, ChuEventStatus.SCHEDULED] },
    },
    orderBy: { startDate: 'asc' },
    take: limit,
  });
}

// ----------------------------------------------------------------------------
// EVENT SCHEDULE
// ----------------------------------------------------------------------------

export async function createSchedule(
  tenantId: string,
  input: CreateScheduleInput,
  actorId: string
) {
  if (!input.serviceId && !input.eventId) {
    throw new Error('Either serviceId or eventId is required');
  }

  const scheduledDate = new Date(input.scheduledDate);

  const schedule = await prisma.chu_event_schedule.create({
    data: withPrismaDefaults({
      tenantId,
      serviceId: input.serviceId,
      eventId: input.eventId,
      scheduledDate,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      preacherId: input.preacherId,
      topic: input.topic,
      createdBy: actorId,
    }),
  });

  return schedule;
}

export async function cancelSchedule(
  tenantId: string,
  scheduleId: string,
  reason: string,
  actorId: string
) {
  const schedule = await prisma.chu_event_schedule.findFirst({
    where: { id: scheduleId, tenantId },
  });

  if (!schedule) throw new Error('Schedule not found');

  return prisma.chu_event_schedule.update({
    where: { id: scheduleId },
    data: {
      isCancelled: true,
      cancellationReason: reason,
    },
  });
}

export async function getUpcomingSchedules(
  tenantId: string,
  churchId?: string,
  days: number = 7
) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const where: Record<string, unknown> = {
    tenantId,
    scheduledDate: { gte: new Date(), lte: endDate },
    isCancelled: false,
  };

  if (churchId) {
    where.OR = [
      { service: { churchId } },
      { event: { churchId } },
    ];
  }

  return prisma.chu_event_schedule.findMany({
    where,
    orderBy: { scheduledDate: 'asc' },
    include: {
      service: { select: { name: true, type: true } },
      event: { select: { title: true, type: true } },
    },
  });
}

// ----------------------------------------------------------------------------
// ATTENDANCE (APPEND-ONLY, AGGREGATED ONLY)
// ----------------------------------------------------------------------------

export async function recordAttendance(
  tenantId: string,
  input: CreateAttendanceInput,
  actorId: string
) {
  if (!input.scheduleId && !input.serviceId && !input.eventId) {
    throw new Error('At least one of scheduleId, serviceId, or eventId is required');
  }

  const attendanceDate = new Date(input.attendanceDate);

  // ⚠️ SAFEGUARDING: Attendance is aggregated only - no individual tracking
  const attendance = await prisma.chu_attendance_fact.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      scheduleId: input.scheduleId,
      serviceId: input.serviceId,
      eventId: input.eventId,
      attendanceDate,
      totalCount: input.totalCount,
      adultCount: input.adultCount,
      childrenCount: input.childrenCount, // Aggregated only - no individual tracking
      maleCount: input.maleCount,
      femaleCount: input.femaleCount,
      firstTimers: input.firstTimers,
      visitors: input.visitors,
      onlineCount: input.onlineCount,
      notes: input.notes,
      recordedBy: actorId,
    }),
  });

  // Update schedule with actual attendance if linked
  if (input.scheduleId) {
    await prisma.chu_event_schedule.update({
      where: { id: input.scheduleId },
      data: { actualAttendance: input.totalCount },
    });
  }

  return {
    ...attendance,
    _safeguarding: 'AGGREGATED_ONLY — No individual attendance tracking for minors safety',
  };
}

export async function getAttendanceHistory(
  tenantId: string,
  churchId: string,
  serviceId?: string,
  eventId?: string,
  limit: number = 50
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (serviceId) where.serviceId = serviceId;
  if (eventId) where.eventId = eventId;

  return prisma.chu_attendance_fact.findMany({
    where,
    orderBy: { attendanceDate: 'desc' },
    take: limit,
    include: {
      service: { select: { name: true } },
      event: { select: { title: true } },
    },
  });
}

export async function getAttendanceStats(
  tenantId: string,
  churchId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (startDate || endDate) {
    where.attendanceDate = {};
    if (startDate) (where.attendanceDate as Record<string, unknown>).gte = startDate;
    if (endDate) (where.attendanceDate as Record<string, unknown>).lte = endDate;
  }

  const records = await prisma.chu_attendance_fact.findMany({ where });

  const totalRecords = records.length;
  const totalAttendance = records.reduce((sum: any, r: any) => sum + r.totalCount, 0);
  const avgAttendance = totalRecords > 0 ? Math.round(totalAttendance / totalRecords) : 0;
  const totalFirstTimers = records.reduce((sum: any, r: any) => sum + (r.firstTimers || 0), 0);
  const totalVisitors = records.reduce((sum: any, r: any) => sum + (r.visitors || 0), 0);

  return {
    totalRecords,
    totalAttendance,
    avgAttendance,
    totalFirstTimers,
    totalVisitors,
    _safeguarding: 'AGGREGATED_STATS_ONLY',
  };
}

// ----------------------------------------------------------------------------
// SPEAKER INVITES
// ----------------------------------------------------------------------------

export async function createSpeakerInvite(
  tenantId: string,
  input: CreateSpeakerInviteInput,
  actorId: string
) {
  const scheduledDate = new Date(input.scheduledDate);

  const invite = await prisma.chu_speaker_invite.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      serviceId: input.serviceId,
      eventId: input.eventId,
      speakerName: input.speakerName,
      title: input.title,
      organization: input.organization,
      phone: input.phone,
      email: input.email,
      topic: input.topic,
      scheduledDate,
      notes: input.notes,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'speaker_invite', invite.id, actorId, undefined, {
    speakerName: invite.speakerName,
    scheduledDate: invite.scheduledDate,
  });

  return invite;
}

export async function updateSpeakerInviteStatus(
  tenantId: string,
  inviteId: string,
  status: string,
  actorId: string
) {
  const invite = await prisma.chu_speaker_invite.findFirst({
    where: { id: inviteId, tenantId },
  });

  if (!invite) throw new Error('Speaker invite not found');

  const updateData: Record<string, unknown> = { status };
  if (status === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
  }

  return prisma.chu_speaker_invite.update({
    where: { id: inviteId },
    data: updateData,
  });
}

export async function listSpeakerInvites(
  tenantId: string,
  churchId: string,
  status?: string
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (status) where.status = status;

  return prisma.chu_speaker_invite.findMany({
    where,
    orderBy: { scheduledDate: 'asc' },
    include: {
      service: { select: { name: true } },
      event: { select: { title: true } },
    },
  });
}
