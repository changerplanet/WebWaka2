/**
 * Church Suite — Ministry Management Service
 * Phase 2: Ministries, Services & Events
 *
 * Authorization: January 8, 2026 (Checkpoint A Approved)
 * Classification: MEDIUM RISK
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { ChuMinistryType } from '@prisma/client';
import { logCreate, logUpdate, logAssignment, logTermination } from './audit-service';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateMinistryInput {
  churchId: string;
  unitId?: string;
  name: string;
  type: ChuMinistryType;
  description?: string;
  leaderId?: string;
  assistantLeaderId?: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingLocation?: string;
  establishedDate?: Date;
}

export interface UpdateMinistryInput extends Partial<Omit<CreateMinistryInput, 'churchId'>> {
  isActive?: boolean;
}

export interface MinistryQueryFilters {
  churchId?: string;
  unitId?: string;
  type?: ChuMinistryType;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateDepartmentInput {
  churchId: string;
  ministryId?: string;
  name: string;
  code?: string;
  description?: string;
  headId?: string;
  deputyHeadId?: string;
}

export interface UpdateDepartmentInput extends Partial<Omit<CreateDepartmentInput, 'churchId'>> {
  isActive?: boolean;
}

export interface CreateMinistryAssignmentInput {
  churchId: string;
  memberId: string;
  ministryId?: string;
  departmentId?: string;
  role?: string;
  effectiveDate?: Date;
  endDate?: Date;
}

export interface CreateTrainingRecordInput {
  churchId: string;
  memberId: string;
  title: string;
  description?: string;
  trainingType?: string;
  provider?: string;
  facilitator?: string;
  startDate: Date;
  endDate?: Date;
  durationHours?: number;
}

export interface CreateVolunteerLogInput {
  churchId: string;
  memberId: string;
  ministryId?: string;
  activity: string;
  description?: string;
  serviceDate: Date;
  hoursServed?: number;
  eventId?: string;
  serviceId?: string;
}

// ----------------------------------------------------------------------------
// MINISTRY CRUD
// ----------------------------------------------------------------------------

export async function createMinistry(
  tenantId: string,
  input: CreateMinistryInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const establishedDate = input.establishedDate ? new Date(input.establishedDate) : null;

  const ministry = await prisma.chu_ministry.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      unitId: input.unitId,
      name: input.name,
      type: input.type,
      description: input.description,
      leaderId: input.leaderId,
      assistantLeaderId: input.assistantLeaderId,
      meetingDay: input.meetingDay,
      meetingTime: input.meetingTime,
      meetinglocation: input.meetingLocation,
      establishedDate,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'ministry', ministry.id, actorId, input.unitId, {
    name: ministry.name,
    type: ministry.type,
  });

  return ministry;
}

export async function updateMinistry(
  tenantId: string,
  ministryId: string,
  input: UpdateMinistryInput,
  actorId: string
) {
  const existing = await prisma.chu_ministry.findFirst({
    where: { id: ministryId, tenantId },
  });

  if (!existing) throw new Error('Ministry not found');

  const updateData: Record<string, unknown> = { ...input };
  if (input.establishedDate) updateData.establishedDate = new Date(input.establishedDate);

  const ministry = await prisma.chu_ministry.update({
    where: { id: ministryId },
    data: updateData,
  });

  await logUpdate(tenantId, existing.churchId, 'ministry', ministryId, actorId, {
    updated: { old: 'previous', new: 'updated' },
  }, existing.unitId || undefined);

  return ministry;
}

export async function getMinistry(
  tenantId: string,
  ministryId: string
) {
  return prisma.chu_ministry.findFirst({
    where: { id: ministryId, tenantId },
    include: {
      departments: { where: { isActive: true } },
      _count: {
        select: {
          assignments: { where: { isActive: true } },
          volunteerLogs: true,
        },
      },
    },
  });
}

export async function listMinistries(
  tenantId: string,
  filters: MinistryQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.type) where.type = filters.type;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const ministries = await prisma.chu_ministry.findMany({
    where,
    orderBy: { name: 'asc' },
    take: filters.limit || 50,
    skip: filters.offset || 0,
    include: {
      _count: {
        select: {
          assignments: { where: { isActive: true } },
          departments: { where: { isActive: true } },
        },
      },
    },
  });

  const total = await prisma.chu_ministry.count({ where });

  return { ministries, total };
}

// ----------------------------------------------------------------------------
// DEPARTMENT CRUD
// ----------------------------------------------------------------------------

export async function createDepartment(
  tenantId: string,
  input: CreateDepartmentInput,
  actorId: string
) {
  const church = await prisma.chu_church.findFirst({
    where: { id: input.churchId, tenantId },
  });
  if (!church) throw new Error('Church not found');

  const department = await prisma.chu_department.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      ministryId: input.ministryId,
      name: input.name,
      code: input.code,
      description: input.description,
      headId: input.headId,
      deputyHeadId: input.deputyHeadId,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'department', department.id, actorId, undefined, {
    name: department.name,
    code: department.code,
  });

  return department;
}

export async function updateDepartment(
  tenantId: string,
  departmentId: string,
  input: UpdateDepartmentInput,
  actorId: string
) {
  const existing = await prisma.chu_department.findFirst({
    where: { id: departmentId, tenantId },
  });

  if (!existing) throw new Error('Department not found');

  const department = await prisma.chu_department.update({
    where: { id: departmentId },
    data: input,
  });

  await logUpdate(tenantId, existing.churchId, 'department', departmentId, actorId, {
    updated: { old: 'previous', new: 'updated' },
  });

  return department;
}

export async function getDepartment(
  tenantId: string,
  departmentId: string
) {
  return prisma.chu_department.findFirst({
    where: { id: departmentId, tenantId },
    include: {
      ministry: { select: { name: true, type: true } },
      _count: {
        select: {
          assignments: { where: { isActive: true } },
        },
      },
    },
  });
}

export async function listDepartments(
  tenantId: string,
  churchId: string,
  ministryId?: string
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (ministryId) where.ministryId = ministryId;

  return prisma.chu_department.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      ministry: { select: { name: true } },
      _count: {
        select: { assignments: { where: { isActive: true } } },
      },
    },
  });
}

// ----------------------------------------------------------------------------
// MINISTRY ASSIGNMENTS
// ----------------------------------------------------------------------------

export async function assignToMinistry(
  tenantId: string,
  input: CreateMinistryAssignmentInput,
  actorId: string
) {
  if (!input.ministryId && !input.departmentId) {
    throw new Error('Either ministryId or departmentId is required');
  }

  const effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
  const endDate = input.endDate ? new Date(input.endDate) : null;

  const assignment = await prisma.chu_ministry_assignment.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      memberId: input.memberId,
      ministryId: input.ministryId,
      departmentId: input.departmentId,
      role: input.role || 'MEMBER',
      effectiveDate,
      endDate,
      assignedBy: actorId,
    }),
  });

  await logAssignment(tenantId, input.churchId, 'ministry_assignment', assignment.id, actorId, {
    memberId: input.memberId,
    ministryId: input.ministryId,
    departmentId: input.departmentId,
    role: input.role,
  });

  return assignment;
}

export async function endMinistryAssignment(
  tenantId: string,
  assignmentId: string,
  actorId: string
) {
  const assignment = await prisma.chu_ministry_assignment.findFirst({
    where: { id: assignmentId, tenantId },
  });

  if (!assignment) throw new Error('Assignment not found');

  const updated = await prisma.chu_ministry_assignment.update({
    where: { id: assignmentId },
    data: {
      isActive: false,
      endDate: new Date(),
    },
  });

  await logTermination(tenantId, assignment.churchId, 'ministry_assignment', assignmentId, actorId, 'Assignment ended');

  return updated;
}

export async function getMemberMinistries(
  tenantId: string,
  memberId: string
) {
  return prisma.chu_ministry_assignment.findMany({
    where: { tenantId, memberId, isActive: true },
    include: {
      ministry: { select: { name: true, type: true } },
      department: { select: { name: true, code: true } },
    },
  });
}

export async function getMinistryMembers(
  tenantId: string,
  ministryId: string
) {
  return prisma.chu_ministry_assignment.findMany({
    where: { tenantId, ministryId, isActive: true },
    orderBy: { role: 'asc' },
  });
}

// ----------------------------------------------------------------------------
// TRAINING RECORDS
// ----------------------------------------------------------------------------

export async function createTrainingRecord(
  tenantId: string,
  input: CreateTrainingRecordInput,
  actorId: string
) {
  const startDate = new Date(input.startDate);
  const endDate = input.endDate ? new Date(input.endDate) : null;

  const record = await prisma.chu_training_record.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      memberId: input.memberId,
      title: input.title,
      description: input.description,
      trainingType: input.trainingType,
      provider: input.provider,
      facilitator: input.facilitator,
      startDate,
      endDate,
      durationHours: input.durationHours,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, input.churchId, 'training_record', record.id, actorId, undefined, {
    title: record.title,
    memberId: record.memberId,
  });

  return record;
}

export async function completeTraining(
  tenantId: string,
  recordId: string,
  certificateUrl: string | null,
  actorId: string
) {
  const record = await prisma.chu_training_record.findFirst({
    where: { id: recordId, tenantId },
  });

  if (!record) throw new Error('Training record not found');

  return prisma.chu_training_record.update({
    where: { id: recordId },
    data: {
      isCompleted: true,
      completedDate: new Date(),
      certificateUrl,
    },
  });
}

export async function getMemberTraining(
  tenantId: string,
  memberId: string
) {
  return prisma.chu_training_record.findMany({
    where: { tenantId, memberId },
    orderBy: { startDate: 'desc' },
  });
}

// ----------------------------------------------------------------------------
// VOLUNTEER LOGS (APPEND-ONLY)
// ----------------------------------------------------------------------------

export async function logVolunteerActivity(
  tenantId: string,
  input: CreateVolunteerLogInput,
  actorId: string
) {
  const serviceDate = new Date(input.serviceDate);

  const log = await prisma.chu_volunteer_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId: input.churchId,
      memberId: input.memberId,
      ministryId: input.ministryId,
      activity: input.activity,
      description: input.description,
      serviceDate,
      hoursServed: input.hoursServed,
      eventId: input.eventId,
      serviceId: input.serviceId,
    }),
  });

  return log;
}

export async function verifyVolunteerLog(
  tenantId: string,
  logId: string,
  actorId: string
) {
  const log = await prisma.chu_volunteer_log.findFirst({
    where: { id: logId, tenantId },
  });

  if (!log) throw new Error('Volunteer log not found');

  return prisma.chu_volunteer_log.update({
    where: { id: logId },
    data: {
      verifiedBy: actorId,
      verifiedAt: new Date(),
    },
  });
}

export async function getMemberVolunteerHistory(
  tenantId: string,
  memberId: string,
  limit: number = 50
) {
  return prisma.chu_volunteer_log.findMany({
    where: { tenantId, memberId },
    orderBy: { serviceDate: 'desc' },
    take: limit,
    include: {
      ministry: { select: { name: true } },
    },
  });
}

export async function getVolunteerStats(
  tenantId: string,
  churchId: string,
  memberId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Record<string, unknown> = { tenantId, churchId };
  if (memberId) where.memberId = memberId;
  if (startDate || endDate) {
    where.serviceDate = {};
    if (startDate) (where.serviceDate as Record<string, unknown>).gte = startDate;
    if (endDate) (where.serviceDate as Record<string, unknown>).lte = endDate;
  }

  const logs = await prisma.chu_volunteer_log.findMany({ where });

  const totalLogs = logs.length;
  const totalHours = logs.reduce((sum: any, log) => sum + (log.hoursServed || 0), 0);
  const verifiedLogs = logs.filter(log => log.verifiedBy).length;

  return {
    totalLogs,
    totalHours,
    verifiedLogs,
    verificationRate: totalLogs > 0 ? (verifiedLogs / totalLogs * 100).toFixed(1) : '0',
  };
}
