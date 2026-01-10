/**
 * Political Suite - Evidence Service (Phase 4)
 * APPEND-ONLY / IMMUTABLE EVIDENCE RECORDS
 * 
 * Authorization: January 8, 2026 (Checkpoint C Approved)
 * Classification: GOVERNANCE & POST-ELECTION
 * 
 * CRITICAL: Evidence is APPEND-ONLY. Once submitted, cannot be modified or deleted.
 * 
 * MANDATORY LABELS:
 * - EVIDENCE SUBMITTED - INTERNAL PARTY USE ONLY
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { createGovernanceAudit } from './governance-audit-service';

// Re-export enums
export {
  PolEvidenceType,
} from '@prisma/client';

import type {
  PolEvidenceType,
} from '@prisma/client';

// MANDATORY DISCLAIMER
const MANDATORY_DISCLAIMER = 'EVIDENCE SUBMITTED - INTERNAL PARTY USE ONLY';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface SubmitEvidenceInput {
  petitionId: string;
  type: PolEvidenceType;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  witnessName?: string;
  witnessContact?: string;
  statement?: string;
}

// ----------------------------------------------------------------------------
// EVIDENCE SUBMISSION (APPEND-ONLY)
// ----------------------------------------------------------------------------

/**
 * Submit evidence for a petition.
 * CRITICAL: Evidence is APPEND-ONLY. Cannot be modified or deleted.
 */
export async function submitEvidence(
  tenantId: string,
  input: SubmitEvidenceInput,
  submittedBy: string
) {
  // Validate petition exists and is not closed
  const petition = await prisma.pol_petition.findFirst({
    where: { id: input.petitionId, tenantId },
  });

  if (!petition) {
    throw new Error('Petition not found');
  }

  if (['CLOSED', 'WITHDRAWN', 'DECIDED'].includes(petition.status)) {
    throw new Error('Cannot submit evidence to a closed/decided petition');
  }

  const evidence = await prisma.pol_evidence.create({
    data: withPrismaDefaults({
      tenantId,
      petitionId: input.petitionId,
      type: input.type,
      title: input.title,
      description: input.description,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      witnessName: input.witnessName,
      witnessContact: input.witnessContact,
      statement: input.statement,
      submittedBy,
      disclaimer: MANDATORY_DISCLAIMER,
    }),
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'evidence',
    entityId: evidence.id,
    action: 'CREATE',
    actorId: submittedBy,
    partyId: petition.partyId,
    changeNote: `Evidence submitted: ${input.title} (${input.type})`,
  });

  return {
    ...evidence,
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _immutability_notice: 'Evidence is APPEND-ONLY. Cannot be modified or deleted.',
  };
}

/**
 * Verify evidence (marks as verified, does NOT modify content).
 */
export async function verifyEvidence(
  tenantId: string,
  evidenceId: string,
  verifiedBy: string,
  verificationNote?: string
) {
  const existing = await prisma.pol_evidence.findFirst({
    where: { id: evidenceId, tenantId },
    include: { petition: true },
  });

  if (!existing) {
    throw new Error('Evidence not found');
  }

  if (existing.isVerified) {
    throw new Error('Evidence has already been verified');
  }

  // Only update verification fields - original evidence remains immutable
  const evidence = await prisma.pol_evidence.update({
    where: { id: evidenceId },
    data: {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
      verificationNote,
    },
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'evidence',
    entityId: evidenceId,
    action: 'VERIFY',
    actorId: verifiedBy,
    partyId: existing.petition.partyId,
    changeNote: `Evidence verified: ${existing.title}`,
  });

  return {
    ...evidence,
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _verification_notice: 'Evidence verified - Original content preserved.',
  };
}

/**
 * Get evidence by ID.
 */
export async function getEvidence(tenantId: string, evidenceId: string) {
  const evidence = await prisma.pol_evidence.findFirst({
    where: { id: evidenceId, tenantId },
    include: {
      petition: { select: { id: true, title: true, partyId: true } },
    },
  });

  if (!evidence) return null;

  return {
    ...evidence,
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _immutability_notice: 'Evidence is APPEND-ONLY.',
  };
}

/**
 * List evidence for a petition.
 */
export async function listEvidence(
  tenantId: string,
  petitionId: string,
  filters: { type?: PolEvidenceType; isVerified?: boolean } = {}
) {
  const where: Record<string, unknown> = { tenantId, petitionId };

  if (filters.type) where.type = filters.type;
  if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;

  const evidence = await prisma.pol_evidence.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
  });

  return {
    data: evidence,
    total: evidence.length,
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _immutability_notice: 'Evidence records are APPEND-ONLY.',
  };
}
