/**
 * Church Suite — Guardian Link Detail API
 * Phase 1: Registry & Membership
 * 
 * ⚠️ SAFEGUARDING: Manages guardian linkage verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyGuardianLink,
  revokeGuardianLink,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

interface RouteParams {
  params: { id: string };
}

// GET /api/church/guardians/[id] - Get guardian link
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const { id } = params;

    const link = await prisma.chu_guardian_link.findFirst({
      where: { id, tenantId },
      include: {
        minor: { select: { firstName: true, lastName: true, isMinor: true } },
        guardian: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Guardian link not found' }, { status: 404 });
    }

    return NextResponse.json({
      link,
      _safeguarding: 'MINORS_PROTECTED',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Guardian Link Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/guardians/[id] - Actions (verify, revoke)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'verify': {
        const link = await verifyGuardianLink(tenantId, id, {
          consentGiven: body.consentGiven,
        }, actorId);
        return NextResponse.json({
          link,
          _safeguarding: 'GUARDIAN_VERIFIED',
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      case 'revoke': {
        const link = await revokeGuardianLink(tenantId, id, actorId);
        return NextResponse.json({
          link,
          _safeguarding: 'GUARDIAN_LINK_REVOKED',
          ...CHURCH_SUITE_DISCLAIMERS,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Guardian Link Action Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
