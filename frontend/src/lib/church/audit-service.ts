/**
 * Church Suite — Audit Service
 * APPEND-ONLY audit trail for all church operations
 *
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ----------------------------------------------------------------------------
// AUDIT LOG CREATION (APPEND-ONLY)
// ----------------------------------------------------------------------------

function generateHash(data: object): string {
  const json = JSON.stringify(data);
  return crypto.createHash('sha256').update(json).digest('hex');
}

export async function logCreate(
  tenantId: string,
  churchId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  unitId?: string,
  metadata?: Record<string, unknown>
) {
  const newState = metadata ? JSON.stringify(metadata) : null;
  const recordData = { tenantId, churchId, entityType, entityId, action: 'CREATE', actorId, newState };
  const recordHash = generateHash(recordData);

  return prisma.chu_audit_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId,
      entityType,
      entityId,
      action: 'CREATE',
      actorId,
      actorType: 'MEMBER',
      newState,
      unitId,
      recordHash,
    }),
  });
}

export async function logUpdate(
  tenantId: string,
  churchId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  unitId?: string
) {
  const previousState = JSON.stringify(Object.fromEntries(
    Object.entries(changes).map(([k, v]) => [k, v.old])
  ));
  const newState = JSON.stringify(Object.fromEntries(
    Object.entries(changes).map(([k, v]) => [k, v.new])
  ));
  const recordData = { tenantId, churchId, entityType, entityId, action: 'UPDATE', actorId, previousState, newState };
  const recordHash = generateHash(recordData);

  return prisma.chu_audit_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId,
      entityType,
      entityId,
      action: 'UPDATE',
      actorId,
      actorType: 'MEMBER',
      previousState,
      newState,
      unitId,
      recordHash,
    }),
  });
}

export async function logStatusChange(
  tenantId: string,
  churchId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  previousStatus: string | null,
  newStatus: string,
  reason?: string,
  unitId?: string
) {
  const recordData = { tenantId, churchId, entityType, entityId, action: 'STATUS_CHANGE', actorId, previousStatus, newStatus };
  const recordHash = generateHash(recordData);

  return prisma.chu_audit_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId,
      entityType,
      entityId,
      action: 'STATUS_CHANGE',
      actorId,
      actorType: 'MEMBER',
      previousState: previousStatus ? JSON.stringify({ status: previousStatus }) : null,
      newState: JSON.stringify({ status: newStatus }),
      changeNote: reason,
      unitId,
      recordHash,
    }),
  });
}

export async function logAssignment(
  tenantId: string,
  churchId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  assignmentData: Record<string, unknown>,
  unitId?: string
) {
  const newState = JSON.stringify(assignmentData);
  const recordData = { tenantId, churchId, entityType, entityId, action: 'ASSIGN', actorId, newState };
  const recordHash = generateHash(recordData);

  return prisma.chu_audit_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId,
      entityType,
      entityId,
      action: 'ASSIGN',
      actorId,
      actorType: 'MEMBER',
      newState,
      unitId,
      recordHash,
    }),
  });
}

export async function logTermination(
  tenantId: string,
  churchId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  reason?: string,
  unitId?: string
) {
  const recordData = { tenantId, churchId, entityType, entityId, action: 'TERMINATE', actorId, reason };
  const recordHash = generateHash(recordData);

  return prisma.chu_audit_log.create({
    data: withPrismaDefaults({
      tenantId,
      churchId,
      entityType,
      entityId,
      action: 'TERMINATE',
      actorId,
      actorType: 'MEMBER',
      changeNote: reason,
      unitId,
      recordHash,
    }),
  });
}

// ----------------------------------------------------------------------------
// AUDIT LOG QUERIES (READ-ONLY)
// ----------------------------------------------------------------------------

export interface AuditQueryFilters {
  churchId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  unitId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(
  tenantId: string,
  filters: AuditQueryFilters
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.churchId) where.churchId = filters.churchId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.unitId) where.unitId = filters.unitId;

  if (filters.startDate || filters.endDate) {
    where.recordedAt = {};
    if (filters.startDate) (where.recordedAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.recordedAt as Record<string, unknown>).lte = filters.endDate;
  }

  const logs = await prisma.chu_audit_log.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });

  const total = await prisma.chu_audit_log.count({ where });

  return { logs, total };
}

export async function getEntityAuditTrail(
  tenantId: string,
  entityType: string,
  entityId: string
) {
  return prisma.chu_audit_log.findMany({
    where: { tenantId, entityType, entityId },
    orderBy: { recordedAt: 'desc' },
  });
}

export async function verifyIntegrity(
  tenantId: string,
  logId: string
) {
  const log = await prisma.chu_audit_log.findFirst({
    where: { id: logId, tenantId },
  });

  if (!log) return { valid: false, error: 'Log not found' };

  const recordData = {
    tenantId: log.tenantId,
    churchId: log.churchId,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    actorId: log.actorId,
    previousState: log.previousState,
    newState: log.newState,
  };

  const expectedHash = generateHash(recordData);

  return {
    valid: log.recordHash === expectedHash,
    recordedHash: log.recordHash,
    computedHash: expectedHash,
  };
}
