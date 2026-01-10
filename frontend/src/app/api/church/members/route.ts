/**
 * Church Suite — Members API
 * Phase 1: Registry & Membership
 * 
 * ⚠️ SAFEGUARDING: Minors data is protected
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  registerMember,
  listMembers,
  getMemberStats,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/members - List members
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Stats mode
    if (searchParams.get('stats') === 'true') {
      const churchId = searchParams.get('churchId');
      if (!churchId) {
        return NextResponse.json(
          { error: 'churchId required for stats' },
          { status: 400 }
        );
      }
      const unitId = searchParams.get('unitId') || undefined;
      const stats = await getMemberStats(tenantId, churchId, unitId);
      return NextResponse.json({
        stats,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    const filters = {
      churchId: searchParams.get('churchId') || undefined,
      unitId: searchParams.get('unitId') || undefined,
      status: searchParams.get('status') as any || undefined,
      isMinor: searchParams.get('isMinor') === 'true' ? true :
               searchParams.get('isMinor') === 'false' ? false : undefined,
      state: searchParams.get('state') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await listMembers(tenantId, filters);

    return NextResponse.json({
      ...result,
      _safeguarding_notice: 'Minors contact information is masked for protection',
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('List Members Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/members - Register member
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

    // Validation
    if (!body.churchId || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'churchId, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    const member = await registerMember(tenantId, body, actorId);

    return NextResponse.json({
      member,
      _safeguarding_notice: member.isMinor ? 'MINOR_REGISTERED — Guardian linkage required' : undefined,
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Register Member Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message.includes('not found') ? 404 : 500 }
    );
  }
}
