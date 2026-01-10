/**
 * Political Suite - Regulator Access Service (Phase 4)
 * READ-ONLY ACCESS FOR REGULATORS & OBSERVERS
 * 
 * Authorization: January 8, 2026 (Checkpoint C Approved)
 * Classification: GOVERNANCE & POST-ELECTION
 * 
 * MANDATORY LABELS:
 * - READ-ONLY ACCESS
 * - NO WRITE PERMISSIONS
 * - AUDIT LOGGED
 * 
 * CRITICAL: All regulator access is logged and auditable.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { createGovernanceAudit } from './governance-audit-service';

// Re-export enums
export {
  PolRegulatorAccessLevel,
} from '@prisma/client';

import type {
  PolRegulatorAccessLevel,
} from '@prisma/client';

// MANDATORY DISCLAIMERS
const DISCLAIMER_1 = 'READ-ONLY ACCESS';
const DISCLAIMER_2 = 'NO WRITE PERMISSIONS';
const DISCLAIMER_3 = 'AUDIT LOGGED';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface GrantAccessInput {
  partyId: string;
  regulatorName: string;
  regulatorType: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  accessLevel?: PolRegulatorAccessLevel;
  canViewParties?: boolean;
  canViewCampaigns?: boolean;
  canViewPrimaries?: boolean;
  canViewResults?: boolean;
  canViewAuditLogs?: boolean;
  canViewPetitions?: boolean;
  canViewEvidence?: boolean;
  canViewFinancials?: boolean;
  expiresAt?: Date;
}

export interface AccessFilters {
  partyId?: string;
  regulatorType?: string;
  accessLevel?: PolRegulatorAccessLevel;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// REGULATOR ACCESS MANAGEMENT
// ----------------------------------------------------------------------------

/**
 * Grant read-only access to a regulator/observer.
 */
export async function grantAccess(
  tenantId: string,
  input: GrantAccessInput,
  grantedBy: string
) {
  // Validate party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  // Check for existing active access
  const existing = await prisma.pol_regulator_access.findFirst({
    where: {
      tenantId,
      partyId: input.partyId,
      contactEmail: input.contactEmail,
      isActive: true,
    },
  });

  if (existing) {
    throw new Error('Active access already exists for this regulator');
  }

  const access = await prisma.pol_regulator_access.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      regulatorName: input.regulatorName,
      regulatorType: input.regulatorType,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      accessLevel: input.accessLevel || 'OBSERVER',
      canViewParties: input.canViewParties ?? true,
      canViewCampaigns: input.canViewCampaigns ?? true,
      canViewPrimaries: input.canViewPrimaries ?? true,
      canViewResults: input.canViewResults ?? true,
      canViewAuditLogs: input.canViewAuditLogs ?? false,
      canViewPetitions: input.canViewPetitions ?? false,
      canViewEvidence: input.canViewEvidence ?? false,
      canViewFinancials: input.canViewFinancials ?? false,
      expiresAt: input.expiresAt,
      disclaimer1: DISCLAIMER_1,
      disclaimer2: DISCLAIMER_2,
      disclaimer3: DISCLAIMER_3,
      grantedBy,
    }),
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'regulator_access',
    entityId: access.id,
    action: 'GRANT',
    actorId: grantedBy,
    partyId: input.partyId,
    changeNote: `Access granted to ${input.regulatorName} (${input.accessLevel || 'OBSERVER'})`,
  });

  return formatAccess(access);
}

/**
 * Revoke regulator access.
 */
export async function revokeAccess(
  tenantId: string,
  accessId: string,
  revokedBy: string,
  revocationReason: string
) {
  const existing = await prisma.pol_regulator_access.findFirst({
    where: { id: accessId, tenantId },
  });

  if (!existing) {
    throw new Error('Access record not found');
  }

  if (!existing.isActive) {
    throw new Error('Access has already been revoked');
  }

  const access = await prisma.pol_regulator_access.update({
    where: { id: accessId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
      revocationReason,
    },
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'regulator_access',
    entityId: accessId,
    action: 'REVOKE',
    actorId: revokedBy,
    partyId: existing.partyId,
    changeNote: `Access revoked: ${revocationReason}`,
  });

  return formatAccess(access);
}

/**
 * Log regulator access (for audit trail).
 */
export async function logAccessEvent(
  tenantId: string,
  accessId: string,
  action: string,
  resource: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Verify access is valid and active
  const access = await prisma.pol_regulator_access.findFirst({
    where: { id: accessId, tenantId, isActive: true },
  });

  if (!access) {
    throw new Error('Invalid or inactive access');
  }

  // Check if expired
  if (access.expiresAt && access.expiresAt < new Date()) {
    throw new Error('Access has expired');
  }

  const log = await prisma.pol_regulator_access_log.create({
    data: withPrismaDefaults({
      tenantId,
      accessId,
      action,
      resource,
      resourceId,
      ipAddress,
      userAgent,
    }),
  });

  return log;
}

/**
 * Get access record by ID.
 */
export async function getAccess(tenantId: string, accessId: string) {
  const access = await prisma.pol_regulator_access.findFirst({
    where: { id: accessId, tenantId },
    include: {
      party: { select: { id: true, name: true, acronym: true } },
      _count: { select: { accessLogs: true } },
    },
  });

  if (!access) return null;

  return formatAccess(access);
}

/**
 * List regulator access records.
 */
export async function listAccess(
  tenantId: string,
  filters: AccessFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.regulatorType) where.regulatorType = filters.regulatorType;
  if (filters.accessLevel) where.accessLevel = filters.accessLevel;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const [data, total] = await Promise.all([
    prisma.pol_regulator_access.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
        _count: { select: { accessLogs: true } },
      },
      orderBy: { grantedAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_regulator_access.count({ where }),
  ]);

  return {
    data: data.map(formatAccess),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
  };
}

/**
 * Get access logs for a regulator.
 */
export async function getAccessLogs(
  tenantId: string,
  accessId: string,
  limit: number = 100
) {
  const logs = await prisma.pol_regulator_access_log.findMany({
    where: { tenantId, accessId },
    orderBy: { accessedAt: 'desc' },
    take: limit,
  });

  return {
    data: logs,
    total: logs.length,
    _notice: 'All regulator access is logged for audit purposes',
  };
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function formatAccess(access: Record<string, unknown>) {
  return {
    ...access,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _mandatory_notice: 'READ-ONLY ACCESS - NO WRITE PERMISSIONS - ALL ACCESS IS LOGGED',
  };
}
