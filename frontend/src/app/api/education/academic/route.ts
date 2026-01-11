export const dynamic = 'force-dynamic'

/**
 * EDUCATION SUITE: Academic API Routes
 * 
 * Manages academic sessions, terms, classes, and subjects.
 * Uses tenant metadata storage - NO NEW SCHEMAS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  getAcademicSessions,
  getActiveSession,
  createAcademicSession,
  updateAcademicSession,
  getActiveTerm,
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  getClassSubjects,
  getClassStudents,
  assignStudentToClass,
  seedDefaultSchoolStructure,
} from '@/lib/education/academic-service';

/**
 * GET /api/education/academic
 * Get academic data (sessions, terms, classes, subjects)
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource') || 'overview';

  try {
    switch (resource) {
      case 'overview': {
        // Get complete academic overview
        const [sessions, activeSession, activeTerm, classes, subjects] = await Promise.all([
          getAcademicSessions(tenantId),
          getActiveSession(tenantId),
          getActiveTerm(tenantId),
          getClasses(tenantId),
          getSubjects(tenantId),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            sessions,
            activeSession,
            activeTerm,
            classes,
            subjects,
            totalClasses: classes.length,
            totalSubjects: subjects.length,
          },
        });
      }

      case 'sessions': {
        const sessions = await getAcademicSessions(tenantId);
        return NextResponse.json({ success: true, sessions });
      }

      case 'active-session': {
        const activeSession = await getActiveSession(tenantId);
        const activeTerm = await getActiveTerm(tenantId);
        return NextResponse.json({ success: true, session: activeSession, term: activeTerm });
      }

      case 'classes': {
        const classId = searchParams.get('classId');
        if (classId) {
          const classConfig = await getClass(tenantId, classId);
          if (!classConfig) {
            return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
          }
          return NextResponse.json({ success: true, class: classConfig });
        }
        const classes = await getClasses(tenantId);
        return NextResponse.json({ success: true, classes });
      }

      case 'class-students': {
        const classId = searchParams.get('classId');
        if (!classId) {
          return NextResponse.json({ success: false, error: 'Class ID required' }, { status: 400 });
        }
        const students = await getClassStudents(tenantId, classId);
        return NextResponse.json({ success: true, students });
      }

      case 'subjects': {
        const classId = searchParams.get('classId');
        if (classId) {
          const subjects = await getClassSubjects(tenantId, classId);
          return NextResponse.json({ success: true, subjects });
        }
        const allSubjects = await getSubjects(tenantId);
        return NextResponse.json({ success: true, subjects: allSubjects });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid resource' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Academic API] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/education/academic
 * Create academic entities
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-session': {
        const { name, startDate, endDate, terms, isActive } = body;

        if (!name || !startDate || !endDate) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: name, startDate, endDate' 
          }, { status: 400 });
        }

        const newSession = await createAcademicSession(tenantId, {
          name,
          startDate,
          endDate,
          terms: terms || [],
          isActive: isActive ?? true,
        });

        return NextResponse.json({ success: true, session: newSession });
      }

      case 'create-class': {
        const { name, shortName, gradeLevel, sections, subjects, classTeacherId, capacity } = body;

        if (!name || !gradeLevel) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: name, gradeLevel' 
          }, { status: 400 });
        }

        const newClass = await createClass(tenantId, {
          name,
          shortName: shortName || name,
          gradeLevel,
          sections: sections || ['A'],
          subjects: subjects || [],
          classTeacherId,
          capacity,
        });

        return NextResponse.json({ success: true, class: newClass });
      }

      case 'create-subject': {
        const { code, name, shortName, creditUnits, isCompulsory, assessmentWeights } = body;

        if (!code || !name) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: code, name' 
          }, { status: 400 });
        }

        const newSubject = await createSubject(tenantId, {
          code,
          name,
          shortName: shortName || name,
          creditUnits,
          isCompulsory: isCompulsory ?? false,
          assessmentWeights: assessmentWeights || { EXAM: 60, CONTINUOUS: 40 },
        });

        return NextResponse.json({ success: true, subject: newSubject });
      }

      case 'assign-student': {
        const { studentId, classId, section, rollNumber } = body;

        if (!studentId || !classId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: studentId, classId' 
          }, { status: 400 });
        }

        const success = await assignStudentToClass(tenantId, studentId, classId, section, rollNumber);

        if (!success) {
          return NextResponse.json({ success: false, error: 'Failed to assign student' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Student assigned to class' });
      }

      case 'seed-defaults': {
        await seedDefaultSchoolStructure(tenantId);
        return NextResponse.json({ success: true, message: 'Default structure seeded' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Academic API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/education/academic
 * Update academic entities
 */
export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    switch (action) {
      case 'update-session': {
        const updated = await updateAcademicSession(tenantId, id, body);
        if (!updated) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, session: updated });
      }

      case 'update-class': {
        const updated = await updateClass(tenantId, id, body);
        if (!updated) {
          return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, class: updated });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Academic API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/education/academic
 * Delete academic entities
 */
export async function DELETE(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');
  const id = searchParams.get('id');

  if (!resource || !id) {
    return NextResponse.json({ success: false, error: 'Resource and ID required' }, { status: 400 });
  }

  try {
    switch (resource) {
      case 'class': {
        const deleted = await deleteClass(tenantId, id);
        if (!deleted) {
          return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Class deleted' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid resource' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Academic API] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
