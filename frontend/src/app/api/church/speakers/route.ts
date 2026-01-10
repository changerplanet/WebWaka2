/**
 * Church Suite — Speaker Invites API
 * Phase 2: Ministries, Services & Events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSpeakerInvite,
  updateSpeakerInviteStatus,
  listSpeakerInvites,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/speakers
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const churchId = searchParams.get('churchId');

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    const status = searchParams.get('status') || undefined;
    const invites = await listSpeakerInvites(tenantId, churchId, status);

    return NextResponse.json({
      invites,
      total: invites.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Speaker Invites Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/speakers
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Update status action
    if (action === 'updateStatus') {
      if (!body.inviteId || !body.status) {
        return NextResponse.json(
          { error: 'inviteId and status are required' },
          { status: 400 }
        );
      }
      const invite = await updateSpeakerInviteStatus(tenantId, body.inviteId, body.status, actorId);
      return NextResponse.json({
        invite,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create invite
    if (!body.churchId || !body.speakerName || !body.scheduledDate) {
      return NextResponse.json(
        { error: 'churchId, speakerName, and scheduledDate are required' },
        { status: 400 }
      );
    }

    const invite = await createSpeakerInvite(tenantId, body, actorId);

    return NextResponse.json({
      invite,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Speaker Invite Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
