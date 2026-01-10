/**
 * RECRUITMENT & ONBOARDING SUITE — Job Service
 * Phase 7C.1, S3 Core Services
 * 
 * Manages job requisitions: create, update, publish, close, status transitions.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  recruit_JobStatus, 
  recruit_EmploymentType,
  type recruit_job 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateJobInput {
  title: string;
  department?: string;
  location?: string;
  workLocation?: string; // "On-site", "Remote", "Hybrid"
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  employmentType?: recruit_EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  benefits?: string;
  openings?: number;
  closingDate?: Date;
  targetHireDate?: Date;
  recruiterId?: string;
  recruiterName?: string;
  hiringManager?: string;
  hiringManagerName?: string;
  isInternal?: boolean;
  isConfidential?: boolean;
  tags?: string[];
  skills?: string[];
  notes?: string;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  status?: recruit_JobStatus;
}

export interface JobFilters {
  status?: recruit_JobStatus;
  department?: string;
  employmentType?: recruit_EmploymentType;
  recruiterId?: string;
  isInternal?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// JOB SERVICE FUNCTIONS
// ============================================================================

/**
 * Generate job code
 */
async function generateJobCode(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.recruit_job.count({
    where: { tenantId, jobCode: { startsWith: `JOB-${year}-` } }
  });
  return `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Create a new job requisition
 */
export async function createJob(
  tenantId: string,
  platformInstanceId: string,
  input: CreateJobInput,
  createdBy?: string
): Promise<recruit_job> {
  const jobCode = await generateJobCode(tenantId);

  return prisma.recruit_job.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      jobCode,
      title: input.title,
      department: input.department,
      location: input.location,
      worklocation: input.workLocation,
      description: input.description,
      requirements: input.requirements,
      responsibilities: input.responsibilities,
      qualifications: input.qualifications,
      employmentType: input.employmentType || 'FULL_TIME',
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      salaryCurrency: input.salaryCurrency || 'NGN',
      salaryPeriod: input.salaryPeriod || 'MONTHLY',
      benefits: input.benefits,
      openings: input.openings || 1,
      closingDate: input.closingDate,
      targetHireDate: input.targetHireDate,
      recruiterId: input.recruiterId,
      recruiterName: input.recruiterName,
      hiringManager: input.hiringManager,
      hiringManagerName: input.hiringManagerName,
      isInternal: input.isInternal || false,
      isConfidential: input.isConfidential || false,
      tags: input.tags || [],
      skills: input.skills || [],
      notes: input.notes,
      status: 'DRAFT',
      createdBy,
    }),
  });
}

/**
 * Get job by ID
 */
export async function getJobById(
  tenantId: string,
  jobId: string
): Promise<recruit_job | null> {
  return prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
    include: {
      applications: {
        select: {
          id: true,
          crm_stages: true,
          applicantName: true,
        },
      },
    },
  });
}

/**
 * Get jobs with filters and pagination
 */
export async function getJobs(
  tenantId: string,
  filters: JobFilters = {}
): Promise<{ jobs: recruit_job[]; total: number; pagination: any }> {
  const {
    status,
    department,
    employmentType,
    recruiterId,
    isInternal,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const where: any = { tenantId };

  if (status) where.status = status;
  if (department) where.department = department;
  if (employmentType) where.employmentType = employmentType;
  if (recruiterId) where.recruiterId = recruiterId;
  if (isInternal !== undefined) where.isInternal = isInternal;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { jobCode: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [jobs, total] = await Promise.all([
    prisma.recruit_job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
    prisma.recruit_job.count({ where }),
  ]);

  return {
    jobs,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update job
 */
export async function updateJob(
  tenantId: string,
  jobId: string,
  input: UpdateJobInput
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job) return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
}

/**
 * Publish job (DRAFT → OPEN)
 */
export async function publishJob(
  tenantId: string,
  jobId: string,
  shareableLink?: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job || job.status !== 'DRAFT') return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      status: 'OPEN',
      postedDate: new Date(),
      shareableLink: shareableLink || `job-${jobId.slice(-8)}`,
    },
  });
}

/**
 * Put job on hold (OPEN → ON_HOLD)
 */
export async function holdJob(
  tenantId: string,
  jobId: string,
  reason?: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job || job.status !== 'OPEN') return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      status: 'ON_HOLD',
      notes: reason ? `${job.notes || ''}\n[ON HOLD] ${reason}` : job.notes,
    },
  });
}

/**
 * Reopen job (ON_HOLD → OPEN)
 */
export async function reopenJob(
  tenantId: string,
  jobId: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job || job.status !== 'ON_HOLD') return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: { status: 'OPEN' },
  });
}

/**
 * Close job (OPEN/ON_HOLD → CLOSED)
 */
export async function closeJob(
  tenantId: string,
  jobId: string,
  reason?: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job || !['OPEN', 'ON_HOLD'].includes(job.status)) return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      status: 'CLOSED',
      closingDate: new Date(),
      notes: reason ? `${job.notes || ''}\n[CLOSED] ${reason}` : job.notes,
    },
  });
}

/**
 * Mark job as filled (when all positions filled)
 */
export async function markJobFilled(
  tenantId: string,
  jobId: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job) return null;

  // Check if all positions are filled
  const hiredCount = await prisma.recruit_application.count({
    where: { jobId, tenantId, stage: 'HIRED' },
  });

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      status: 'FILLED',
      filledCount: hiredCount,
    },
  });
}

/**
 * Cancel job (any status → CANCELLED)
 */
export async function cancelJob(
  tenantId: string,
  jobId: string,
  reason?: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job || job.status === 'FILLED') return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      status: 'CANCELLED',
      notes: reason ? `${job.notes || ''}\n[CANCELLED] ${reason}` : job.notes,
    },
  });
}

/**
 * Delete job (only if DRAFT)
 */
export async function deleteJob(
  tenantId: string,
  jobId: string
): Promise<boolean> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job || job.status !== 'DRAFT') return false;

  await prisma.recruit_job.delete({ where: { id: jobId } });
  return true;
}

/**
 * Get job statistics for dashboard
 */
export async function getJobStats(tenantId: string): Promise<{
  totalJobs: number;
  openJobs: number;
  draftJobs: number;
  filledJobs: number;
  totalOpenings: number;
  totalFilled: number;
  byDepartment: { department: string; count: number }[];
  byType: { type: string; count: number }[];
}> {
  const [
    totalJobs,
    openJobs,
    draftJobs,
    filledJobs,
    openingsAgg,
    filledAgg,
    byDepartment,
    byType,
  ] = await Promise.all([
    prisma.recruit_job.count({ where: { tenantId } }),
    prisma.recruit_job.count({ where: { tenantId, status: 'OPEN' } }),
    prisma.recruit_job.count({ where: { tenantId, status: 'DRAFT' } }),
    prisma.recruit_job.count({ where: { tenantId, status: 'FILLED' } }),
    prisma.recruit_job.aggregate({
      where: { tenantId, status: 'OPEN' },
      _sum: { openings: true },
    }),
    prisma.recruit_job.aggregate({
      where: { tenantId },
      _sum: { filledCount: true },
    }),
    prisma.recruit_job.groupBy({
      by: ['department'],
      where: { tenantId, department: { not: null } },
      _count: true,
    }),
    prisma.recruit_job.groupBy({
      by: ['employmentType'],
      where: { tenantId },
      _count: true,
    }),
  ]);

  return {
    totalJobs,
    openJobs,
    draftJobs,
    filledJobs,
    totalOpenings: openingsAgg._sum.openings || 0,
    totalFilled: filledAgg._sum.filledCount || 0,
    byDepartment: byDepartment.map((d: any) => ({
      department: d.department || 'Unassigned',
      count: d._count,
    })),
    byType: byType.map((t: any) => ({
      type: t.employmentType,
      count: t._count,
    })),
  };
}

/**
 * Approve job requisition
 */
export async function approveJob(
  tenantId: string,
  jobId: string,
  approvedBy: string
): Promise<recruit_job | null> {
  const job = await prisma.recruit_job.findFirst({
    where: { id: jobId, tenantId },
  });

  if (!job) return null;

  return prisma.recruit_job.update({
    where: { id: jobId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
    },
  });
}
