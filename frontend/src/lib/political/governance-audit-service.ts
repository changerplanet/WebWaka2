/**
 * Political Suite - Governance Audit Service (Phase 4)
 * APPEND-ONLY / IMMUTABLE AUDIT TRAIL
 * 
 * Authorization: January 8, 2026 (Checkpoint C Approved)
 * Classification: GOVERNANCE & POST-ELECTION
 * 
 * CRITICAL: Audit logs are APPEND-ONLY. Once written, cannot be modified or deleted.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreateAuditInput {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorType?: string;
  previousState?: string;
  newState?: string;
  changeNote?: string;
  ipAddress?: string;
  userAgent?: string;
  partyId?: string;
  state?: string;
  lga?: string;
  ward?: string;
}

export interface AuditFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  partyId?: string;
  state?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// AUDIT LOG CREATION (APPEND-ONLY)
// ----------------------------------------------------------------------------

/**
 * Create a governance audit log entry.
 * CRITICAL: Audit logs are APPEND-ONLY. Cannot be modified or deleted.
 */
export async function createGovernanceAudit(
  tenantId: string,
  input: CreateAuditInput
) {
  // Create hash for integrity verification
  const recordData = JSON.stringify({
    tenantId,
    ...input,
    recordedAt: new Date().toISOString(),
  });
  const recordHash = crypto.createHash('sha256').update(recordData).digest('hex');

  const audit = await prisma.pol_governance_audit.create({
    data: withPrismaDefaults({
      tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      actorType: input.actorType,
      previousState: input.previousState,
      newState: input.newState,
      changeNote: input.changeNote,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      partyId: input.partyId,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      recordHash,
    }),
  });

  return {
    ...audit,
    _immutability_notice: 'Audit log is APPEND-ONLY. Cannot be modified or deleted.',
  };
}

// ----------------------------------------------------------------------------
// AUDIT LOG QUERIES (READ-ONLY)
// ----------------------------------------------------------------------------

/**
 * Get a single audit log entry.
 */
export async function getAuditLog(tenantId: string, auditId: string) {
  const audit = await prisma.pol_governance_audit.findFirst({
    where: { id: auditId, tenantId },
  });

  if (!audit) return null;

  return {
    ...audit,
    _immutability_notice: 'Audit log is APPEND-ONLY.',
  };
}

/**
 * List audit logs with filters.
 */
export async function listAuditLogs(
  tenantId: string,
  filters: AuditFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.state) where.state = filters.state;

  if (filters.fromDate || filters.toDate) {
    where.recordedAt = {};
    if (filters.fromDate) (where.recordedAt as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.recordedAt as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_governance_audit.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    }),
    prisma.pol_governance_audit.count({ where }),
  ]);

  return {
    data,
    total,
    limit: filters.limit || 100,
    offset: filters.offset || 0,
    _immutability_notice: 'Audit logs are APPEND-ONLY. Cannot be modified or deleted.',
  };
}

/**
 * Get audit trail for a specific entity.
 */
export async function getEntityAuditTrail(
  tenantId: string,
  entityType: string,
  entityId: string
) {
  const logs = await prisma.pol_governance_audit.findMany({
    where: { tenantId, entityType, entityId },
    orderBy: { recordedAt: 'asc' },
  });

  return {
    entityType,
    entityId,
    auditTrail: logs,
    totalEvents: logs.length,
    _immutability_notice: 'Complete audit trail - APPEND-ONLY records.',
  };
}

/**
 * Verify audit log integrity.
 */
export async function verifyAuditIntegrity(
  tenantId: string,
  auditId: string
) {
  const audit = await prisma.pol_governance_audit.findFirst({
    where: { id: auditId, tenantId },
  });

  if (!audit) {
    return { valid: false, error: 'Audit log not found' };
  }

  // Recompute hash
  const recordData = JSON.stringify({
    tenantId: audit.tenantId,
    entityType: audit.entityType,
    entityId: audit.entityId,
    action: audit.action,
    actorId: audit.actorId,
    actorType: audit.actorType,
    previousState: audit.previousState,
    newState: audit.newState,
    changeNote: audit.changeNote,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
    partyId: audit.partyId,
    state: audit.state,
    lga: audit.lga,
    ward: audit.ward,
    recordedAt: audit.recordedAt.toISOString(),
  });
  const computedHash = crypto.createHash('sha256').update(recordData).digest('hex');

  return {
    valid: computedHash === audit.recordHash,
    storedHash: audit.recordHash,
    computedHash,
    _notice: 'Hash verification ensures record integrity.',
  };
}

/**
 * Export audit logs (for compliance reporting).
 */
export async function exportAuditLogs(
  tenantId: string,
  filters: AuditFilters = {},
  format: 'json' | 'csv' = 'json'
) {
  const result = await listAuditLogs(tenantId, { ...filters, limit: 10000 });

  if (format === 'csv') {
    const headers = [
      'id', 'entityType', 'entityId', 'action', 'actorId', 'actorType',
      'changeNote', 'partyId', 'state', 'lga', 'ward', 'recordedAt', 'recordHash'
    ];
    const rows = result.data.map(log => [
      log.id,
      log.entityType,
      log.entityId,
      log.action,
      log.actorId,
      log.actorType || '',
      (log.changeNote || '').replace(/,/g, ';'),
      log.partyId || '',
      log.state || '',
      log.lga || '',
      log.ward || '',
      log.recordedAt.toISOString(),
      log.recordHash || '',
    ].join(','));

    return {
      format: 'csv',
      content: [headers.join(','), ...rows].join('\n'),
      recordCount: result.data.length,
      _notice: 'Exported audit logs for compliance purposes.',
    };
  }

  return {
    format: 'json',
    content: result.data,
    recordCount: result.data.length,
    _notice: 'Exported audit logs for compliance purposes.',
  };
}
