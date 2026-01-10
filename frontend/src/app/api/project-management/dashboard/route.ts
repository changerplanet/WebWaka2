/**
 * PROJECT MANAGEMENT SUITE — Dashboard API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/dashboard - Aggregated stats
 */

import { NextResponse } from 'next/server';
import { getProjectStats } from '@/lib/project-management/project-service';
import { getTaskStats } from '@/lib/project-management/task-service';

// GET /api/project-management/dashboard
export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const [projectStats, taskStats] = await Promise.all([
      getProjectStats(tenantId, platformInstanceId || undefined),
      getTaskStats(tenantId),
    ]);

    return NextResponse.json({
      summary: {
        totalProjects: projectStats.total,
        activeProjects: projectStats.byStatus['ACTIVE'] || 0,
        completedProjects: projectStats.byStatus['COMPLETED'] || 0,
        overdueProjects: projectStats.overdue,
        totalTasks: taskStats.total,
        tasksInProgress: taskStats.byStatus['IN_PROGRESS'] || 0,
        overdueTasks: taskStats.overdue,
        tasksDueToday: taskStats.dueToday,
      },
      projects: projectStats,
      tasks: taskStats,
    });
  } catch (error) {
    console.error('GET /api/project-management/dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
