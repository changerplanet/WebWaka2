export const dynamic = 'force-dynamic'

/**
 * RECRUITMENT SUITE — Dashboard API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/dashboard - Get aggregated recruitment dashboard stats
 */

import { NextResponse } from 'next/server';
import {
  getJobStats,
  getApplicationStats,
  getInterviewStats,
  getOfferStats,
  getOnboardingStats,
  getUpcomingInterviews,
  getOverdueTasks,
} from '@/lib/recruitment';

// GET /api/recruitment/dashboard
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Fetch all stats in parallel
    const [
      jobStats,
      applicationStats,
      interviewStats,
      offerStats,
      onboardingStats,
      upcomingInterviews,
      overdueTasks,
    ] = await Promise.all([
      getJobStats(tenantId),
      getApplicationStats(tenantId),
      getInterviewStats(tenantId),
      getOfferStats(tenantId),
      getOnboardingStats(tenantId),
      detailed ? getUpcomingInterviews(tenantId, 7) : Promise.resolve([]),
      detailed ? getOverdueTasks(tenantId) : Promise.resolve([]),
    ]);

    // Calculate key metrics
    const dashboard = {
      // Summary
      summary: {
        openJobs: jobStats.openJobs,
        totalApplicants: applicationStats.total,
        scheduledInterviews: interviewStats.scheduled,
        pendingOffers: offerStats.sent + offerStats.pending,
        hiresThisMonth: applicationStats.byStage?.HIRED || 0,
      },

      // Jobs Overview
      jobs: {
        total: jobStats.totalJobs,
        open: jobStats.openJobs,
        draft: jobStats.draftJobs,
        filled: jobStats.filledJobs,
        totalOpenings: jobStats.totalOpenings,
        totalFilled: jobStats.totalFilled,
        byDepartment: jobStats.byDepartment,
        byType: jobStats.byType,
      },

      // Applications Pipeline
      applications: {
        total: applicationStats.total,
        byStage: applicationStats.byStage,
        shortlisted: applicationStats.shortlisted,
        rejected: applicationStats.rejected,
        avgScore: applicationStats.avgScore,
        bySource: applicationStats.bySource,
      },

      // Interviews
      interviews: {
        total: interviewStats.total,
        scheduled: interviewStats.scheduled,
        completed: interviewStats.completed,
        passed: interviewStats.passed,
        failed: interviewStats.failed,
        noShows: interviewStats.noShows,
        passRate: interviewStats.completed > 0 
          ? Math.round((interviewStats.passed / interviewStats.completed) * 100) 
          : 0,
        byType: interviewStats.byType,
        avgScore: interviewStats.avgScore,
      },

      // Offers
      offers: {
        total: offerStats.total,
        draft: offerStats.draft,
        pending: offerStats.pending,
        sent: offerStats.sent,
        accepted: offerStats.accepted,
        declined: offerStats.declined,
        acceptanceRate: offerStats.acceptanceRate,
        avgSalary: offerStats.avgSalary,
      },

      // Onboarding
      onboarding: {
        total: onboardingStats.total,
        pending: onboardingStats.pending,
        inProgress: onboardingStats.inProgress,
        completed: onboardingStats.completed,
        overdue: onboardingStats.overdue,
        completionRate: onboardingStats.avgCompletionRate,
        byCategory: onboardingStats.byCategory,
      },

      // Alerts (if detailed)
      ...(detailed && {
        alerts: {
          upcomingInterviews: upcomingInterviews.slice(0, 5).map((i: any) => ({
            id: i.id,
            type: i.interviewType,
            scheduledDate: i.scheduledDate,
            scheduledTime: i.scheduledTime,
            applicantName: (i as any).application?.applicantName,
            jobTitle: (i as any).application?.job?.title,
          })),
          overdueTasks: overdueTasks.slice(0, 5).map((t: any) => ({
            id: t.id,
            taskName: t.taskName,
            dueDate: t.dueDate,
            category: t.category,
            applicantName: (t as any).application?.applicantName,
          })),
          totalUpcomingInterviews: upcomingInterviews.length,
          totalOverdueTasks: overdueTasks.length,
        },
      }),
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('GET /api/recruitment/dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
