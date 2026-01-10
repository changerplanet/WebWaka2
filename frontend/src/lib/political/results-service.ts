/**
 * Political Suite - Results Service (Phase 3)
 * INTERNAL PARTY USE ONLY — NOT AN OFFICIAL ELECTION
 * 
 * Authorization: January 8, 2026 (Checkpoint B Approved)
 * Classification: HIGH-RISK PHASE — HEIGHTENED CONTROLS
 * 
 * CRITICAL: Results are APPEND-ONLY. Once declared, cannot be modified.
 * 
 * MANDATORY LABELS (Must appear everywhere):
 * - UNOFFICIAL RESULT
 * - INTERNAL PARTY USE ONLY
 * - NOT INEC-CERTIFIED - NO LEGAL STANDING
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { createAuditLog } from './audit-service';
import { PolAuditAction } from './types';

// Re-export enums
export {
  PolResultStatus,
} from '@prisma/client';

import type {
  PolResultStatus,
} from '@prisma/client';

// MANDATORY DISCLAIMERS
const DISCLAIMER_1 = 'UNOFFICIAL RESULT';
const DISCLAIMER_2 = 'INTERNAL PARTY USE ONLY';
const DISCLAIMER_3 = 'NOT INEC-CERTIFIED - NO LEGAL STANDING';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface DeclareResultInput {
  primaryId: string;
  scope: 'OVERALL' | 'STATE' | 'LGA' | 'WARD';
  state?: string;
  lga?: string;
  ward?: string;
}

export interface ResultFilters {
  primaryId: string;
  scope?: string;
  status?: PolResultStatus;
  state?: string;
  lga?: string;
  ward?: string;
}

// ----------------------------------------------------------------------------
// RESULT DECLARATION (APPEND-ONLY)
// ----------------------------------------------------------------------------

/**
 * Compute and declare results for a primary.
 * CRITICAL: Results are APPEND-ONLY. Once declared, cannot be modified.
 * Results are UNOFFICIAL and for INTERNAL PARTY USE ONLY.
 */
export async function declareResults(
  tenantId: string,
  input: DeclareResultInput,
  declaredBy: string
) {
  // Validate primary exists and is in correct status
  const primary = await prisma.pol_primary.findFirst({
    where: { id: input.primaryId, tenantId },
  });

  if (!primary) {
    throw new Error('Primary not found');
  }

  if (!['VOTING_CLOSED', 'COUNTING', 'RESULTS_DECLARED'].includes(primary.status)) {
    throw new Error('Primary must be in VOTING_CLOSED, COUNTING, or RESULTS_DECLARED status to declare results');
  }

  // JURISDICTION VALIDATION
  if (input.scope === 'STATE' && !input.state) {
    throw new Error('State is required for STATE scope results');
  }
  if (input.scope === 'LGA' && (!input.state || !input.lga)) {
    throw new Error('State and LGA are required for LGA scope results');
  }
  if (input.scope === 'WARD' && (!input.state || !input.lga || !input.ward)) {
    throw new Error('State, LGA, and Ward are required for WARD scope results');
  }

  // Check if results already exist for this scope
  const existingResults = await prisma.pol_primary_result.findFirst({
    where: {
      tenantId,
      primaryId: input.primaryId,
      scope: input.scope,
      state: input.state || null,
      lga: input.lga || null,
      ward: input.ward || null,
    },
  });

  if (existingResults) {
    throw new Error(
      `Results have already been declared for this scope. ` +
      `Results are APPEND-ONLY and cannot be modified.`
    );
  }

  // Build vote query filter
  const voteWhere: Record<string, unknown> = {
    tenantId,
    primaryId: input.primaryId,
    status: 'CAST',
  };

  if (input.state) voteWhere.state = input.state;
  if (input.lga) voteWhere.lga = input.lga;
  if (input.ward) voteWhere.ward = input.ward;

  // Count total votes
  const totalVotes = await prisma.pol_internal_vote.aggregate({
    where: voteWhere,
    _sum: { voteWeight: true },
  });

  const totalVoteCount = totalVotes._sum.voteWeight || 0;

  if (totalVoteCount === 0) {
    throw new Error('No votes found for this scope');
  }

  // Get votes by aspirant
  const votesByAspirant = await prisma.pol_internal_vote.groupBy({
    by: ['aspirantId'],
    where: voteWhere,
    _sum: { voteWeight: true },
  });

  // Sort by votes descending
  const sortedResults = votesByAspirant
    .map((v: { aspirantId: string; _sum: { voteWeight: number | null } }) => ({
      aspirantId: v.aspirantId,
      votes: v._sum.voteWeight || 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  // Create result records (APPEND-ONLY)
  const results = await Promise.all(
    sortedResults.map(async (result: any, index) => {
      const percentage = (result.votes / totalVoteCount) * 100;
      const isWinner = index === 0;

      return prisma.pol_primary_result.create({
        data: withPrismaDefaults({
          tenantId,
          primaryId: input.primaryId,
          aspirantId: result.aspirantId,
          scope: input.scope,
          state: input.state,
          lga: input.lga,
          ward: input.ward,
          votesReceived: result.votes,
          votePercentage: new Decimal(percentage.toFixed(2)),
          position: index + 1,
          status: 'DECLARED',
          declaredAt: new Date(),
          declaredBy,
          isWinner,
          disclaimer1: DISCLAIMER_1,
          disclaimer2: DISCLAIMER_2,
          disclaimer3: DISCLAIMER_3,
          recordedBy: declaredBy,
        }),
      });
    })
  );

  // Update primary status to RESULTS_DECLARED if overall results declared
  if (input.scope === 'OVERALL' && primary.status !== 'RESULTS_DECLARED') {
    await prisma.pol_primary.update({
      where: { id: input.primaryId },
      data: { status: 'RESULTS_DECLARED' },
    });
  }

  // Audit log
  await createAuditLog(tenantId, {
    action: PolAuditAction.CERTIFY,
    entityType: 'primary_result',
    entityId: input.primaryId,
    actorId: declaredBy,
    description: `Results declared for ${input.scope} scope`,
    metadata: {
      scope: input.scope,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      totalVotes: totalVoteCount,
      resultCount: results.length,
    },
    state: input.state,
    lga: input.lga,
    ward: input.ward,
  });

  // Get aspirant details for response
  const aspirantIds = results.map((r: any) => r.aspirantId);
  const aspirants = await prisma.pol_primary_aspirant.findMany({
    where: { id: { in: aspirantIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const aspirantMap = new Map(aspirants.map((a: any) => [a.id, a]));

  return {
    primaryId: input.primaryId,
    scope: input.scope,
    jurisdiction: {
      state: input.state,
      lga: input.lga,
      ward: input.ward,
    },
    totalVotes: totalVoteCount,
    results: results.map((r: any) => {
      const aspirant = aspirantMap.get(r.aspirantId);
      return {
        position: r.position,
        aspirantId: r.aspirantId,
        aspirantName: aspirant ? `${aspirant.firstName} ${aspirant.lastName}` : 'Unknown',
        votesReceived: r.votesReceived,
        votePercentage: r.votePercentage.toNumber(),
        isWinner: r.isWinner,
      };
    }),
    declaredAt: new Date().toISOString(),
    declaredBy,
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _mandatory_notice: 'UNOFFICIAL - INTERNAL PARTY USE ONLY - NOT INEC-CERTIFIED - NO LEGAL STANDING',
    _immutability_notice: 'These results are APPEND-ONLY and cannot be modified.',
  };
}

// ----------------------------------------------------------------------------
// RESULT QUERIES (READ-ONLY)
// ----------------------------------------------------------------------------

/**
 * Get declared results for a primary.
 */
export async function getResults(
  tenantId: string,
  filters: ResultFilters
) {
  const where: Record<string, unknown> = {
    tenantId,
    primaryId: filters.primaryId,
  };

  if (filters.scope) where.scope = filters.scope;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;
  if (filters.lga) where.lga = filters.lga;
  if (filters.ward) where.ward = filters.ward;

  const results = await prisma.pol_primary_result.findMany({
    where,
    include: {
      aspirant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
    orderBy: [{ scope: 'asc' }, { position: 'asc' }],
  });

  return {
    data: results.map((r: any) => ({
      ...r,
      votePercentage: r.votePercentage.toNumber(),
    })),
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _mandatory_notice: 'UNOFFICIAL - INTERNAL PARTY USE ONLY - NOT INEC-CERTIFIED - NO LEGAL STANDING',
  };
}

/**
 * Get the winner of a primary (if declared).
 */
export async function getWinner(
  tenantId: string,
  primaryId: string
) {
  const winner = await prisma.pol_primary_result.findFirst({
    where: {
      tenantId,
      primaryId,
      scope: 'OVERALL',
      isWinner: true,
      status: 'DECLARED',
    },
    include: {
      aspirant: true,
      primary: {
        select: {
          title: true,
          office: true,
          state: true,
          party: { select: { name: true, acronym: true } },
        },
      },
    },
  });

  if (!winner) {
    return {
      winner: null,
      _notice: 'No winner declared for this primary',
      _mandatory_notice: 'UNOFFICIAL - INTERNAL PARTY USE ONLY',
    };
  }

  return {
    winner: {
      aspirant: {
        id: winner.aspirant.id,
        name: `${winner.aspirant.firstName} ${winner.aspirant.lastName}`,
        photoUrl: winner.aspirant.photoUrl,
      },
      votesReceived: winner.votesReceived,
      votePercentage: winner.votePercentage.toNumber(),
      primary: winner.primary,
      declaredAt: winner.declaredAt,
    },
    _disclaimer1: DISCLAIMER_1,
    _disclaimer2: DISCLAIMER_2,
    _disclaimer3: DISCLAIMER_3,
    _mandatory_notice: 'UNOFFICIAL WINNER - INTERNAL PARTY USE ONLY - NOT INEC-CERTIFIED - NO LEGAL STANDING',
    _legal_notice: 'This result has no legal standing. Not an official election outcome.',
  };
}

/**
 * Challenge a result (marks as challenged, does NOT modify the result).
 */
export async function challengeResult(
  tenantId: string,
  resultId: string,
  challengedBy: string,
  challengeNote: string
) {
  const existing = await prisma.pol_primary_result.findFirst({
    where: { id: resultId, tenantId },
  });

  if (!existing) {
    throw new Error('Result not found');
  }

  if (existing.isChallenged) {
    throw new Error('Result has already been challenged');
  }

  // Note: We update challenge flag but original result data remains immutable
  const result = await prisma.pol_primary_result.update({
    where: { id: resultId },
    data: {
      isChallenged: true,
      challengeNote,
      status: 'CHALLENGED',
    },
  });

  await createAuditLog(tenantId, {
    action: PolAuditAction.STATUS_CHANGE,
    entityType: 'primary_result',
    entityId: resultId,
    actorId: challengedBy,
    description: 'Result challenged',
    metadata: { challengeNote },
  });

  return {
    id: result.id,
    status: result.status,
    isChallenged: result.isChallenged,
    _notice: 'Result challenged - Original data preserved. Subject to review.',
    _mandatory_notice: DISCLAIMER_1 + ' - ' + DISCLAIMER_2,
  };
}
