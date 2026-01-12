export const dynamic = 'force-dynamic'

/**
 * Church Suite — Guardian Links API
 * Phase 1: Registry & Membership
 * 
 * ⚠️ SAFEGUARDING: Manages guardian linkage for minors
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createGuardianLink,
  getMinorGuardians,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/guardians - Get guardians for a minor
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const minorId = searchParams.get('minorId');

    if (!minorId) {
      return NextResponse.json(
        { error: 'minorId is required' },
        { status: 400 }
      );
    }

    const guardians = await getMinorGuardians(tenantId, minorId);

    return NextResponse.json({
      guardians,
      total: guardians.length,
      _safeguarding: 'MINORS_PROTECTED',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Guardians Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/guardians - Create guardian link
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

    if (!body.minorId || !body.guardianId || !body.relationship) {
      return NextResponse.json(
        { error: 'minorId, guardianId, and relationship are required' },
        { status: 400 }
      );
    }

    const link = await createGuardianLink(tenantId, body, actorId);

    return NextResponse.json({
      link,
      _safeguarding: 'GUARDIAN_LINK_CREATED — Verification required',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Create Guardian Link Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') || message.includes('not a') ? 400 : 500 }
    );
  }
}
