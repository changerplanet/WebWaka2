export const dynamic = 'force-dynamic'

/**
 * EDUCATION SUITE: Students API Routes
 * 
 * Manages students and guardians using CRM Contact module.
 * NO NEW SCHEMAS - Wraps CRM with education-specific logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  createStudent,
  getStudent,
  listStudents,
  updateStudent,
  updateStudentStatus,
  createGuardian,
  getStudentGuardians,
  getStudentCountByClass,
} from '@/lib/education/student-service';

/**
 * GET /api/education/students
 * List students or get a single student
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT', hint: 'Set an active tenant in your session or make sure you have selected a tenant before making this request' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const studentId = searchParams.get('id');

  try {
    // Get single student
    if (studentId) {
      const student = await getStudent(tenantId, studentId);
      if (!student) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, student });
    }

    // Special actions
    if (action === 'count-by-class') {
      const counts = await getStudentCountByClass(tenantId);
      return NextResponse.json({ success: true, counts });
    }

    if (action === 'guardians') {
      const forStudentId = searchParams.get('studentId');
      if (!forStudentId) {
        return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
      }
      const guardians = await getStudentGuardians(tenantId, forStudentId);
      return NextResponse.json({ success: true, guardians });
    }

    // List students with filters
    const filters = {
      classId: searchParams.get('classId') || undefined,
      section: searchParams.get('section') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };

    const result = await listStudents(tenantId, filters);
    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('[Education Students API] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/education/students
 * Create a new student or guardian
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT', hint: 'Set an active tenant in your session or make sure you have selected a tenant before making this request' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action = 'create-student' } = body;

    switch (action) {
      case 'create-student': {
        const { 
          firstName, lastName, email, phone, dateOfBirth, gender, address,
          admissionNumber, enrollmentDate, classId, className, section, rollNumber,
          gradeLevel, stream, guardians 
        } = body;

        if (!firstName || !lastName || !admissionNumber || !enrollmentDate || !classId || !className) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: firstName, lastName, admissionNumber, enrollmentDate, classId, className' 
          }, { status: 400 });
        }

        const result = await createStudent(tenantId, {
          firstName, lastName, email, phone, dateOfBirth, gender, address,
          admissionNumber, enrollmentDate, classId, className, section, rollNumber,
          gradeLevel: gradeLevel || 1, stream, guardians,
        }, session.user.id);

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, studentId: result.studentId });
      }

      case 'create-guardian': {
        const { firstName, lastName, email, phone, relationship, studentId, isPrimary } = body;

        if (!firstName || !lastName || !phone || !relationship || !studentId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: firstName, lastName, phone, relationship, studentId' 
          }, { status: 400 });
        }

        const result = await createGuardian(tenantId, {
          firstName, lastName, email, phone, relationship, studentId, isPrimary,
        });

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, guardianId: result.guardianId });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Students API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/education/students
 * Update student details or status
 */
export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = session.activeTenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'No active tenant', code: 'NO_TENANT', hint: 'Set an active tenant in your session or make sure you have selected a tenant before making this request' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { studentId, action = 'update' } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
    }

    switch (action) {
      case 'update': {
        const result = await updateStudent(tenantId, studentId, body);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Student updated' });
      }

      case 'update-status': {
        const { status } = body;
        if (!['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'WITHDRAWN', 'SUSPENDED'].includes(status)) {
          return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const result = await updateStudentStatus(tenantId, studentId, status);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: 'Status updated' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Students API] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
