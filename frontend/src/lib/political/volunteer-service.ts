/**
 * Political Suite - Volunteer Service
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateVolunteerInput,
  UpdateVolunteerInput,
  VolunteerQueryFilters,
  PolVolunteerStatus,
  PolVolunteerRole,
} from './types';
import { logCreate, logUpdate, logStatusChange } from './audit-service';

// ----------------------------------------------------------------------------
// VOLUNTEER CRUD
// ----------------------------------------------------------------------------

export async function createVolunteer(
  tenantId: string,
  input: CreateVolunteerInput,
  actorId: string
) {
  // Verify campaign exists
  const campaign = await prisma.pol_campaign.findFirst({
    where: { id: input.campaignId, tenantId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Verify event exists if provided
  if (input.eventId) {
    const event = await prisma.pol_event.findFirst({
      where: { id: input.eventId, tenantId, campaignId: input.campaignId },
    });
    if (!event) {
      throw new Error('Event not found');
    }
  }

  // Verify member exists if provided
  if (input.memberId) {
    const member = await prisma.pol_member.findFirst({
      where: { id: input.memberId, tenantId },
    });
    if (!member) {
      throw new Error('Member not found');
    }
  }

  const volunteer = await prisma.pol_volunteer.create({
    data: withPrismaDefaults({
      tenantId,
      campaignId: input.campaignId,
      memberId: input.memberId,
      eventId: input.eventId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      role: input.role,
      assignment: input.assignment,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      pollingUnit: input.pollingUnit,
      availableFrom: input.availableFrom,
      availableTo: input.availableTo,
      isFullTime: input.isFullTime ?? false,
      supervisorId: input.supervisorId,
      supervisorName: input.supervisorName,
      notes: input.notes,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'volunteer', volunteer.id, actorId, undefined, {
    campaignId: input.campaignId,
    name: `${volunteer.firstName} ${volunteer.lastName}`,
    role: volunteer.role,
    state: volunteer.state,
    ward: volunteer.ward,
  });

  return volunteer;
}

export async function updateVolunteer(
  tenantId: string,
  volunteerId: string,
  input: UpdateVolunteerInput,
  actorId: string
) {
  const existing = await prisma.pol_volunteer.findFirst({
    where: { id: volunteerId, tenantId },
  });

  if (!existing) {
    throw new Error('Volunteer not found');
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

  const volunteer = await prisma.pol_volunteer.update({
    where: { id: volunteerId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        'volunteer',
        volunteerId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, 'volunteer', volunteerId, actorId, changes);
    }
  }

  return volunteer;
}

export async function getVolunteer(tenantId: string, volunteerId: string) {
  const volunteer = await prisma.pol_volunteer.findFirst({
    where: { id: volunteerId, tenantId },
    include: {
      campaign: {
        include: {
          party: true,
        },
      },
      member: true,
      event: true,
    },
  });

  return volunteer;
}

export async function listVolunteers(
  tenantId: string,
  filters: VolunteerQueryFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pol_volunteer.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        member: { select: { id: true, membershipNo: true } },
        event: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_volunteer.count({ where }),
  ]);

  return { data, total, limit: filters.limit || 50, offset: filters.offset || 0 };
}

export async function trainVolunteer(
  tenantId: string,
  volunteerId: string,
  actorId: string
) {
  const existing = await prisma.pol_volunteer.findFirst({
    where: { id: volunteerId, tenantId },
  });

  if (!existing) {
    throw new Error('Volunteer not found');
  }

  const volunteer = await prisma.pol_volunteer.update({
    where: { id: volunteerId },
    data: {
      isTrainedAgent: true,
      trainedAt: new Date(),
    },
  });

  await logUpdate(tenantId, 'volunteer', volunteerId, actorId, {
    isTrainedAgent: { old: false, new: true },
  });

  return volunteer;
}

export async function logVolunteerActivity(
  tenantId: string,
  volunteerId: string,
  hours: number,
  tasksCompleted: number,
  actorId: string
) {
  const existing = await prisma.pol_volunteer.findFirst({
    where: { id: volunteerId, tenantId },
  });

  if (!existing) {
    throw new Error('Volunteer not found');
  }

  const volunteer = await prisma.pol_volunteer.update({
    where: { id: volunteerId },
    data: {
      hoursLogged: { increment: hours },
      tasksCompleted: { increment: tasksCompleted },
    },
  });

  await logUpdate(tenantId, 'volunteer', volunteerId, actorId, {
    hoursLogged: { old: existing.hoursLogged, new: existing.hoursLogged + hours },
    tasksCompleted: { old: existing.tasksCompleted, new: existing.tasksCompleted + tasksCompleted },
  });

  return volunteer;
}

export async function getVolunteerStats(
  tenantId: string,
  campaignId?: string
) {
  const where: Record<string, unknown> = { tenantId };
  if (campaignId) where.campaignId = campaignId;

  const [total, active, trained, byRole, byState, totalHours] = await Promise.all([
    prisma.pol_volunteer.count({ where }),
    prisma.pol_volunteer.count({ where: { ...where, status: PolVolunteerStatus.ACTIVE } }),
    prisma.pol_volunteer.count({ where: { ...where, isTrainedAgent: true } }),
    prisma.pol_volunteer.groupBy({
      by: ['role'],
      where,
      _count: true,
    }),
    prisma.pol_volunteer.groupBy({
      by: ['state'],
      where: { ...where, state: { not: null } },
      _count: true,
    }),
    prisma.pol_volunteer.aggregate({
      where,
      _sum: { hoursLogged: true, tasksCompleted: true },
    }),
  ]);

  return {
    total,
    active,
    trained,
    totalHoursLogged: totalHours._sum.hoursLogged || 0,
    totalTasksCompleted: totalHours._sum.tasksCompleted || 0,
    byRole: byRole.reduce((acc: any, item: any) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byState: byState.reduce((acc: any, item: any) => {
      if (item.state) acc[item.state] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}
