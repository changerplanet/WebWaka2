/**
 * PROJECT MANAGEMENT SUITE — Team Member Detail API
 * Phase 7C.2, S4 API Routes
 * 
 * GET /api/project-management/team/[id] - Get team member details
 * PATCH /api/project-management/team/[id] - Update team member
 * POST /api/project-management/team/[id] - Actions (transfer ownership, set manager)
 * DELETE /api/project-management/team/[id] - Remove team member
 */

import { NextResponse } from 'next/server';
import {
  getTeamMemberById,
  updateTeamMember,
  removeTeamMember,
  deleteTeamMember,
  transferOwnership,
  setProjectManager,
  type UpdateTeamMemberInput,
} from '@/lib/project-management/team-service';

interface RouteParams {
  params: { id: string };
}

// GET /api/project-management/team/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const member = await getTeamMemberById(tenantId, params.id);

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('GET /api/project-management/team/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/project-management/team/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body: UpdateTeamMemberInput = await request.json();
    const member = await updateTeamMember(tenantId, params.id, body);

    return NextResponse.json(member);
  } catch (error) {
    console.error('PATCH /api/project-management/team/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/project-management/team/[id] - Actions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Get the team member to get their memberId
    const teamMember = await getTeamMemberById(tenantId, params.id);
    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'transferOwnership':
        await transferOwnership(tenantId, projectId, teamMember.memberId);
        return NextResponse.json({ success: true, message: 'Ownership transferred' });
      case 'setManager':
        await setProjectManager(tenantId, projectId, teamMember.memberId);
        return NextResponse.json({ success: true, message: 'Project manager set' });
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/project-management/team/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-management/team/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    if (hard) {
      await deleteTeamMember(tenantId, params.id);
    } else {
      await removeTeamMember(tenantId, params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/project-management/team/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
