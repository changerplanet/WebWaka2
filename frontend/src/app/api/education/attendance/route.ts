export const dynamic = 'force-dynamic'

/**
 * EDUCATION SUITE: Student Attendance API Routes
 * 
 * STATUS: RE-ENABLED (v2-CLEAN)
 * 
 * Re-enabled as part of Phase 4A governance action.
 * Uses edu_attendance Prisma model.
 * 
 * @module api/education/attendance
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { checkCapabilityForSession } from '@/lib/capabilities';
import { prisma } from '@/lib/prisma';
import {
  createAttendanceEntity,
  createBulkAttendanceEntities,
  calculateAttendanceStats,
  calculateDailyClassSummary,
  validateAttendanceInput,
  validateBackfillDate,
} from '@/lib/education';

// ============================================================================
// GET - Get attendance records
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list': {
        const studentId = searchParams.get('studentId');
        const classId = searchParams.get('classId');
        const termId = searchParams.get('termId');
        const date = searchParams.get('date');
        const status = searchParams.get('status');

        const where: any = { tenantId };
        if (studentId) where.studentId = studentId;
        if (classId) where.classId = classId;
        if (termId) where.termId = termId;
        if (date) where.attendanceDate = new Date(date);
        if (status) where.status = status;

        const attendance = await prisma.edu_attendance.findMany({
          where,
          include: {
            student: { select: { id: true, fullName: true, studentId: true } },
            class: { select: { id: true, name: true } },
            term: { select: { id: true, name: true } },
            markedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { attendanceDate: 'desc' },
          take: 100,
        });

        return NextResponse.json({ success: true, attendance });
      }

      case 'stats': {
        const studentId = searchParams.get('studentId');
        const termId = searchParams.get('termId');

        if (!studentId || !termId) {
          return NextResponse.json(
            { error: 'studentId and termId required for stats' },
            { status: 400 }
          );
        }

        const attendance = await prisma.edu_attendance.findMany({
          where: { tenantId, studentId, termId },
        });

        const stats = calculateAttendanceStats(attendance as any);
        return NextResponse.json({ success: true, stats });
      }

      case 'daily-summary': {
        const classId = searchParams.get('classId');
        const date = searchParams.get('date');

        if (!classId || !date) {
          return NextResponse.json(
            { error: 'classId and date required for daily-summary' },
            { status: 400 }
          );
        }

        const attendance = await prisma.edu_attendance.findMany({
          where: {
            tenantId,
            classId,
            attendanceDate: new Date(date),
          },
        });

        const summary = calculateDailyClassSummary(attendance as any, new Date(date));
        return NextResponse.json({ success: true, summary });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education Attendance API] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Mark attendance
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const body = await request.json();
    const { action = 'mark-single' } = body;

    switch (action) {
      case 'mark-single': {
        const input = {
          tenantId,
          studentId: body.studentId,
          classId: body.classId,
          termId: body.termId,
          attendanceDate: new Date(body.attendanceDate),
          status: body.status,
          arrivalTime: body.arrivalTime ? new Date(body.arrivalTime) : undefined,
          notes: body.notes,
          excuseReason: body.excuseReason,
          markedById: session.user.id,
          isBackfilled: body.isBackfilled,
        };

        const validation = validateAttendanceInput(input);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.errors.join(', ') },
            { status: 400 }
          );
        }

        const entity = createAttendanceEntity(input);

        const attendance = await (prisma.edu_attendance.create as any)({
          data: entity,
        });

        return NextResponse.json({ success: true, attendanceId: attendance.id });
      }

      case 'mark-bulk': {
        const { classId, termId, attendanceDate, students, isBackfilled } = body;

        if (!classId || !termId || !attendanceDate || !students?.length) {
          return NextResponse.json(
            { error: 'classId, termId, attendanceDate, and students array required' },
            { status: 400 }
          );
        }

        const entities = createBulkAttendanceEntities(
          tenantId,
          classId,
          termId,
          new Date(attendanceDate),
          students,
          session.user.id,
          isBackfilled
        );

        const created = await prisma.$transaction(
          entities.map((entity) =>
            (prisma.edu_attendance.create as any)({ data: entity })
          )
        );

        return NextResponse.json({
          success: true,
          count: created.length,
          ids: created.map((a: any) => a.id),
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Education Attendance API] POST error:', error);
    
    // Handle unique constraint violation (duplicate attendance)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Attendance already marked for this student on this date' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update attendance
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const body = await request.json();
    const { attendanceId, status, notes, excuseReason } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: 'attendanceId required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.edu_attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    const updated = await prisma.edu_attendance.update({
      where: { id: attendanceId },
      data: {
        status: status || existing.status,
        notes: notes ?? existing.notes,
        excuseReason: excuseReason ?? existing.excuseReason,
      },
    });

    return NextResponse.json({ success: true, attendance: updated });
  } catch (error: any) {
    console.error('[Education Attendance API] PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete attendance record
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education');
    if (guardResult) return guardResult;

    const tenantId = session.activeTenantId;
    const { searchParams } = new URL(request.url);
    const attendanceId = searchParams.get('id');

    if (!attendanceId) {
      return NextResponse.json({ error: 'Attendance ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.edu_attendance.findFirst({
      where: { id: attendanceId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });
    }

    await prisma.edu_attendance.delete({
      where: { id: attendanceId },
    });

    return NextResponse.json({ success: true, message: 'Attendance deleted' });
  } catch (error: any) {
    console.error('[Education Attendance API] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
