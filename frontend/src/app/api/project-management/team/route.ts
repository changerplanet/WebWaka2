export const dynamic = 'force-dynamic'

/**
 * PROJECT MANAGEMENT SUITE — Team API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/team - List team members
 * POST /api/project-management/team - Add team member
 */

import { NextResponse } from 'next/server';
import {
  addTeamMember,
  listTeamMembers,
  getTeamStats,
  getTeamWorkload,
  getMemberProjects,
  type AddTeamMemberInput,
  type TeamMemberFilters,
} from '@/lib/project-management/team-service';
import { validateTeamRole } from '@/lib/enums';

// GET /api/project-management/team
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
    const projectId = searchParams.get('projectId');
    const memberId = searchParams.get('memberId');

    // Get projects for a specific member
    if (memberId) {
      const activeOnly = searchParams.get('activeOnly') !== 'false';
      const projects = await getMemberProjects(tenantId, memberId, activeOnly);
      return NextResponse.json({ projects, total: projects.length });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required parameter: projectId or memberId' },
        { status: 400 }
      );
    }

    // Check if stats only
    if (searchParams.get('stats') === 'true') {
      const stats = await getTeamStats(tenantId, projectId);
      return NextResponse.json(stats);
    }

    // Check if workload view
    if (searchParams.get('view') === 'workload') {
      const workload = await getTeamWorkload(tenantId, projectId);
      return NextResponse.json({ workload });
    }

    // Phase 11B: Using type-safe enum validator
    const filters: TeamMemberFilters = {
      projectId,
      role: validateTeamRole(searchParams.get('role')),
      memberType: searchParams.get('memberType') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
    };

    const members = await listTeamMembers(tenantId, filters);
    return NextResponse.json({ members, total: members.length });
  } catch (error) {
    console.error('GET /api/project-management/team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/team
export async function POST(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const platformInstanceId = request.headers.get('x-platform-instance-id') || tenantId;
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, ...memberData }: { projectId: string } & AddTeamMemberInput = body;

    if (!projectId || !memberData.memberId || !memberData.memberName) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, memberId, memberName' },
        { status: 400 }
      );
    }

    const member = await addTeamMember(
      tenantId,
      platformInstanceId!,
      projectId,
      memberData,
      userId || undefined
    );

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-management/team error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
