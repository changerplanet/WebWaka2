export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { educationPortalService } from '@/lib/portals/education/education-portal-service';
import { getCurrentSession } from '@/lib/auth';
import { canAccessStudent } from '@/lib/portals/authorization';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const termId = searchParams.get('termId') || undefined;
    const tenantId = session.activeTenantId;

    if (!tenantId || !studentId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await canAccessStudent(session.user.id, tenantId, studentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const attendanceData = await educationPortalService.getAttendance(tenantId, studentId, termId);

    const serializedData = {
      records: attendanceData.records.map(r => ({
        ...r,
        date: r.date.toISOString(),
      })),
      summary: attendanceData.summary,
    };

    return NextResponse.json({ data: serializedData });
  } catch (error) {
    console.error('Education portal attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
