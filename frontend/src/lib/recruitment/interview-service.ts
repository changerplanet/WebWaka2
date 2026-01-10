/**
 * RECRUITMENT & ONBOARDING SUITE — Interview Service
 * Phase 7C.1, S3 Core Services
 * 
 * Manages interviews: schedule, feedback, results, scorecard.
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma';
import { 
  recruit_InterviewType,
  recruit_InterviewResult,
  type recruit_interview 
} from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateInterviewInput {
  applicationId: string;
  interviewType: recruit_InterviewType;
  title?: string;
  round?: number;
  scheduledDate?: Date;
  scheduledTime?: string;
  duration?: number;
  location?: string;
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  interviewers?: { id: string; name: string; role?: string }[];
  leadInterviewer?: string;
  leadInterviewerName?: string;
  notes?: string;
}

export interface UpdateInterviewInput {
  interviewType?: recruit_InterviewType;
  title?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  duration?: number;
  location?: string;
  meetingLink?: string;
  interviewers?: { id: string; name: string; role?: string }[];
  leadInterviewer?: string;
  leadInterviewerName?: string;
  notes?: string;
}

export interface InterviewFeedbackInput {
  result: recruit_InterviewResult;
  feedback?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
  scorecard?: Record<string, number>;
  overallScore?: number;
  resultBy?: string;
}

export interface InterviewFilters {
  applicationId?: string;
  interviewType?: recruit_InterviewType;
  result?: recruit_InterviewResult;
  leadInterviewer?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  status?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// INTERVIEW SERVICE FUNCTIONS
// ============================================================================

/**
 * Schedule an interview
 */
export async function createInterview(
  tenantId: string,
  platformInstanceId: string,
  input: CreateInterviewInput,
  createdBy?: string
): Promise<recruit_interview> {
  // Verify application exists
  const application = await prisma.recruit_application.findFirst({
    where: { id: input.applicationId, tenantId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Determine round number
  const existingInterviews = await prisma.recruit_interview.count({
    where: { applicationId: input.applicationId, tenantId },
  });

  return prisma.recruit_interview.create({
    data: withPrismaDefaults({
      tenantId,
      platformInstanceId,
      applicationId: input.applicationId,
      interviewType: input.interviewType,
      title: input.title || `${input.interviewType} Interview`,
      round: input.round || existingInterviews + 1,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      duration: input.duration || 60, // Default 1 hour
      timezone: 'Africa/Lagos',
      location: input.location,
      meetingLink: input.meetingLink,
      meetingId: input.meetingId,
      meetingPassword: input.meetingPassword,
      interviewers: input.interviewers,
      leadInterviewer: input.leadInterviewer,
      leadInterviewerName: input.leadInterviewerName,
      result: 'PENDING',
      status: input.scheduledDate ? 'SCHEDULED' : 'DRAFT',
      notes: input.notes,
      createdBy,
    }),
  });
}

/**
 * Get interview by ID
 */
export async function getInterviewById(
  tenantId: string,
  interviewId: string
): Promise<recruit_interview | null> {
  return prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
    include: {
      application: {
        select: {
          id: true,
          applicantName: true,
          applicantEmail: true,
          applicantPhone: true,
          crm_stages: true,
          log_jobs: {
            select: { id: true, title: true, jobCode: true },
          },
        },
      },
    },
  });
}

/**
 * Get interviews with filters
 */
export async function getInterviews(
  tenantId: string,
  filters: InterviewFilters = {}
): Promise<{ interviews: recruit_interview[]; total: number; pagination: any }> {
  const {
    applicationId,
    interviewType,
    result,
    leadInterviewer,
    scheduledFrom,
    scheduledTo,
    status,
    page = 1,
    limit = 20,
  } = filters;

  const where: any = { tenantId };

  if (applicationId) where.applicationId = applicationId;
  if (interviewType) where.interviewType = interviewType;
  if (result) where.result = result;
  if (leadInterviewer) where.leadInterviewer = leadInterviewer;
  if (status) where.status = status;

  if (scheduledFrom || scheduledTo) {
    where.scheduledDate = {};
    if (scheduledFrom) where.scheduledDate.gte = scheduledFrom;
    if (scheduledTo) where.scheduledDate.lte = scheduledTo;
  }

  const [interviews, total] = await Promise.all([
    prisma.recruit_interview.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        application: {
          select: {
            id: true,
            applicantName: true,
            applicantEmail: true,
            log_jobs: { select: { title: true, jobCode: true } },
          },
        },
      },
    }),
    prisma.recruit_interview.count({ where }),
  ]);

  return {
    interviews,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update interview details
 */
export async function updateInterview(
  tenantId: string,
  interviewId: string,
  input: UpdateInterviewInput
): Promise<recruit_interview | null> {
  const interview = await prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
  });

  if (!interview) return null;

  return prisma.recruit_interview.update({
    where: { id: interviewId },
    data: {
      ...input,
      status: input.scheduledDate ? 'SCHEDULED' : interview.status,
      updatedAt: new Date(),
    },
  });
}

/**
 * Record interview feedback and result
 */
export async function recordFeedback(
  tenantId: string,
  interviewId: string,
  input: InterviewFeedbackInput
): Promise<recruit_interview | null> {
  const interview = await prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
  });

  if (!interview) return null;

  return prisma.recruit_interview.update({
    where: { id: interviewId },
    data: {
      result: input.result,
      resultDate: new Date(),
      resultBy: input.resultBy,
      feedback: input.feedback,
      strengths: input.strengths,
      weaknesses: input.weaknesses,
      recommendation: input.recommendation,
      scorecard: input.scorecard,
      overallScore: input.overallScore,
      status: 'COMPLETED',
    },
  });
}

/**
 * Mark interview as no-show
 */
export async function markNoShow(
  tenantId: string,
  interviewId: string,
  notes?: string
): Promise<recruit_interview | null> {
  const interview = await prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
  });

  if (!interview) return null;

  return prisma.recruit_interview.update({
    where: { id: interviewId },
    data: {
      result: 'NO_SHOW',
      resultDate: new Date(),
      status: 'NO_SHOW',
      notes: notes ? `${interview.notes || ''}\n[NO SHOW] ${notes}` : interview.notes,
    },
  });
}

/**
 * Cancel interview
 */
export async function cancelInterview(
  tenantId: string,
  interviewId: string,
  reason?: string
): Promise<recruit_interview | null> {
  const interview = await prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
  });

  if (!interview) return null;

  return prisma.recruit_interview.update({
    where: { id: interviewId },
    data: {
      result: 'CANCELLED',
      isCancelled: true,
      cancelledReason: reason,
      cancelledAt: new Date(),
      status: 'CANCELLED',
    },
  });
}

/**
 * Reschedule interview
 */
export async function rescheduleInterview(
  tenantId: string,
  interviewId: string,
  newDate: Date,
  newTime?: string,
  reason?: string
): Promise<recruit_interview | null> {
  const interview = await prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
  });

  if (!interview) return null;

  return prisma.recruit_interview.update({
    where: { id: interviewId },
    data: {
      scheduledDate: newDate,
      scheduledTime: newTime || interview.scheduledTime,
      isRescheduled: true,
      rescheduledFrom: interview.scheduledDate,
      rescheduledReason: reason,
      result: 'RESCHEDULED',
      status: 'SCHEDULED',
    },
  });
}

/**
 * Get upcoming interviews (next 7 days)
 */
export async function getUpcomingInterviews(
  tenantId: string,
  days: number = 7
): Promise<recruit_interview[]> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return prisma.recruit_interview.findMany({
    where: {
      tenantId,
      scheduledDate: { gte: now, lte: future },
      status: 'SCHEDULED',
      isCancelled: false,
    },
    orderBy: { scheduledDate: 'asc' },
    include: {
      application: {
        select: {
          applicantName: true,
          applicantPhone: true,
          applicantEmail: true,
          log_jobs: { select: { title: true } },
        },
      },
    },
  });
}

/**
 * Get today's interviews
 */
export async function getTodayInterviews(
  tenantId: string
): Promise<recruit_interview[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.recruit_interview.findMany({
    where: {
      tenantId,
      scheduledDate: { gte: today, lt: tomorrow },
      isCancelled: false,
    },
    orderBy: { scheduledTime: 'asc' },
    include: {
      application: {
        select: {
          applicantName: true,
          applicantPhone: true,
          applicantEmail: true,
          log_jobs: { select: { title: true, jobCode: true } },
        },
      },
    },
  });
}

/**
 * Get interview statistics
 */
export async function getInterviewStats(
  tenantId: string
): Promise<{
  total: number;
  scheduled: number;
  completed: number;
  passed: number;
  failed: number;
  noShows: number;
  byType: { type: string; count: number }[];
  avgScore: number | null;
}> {
  const [
    total,
    scheduled,
    completed,
    passed,
    failed,
    noShows,
    byType,
    scoreAgg,
  ] = await Promise.all([
    prisma.recruit_interview.count({ where: { tenantId } }),
    prisma.recruit_interview.count({ where: { tenantId, status: 'SCHEDULED' } }),
    prisma.recruit_interview.count({ where: { tenantId, status: 'COMPLETED' } }),
    prisma.recruit_interview.count({ where: { tenantId, result: 'PASS' } }),
    prisma.recruit_interview.count({ where: { tenantId, result: 'FAIL' } }),
    prisma.recruit_interview.count({ where: { tenantId, result: 'NO_SHOW' } }),
    prisma.recruit_interview.groupBy({
      by: ['interviewType'],
      where: { tenantId },
      _count: true,
    }),
    prisma.recruit_interview.aggregate({
      where: { tenantId, overallScore: { not: null } },
      _avg: { overallScore: true },
    }),
  ]);

  return {
    total,
    scheduled,
    completed,
    passed,
    failed,
    noShows,
    byType: byType.map((t: any) => ({ type: t.interviewType, count: t._count })),
    avgScore: scoreAgg._avg.overallScore,
  };
}

/**
 * Get interviews by interviewer
 */
export async function getInterviewsByInterviewer(
  tenantId: string,
  interviewerId: string,
  options: { upcoming?: boolean; page?: number; limit?: number } = {}
): Promise<{ interviews: recruit_interview[]; total: number }> {
  const { upcoming = false, page = 1, limit = 20 } = options;

  const where: any = {
    tenantId,
    leadInterviewer: interviewerId,
    isCancelled: false,
  };

  if (upcoming) {
    where.scheduledDate = { gte: new Date() };
    where.status = 'SCHEDULED';
  }

  const [interviews, total] = await Promise.all([
    prisma.recruit_interview.findMany({
      where,
      orderBy: { scheduledDate: upcoming ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        application: {
          select: {
            applicantName: true,
            log_jobs: { select: { title: true } },
          },
        },
      },
    }),
    prisma.recruit_interview.count({ where }),
  ]);

  return { interviews, total };
}

/**
 * Delete interview (only if not completed)
 */
export async function deleteInterview(
  tenantId: string,
  interviewId: string
): Promise<boolean> {
  const interview = await prisma.recruit_interview.findFirst({
    where: { id: interviewId, tenantId },
  });

  if (!interview || interview.status === 'COMPLETED') return false;

  await prisma.recruit_interview.delete({ where: { id: interviewId } });
  return true;
}
