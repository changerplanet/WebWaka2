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
    const tenantId = session.activeTenantId;

    if (!tenantId || !studentId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await canAccessStudent(session.user.id, tenantId, studentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const profile = await educationPortalService.getStudentProfile(tenantId, studentId);

    if (!profile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const serializedProfile = {
      ...profile,
      dateOfBirth: profile.dateOfBirth?.toISOString() || null,
      admissionDate: profile.admissionDate?.toISOString() || null,
    };

    return NextResponse.json({ data: serializedProfile });
  } catch (error) {
    console.error('Education portal profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
