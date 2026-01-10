/**
 * Political Suite - Campaign Service
 * Phase 1: Party & Campaign Operations
 * 
 * Authorization: January 8, 2026
 * Classification: HIGH-RISK VERTICAL
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateCandidateInput,
  UpdateCandidateInput,
  CampaignQueryFilters,
  PolCampaignStatus,
  PolCandidateStatus,
} from './types';
import { logCreate, logUpdate, logStatusChange, logVerify } from './audit-service';

// ----------------------------------------------------------------------------
// CAMPAIGN CRUD
// ----------------------------------------------------------------------------

export async function createCampaign(
  tenantId: string,
  input: CreateCampaignInput,
  actorId: string
) {
  // Verify party exists
  const party = await prisma.pol_party.findFirst({
    where: { id: input.partyId, tenantId },
  });

  if (!party) {
    throw new Error('Party not found');
  }

  const campaign = await prisma.pol_campaign.create({
    data: withPrismaDefaults({
      tenantId,
      partyId: input.partyId,
      name: input.name,
      description: input.description,
      type: input.type,
      zone: input.zone,
      state: input.state,
      constituency: input.constituency,
      lga: input.lga,
      ward: input.ward,
      startDate: input.startDate,
      endDate: input.endDate,
      electionDate: input.electionDate,
      headquarters: input.headquarters,
      phone: input.phone,
      email: input.email,
      website: input.website,
      facebookUrl: input.facebookUrl,
      twitterUrl: input.twitterUrl,
      instagramUrl: input.instagramUrl,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'campaign', campaign.id, actorId, undefined, {
    partyId: input.partyId,
    name: campaign.name,
    type: campaign.type,
    state: campaign.state,
  });

  return campaign;
}

export async function updateCampaign(
  tenantId: string,
  campaignId: string,
  input: UpdateCampaignInput,
  actorId: string
) {
  const existing = await prisma.pol_campaign.findFirst({
    where: { id: campaignId, tenantId },
  });

  if (!existing) {
    throw new Error('Campaign not found');
  }

  // Prevent updates if campaign is completed or cancelled
  if (
    existing.status === PolCampaignStatus.COMPLETED ||
    existing.status === PolCampaignStatus.CANCELLED
  ) {
    throw new Error('Cannot update a completed or cancelled campaign');
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

  const campaign = await prisma.pol_campaign.update({
    where: { id: campaignId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        'campaign',
        campaignId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, 'campaign', campaignId, actorId, changes);
    }
  }

  return campaign;
}

export async function getCampaign(tenantId: string, campaignId: string) {
  const campaign = await prisma.pol_campaign.findFirst({
    where: { id: campaignId, tenantId },
    include: {
      party: true,
      candidates: true,
      _count: {
        select: {
          events: true,
          volunteers: true,
        },
      },
    },
  });

  return campaign;
}

export async function listCampaigns(tenantId: string, filters: CampaignQueryFilters = {}) {
  const where: Record<string, unknown> = { tenantId };

  if (filters.partyId) where.partyId = filters.partyId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pol_campaign.findMany({
      where,
      include: {
        party: { select: { id: true, name: true, acronym: true } },
        _count: {
          select: {
            candidates: true,
            events: true,
            volunteers: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_campaign.count({ where }),
  ]);

  return { data, total, limit: filters.limit || 50, offset: filters.offset || 0 };
}

export async function activateCampaign(
  tenantId: string,
  campaignId: string,
  actorId: string
) {
  const existing = await prisma.pol_campaign.findFirst({
    where: { id: campaignId, tenantId },
  });

  if (!existing) {
    throw new Error('Campaign not found');
  }

  if (existing.status !== PolCampaignStatus.DRAFT) {
    throw new Error('Only draft campaigns can be activated');
  }

  const campaign = await prisma.pol_campaign.update({
    where: { id: campaignId },
    data: { status: PolCampaignStatus.ACTIVE },
  });

  await logStatusChange(
    tenantId,
    'campaign',
    campaignId,
    actorId,
    PolCampaignStatus.DRAFT,
    PolCampaignStatus.ACTIVE
  );

  return campaign;
}

// ----------------------------------------------------------------------------
// CANDIDATE CRUD
// ----------------------------------------------------------------------------

export async function createCandidate(
  tenantId: string,
  input: CreateCandidateInput,
  actorId: string
) {
  // Verify campaign exists
  const campaign = await prisma.pol_campaign.findFirst({
    where: { id: input.campaignId, tenantId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Verify member exists if provided
  if (input.memberId) {
    const member = await prisma.pol_member.findFirst({
      where: { id: input.memberId, tenantId },
    });
    if (!member) {
      throw new Error('Member not found');
    }
  }

  const candidate = await prisma.pol_candidate.create({
    data: withPrismaDefaults({
      tenantId,
      campaignId: input.campaignId,
      memberId: input.memberId,
      firstName: input.firstName,
      lastName: input.lastName,
      otherNames: input.otherNames,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone,
      email: input.email,
      position: input.position,
      constituency: input.constituency,
      zone: input.zone,
      state: input.state,
      lga: input.lga,
      ward: input.ward,
      biography: input.biography,
      manifesto: input.manifesto,
      photoUrl: input.photoUrl,
      facebookUrl: input.facebookUrl,
      twitterUrl: input.twitterUrl,
      instagramUrl: input.instagramUrl,
      nominatedAt: new Date(),
      nominatedBy: actorId,
      createdBy: actorId,
    }),
  });

  await logCreate(tenantId, 'candidate', candidate.id, actorId, undefined, {
    campaignId: input.campaignId,
    name: `${candidate.firstName} ${candidate.lastName}`,
    position: candidate.position,
    state: candidate.state,
  });

  return candidate;
}

export async function updateCandidate(
  tenantId: string,
  candidateId: string,
  input: UpdateCandidateInput,
  actorId: string
) {
  const existing = await prisma.pol_candidate.findFirst({
    where: { id: candidateId, tenantId },
  });

  if (!existing) {
    throw new Error('Candidate not found');
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

  const candidate = await prisma.pol_candidate.update({
    where: { id: candidateId },
    data: input,
  });

  if (Object.keys(changes).length > 0) {
    if (changes.status) {
      await logStatusChange(
        tenantId,
        'candidate',
        candidateId,
        actorId,
        String(changes.status.old),
        String(changes.status.new)
      );
    } else {
      await logUpdate(tenantId, 'candidate', candidateId, actorId, changes);
    }
  }

  return candidate;
}

export async function screenCandidate(
  tenantId: string,
  candidateId: string,
  actorId: string,
  passed: boolean,
  screeningNote?: string
) {
  const existing = await prisma.pol_candidate.findFirst({
    where: { id: candidateId, tenantId },
  });

  if (!existing) {
    throw new Error('Candidate not found');
  }

  if (existing.status !== PolCandidateStatus.NOMINATED) {
    throw new Error('Only nominated candidates can be screened');
  }

  const newStatus = passed ? PolCandidateStatus.SCREENED : PolCandidateStatus.DISQUALIFIED;

  const candidate = await prisma.pol_candidate.update({
    where: { id: candidateId },
    data: {
      status: newStatus,
      screenedAt: new Date(),
      screenedBy: actorId,
      screeningNote,
    },
  });

  await logStatusChange(
    tenantId,
    'candidate',
    candidateId,
    actorId,
    PolCandidateStatus.NOMINATED,
    newStatus
  );

  return candidate;
}

export async function clearCandidate(
  tenantId: string,
  candidateId: string,
  actorId: string,
  clearanceNote?: string
) {
  const existing = await prisma.pol_candidate.findFirst({
    where: { id: candidateId, tenantId },
  });

  if (!existing) {
    throw new Error('Candidate not found');
  }

  if (existing.status !== PolCandidateStatus.SCREENED) {
    throw new Error('Only screened candidates can be cleared');
  }

  const candidate = await prisma.pol_candidate.update({
    where: { id: candidateId },
    data: {
      status: PolCandidateStatus.CLEARED,
      clearedAt: new Date(),
      clearedBy: actorId,
      clearanceNote,
    },
  });

  await logStatusChange(
    tenantId,
    'candidate',
    candidateId,
    actorId,
    PolCandidateStatus.SCREENED,
    PolCandidateStatus.CLEARED
  );

  return candidate;
}

export async function getCandidate(tenantId: string, candidateId: string) {
  const candidate = await prisma.pol_candidate.findFirst({
    where: { id: candidateId, tenantId },
    include: {
      crm_campaigns: {
        include: {
          party: true,
        },
      },
      member: true,
    },
  });

  return candidate;
}

export async function listCandidates(
  tenantId: string,
  campaignId: string,
  filters: {
    status?: PolCandidateStatus;
    state?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: Record<string, unknown> = { tenantId, campaignId };

  if (filters.status) where.status = filters.status;
  if (filters.state) where.state = filters.state;

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { position: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.pol_candidate.findMany({
      where,
      include: {
        member: { select: { id: true, membershipNo: true } },
      },
      orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.pol_candidate.count({ where }),
  ]);

  return { data, total, limit: filters.limit || 50, offset: filters.offset || 0 };
}
