export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { educationPortalService } from '@/lib/portals/education/education-portal-service';
import { getCurrentSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const notices = await educationPortalService.getNotices(tenantId);

    const serializedNotices = notices.map(n => ({
      ...n,
      publishedAt: n.publishedAt.toISOString(),
      expiresAt: n.expiresAt?.toISOString() || null,
    }));

    return NextResponse.json({ data: serializedNotices });
  } catch (error) {
    console.error('Education portal notices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
