/**
 * CIVIC SUITE: Voting Service
 * 
 * In-memory service for managing polls and elections.
 * For internal organizational use only.
 */

import {
  Poll,
  Vote,
  PollType,
  PollStatus,
  PollPosition,
  PollOption,
  PollCandidate,
} from './config';
import { getPollsStore, getVotesStore, getConstituentsStore } from './demo-data';
import crypto from 'crypto';

// ============================================================================
// POLL SERVICE
// ============================================================================

export async function getPolls(tenantId: string, options?: {
  status?: PollStatus;
  type?: PollType;
  page?: number;
  limit?: number;
}): Promise<{ polls: Poll[]; total: number; stats: PollStats }> {
  const store = getPollsStore();
  let filtered = store.filter((p: any) => p.tenantId === tenantId || tenantId === 'demo-civic');
  
  if (options?.status) {
    filtered = filtered.filter((p: any) => p.status === options.status);
  }
  
  if (options?.type) {
    filtered = filtered.filter((p: any) => p.pollType === options.type);
  }
  
  // Sort by voting start date
  filtered.sort((a: any, b: any) => new Date(b.votingStart).getTime() - new Date(a.votingStart).getTime());
  
  const total = filtered.length;
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);
  
  return {
    polls: paginated,
    total,
    stats: calculateStats(store.filter((p: any) => p.tenantId === tenantId || tenantId === 'demo-civic')),
  };
}

export async function getPollById(tenantId: string, id: string): Promise<Poll | null> {
  const store = getPollsStore();
  return store.find((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic')) || null;
}

export async function getActivePolls(tenantId: string): Promise<Poll[]> {
  const store = getPollsStore();
  const now = new Date().toISOString();
  
  return store.filter((p: any) => 
    (p.tenantId === tenantId || tenantId === 'demo-civic') &&
    p.status === 'ACTIVE' &&
    p.votingStart <= now &&
    p.votingEnd >= now
  );
}

export async function createPoll(tenantId: string, data: {
  pollType: PollType;
  title: string;
  description?: string;
  positions?: PollPosition[];
  options?: PollOption[];
  votingStart: string;
  votingEnd: string;
  createdBy: string;
}): Promise<Poll> {
  const store = getPollsStore();
  const constituents = getConstituentsStore();
  
  // Count eligible voters (active members)
  const eligibleVotersCount = constituents.filter((c: any) => 
    (c.tenantId === tenantId || tenantId === 'demo-civic') &&
    c.membershipStatus === 'ACTIVE'
  ).length;
  
  const newPoll: Poll = {
    id: `poll_${Date.now()}`,
    tenantId,
    pollType: data.pollType,
    title: data.title,
    description: data.description,
    positions: data.positions,
    options: data.options,
    votingStart: data.votingStart,
    votingEnd: data.votingEnd,
    eligibleVotersCount,
    status: 'DRAFT',
    totalVotes: 0,
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  store.push(newPoll);
  return newPoll;
}

export async function updatePoll(
  tenantId: string,
  id: string,
  data: Partial<Poll>
): Promise<Poll | null> {
  const store = getPollsStore();
  const index = store.findIndex((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  // Don't allow updates to active or closed polls
  if (['ACTIVE', 'CLOSED', 'RESULTS_DECLARED'].includes(store[index].status)) {
    throw new Error('Cannot update an active or closed poll');
  }
  
  store[index] = {
    ...store[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function schedulePoll(tenantId: string, id: string): Promise<Poll | null> {
  const store = getPollsStore();
  const index = store.findIndex((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'SCHEDULED',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function activatePoll(tenantId: string, id: string): Promise<Poll | null> {
  const store = getPollsStore();
  const index = store.findIndex((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function closePoll(tenantId: string, id: string): Promise<Poll | null> {
  const store = getPollsStore();
  const index = store.findIndex((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  // Calculate results
  const results = await calculatePollResults(id);
  
  store[index] = {
    ...store[index],
    status: 'CLOSED',
    results,
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function declareResults(tenantId: string, id: string): Promise<Poll | null> {
  const store = getPollsStore();
  const index = store.findIndex((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  if (store[index].status !== 'CLOSED') {
    throw new Error('Poll must be closed before declaring results');
  }
  
  store[index] = {
    ...store[index],
    status: 'RESULTS_DECLARED',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

export async function cancelPoll(tenantId: string, id: string): Promise<Poll | null> {
  const store = getPollsStore();
  const index = store.findIndex((p: any) => p.id === id && (p.tenantId === tenantId || tenantId === 'demo-civic'));
  
  if (index === -1) return null;
  
  store[index] = {
    ...store[index],
    status: 'CANCELLED',
    updatedAt: new Date().toISOString(),
  };
  
  return store[index];
}

// ============================================================================
// VOTING
// ============================================================================

export async function castVote(
  pollId: string,
  voterId: string,
  selections: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const pollStore = getPollsStore();
  const voteStore = getVotesStore();
  const constituents = getConstituentsStore();
  
  const poll = pollStore.find((p: any) => p.id === pollId);
  if (!poll) {
    return { success: false, message: 'Poll not found' };
  }
  
  if (poll.status !== 'ACTIVE') {
    return { success: false, message: 'Poll is not currently accepting votes' };
  }
  
  const now = new Date().toISOString();
  if (now < poll.votingStart || now > poll.votingEnd) {
    return { success: false, message: 'Voting is not open at this time' };
  }
  
  // Check if voter is eligible
  const voter = constituents.find((c: any) => c.id === voterId);
  if (!voter || voter.membershipStatus !== 'ACTIVE') {
    return { success: false, message: 'You are not eligible to vote in this poll' };
  }
  
  // Check if already voted
  const voterHash = hashVoterId(voterId, pollId);
  const existingVote = voteStore.find((v: Vote) => v.pollId === pollId && v.voterHash === voterHash);
  if (existingVote) {
    return { success: false, message: 'You have already voted in this poll' };
  }
  
  // Record the vote
  const vote: Vote = {
    id: `vote_${Date.now()}`,
    pollId,
    voterId: '', // Don't store actual voter ID for anonymity
    voterHash,
    selections,
    votedAt: new Date().toISOString(),
  };
  
  voteStore.push(vote);
  
  // Update poll vote count
  const pollIndex = pollStore.findIndex((p: any) => p.id === pollId);
  pollStore[pollIndex].totalVotes++;
  pollStore[pollIndex].updatedAt = new Date().toISOString();
  
  return { success: true, message: 'Your vote has been recorded' };
}

export async function hasVoted(pollId: string, voterId: string): Promise<boolean> {
  const voteStore = getVotesStore();
  const voterHash = hashVoterId(voterId, pollId);
  return voteStore.some((v: Vote) => v.pollId === pollId && v.voterHash === voterHash);
}

async function calculatePollResults(pollId: string): Promise<Record<string, number>> {
  const voteStore = getVotesStore();
  const votes = voteStore.filter((v: Vote) => v.pollId === pollId);
  
  const results: Record<string, number> = {};
  
  votes.forEach(vote => {
    Object.entries(vote.selections).forEach(([position, selection]) => {
      const key = `${position}:${selection}`;
      results[key] = (results[key] || 0) + 1;
    });
  });
  
  return results;
}

export async function getPollResults(tenantId: string, pollId: string): Promise<{
  poll: Poll;
  results: {
    position?: string;
    option?: string;
    candidate?: string;
    votes: number;
    percentage: number;
  }[];
  totalVotes: number;
  turnout: number;
} | null> {
  const poll = await getPollById(tenantId, pollId);
  if (!poll) return null;
  
  if (!['CLOSED', 'RESULTS_DECLARED'].includes(poll.status)) {
    throw new Error('Results are not available yet');
  }
  
  const rawResults = poll.results || {};
  const results: {
    position?: string;
    option?: string;
    candidate?: string;
    votes: number;
    percentage: number;
  }[] = [];
  
  Object.entries(rawResults).forEach(([key, votes]) => {
    const [position, selection] = key.split(':');
    const percentage = poll.totalVotes > 0 ? (votes / poll.totalVotes) * 100 : 0;
    
    if (poll.pollType === 'ELECTION' && poll.positions) {
      const positionConfig = poll.positions.find((p: any) => p.key === position);
      const candidate = positionConfig?.candidates.find((c: any) => c.id === selection);
      results.push({
        position: positionConfig?.title,
        candidate: candidate?.name,
        votes,
        percentage,
      });
    } else if (poll.options) {
      const option = poll.options.find((o: any) => o.key === selection);
      results.push({
        option: option?.label,
        votes,
        percentage,
      });
    }
  });
  
  const turnout = poll.eligibleVotersCount > 0 
    ? (poll.totalVotes / poll.eligibleVotersCount) * 100 
    : 0;
  
  return {
    poll,
    results,
    totalVotes: poll.totalVotes,
    turnout,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function hashVoterId(voterId: string, pollId: string): string {
  // Create a hash that can't be reversed to find the voter
  // but can verify if the same voter tries to vote again
  return crypto
    .createHash('sha256')
    .update(`${voterId}-${pollId}-civic-suite`)
    .digest('hex');
}

// ============================================================================
// STATISTICS
// ============================================================================

interface PollStats {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  totalVotesCast: number;
  avgTurnout: number;
  byType: Record<string, number>;
}

function calculateStats(polls: Poll[]): PollStats {
  const completed = polls.filter((p: any) => ['CLOSED', 'RESULTS_DECLARED'].includes(p.status));
  
  let totalTurnout = 0;
  completed.forEach((p: any) => {
    if (p.eligibleVotersCount > 0) {
      totalTurnout += (p.totalVotes / p.eligibleVotersCount) * 100;
    }
  });
  
  return {
    total: polls.length,
    active: polls.filter((p: any) => p.status === 'ACTIVE').length,
    scheduled: polls.filter((p: any) => p.status === 'SCHEDULED').length,
    completed: completed.length,
    cancelled: polls.filter((p: any) => p.status === 'CANCELLED').length,
    totalVotesCast: polls.reduce((sum: any, p: any) => sum + p.totalVotes, 0),
    avgTurnout: completed.length > 0 ? totalTurnout / completed.length : 0,
    byType: polls.reduce((acc: any, p: any) => {
      acc[p.pollType] = (acc[p.pollType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function getPollStats(tenantId: string): Promise<PollStats> {
  const store = getPollsStore();
  const filtered = store.filter((p: any) => p.tenantId === tenantId || tenantId === 'demo-civic');
  return calculateStats(filtered);
}
