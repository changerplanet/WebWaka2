/**
 * RECRUITMENT & ONBOARDING SUITE — Offer Service
 * Phase 7C.1, S3 Core Services
 * 
 * Manages job offers: draft, approve, send, accept/decline, negotiation.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  recruit_OfferStatus,
  type recruit_offer 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateOfferInput {
  applicationId: string;
  position: string;
  department?: string;
  reportingTo?: string;
  baseSalary: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  housingAllowance?: number;
  transportAllowance?: number;
  mealAllowance?: number;
  otherAllowances?: { name: string; amount: number }[];
  benefits?: string;
  leaveEntitlement?: number;
  probationPeriod?: number;
  pensionContribution?: number;
  healthInsurance?: string;
  signingBonus?: number;
  annualBonus?: string;
  startDate?: Date;
  responseDeadline?: Date;
  notes?: string;
}

export interface UpdateOfferInput extends Partial<CreateOfferInput> {}

export interface OfferFilters {
  applicationId?: string;
  status?: recruit_OfferStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// OFFER SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate offer code
 */
async function generateOfferCode(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.recruit_offer.count({
    where: { tenantId, offerCode: { startsWith: `OFF-${year}-` } }
  });
  return `OFF-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Create a new offer
 */
export async function createOffer(
  tenantId: string,
  platformInstanceId: string,
  input: CreateOfferInput,
  createdBy?: string
): Promise<recruit_offer> {
  // Verify application exists and is at offer stage
  const application = await prisma.recruit_application.findFirst({
    where: { id: input.applicationId, tenantId },
    include: { log_jobs: true },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Check if offer already exists
  const existingOffer = await prisma.recruit_offer.findFirst({
    where: { applicationId: input.applicationId, tenantId },
  });

  if (existingOffer) {
    throw new Error('Offer already exists for this application');
  }

  const offerCode = await generateOfferCode(tenantId);

  // Calculate total compensation
  const totalMonthly = 
    input.baseSalary +
    (input.housingAllowance || 0) +
    (input.transportAllowance || 0) +
    (input.mealAllowance || 0) +
    (input.otherAllowances?.reduce((sum: any, a: any) => sum + a.amount, 0) || 0);

  const offer = await prisma.recruit_offer.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      applicationId: input.applicationId,
      offerCode,
      position: input.position || application.job?.title || 'Position',
      department: input.department || application.job?.department,
      reportingTo: input.reportingTo,
      baseSalary: input.baseSalary,
      salaryCurrency: input.salaryCurrency || 'NGN',
      salaryPeriod: input.salaryPeriod || 'MONTHLY',
      housingAllowance: input.housingAllowance,
      transportAllowance: input.transportAllowance,
      mealAllowance: input.mealAllowance,
      otherAllowances: input.otherAllowances,
      benefits: input.benefits,
      leaveEntitlement: input.leaveEntitlement || 20, // Default 20 days
      probationPeriod: input.probationPeriod || 3, // Default 3 months
      pensionContribution: input.pensionContribution || 8, // Default 8%
      healthInsurance: input.healthInsurance,
      signingBonus: input.signingBonus,
      annualBonus: input.annualBonus,
      startDate: input.startDate,
      responseDeadline: input.responseDeadline,
      expiryDate: input.responseDeadline,
      status: 'DRAFT',
      notes: input.notes,
      createdBy,
    }),
  });

  // Update application to offer stage
  await prisma.recruit_application.update({
    where: { id: input.applicationId },
    data: {
      stage: 'OFFER',
      offerId: offer.id,
      stageChangedAt: new Date(),
    },
  });

  return offer;
}

/**
 * Get offer by ID
 */
export async function getOfferById(
  tenantId: string,
  offerId: string
): Promise<recruit_offer | null> {
  return prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
    include: {
      application: {
        select: {
          id: true,
          applicantName: true,
          applicantEmail: true,
          applicantPhone: true,
          expectedSalary: true,
          log_jobs: {
            select: { id: true, title: true, jobCode: true, department: true },
          },
        },
      },
    },
  });
}

/**
 * Get offer by application ID
 */
export async function getOfferByApplication(
  tenantId: string,
  applicationId: string
): Promise<recruit_offer | null> {
  return prisma.recruit_offer.findFirst({
    where: { applicationId, tenantId },
    include: {
      application: {
        select: {
          applicantName: true,
          applicantEmail: true,
          log_jobs: { select: { title: true } },
        },
      },
    },
  });
}

/**
 * Get offers with filters
 */
export async function getOffers(
  tenantId: string,
  filters: OfferFilters = {}
): Promise<{ offers: recruit_offer[]; total: number; pagination: any }> {
  const {
    applicationId,
    status,
    startDateFrom,
    startDateTo,
    page = 1,
    limit = 20,
  } = filters;

  const where: any = { tenantId };

  if (applicationId) where.applicationId = applicationId;
  if (status) where.status = status;

  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) where.startDate.gte = startDateFrom;
    if (startDateTo) where.startDate.lte = startDateTo;
  }

  const [offers, total] = await Promise.all([
    prisma.recruit_offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        application: {
          select: {
            applicantName: true,
            applicantEmail: true,
            log_jobs: { select: { title: true, jobCode: true } },
          },
        },
      },
    }),
    prisma.recruit_offer.count({ where }),
  ]);

  return {
    offers,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update offer details
 */
export async function updateOffer(
  tenantId: string,
  offerId: string,
  input: UpdateOfferInput
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer) return null;

  // Can only update if DRAFT or NEGOTIATING
  if (!['DRAFT', 'NEGOTIATING'].includes(offer.status)) {
    throw new Error('Cannot update offer in current status');
  }

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
}

/**
 * Submit offer for approval (DRAFT → PENDING_APPROVAL)
 */
export async function submitForApproval(
  tenantId: string,
  offerId: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || offer.status !== 'DRAFT') return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'PENDING_APPROVAL',
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Approve offer (PENDING_APPROVAL → APPROVED)
 */
export async function approveOffer(
  tenantId: string,
  offerId: string,
  approvedBy: string,
  notes?: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || offer.status !== 'PENDING_APPROVAL') return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'APPROVED',
      approvalStatus: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      approverNotes: notes,
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Reject offer approval (PENDING_APPROVAL → DRAFT)
 */
export async function rejectApproval(
  tenantId: string,
  offerId: string,
  rejectedBy: string,
  reason: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || offer.status !== 'PENDING_APPROVAL') return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'DRAFT',
      approvalStatus: 'REJECTED',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      approverNotes: reason,
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Send offer to candidate (APPROVED → SENT)
 */
export async function sendOffer(
  tenantId: string,
  offerId: string,
  sentBy: string,
  sentVia: string = 'Email'
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || offer.status !== 'APPROVED') return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      sentBy,
      sentVia,
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Mark offer as viewed
 */
export async function markOfferViewed(
  tenantId: string,
  offerId: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || !['SENT', 'VIEWED'].includes(offer.status)) return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'VIEWED',
      viewedAt: offer.viewedAt || new Date(),
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Accept offer (SENT/VIEWED → ACCEPTED)
 */
export async function acceptOffer(
  tenantId: string,
  offerId: string,
  notes?: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
    include: { application: true },
  });

  if (!offer || !['SENT', 'VIEWED', 'NEGOTIATING'].includes(offer.status)) return null;

  // Update offer
  const updatedOffer = await prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
      responseNotes: notes,
      statusChangedAt: new Date(),
    },
  });

  // Update application to HIRED
  await prisma.recruit_application.update({
    where: { id: offer.applicationId },
    data: {
      stage: 'HIRED',
      stageChangedAt: new Date(),
    },
  });

  return updatedOffer;
}

/**
 * Decline offer (SENT/VIEWED → DECLINED)
 */
export async function declineOffer(
  tenantId: string,
  offerId: string,
  reason?: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || !['SENT', 'VIEWED', 'NEGOTIATING'].includes(offer.status)) return null;

  // Update offer
  const updatedOffer = await prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'DECLINED',
      respondedAt: new Date(),
      responseNotes: reason,
      statusChangedAt: new Date(),
    },
  });

  // Update application to REJECTED (candidate declined)
  await prisma.recruit_application.update({
    where: { id: offer.applicationId },
    data: {
      stage: 'REJECTED',
      isRejected: true,
      rejectionReason: 'Candidate declined offer',
      rejectedAt: new Date(),
      stageChangedAt: new Date(),
    },
  });

  return updatedOffer;
}

/**
 * Start negotiation
 */
export async function startNegotiation(
  tenantId: string,
  offerId: string,
  counterOffer?: number,
  request?: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || !['SENT', 'VIEWED'].includes(offer.status)) return null;

  const negotiationEntry = {
    date: new Date().toISOString(),
    request: request || 'Counter offer',
    counterOffer,
  };

  const history = (offer.negotiationHistory as any[]) || [];
  history.push(negotiationEntry);

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'NEGOTIATING',
      isNegotiating: true,
      counterOffer,
      negotiationHistory: history,
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Withdraw offer
 */
export async function withdrawOffer(
  tenantId: string,
  offerId: string,
  reason?: string,
  withdrawnBy?: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || ['ACCEPTED', 'DECLINED', 'WITHDRAWN'].includes(offer.status)) return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'WITHDRAWN',
      responseNotes: reason ? `[WITHDRAWN] ${reason}` : offer.responseNotes,
      statusChangedAt: new Date(),
      statusChangedBy: withdrawnBy,
    },
  });
}

/**
 * Mark offer as expired
 */
export async function markOfferExpired(
  tenantId: string,
  offerId: string
): Promise<recruit_offer | null> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || !['SENT', 'VIEWED', 'NEGOTIATING'].includes(offer.status)) return null;

  return prisma.recruit_offer.update({
    where: { id: offerId },
    data: {
      status: 'EXPIRED',
      statusChangedAt: new Date(),
    },
  });
}

/**
 * Get offer statistics
 */
export async function getOfferStats(tenantId: string): Promise<{
  total: number;
  draft: number;
  pending: number;
  sent: number;
  accepted: number;
  declined: number;
  avgSalary: number | null;
  acceptanceRate: number;
}> {
  const [
    total,
    draft,
    pending,
    sent,
    accepted,
    declined,
    salaryAgg,
  ] = await Promise.all([
    prisma.recruit_offer.count({ where: { tenantId } }),
    prisma.recruit_offer.count({ where: { tenantId, status: 'DRAFT' } }),
    prisma.recruit_offer.count({ where: { tenantId, status: 'PENDING_APPROVAL' } }),
    prisma.recruit_offer.count({ where: { tenantId, status: 'SENT' } }),
    prisma.recruit_offer.count({ where: { tenantId, status: 'ACCEPTED' } }),
    prisma.recruit_offer.count({ where: { tenantId, status: 'DECLINED' } }),
    prisma.recruit_offer.aggregate({
      where: { tenantId },
      _avg: { baseSalary: true },
    }),
  ]);

  const responded = accepted + declined;
  const acceptanceRate = responded > 0 ? (accepted / responded) * 100 : 0;

  return {
    total,
    draft,
    pending,
    sent,
    accepted,
    declined,
    avgSalary: salaryAgg._avg.baseSalary,
    acceptanceRate: Math.round(acceptanceRate),
  };
}

/**
 * Calculate total monthly compensation
 */
export function calculateTotalCompensation(offer: recruit_offer): number {
  const base = offer.baseSalary || 0;
  const housing = offer.housingAllowance || 0;
  const transport = offer.transportAllowance || 0;
  const meal = offer.mealAllowance || 0;
  const other = (offer.otherAllowances as any[])?.reduce((sum: any, a: any) => sum + (a.amount || 0), 0) || 0;
  
  return base + housing + transport + meal + other;
}

/**
 * Delete offer (only if DRAFT)
 */
export async function deleteOffer(
  tenantId: string,
  offerId: string
): Promise<boolean> {
  const offer = await prisma.recruit_offer.findFirst({
    where: { id: offerId, tenantId },
  });

  if (!offer || offer.status !== 'DRAFT') return false;

  await prisma.recruit_offer.delete({ where: { id: offerId } });
  return true;
}
