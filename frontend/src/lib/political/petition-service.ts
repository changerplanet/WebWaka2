/**
 * Political Suite - Petition Service (Phase 4)
 * INTERNAL PARTY GRIEVANCE HANDLING ONLY
 * 
 * Authorization: January 8, 2026 (Checkpoint C Approved)
 * Classification: GOVERNANCE & POST-ELECTION
 * 
 * MANDATORY LABELS:
 * - INTERNAL PARTY GRIEVANCE
 * - NOT A LEGAL PROCEEDING
 * - NO OFFICIAL STANDING
 * 
 * CONSTRAINTS:
 * - No payment/financial execution
 * - No official election certification
 * - No INEC integration
 * - Evidence is APPEND-ONLY
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { createGovernanceAudit } from './governance-audit-service';

// Re-export enums
export {
  PolPetitionType,
  PolPetitionStatus,
} from '@prisma/client';

import type {
  PolPetitionType,
  PolPetitionStatus,
} from '@prisma/client';

// MANDATORY DISCLAIMERS
const DISCLAIMER_1 = 'INTERNAL PARTY GRIEVANCE';
const DISCLAIMER_2 = 'NOT A LEGAL PROCEEDING';
const DISCLAIMER_3 = 'NO OFFICIAL STANDING';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreatePetitionInput {
  partyId: string;
  type: PolPetitionType;
  title: string;
  description: string;
  primaryId?: string;
  campaignId?: string;
  state?: string;
  lga?: string;
  ward?: string;
  petitionerId: string;
  petitionerName: string;
  petitionerRole?: string;
  respondentId?: string;
  respondentName?: string;
  incidentDate?: Date;
}

export interface UpdatePetitionInput {
  title?: string;
  description?: string;
  respondentId?: string;
  respondentName?: string;
  incidentDate?: Date;
}

export interface PetitionFilters {
  partyId?: string;
  type?: PolPetitionType;
  status?: PolPetitionStatus;
  petitionerId?: string;
  state?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// PETITION CRUD
// ----------------------------------------------------------------------------

/**
 * Create a petition/grievance.
 * INTERNAL PARTY USE ONLY — NOT a legal proceeding.
 */
export async function createPetition(
  tenantId: string,
  input: CreatePetitionInput,
  createdBy: string
) {
  // Validate party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  // Validate petitioner is a party member
  const member = await prisma.pol_member.findFirst({
    where: { id: input.petitionerId, tenantId, partyId: input.partyId },
  });

  if (!member) {
    throw new Error('Petitioner must be a party member');
  }

  const petition = await prisma.pol_petition.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      type: input.type,
      title: input.title,
      description: input.description,
      primaryId: input.primaryId,
      campaignId: input.campaignId,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      petitionerId: input.petitionerId,
      petitionerName: input.petitionerName,
      petitionerRole: input.petitionerRole,
      respondentId: input.respondentId,
      respondentName: input.respondentName,
      incidentDate: input.incidentDate,
      disclaimer1: DISCLAIMER_1,
      disclaimer2: DISCLAIMER_2,
      disclaimer3: DISCLAIMER_3,
      createdBy,
    }),
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'petition',
    entityId: petition.id,
    action: 'CREATE',
    actorId: createdBy,
    partyId: input.partyId,
    state: input.state,
    changeNote: `Petition created: ${input.title}`,
  });

  return formatPetition(petition);
}

/**
 * Update a petition (only in DRAFT status).
 */
export async function updatePetition(
  tenantId: string,
  petitionId: string,
  input: UpdatePetitionInput,
  actorId: string
) {
  const existing = await prisma.pol_petition.findFirst({
    where: { id: petitionId, tenantId },
  });

  if (!existing) {
    throw new Error('Petition not found');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Petition can only be updated in DRAFT status');
  }

  const petition = await prisma.pol_petition.update({
    where: { id: petitionId },
    data: input,
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'petition',
    entityId: petitionId,
    action: 'UPDATE',
    actorId,
    partyId: existing.partyId,
    changeNote: 'Petition updated',
  });

  return formatPetition(petition);
}

/**
 * Submit a petition for review.
 */
export async function submitPetition(
  tenantId: string,
  petitionId: string,
  actorId: string
) {
  const existing = await prisma.pol_petition.findFirst({
    where: { id: petitionId, tenantId },
  });

  if (!existing) {
    throw new Error('Petition not found');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only DRAFT petitions can be submitted');
  }

  // Verify actor is the petitioner
  if (existing.petitionerId !== actorId && existing.createdBy !== actorId) {
    throw new Error('Only the petitioner can submit this petition');
  }

  const petition = await prisma.pol_petition.update({
    where: { id: petitionId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'petition',
    entityId: petitionId,
    action: 'SUBMIT',
    actorId,
    partyId: existing.partyId,
    previousState: JSON.stringify({ status: 'DRAFT' }),
    newState: JSON.stringify({ status: 'SUBMITTED' }),
    changeNote: 'Petition submitted for review',
  });

  return formatPetition(petition);
}

/**
 * Transition petition status.
 */
export async function transitionPetitionStatus(
  tenantId: string,
  petitionId: string,
  newStatus: PolPetitionStatus,
  actorId: string,
  note?: string
) {
  const existing = await prisma.pol_petition.findFirst({
    where: { id: petitionId, tenantId },
  });

  if (!existing) {
    throw new Error('Petition not found');
  }

  const validTransitions: Record<PolPetitionStatus, PolPetitionStatus[]> = {
    DRAFT: ['SUBMITTED', 'WITHDRAWN'],
    SUBMITTED: ['UNDER_REVIEW', 'WITHDRAWN'],
    UNDER_REVIEW: ['EVIDENCE_REQUESTED', 'HEARING_SCHEDULED', 'DECIDED', 'CLOSED'],
    EVIDENCE_REQUESTED: ['UNDER_REVIEW', 'CLOSED'],
    HEARING_SCHEDULED: ['DECIDED', 'CLOSED'],
    DECIDED: ['APPEALED', 'CLOSED'],
    APPEALED: ['UNDER_REVIEW', 'CLOSED'],
    CLOSED: [],
    WITHDRAWN: [],
  };

  const allowed = validTransitions[existing.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition: ${existing.status} → ${newStatus}. ` +
      `Valid: ${allowed.join(', ') || 'none (terminal state)'}`
    );
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  
  if (newStatus === 'UNDER_REVIEW' && !existing.reviewStartedAt) {
    updateData.reviewStartedAt = new Date();
  }

  const petition = await prisma.pol_petition.update({
    where: { id: petitionId },
    data: updateData,
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'petition',
    entityId: petitionId,
    action: 'STATUS_CHANGE',
    actorId,
    partyId: existing.partyId,
    previousState: JSON.stringify({ status: existing.status }),
    newState: JSON.stringify({ status: newStatus }),
    changeNote: note || `Status changed to ${newStatus}`,
  });

  return formatPetition(petition);
}

/**
 * Decide on a petition.
 */
export async function decidePetition(
  tenantId: string,
  petitionId: string,
  decision: string,
  isUpheld: boolean,
  decidedBy: string
) {
  const existing = await prisma.pol_petition.findFirst({
    where: { id: petitionId, tenantId },
  });

  if (!existing) {
    throw new Error('Petition not found');
  }

  if (!['UNDER_REVIEW', 'HEARING_SCHEDULED'].includes(existing.status)) {
    throw new Error('Petition must be UNDER_REVIEW or HEARING_SCHEDULED to decide');
  }

  const petition = await prisma.pol_petition.update({
    where: { id: petitionId },
    data: {
      status: 'DECIDED',
      decision,
      isUpheld,
      decidedBy,
      decidedAt: new Date(),
    },
  });

  await createGovernanceAudit(tenantId, {
    entityType: 'petition',
    entityId: petitionId,
    action: 'DECIDE',
    actorId: decidedBy,
    partyId: existing.partyId,
    newState: JSON.stringify({ decision, isUpheld }),
    changeNote: `Petition ${isUpheld ? 'UPHELD' : 'DISMISSED'}`,
  });

  return formatPetition(petition);
}

/**
 * Get a petition by ID.
 */
export async function getPetition(tenantId: string, petitionId: string) {
  const petition = await prisma.pol_petition.findFirst({
    where: { id: petitionId, tenantId },
    include: {
      party: { select: { id: true, name: true, acronym: true } },
      primary: { select: { id: true, title: true } },
      campaign: { select: { id: true, name: true } },
      evidence: { orderBy: { submittedAt: 'desc' } },
      _count: { select: { evidence: true, auditLogs: true } },
    },
  });

  if (!petition) return null;

  return formatPetition(petition);
}

/**
 * List petitions.
 */
export async function listPetitions(
  tenantId: string,
  filters: PetitionFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.petitionerId) where.petitionerId = filters.petitionerId;
  if (filters.state) where.state = filters.state;

  if (filters.fromDate || filters.toDate) {
    where.submittedAt = {};
    if (filters.fromDate) (where.submittedAt as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.submittedAt as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_petition.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
        _count: { select: { evidence: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_petition.count({ where }),
  ]);

  return {
    data: data.map(formatPetition),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
  };
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function formatPetition(petition: Record<string, unknown>) {
  return {
    ...petition,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _mandatory_notice: 'INTERNAL PARTY GRIEVANCE - NOT A LEGAL PROCEEDING - NO OFFICIAL STANDING',
  };
}
