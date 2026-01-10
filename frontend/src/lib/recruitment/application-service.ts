/**
 * RECRUITMENT & ONBOARDING SUITE — Application Service
 * Phase 7C.1, S3 Core Services
 * 
 * Manages job applications: apply, stage transitions, scoring, recruiter assignment.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  recruit_ApplicationStage,
  type recruit_application 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateApplicationInput {
  jobId: string;
  applicantContactId?: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantLocation?: string;
  source?: string;
  referredBy?: string;
  cvFileId?: string;
  cvFileName?: string;
  coverLetter?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  availableFrom?: Date;
  notes?: string;
}

export interface UpdateApplicationInput {
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantLocation?: string;
  source?: string;
  cvFileId?: string;
  cvFileName?: string;
  coverLetter?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  availableFrom?: Date;
  score?: number;
  rating?: number;
  tags?: string[];
  notes?: string;
}

export interface ApplicationFilters {
  jobId?: string;
  stage?: recruit_ApplicationStage;
  assignedTo?: string;
  isShortlisted?: boolean;
  isRejected?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Valid stage transitions
const STAGE_TRANSITIONS: Record<recruit_ApplicationStage, recruit_ApplicationStage[]> = {
  APPLIED: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['ASSESSMENT', 'OFFER', 'REJECTED', 'WITHDRAWN'],
  ASSESSMENT: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['HIRED', 'REJECTED', 'WITHDRAWN'],
  HIRED: [], // Terminal state
  REJECTED: [], // Terminal state
  WITHDRAWN: [], // Terminal state
};

// ============================================================================
// APPLICATION SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new application (apply to job)
 */
export async function createApplication(
  tenantId: string,
  platformInstanceId: string,
  input: CreateApplicationInput
): Promise<recruit_application> {
  // Verify job exists and is open
  const job = await prisma.recruit_job.findFirst({
    where: { id: input.jobId, tenantId, status: 'OPEN' },
  });

  if (!job) {
    throw new Error('Job not found or not accepting applications');
  }

  // Check for duplicate application
  if (input.applicantEmail) {
    const existing = await prisma.recruit_application.findFirst({
      where: { 
        jobId: input.jobId, 
        tenantId,
        applicantEmail: input.applicantEmail,
      },
    });
    if (existing) {
      throw new Error('Application already exists for this email');
    }
  }

  return prisma.recruit_application.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      jobId: input.jobId,
      applicantContactId: input.applicantContactId,
      applicantName: input.applicantName,
      applicantEmail: input.applicantEmail,
      applicantPhone: input.applicantPhone,
      applicantlocation: input.applicantLocation,
      source: input.source || 'Direct',
      referredBy: input.referredBy,
      cvFileId: input.cvFileId,
      cvFileName: input.cvFileName,
      coverLetter: input.coverLetter,
      expectedSalary: input.expectedSalary,
      noticePeriod: input.noticePeriod,
      availableFrom: input.availableFrom,
      notes: input.notes,
      stage: 'APPLIED',
      applicationDate: new Date(),
    }),
  });
}

/**
 * Get application by ID
 */
export async function getApplicationById(
  tenantId: string,
  applicationId: string
): Promise<recruit_application | null> {
  return prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
    include: {
      job: {
        select: {
          id: true,
          jobCode: true,
          title: true,
          department: true,
          status: true,
        },
      },
      interviews: {
        orderBy: { scheduledDate: 'desc' },
      },
      offer: true,
      onboardingTasks: {
        orderBy: { dueOrder: 'asc' },
      },
    },
  });
}

/**
 * Get applications with filters
 */
export async function getApplications(
  tenantId: string,
  filters: ApplicationFilters = {}
): Promise<{ applications: recruit_application[]; total: number; pagination: any }> {
  const {
    jobId,
    stage,
    assignedTo,
    isShortlisted,
    isRejected,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const where: any = { tenantId };

  if (jobId) where.jobId = jobId;
  if (stage) where.stage = stage;
  if (assignedTo) where.assignedTo = assignedTo;
  if (isShortlisted !== undefined) where.isShortlisted = isShortlisted;
  if (isRejected !== undefined) where.isRejected = isRejected;

  if (search) {
    where.OR = [
      { applicantName: { contains: search, mode: 'insensitive' } },
      { applicantEmail: { contains: search, mode: 'insensitive' } },
      { applicantPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.recruit_application.findMany({
      where,
      orderBy: { applicationDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        job: {
          select: { id: true, title: true, jobCode: true },
        },
        _count: {
          select: { interviews: true },
        },
      },
    }),
    prisma.recruit_application.count({ where }),
  ]);

  return {
    applications,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update application details
 */
export async function updateApplication(
  tenantId: string,
  applicationId: string,
  input: UpdateApplicationInput
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
}

/**
 * Move application to next stage
 */
export async function moveToStage(
  tenantId: string,
  applicationId: string,
  newStage: recruit_ApplicationStage,
  changedBy?: string
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  // Validate transition
  const validTransitions = STAGE_TRANSITIONS[application.stage];
  if (!validTransitions.includes(newStage)) {
    throw new Error(`Invalid stage transition from ${application.stage} to ${newStage}`);
  }

  const updateData: any = {
    stage: newStage,
    stageChangedAt: new Date(),
    stageChangedBy: changedBy,
  };

  // Handle special cases
  if (newStage === 'REJECTED') {
    updateData.isRejected = true;
    updateData.rejectedAt = new Date();
    updateData.rejectedBy = changedBy;
  } else if (newStage === 'WITHDRAWN') {
    updateData.isWithdrawn = true;
    updateData.withdrawnAt = new Date();
  }

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: updateData,
  });
}

/**
 * Assign recruiter to application
 */
export async function assignRecruiter(
  tenantId: string,
  applicationId: string,
  recruiterId: string,
  recruiterName: string
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: {
      assignedTo: recruiterId,
      assignedToName: recruiterName,
    },
  });
}

/**
 * Score/rate application
 */
export async function scoreApplication(
  tenantId: string,
  applicationId: string,
  score: number,
  rating?: number,
  screeningNotes?: string,
  screenedBy?: string
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: {
      score,
      rating,
      screeningNotes,
      screeningDate: new Date(),
      screenedBy,
    },
  });
}

/**
 * Shortlist application
 */
export async function shortlistApplication(
  tenantId: string,
  applicationId: string,
  shortlist: boolean = true
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: { isShortlisted: shortlist },
  });
}

/**
 * Reject application with reason
 */
export async function rejectApplication(
  tenantId: string,
  applicationId: string,
  reason: string,
  rejectedBy?: string
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  // Can only reject if not already hired
  if (application.stage === 'HIRED') {
    throw new Error('Cannot reject a hired applicant');
  }

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: {
      stage: 'REJECTED',
      isRejected: true,
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy,
      stageChangedAt: new Date(),
      stageChangedBy: rejectedBy,
    },
  });
}

/**
 * Withdraw application
 */
export async function withdrawApplication(
  tenantId: string,
  applicationId: string,
  reason?: string
): Promise<recruit_application | null> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application) return null;

  // Can only withdraw if not already hired or rejected
  if (['HIRED', 'REJECTED'].includes(application.stage)) {
    throw new Error('Cannot withdraw application in terminal state');
  }

  return prisma.recruit_application.update({
    where: { id: applicationId },
    data: {
      stage: 'WITHDRAWN',
      isWithdrawn: true,
      withdrawnAt: new Date(),
      withdrawnReason: reason,
      stageChangedAt: new Date(),
    },
  });
}

/**
 * Get application statistics
 */
export async function getApplicationStats(
  tenantId: string,
  jobId?: string
): Promise<{
  total: number;
  byStage: Record<string, number>;
  shortlisted: number;
  rejected: number;
  avgScore: number | null;
  bySource: { source: string; count: number }[];
}> {
  const where: any = { tenantId };
  if (jobId) where.jobId = jobId;

  const [
    total,
    stageGroups,
    shortlisted,
    rejected,
    scoreAgg,
    sourceGroups,
  ] = await Promise.all([
    prisma.recruit_application.count({ where }),
    prisma.recruit_application.groupBy({
      by: ['stage'],
      where,
      _count: true,
    }),
    prisma.recruit_application.count({ where: { ...where, isShortlisted: true } }),
    prisma.recruit_application.count({ where: { ...where, isRejected: true } }),
    prisma.recruit_application.aggregate({
      where: { ...where, score: { not: null } },
      _avg: { score: true },
    }),
    prisma.recruit_application.groupBy({
      by: ['source'],
      where: { ...where, source: { not: null } },
      _count: true,
    }),
  ]);

  const byStage: Record<string, number> = {};
  stageGroups.forEach((g: any) => {
    byStage[g.stage] = g._count;
  });

  return {
    total,
    byStage,
    shortlisted,
    rejected,
    avgScore: scoreAgg._avg.score,
    bySource: sourceGroups.map((s: any) => ({
      source: s.source || 'Unknown',
      count: s._count,
    })),
  };
}

/**
 * Get pipeline view (applications grouped by stage for a job)
 */
export async function getPipeline(
  tenantId: string,
  jobId: string
): Promise<Record<string, recruit_application[]>> {
  const applications = await prisma.recruit_application.findMany({
    where: { tenantId, jobId },
    orderBy: { applicationDate: 'desc' },
    include: {
      _count: { select: { interviews: true } },
    },
  });

  const pipeline: Record<string, recruit_application[]> = {
    APPLIED: [],
    SCREENING: [],
    INTERVIEW: [],
    ASSESSMENT: [],
    OFFER: [],
    HIRED: [],
    REJECTED: [],
    WITHDRAWN: [],
  };

  applications.forEach(app => {
    if (pipeline[app.stage]) {
      pipeline[app.stage].push(app);
    }
  });

  return pipeline;
}

/**
 * Bulk assign recruiter to multiple applications
 */
export async function bulkAssignRecruiter(
  tenantId: string,
  applicationIds: string[],
  recruiterId: string,
  recruiterName: string
): Promise<number> {
  const result = await prisma.recruit_application.updateMany({
    where: {
      id: { in: applicationIds },
      tenantId,
    },
    data: {
      assignedTo: recruiterId,
      assignedToName: recruiterName,
    },
  });

  return result.count;
}

/**
 * Delete application (only if APPLIED stage)
 */
export async function deleteApplication(
  tenantId: string,
  applicationId: string
): Promise<boolean> {
  const application = await prisma.recruit_application.findFirst({
    where: { id: applicationId, tenantId },
  });

  if (!application || application.stage !== 'APPLIED') return false;

  await prisma.recruit_application.delete({ where: { id: applicationId } });
  return true;
}
