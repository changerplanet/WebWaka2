export const dynamic = 'force-dynamic'

/**
 * EDUCATION SUITE: Report Cards API Routes
 * 
 * Generates report cards and academic transcripts.
 * Uses data from grading service - NO NEW SCHEMAS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  generateReportCard,
  generateClassReportCards,
  generateTranscript,
  addTeacherRemarks,
  addPrincipalRemarks,
  getRemarkSuggestion,
} from '@/lib/education/report-card-service';

/**
 * GET /api/education/report-cards
 * Get report cards or transcripts
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
  const action = searchParams.get('action') || 'generate';

  try {
    switch (action) {
      case 'generate': {
        // Generate report card for a student
        const studentId = searchParams.get('studentId');
        const sessionId = searchParams.get('sessionId') || undefined;
        const termId = searchParams.get('termId') || undefined;

        if (!studentId) {
          return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
        }

        const result = await generateReportCard(tenantId, studentId, sessionId, termId);

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, reportCard: result.data });
      }

      case 'transcript': {
        // Generate academic transcript
        const studentId = searchParams.get('studentId');

        if (!studentId) {
          return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
        }

        const result = await generateTranscript(tenantId, studentId);

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, transcript: result.data });
      }

      case 'remark-suggestions': {
        // Get remark suggestions based on average score
        const averageScore = searchParams.get('averageScore');

        if (!averageScore) {
          return NextResponse.json({ success: false, error: 'Average score required' }, { status: 400 });
        }

        const suggestions = getRemarkSuggestion(parseFloat(averageScore));
        return NextResponse.json({ success: true, suggestions });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Report Cards API] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/education/report-cards
 * Generate report cards or add remarks
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
      case 'generate-class': {
        // Generate report cards for entire class
        const { classId, sessionId, termId } = body;

        if (!classId) {
          return NextResponse.json({ success: false, error: 'Class ID required' }, { status: 400 });
        }

        const result = await generateClassReportCards(tenantId, classId, sessionId, termId);

        return NextResponse.json({
          success: result.success,
          generated: result.generated,
          errors: result.errors.length > 0 ? result.errors : undefined,
        });
      }

      case 'add-teacher-remarks': {
        const { studentId, sessionId, termId, remarks } = body;

        if (!studentId || !sessionId || !termId || !remarks) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: studentId, sessionId, termId, remarks' 
          }, { status: 400 });
        }

        const result = await addTeacherRemarks(tenantId, studentId, sessionId, termId, remarks);

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Teacher remarks added' });
      }

      case 'add-principal-remarks': {
        const { studentId, sessionId, termId, remarks } = body;

        if (!studentId || !sessionId || !termId || !remarks) {
          return NextResponse.json({ 
            success: false, 
            error: 'Required fields: studentId, sessionId, termId, remarks' 
          }, { status: 400 });
        }

        const result = await addPrincipalRemarks(tenantId, studentId, sessionId, termId, remarks);

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Principal remarks added' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Education Report Cards API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
