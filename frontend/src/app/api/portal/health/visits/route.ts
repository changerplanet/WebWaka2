export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { healthPortalService } from '@/lib/portals/health/health-portal-service';
import { getCurrentSession } from '@/lib/auth';
import { canAccessPatient } from '@/lib/portals/authorization';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const tenantId = session.activeTenantId;

    if (!tenantId || !patientId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await canAccessPatient(session.user.id, tenantId, patientId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const visits = await healthPortalService.getVisitSummaries(tenantId, patientId);

    const serializedData = visits.map(v => ({
      ...v,
      visitDate: v.visitDate.toISOString(),
    }));

    return NextResponse.json({ data: serializedData });
  } catch (error) {
    console.error('Health portal visits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
