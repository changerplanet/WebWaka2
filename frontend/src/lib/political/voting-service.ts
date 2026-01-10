/**
 * Political Suite - Voting Service (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT A PUBLIC ELECTION
 * 
 * Authorization: January 8, 2026 (Checkpoint B Approved)
 * Classification: HIGH-RISK PHASE — HEIGHTENED CONTROLS
 * 
 * CRITICAL: Votes are APPEND-ONLY. Once cast, cannot be modified or deleted.
 * 
 * MANDATORY LABELS:
 * - UNOFFICIAL
 * - INTERNAL / PARTY-LEVEL ONLY
 * - NOT INEC / NOT GOVERNMENT / NOT CERTIFICATION
 * 
 * CONFLICT-OF-INTEREST CONTROL:
 * - No actor may vote and administer the same primary.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { logCreate, createAuditLog } from './audit-service';
import { PolAuditAction } from './types';

// Re-export enums
export {
  PolVoteStatus,
} from '@prisma/client';

import type {
  PolVoteStatus,
} from '@prisma/client';

// MANDATORY DISCLAIMER
const MANDATORY_DISCLAIMER = 'INTERNAL PARTY VOTE - UNOFFICIAL - NOT A PUBLIC ELECTION';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface CastVoteInput {
  primaryId: string;
  aspirantId: string;
  voterId: string;  // Party member ID - NOT a public voter ID
  voterDelegate?: string;
  voteWeight?: number;
  state?: string;
  lga?: string;
  ward?: string;
  pollingPoint?: string;
  captureMethod?: string;
}

export interface VoteQueryFilters {
  primaryId: string;
  aspirantId?: string;
  voterId?: string;
  state?: string;
  lga?: string;
  ward?: string;
  status?: PolVoteStatus;
  limit?: number;
  offset?: number;
}

// ----------------------------------------------------------------------------
// VOTE CASTING (APPEND-ONLY)
// ----------------------------------------------------------------------------

/**
 * Cast a vote in a party primary.
 * CRITICAL: This is APPEND-ONLY. Votes cannot be modified or deleted.
 * This is for INTERNAL PARTY voting only. NOT a public election.
 * 
 * CONFLICT-OF-INTEREST: The capturedBy actor cannot be the same as the voter.
 */
export async function castVote(
  tenantId: string,
  input: CastVoteInput,
  capturedBy: string
) {
  // CONFLICT-OF-INTEREST CHECK
  if (capturedBy === input.voterId) {
    throw new Error(
      'CONFLICT OF INTEREST: The person capturing the vote cannot be the voter. ' +
      'Votes must be captured by an authorized poll official.'
    );
  }

  // Validate primary exists and is in voting phase
  const primary = await prisma.pol_primary.findFirst({
    where: { id: input.primaryId, tenantId },
  });

  if (!primary) {
    throw new Error('Primary not found');
  }

  if (primary.status !== 'VOTING_OPEN') {
    throw new Error('Voting is not open for this primary');
  }

  // JURISDICTION HARD-SCOPING: Validate vote jurisdiction matches primary
  if (input.state && primary.state && input.state !== primary.state) {
    throw new Error(
      `JURISDICTION VIOLATION: Vote state (${input.state}) does not match primary state (${primary.state})`
    );
  }

  // Validate aspirant exists and is cleared
  const aspirant = await prisma.pol_primary_aspirant.findFirst({
    where: {
      id: input.aspirantId,
      tenantId,
      primaryId: input.primaryId,
      isCleared: true,
      isActive: true,
    },
  });

  if (!aspirant) {
    throw new Error('Aspirant not found, not cleared, or not active');
  }

  // Check if voter has already voted (prevent double voting)
  const existingVote = await prisma.pol_internal_vote.findFirst({
    where: {
      tenantId,
      primaryId: input.primaryId,
      voterId: input.voterId,
      status: 'CAST',
    },
  });

  if (existingVote) {
    // Check max votes per voter
    const voteCount = await prisma.pol_internal_vote.count({
      where: {
        tenantId,
        primaryId: input.primaryId,
        voterId: input.voterId,
        status: 'CAST',
      },
    });

    if (voteCount >= primary.maxVotesPerVoter) {
      throw new Error(
        `Voter has already cast maximum allowed votes (${primary.maxVotesPerVoter}) in this primary`
      );
    }
  }

  // Validate voter is a party member (NOT a voter register check)
  const member = await prisma.pol_member.findFirst({
    where: {
      id: input.voterId,
      tenantId,
      partyId: primary.partyId,
      status: 'VERIFIED',
    },
  });

  if (!member) {
    throw new Error('Voter must be a verified party member');
  }

  // Cast the vote (APPEND-ONLY)
  const vote = await prisma.pol_internal_vote.create({
    data: withPrismaDefaults({
      tenantId,
      primaryId: input.primaryId,
      aspirantId: input.aspirantId,
      voterId: input.voterId,
      voterDelegate: input.voterDelegate,
      voteWeight: input.voteWeight || 1,
      state: input.state || primary.state,
      lga: input.lga || primary.lga,
      ward: input.ward || primary.ward,
      pollingPoint: input.pollingPoint,
      capturedBy,
      captureMethod: input.captureMethod || 'MANUAL',
      disclaimer: MANDATORY_DISCLAIMER,
    }),
  });

  // Log to audit trail (separate from vote record for immutability)
  await createAuditLog(tenantId, {
    action: PolAuditAction.CREATE,
    entityType: 'internal_vote',
    entityId: vote.id,
    actorId: capturedBy,
    description: 'Vote cast in party primary',
    metadata: {
      primaryId: input.primaryId,
      state: vote.state,
      lga: vote.lga,
      ward: vote.ward,
      // Note: We do NOT log voterId or aspirantId to preserve ballot secrecy
      // Only the fact that a vote was cast is logged
    },
    state: vote.state || undefined,
    lga: vote.lga || undefined,
    ward: vote.ward || undefined,
  });

  return {
    id: vote.id,
    primaryId: vote.primaryId,
    status: vote.status,
    capturedAt: vote.capturedAt,
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _legal_notice: 'This vote is for internal party use only. Not a public election.',
    // Note: We do NOT return voterId or aspirantId to preserve ballot secrecy
  };
}

// ----------------------------------------------------------------------------
// VOTE QUERIES (READ-ONLY, Aggregated Only)
// ----------------------------------------------------------------------------

/**
 * Get vote counts for a primary (aggregated, no individual voter data).
 * This is for internal party use only.
 */
export async function getVoteCounts(
  tenantId: string,
  primaryId: string,
  scope?: { state?: string; lga?: string; ward?: string }
) {
  const where: Record<string, unknown> = {
    tenantId,
    primaryId,
    status: 'CAST',
  };

  if (scope?.state) where.state = scope.state;
  if (scope?.lga) where.lga = scope.lga;
  if (scope?.ward) where.ward = scope.ward;

  // Get total votes
  const totalVotes = await prisma.pol_internal_vote.aggregate({
    where,
    _sum: { voteWeight: true },
    _count: true,
  });

  // Get votes by aspirant
  const votesByAspirant = await prisma.pol_internal_vote.groupBy({
    by: ['aspirantId'],
    where,
    _sum: { voteWeight: true },
    _count: true,
  });

  // Get aspirant details
  const aspirantIds = votesByAspirant.map((v: string) => v.aspirantId);
  const aspirants = await prisma.pol_primary_aspirant.findMany({
    where: { id: { in: aspirantIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      ballotPosition: true,
    },
  });

  const aspirantMap = new Map(aspirants.map((a: any) => [a.id, a]));

  return {
    primaryId,
    scope: scope || 'OVERALL',
    totalVotes: totalVotes._sum.voteWeight || 0,
    totalBallots: totalVotes._count,
    byAspirant: votesByAspirant.map((v: string) => {
      const aspirant = aspirantMap.get(v.aspirantId);
      return {
        aspirantId: v.aspirantId,
        aspirantName: aspirant ? `${aspirant.firstName} ${aspirant.lastName}` : 'Unknown',
        ballotPosition: aspirant?.ballotPosition,
        votes: v._sum.voteWeight || 0,
        ballots: v._count,
        percentage: totalVotes._sum.voteWeight
          ? (((v._sum.voteWeight || 0) / totalVotes._sum.voteWeight) * 100).toFixed(2)
          : '0.00',
      };
    }).sort((a: any, b: any) => (b.votes as number) - (a.votes as number)),
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _classification: 'UNOFFICIAL VOTE COUNT - INTERNAL PARTY USE ONLY',
    _legal_notice: 'These counts are provisional and have no legal standing.',
  };
}

/**
 * Get vote statistics by jurisdiction.
 */
export async function getVoteStatsByJurisdiction(
  tenantId: string,
  primaryId: string
) {
  const where = { tenantId, primaryId, status: 'CAST' as const };

  const [byState, byLga, byWard, total] = await Promise.all([
    prisma.pol_internal_vote.groupBy({
      by: ['state'],
      where: { ...where, state: { not: null } },
      _sum: { voteWeight: true },
      _count: true,
    }),
    prisma.pol_internal_vote.groupBy({
      by: ['lga'],
      where: { ...where, lga: { not: null } },
      _sum: { voteWeight: true },
      _count: true,
    }),
    prisma.pol_internal_vote.groupBy({
      by: ['ward'],
      where: { ...where, ward: { not: null } },
      _sum: { voteWeight: true },
      _count: true,
    }),
    prisma.pol_internal_vote.aggregate({
      where,
      _sum: { voteWeight: true },
      _count: true,
    }),
  ]);

  return {
    primaryId,
    totalVotes: total._sum.voteWeight || 0,
    totalBallots: total._count,
    byState: byState.reduce((acc: any, item: any) => {
      if (item.state) {
        acc[item.state] = { votes: item._sum.voteWeight || 0, ballots: item._count };
      }
      return acc;
    }, {} as Record<string, { votes: number; ballots: number }>),
    byLga: byLga.reduce((acc: any, item: any) => {
      if (item.lga) {
        acc[item.lga] = { votes: item._sum.voteWeight || 0, ballots: item._count };
      }
      return acc;
    }, {} as Record<string, { votes: number; ballots: number }>),
    byWard: byWard.reduce((acc: any, item: any) => {
      if (item.ward) {
        acc[item.ward] = { votes: item._sum.voteWeight || 0, ballots: item._count };
      }
      return acc;
    }, {} as Record<string, { votes: number; ballots: number }>),
    _mandatory_notice: MANDATORY_DISCLAIMER,
    _legal_notice: 'Statistics are unofficial and for internal party use only.',
  };
}

/**
 * Challenge a vote (marks as challenged, does NOT delete).
 */
export async function challengeVote(
  tenantId: string,
  voteId: string,
  challengedBy: string,
  challengeNote: string
) {
  const existing = await prisma.pol_internal_vote.findFirst({
    where: { id: voteId, tenantId },
  });

  if (!existing) {
    throw new Error('Vote not found');
  }

  if (existing.isChallenged) {
    throw new Error('Vote has already been challenged');
  }

  // Note: We update challenge fields but the original vote data remains immutable
  const vote = await prisma.pol_internal_vote.update({
    where: { id: voteId },
    data: {
      isChallenged: true,
      challengeNote,
      challengedBy,
      challengedAt: new Date(),
      status: 'CHALLENGED',
    },
  });

  await createAuditLog(tenantId, {
    action: PolAuditAction.STATUS_CHANGE,
    entityType: 'internal_vote',
    entityId: voteId,
    actorId: challengedBy,
    description: 'Vote challenged',
    metadata: { challengeNote },
  });

  return {
    id: vote.id,
    status: vote.status,
    isChallenged: vote.isChallenged,
    _notice: 'Vote challenged - Will be reviewed. Original vote data preserved.',
  };
}
