/**
 * EDUCATION SUITE: Grades API Routes
 * 
 * Handles grade recording, GPA calculation, and academic performance tracking.
 * Stores data in CRM Contact metadata - NO NEW SCHEMAS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  recordGrade,
  recordBulkGrades,
  getStudentCurrentGrades,
  getStudentAcademicHistory,
  getClassGradeSummary,
  getSubjectPerformance,
  getStudentsAtRisk,
} from '@/lib/education/grading-service';
import { getGradeFromScore, GRADE_SCALES } from '@/lib/education/config';

/**
 * GET /api/education/grades
 * Get grades for students, classes, or subjects
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
  const action = searchParams.get('action') || 'student-current';

  try {
    switch (action) {
      case 'student-current': {
        const studentId = searchParams.get('studentId');
        if (!studentId) {
          return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
        }

        const grades = await getStudentCurrentGrades(tenantId, studentId);
        return NextResponse.json({ success: true, grades });
      }

      case 'student-history': {
        const studentId = searchParams.get('studentId');
        if (!studentId) {
          return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
        }

        const history = await getStudentAcademicHistory(tenantId, studentId);
        return NextResponse.json({ success: true, history });
      }

      case 'class-summary': {
        const classId = searchParams.get('classId');
        if (!classId) {
          return NextResponse.json({ success: false, error: 'Class ID required' }, { status: 400 });
        }

        const sessionId = searchParams.get('sessionId') || undefined;
        const termId = searchParams.get('termId') || undefined;

        const summary = await getClassGradeSummary(tenantId, classId, sessionId, termId);
        return NextResponse.json({ success: true, summary });
      }

      case 'subject-performance': {
        const classId = searchParams.get('classId');
        const subjectCode = searchParams.get('subjectCode');
        if (!classId || !subjectCode) {
          return NextResponse.json({ success: false, error: 'Class ID and subject code required' }, { status: 400 });
        }

        const performance = await getSubjectPerformance(tenantId, classId, subjectCode);
        return NextResponse.json({ success: true, performance });
      }

      case 'at-risk': {
        const classId = searchParams.get('classId');
        if (!classId) {
          return NextResponse.json({ success: false, error: 'Class ID required' }, { status: 400 });
        }

        const threshold = searchParams.get('threshold') ? parseInt(searchParams.get('threshold')!) : 40;
        const atRisk = await getStudentsAtRisk(tenantId, classId, threshold);
        return NextResponse.json({ success: true, students: atRisk });
      }

      case 'grade-scale': {
        const scale = searchParams.get('scale') || 'WAEC';
        const gradeScale = GRADE_SCALES[scale as keyof typeof GRADE_SCALES];
        if (!gradeScale) {
          return NextResponse.json({ success: false, error: 'Invalid grade scale' }, { status: 400 });
        }
        return NextResponse.json({ success: true, scale: gradeScale });
      }

      case 'calculate-grade': {
        const score = searchParams.get('score');
        const scale = searchParams.get('scale') || 'WAEC';
        if (!score) {
          return NextResponse.json({ success: false, error: 'Score required' }, { status: 400 });
        }

        const result = getGradeFromScore(parseFloat(score), scale as any);
        return NextResponse.json({ success: true, result });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Grades API] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/education/grades
 * Record grades (single or bulk)
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
    const { action = 'record-single' } = body;

    switch (action) {
      case 'record-single': {
        const { studentId, subjectCode, assessmentType, score, maxScore, remarks } = body;

        if (!studentId || !subjectCode || !assessmentType || score === undefined || !maxScore) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: studentId, subjectCode, assessmentType, score, maxScore' 
          }, { status: 400 });
        }

        const result = await recordGrade(tenantId, {
          studentId,
          subjectCode,
          assessmentType,
          score: parseFloat(score),
          maxScore: parseFloat(maxScore),
          remarks,
          recordedBy: session.user.id,
        });

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Grade recorded' });
      }

      case 'record-bulk': {
        const { classId, subjectCode, assessmentType, maxScore, grades } = body;

        if (!classId || !subjectCode || !assessmentType || !maxScore || !grades || !Array.isArray(grades)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: classId, subjectCode, assessmentType, maxScore, grades[]' 
          }, { status: 400 });
        }

        const result = await recordBulkGrades(tenantId, {
          classId,
          subjectCode,
          assessmentType,
          maxScore: parseFloat(maxScore),
          grades: grades.map((g: any) => ({
            studentId: g.studentId,
            score: parseFloat(g.score),
            remarks: g.remarks,
          })),
          recordedBy: session.user.id,
        });

        return NextResponse.json({
          success: result.success,
          processed: result.processed,
          errors: result.errors,
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Grades API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
