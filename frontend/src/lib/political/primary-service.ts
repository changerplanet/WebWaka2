/**
 * Political Suite - Primary Service (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT AN OFFICIAL ELECTION
 * 
 * Authorization: January 8, 2026 (Checkpoint B Approved)
 * Classification: HIGH-RISK PHASE — HEIGHTENED CONTROLS
 * 
 * MANDATORY LABELS:
 * - UNOFFICIAL
 * - INTERNAL / PARTY-LEVEL ONLY  
 * - NOT INEC / NOT GOVERNMENT / NOT CERTIFICATION
 * 
 * ABSOLUTE PROHIBITIONS:
 * - No general election logic
 * - No voter register
 * - No biometrics
 * - No certification
 * - No INEC integration
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { logCreate, logUpdate, logStatusChange } from './audit-service';

// Re-export enums
export {
  PolPrimaryType,
  PolPrimaryStatus,
  PolVotingMethod,
} from '@prisma/client';

import type {
  PolPrimaryType,
  PolPrimaryStatus,
  PolVotingMethod,
} from '@prisma/client';

// MANDATORY DISCLAIMER - Must appear in all responses
const MANDATORY_DISCLAIMER = 'UNOFFICIAL - INTERNAL PARTY USE ONLY. NOT AN OFFICIAL ELECTION. NOT INEC-AFFILIATED. RESULTS HAVE NO LEGAL STANDING.';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CreatePrimaryInput {
  partyId: string;
  title: string;
  type: PolPrimaryType;
  description?: string;
  zone?: string;
  state?: string;
  constituency?: string;
  lga?: string;
  ward?: string;
  office: string;
  votingMethod?: PolVotingMethod;
  isSecretBallot?: boolean;
  maxVotesPerVoter?: number;
  nominationStart?: Date;
  nominationEnd?: Date;
  votingStart?: Date;
  votingEnd?: Date;
  voterEligibility?: string;
  candidateEligibility?: string;
  totalDelegates?: number;
  quorumRequired?: number;
}

export interface UpdatePrimaryInput {
  title?: string;
  description?: string;
  nominationStart?: Date;
  nominationEnd?: Date;
  votingStart?: Date;
  votingEnd?: Date;
  voterEligibility?: string;
  candidateEligibility?: string;
  totalDelegates?: number;
  delegatesPresent?: number;
  quorumRequired?: number;
  statusNote?: string;
}

export interface CreateAspirantInput {
  primaryId: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  phone: string;
  email?: string;
  biography?: string;
  photoUrl?: string;
}

export interface PrimaryFilters {
  partyId?: string;
  type?: PolPrimaryType;
  status?: PolPrimaryStatus;
  state?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// PRIMARY CRUD
// ----------------------------------------------------------------------------

/**
 * Create a party primary election.
 * INTERNAL PARTY USE ONLY — NOT an official election.
 */
export async function createPrimary(
  tenantId: string,
  input: CreatePrimaryInput,
  createdBy: string
) {
  // Validate party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  // Validate jurisdiction is provided (MANDATORY)
  if (!input.state && !input.zone) {
    throw new Error('Jurisdiction (state or zone) is required for primary elections');
  }

  const primary = await prisma.pol_primary.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      title: input.title,
      type: input.type,
      description: input.description,
      zone: input.zone,
      state: input.state,
      constituency: input.constituency,
      lga: input.lga,
      ward: input.ward,
      office: input.office,
      votingMethod: input.votingMethod || 'DIRECT',
      isSecretBallot: input.isSecretBallot ?? true,
      maxVotesPerVoter: input.maxVotesPerVoter || 1,
      nominationStart: input.nominationStart,
      nominationEnd: input.nominationEnd,
      votingStart: input.votingStart,
      votingEnd: input.votingEnd,
      voterEligibility: input.voterEligibility,
      candidateEligibility: input.candidateEligibility,
      totalDelegates: input.totalDelegates,
      quorumRequired: input.quorumRequired,
      disclaimer: MANDATORY_DISCLAIMER,
      createdBy,
    }),
  });

  await logCreate(tenantId, 'primary', primary.id, createdBy, undefined, {
    partyId: input.partyId,
    title: input.title,
    type: input.type,
    office: input.office,
    state: input.state,
  });

  return formatPrimary(primary);
}

/**
 * Update a primary election (ONLY allowed in DRAFT or SCHEDULED status).
 */
export async function updatePrimary(
  tenantId: string,
  primaryId: string,
  input: UpdatePrimaryInput,
  actorId: string
) {
  const existing = await prisma.pol_primary.findFirst({
    where: { id: primaryId, tenantId },
  });

  if (!existing) {
    throw new Error('Primary not found');
  }

  // Only allow updates in DRAFT or SCHEDULED status
  if (!['DRAFT', 'SCHEDULED'].includes(existing.status)) {
    throw new Error('Primary can only be updated in DRAFT or SCHEDULED status');
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

  const primary = await prisma.pol_primary.update({
    where: { id: primaryId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    await logUpdate(tenantId, 'primary', primaryId, actorId, changes);
  }

  return formatPrimary(primary);
}

/**
 * Get a primary election by ID.
 */
export async function getPrimary(tenantId: string, primaryId: string) {
  const primary = await prisma.pol_primary.findFirst({
    where: { id: primaryId, tenantId },
    include: {
      party: { select: { id: true, name: true, acronym: true } },
      aspirants: { where: { isActive: true }, orderBy: { ballotPosition: 'asc' } },
      _count: {
        select: {
          votes: true,
          results: true,
        },
      },
    },
  });

  if (!primary) return null;

  return formatPrimary(primary);
}

/**
 * List primary elections.
 */
export async function listPrimaries(
  tenantId: string,
  filters: PrimaryFilters = {}
) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;

  if (filters.fromDate || filters.toDate) {
    where.votingStart = {};
    if (filters.fromDate) (where.votingStart as Record<string, Date>).gte = filters.fromDate;
    if (filters.toDate) (where.votingStart as Record<string, Date>).lte = filters.toDate;
  }

  const [data, total] = await Promise.all([
    prisma.pol_primary.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
        _count: {
          select: {
            aspirants: true,
            votes: true,
          },
        },
      },
      orderBy: { votingStart: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_primary.count({ where }),
  ]);

  return {
    data: data.map(formatPrimary),
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
    _mandatory_notice: MANDATORY_DISCLAIMER,
  };
}

// ----------------------------------------------------------------------------
// PRIMARY STATUS TRANSITIONS
// ----------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<PolPrimaryStatus, PolPrimaryStatus[]> = {
  DRAFT: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['NOMINATION_OPEN', 'CANCELLED'],
  NOMINATION_OPEN: ['NOMINATION_CLOSED', 'CANCELLED'],
  NOMINATION_CLOSED: ['VOTING_OPEN', 'CANCELLED'],
  VOTING_OPEN: ['VOTING_CLOSED'],
  VOTING_CLOSED: ['COUNTING'],
  COUNTING: ['RESULTS_DECLARED'],
  RESULTS_DECLARED: [],  // Terminal state
  CANCELLED: [],  // Terminal state
};

/**
 * Transition primary to a new status.
 */
export async function transitionPrimaryStatus(
  tenantId: string,
  primaryId: string,
  newStatus: PolPrimaryStatus,
  actorId: string,
  statusNote?: string
) {
  const existing = await prisma.pol_primary.findFirst({
    where: { id: primaryId, tenantId },
  });

  if (!existing) {
    throw new Error('Primary not found');
  }

  const validNextStates = VALID_TRANSITIONS[existing.status];
  if (!validNextStates.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${existing.status} → ${newStatus}. ` +
      `Valid transitions: ${validNextStates.join(', ') || 'none (terminal state)'}`
    );
  }

  const primary = await prisma.pol_primary.update({
    where: { id: primaryId },
    data: {
      status: newStatus,
      statusNote,
    },
  });

  await logStatusChange(
    tenantId,
    'primary',
    primaryId,
    actorId,
    existing.status,
    newStatus
  );

  return formatPrimary(primary);
}

// ----------------------------------------------------------------------------
// ASPIRANT MANAGEMENT
// ----------------------------------------------------------------------------

/**
 * Add an aspirant to a primary.
 */
export async function addAspirant(
  tenantId: string,
  input: CreateAspirantInput,
  actorId: string
) {
  // Validate primary exists and is in nomination phase
  const primary = await prisma.pol_primary.findFirst({
    where: { id: input.primaryId, tenantId },
  });

  if (!primary) {
    throw new Error('Primary not found');
  }

  if (!['DRAFT', 'SCHEDULED', 'NOMINATION_OPEN'].includes(primary.status)) {
    throw new Error('Nominations are not open for this primary');
  }

  // Validate member exists if provided
  if (input.memberId) {
    const member = await prisma.pol_member.findFirst({
      where: { id: input.memberId, tenantId, partyId: primary.partyId },
    });
    if (!member) {
      throw new Error('Member not found in this party');
    }
  }

  // Get next ballot position
  const maxPosition = await prisma.pol_primary_aspirant.aggregate({
    where: { primaryId: input.primaryId },
    _max: { ballotPosition: true },
  });

  const aspirant = await prisma.pol_primary_aspirant.create({
    data: withPrismaDefaults({
      tenantId,
      primaryId: input.primaryId,
      memberId: input.memberId,
      firstName: input.firstName,
      lastName: input.lastName,
      otherNames: input.otherNames,
      phone: input.phone,
      email: input.email,
      biography: input.biography,
      photoUrl: input.photoUrl,
      nominatedBy: actorId,
      ballotPosition: (maxPosition._max.ballotPosition || 0) + 1,
    }),
  });

  await logCreate(tenantId, 'primary_aspirant', aspirant.id, actorId, undefined, {
    primaryId: input.primaryId,
    name: `${aspirant.firstName} ${aspirant.lastName}`,
  });

  return {
    ...aspirant,
    _notice: 'ASPIRANT ADDED - INTERNAL PARTY PRIMARY ONLY',
  };
}

/**
 * Screen an aspirant (Party-level screening).
 */
export async function screenAspirant(
  tenantId: string,
  aspirantId: string,
  actorId: string,
  passed: boolean,
  screeningNote?: string
) {
  const existing = await prisma.pol_primary_aspirant.findFirst({
    where: { id: aspirantId, tenantId },
    include: { primary: true },
  });

  if (!existing) {
    throw new Error('Aspirant not found');
  }

  if (existing.isScreened) {
    throw new Error('Aspirant has already been screened');
  }

  const aspirant = await prisma.pol_primary_aspirant.update({
    where: { id: aspirantId },
    data: {
      isScreened: true,
      screenedAt: new Date(),
      screenedBy: actorId,
      screeningNote,
      screeningPassed: passed,
      isActive: passed,
    },
  });

  await logUpdate(tenantId, 'primary_aspirant', aspirantId, actorId, {
    isScreened: { old: false, new: true },
    screeningPassed: { old: null, new: passed },
  });

  return {
    ...aspirant,
    _notice: 'SCREENING COMPLETE - PARTY-LEVEL ONLY - NOT OFFICIAL CERTIFICATION',
  };
}

/**
 * Clear an aspirant (Party-level clearance).
 */
export async function clearAspirant(
  tenantId: string,
  aspirantId: string,
  actorId: string,
  clearanceNote?: string
) {
  const existing = await prisma.pol_primary_aspirant.findFirst({
    where: { id: aspirantId, tenantId },
  });

  if (!existing) {
    throw new Error('Aspirant not found');
  }

  if (!existing.isScreened || !existing.screeningPassed) {
    throw new Error('Aspirant must pass screening before clearance');
  }

  if (existing.isCleared) {
    throw new Error('Aspirant has already been cleared');
  }

  const aspirant = await prisma.pol_primary_aspirant.update({
    where: { id: aspirantId },
    data: {
      isCleared: true,
      clearedAt: new Date(),
      clearedBy: actorId,
      clearanceNote,
    },
  });

  await logUpdate(tenantId, 'primary_aspirant', aspirantId, actorId, {
    isCleared: { old: false, new: true },
  });

  return {
    ...aspirant,
    _notice: 'CLEARANCE GRANTED - PARTY-LEVEL ONLY - NOT OFFICIAL CERTIFICATION',
  };
}

/**
 * List aspirants for a primary.
 */
export async function listAspirants(
  tenantId: string,
  primaryId: string,
  filters: {
    isScreened?: boolean;
    isCleared?: boolean;
    isActive?: boolean;
  } = {}
) {
  const where: Record<string, unknown> = { tenantId, primaryId };

  if (filters.isScreened !== undefined) where.isScreened = filters.isScreened;
  if (filters.isCleared !== undefined) where.isCleared = filters.isCleared;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const aspirants = await prisma.pol_primary_aspirant.findMany({
    where,
    include: {
      member: { select: { id: true, membershipNo: true } },
      _count: {
        select: { votes: true },
      },
    },
    orderBy: { ballotPosition: 'asc' },
  });

  return {
    data: aspirants,
    _mandatory_notice: MANDATORY_DISCLAIMER,
  };
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function formatPrimary(primary: {
  id: string;
  tenantId: string;
  partyId: string;
  title: string;
  type: PolPrimaryType;
  description: string | null;
  country: string;
  zone: string | null;
  state: string | null;
  constituency: string | null;
  lga: string | null;
  ward: string | null;
  office: string;
  votingMethod: PolVotingMethod;
  isSecretBallot: boolean;
  maxVotesPerVoter: number;
  nominationStart: Date | null;
  nominationEnd: Date | null;
  votingStart: Date | null;
  votingEnd: Date | null;
  status: PolPrimaryStatus;
  statusNote: string | null;
  voterEligibility: string | null;
  candidateEligibility: string | null;
  totalDelegates: number | null;
  delegatesPresent: number | null;
  quorumRequired: number | null;
  disclaimer: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  party?: { id: string; name: string; acronym: string } | null;
  aspirants?: unknown[];
  _count?: { votes?: number; results?: number; aspirants?: number };
}) {
  return {
    ...primary,
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _classification: 'INTERNAL PARTY PRIMARY - NOT AN OFFICIAL ELECTION',
    _legal_notice: 'Results have no legal standing. Not INEC-certified.',
  };
}
