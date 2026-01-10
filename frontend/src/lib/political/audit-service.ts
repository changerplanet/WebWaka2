/**
 * Political Suite - Audit Service
 * Phase 1: Party & Campaign Operations
 * 
 * CRITICAL: This service manages the APPEND-ONLY audit log.
 * No updates or deletes are permitted on audit records.
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { CreateAuditLogInput, PolAuditAction } from './types';

/**
 * Create an audit log entry (APPEND-ONLY)
 * This is the ONLY write operation permitted on the audit log.
 */
export async function createAuditLog(
  tenantId: string,
  input: CreateAuditLogInput
): Promise<void> {
  await prisma.pol_audit_log.create({
    data: {
      tenantId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorName: input.actorName,
      actorRole: input.actorRole,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      description: input.description,
      changes: input.changes,
      metadata: input.metadata,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
    },
  });
}

/**
 * Helper to log entity creation
 */
export async function logCreate(
  tenantId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  actorEmail?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(tenantId, {
    action: PolAuditAction.CREATE,
    entityType,
    entityId,
    actorId,
    actorEmail,
    description: `Created ${entityType}`,
    metadata,
  });
}

/**
 * Helper to log entity update
 */
export async function logUpdate(
  tenantId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  actorEmail?: string
): Promise<void> {
  await createAuditLog(tenantId, {
    action: PolAuditAction.UPDATE,
    entityType,
    entityId,
    actorId,
    actorEmail,
    description: `Updated ${entityType}`,
    changes,
  });
}

/**
 * Helper to log status change
 */
export async function logStatusChange(
  tenantId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  oldStatus: string,
  newStatus: string,
  actorEmail?: string
): Promise<void> {
  await createAuditLog(tenantId, {
    action: PolAuditAction.STATUS_CHANGE,
    entityType,
    entityId,
    actorId,
    actorEmail,
    description: `Changed ${entityType} status from ${oldStatus} to ${newStatus}`,
    changes: { status: { old: oldStatus, new: newStatus } },
  });
}

/**
 * Helper to log verification
 */
export async function logVerify(
  tenantId: string,
  entityType: string,
  entityId: string,
  actorId: string,
  actorEmail?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog(tenantId, {
    action: PolAuditAction.VERIFY,
    entityType,
    entityId,
    actorId,
    actorEmail,
    description: `Verified ${entityType}`,
    metadata,
  });
}

/**
 * Query audit logs (READ-ONLY)
 */
export async function queryAuditLogs(
  tenantId: string,
  filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: PolAuditAction;
    fromDate?: Date;
    toDate?: Date;
    state?: string;
    lga?: string;
    ward?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.action) where.action = filters.action;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) (where.createdAt as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.createdAt as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_audit_log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_audit_log.count({ where }),
  ]);

  return {
    data: data.map(log => ({
      ...log,
      changes: log.changes as Record<string, unknown> | null,
      metadata: log.metadata as Record<string, unknown> | null,
    })),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}
