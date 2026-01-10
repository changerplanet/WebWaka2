/**
 * EDUCATION SUITE: Assessments & Results API
 * 
 * GET - Get assessments and results
 * POST - Record assessments, compute results
 * 
 * @module api/education/assessments
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import {
  createAssessmentEntity,
  createResultEntity,
  validateAssessmentInput,
  getGradeFromScore,
  calculatePositions,
  calculateClassAverage,
  isValidResultStatusTransition,
  canModifyResult,
  createResultLock,
  NIGERIA_GRADE_BOUNDARIES,
} from '@/lib/education'

// ============================================================================
// GET - Get assessments and results
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || 'assessments'

    switch (entity) {
      case 'assessments': {
        const studentId = searchParams.get('studentId')
        const classId = searchParams.get('classId')
        const subjectId = searchParams.get('subjectId')
        const termId = searchParams.get('termId')

        const where: any = { tenantId }
        if (studentId) where.studentId = studentId
        if (classId) where.classId = classId
        if (subjectId) where.subjectId = subjectId
        if (termId) where.termId = termId

        const assessments = await prisma.edu_assessment.findMany({
          where,
          include: {
            student: { select: { id: true, fullName: true, studentId: true } },
            subject: { select: { id: true, name: true, code: true } },
            gradedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, assessments })
      }

      case 'results': {
        const studentId = searchParams.get('studentId')
        const classId = searchParams.get('classId')
        const subjectId = searchParams.get('subjectId')
        const termId = searchParams.get('termId')
        const sessionId = searchParams.get('sessionId')
        const status = searchParams.get('status')

        const where: any = { tenantId }
        if (studentId) where.studentId = studentId
        if (classId) where.classId = classId
        if (subjectId) where.subjectId = subjectId
        if (termId) where.termId = termId
        if (sessionId) where.sessionId = sessionId
        if (status) where.status = status

        const results = await prisma.edu_result.findMany({
          where,
          include: {
            student: { select: { id: true, fullName: true, studentId: true } },
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
            term: { select: { id: true, name: true } },
            session: { select: { id: true, name: true } },
          },
          orderBy: [{ student: { fullName: 'asc' } }, { subject: { name: 'asc' } }],
        })

        return NextResponse.json({ success: true, results })
      }

      case 'result-sheet': {
        // Get complete result sheet for a student
        const studentId = searchParams.get('studentId')
        const termId = searchParams.get('termId')

        if (!studentId || !termId) {
          return NextResponse.json(
            { error: 'studentId and termId required' },
            { status: 400 }
          )
        }

        const [student, results, term] = await Promise.all([
          prisma.edu_student.findFirst({
            where: { id: studentId, tenantId },
            include: {
              mkt_workflow_enrollments: {
                where: { status: 'ENROLLED' },
                include: { class: true },
                take: 1,
              },
            },
          }),
          prisma.edu_result.findMany({
            where: { studentId, termId, tenantId },
            include: {
              subject: true,
            },
            orderBy: { subject: { name: 'asc' } },
          }),
          prisma.edu_term.findFirst({
            where: { id: termId },
            include: { session: true },
          }),
        ])

        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Calculate aggregates
        const totalScore = results.reduce((sum: any, r: any) => sum + Number(r.totalScore), 0)
        const averageScore = results.length > 0 ? totalScore / results.length : 0
        const overallGrade = getGradeFromScore(averageScore, NIGERIA_GRADE_BOUNDARIES)

        return NextResponse.json({
          success: true,
          resultSheet: {
            student: {
              ...student,
              class: student.enrollments[0]?.class,
            },
            term,
            results,
            summary: {
              subjectCount: results.length,
              totalScore,
              averageScore: Math.round(averageScore * 100) / 100,
              overallGrade: overallGrade?.grade,
              overallRemark: overallGrade?.remark,
            },
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Education Assessments API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Record assessments and manage results
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'education')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'record-assessment': {
        const validation = validateAssessmentInput({ ...body, tenantId })
        if (!validation.valid) {
          return NextResponse.json(
            { error: 'Validation failed', errors: validation.errors },
            { status: 400 }
          )
        }

        const assessmentData = createAssessmentEntity({ ...body, tenantId })
        const assessment = await prisma.edu_assessment.create({
          data: assessmentData as any,
        })

        return NextResponse.json({
          success: true,
          message: 'Assessment recorded',
          assessment,
        })
      }

      case 'bulk-record-assessment': {
        const { classId, subjectId, termId, assessmentType, assessmentName, maxScore, scores, gradedById } =
          body

        if (!classId || !subjectId || !termId || !Array.isArray(scores)) {
          return NextResponse.json(
            { error: 'classId, subjectId, termId, and scores array required' },
            { status: 400 }
          )
        }

        const now = new Date()
        const created = await prisma.edu_assessment.createMany({
          data: scores.map((s: any) => ({
            tenantId,
            studentId: s.studentId,
            classId,
            subjectId,
            termId,
            assessmentType: assessmentType || 'CONTINUOUS_ASSESSMENT',
            assessmentName,
            maxScore: maxScore || 100,
            score: s.score,
            gradedById,
            gradedAt: now,
            teacherComment: s.comment,
          })),
        })

        return NextResponse.json({
          success: true,
          message: `${created.count} assessments recorded`,
          count: created.count,
        })
      }

      case 'compute-results': {
        // Compute results for a class/subject/term
        const { classId, subjectId, termId, sessionId, examScores } = body

        if (!classId || !subjectId || !termId || !sessionId) {
          return NextResponse.json(
            { error: 'classId, subjectId, termId, and sessionId required' },
            { status: 400 }
          )
        }

        // Get enrolled students
        const enrollments = await prisma.edu_enrollment.findMany({
          where: { classId, sessionId, status: 'ENROLLED', tenantId },
          select: { studentId: true },
        })

        const studentIds = enrollments.map((e: any) => e.studentId)
        const results: any[] = []

        for (const studentId of studentIds) {
          // Get CA assessments
          const assessments = await prisma.edu_assessment.findMany({
            where: {
              tenantId,
              studentId,
              classId,
              subjectId,
              termId,
              assessmentType: { in: ['CONTINUOUS_ASSESSMENT', 'TEST', 'QUIZ', 'ASSIGNMENT', 'PROJECT'] },
            },
          })

          // Get exam score from input
          const examScore = examScores?.[studentId] || 0

          // Create result entity using service
          const resultData = createResultEntity({
            tenantId,
            studentId,
            classId,
            subjectId,
            termId,
            sessionId,
            assessments: assessments as any,
            examScore,
          })

          // Upsert result
          const result = await prisma.edu_result.upsert({
            where: {
              studentId_subjectId_termId: { studentId, subjectId, termId },
            },
            create: resultData as any,
            update: {
              caScore: resultData.caScore,
              examScore: resultData.examScore,
              totalScore: resultData.totalScore,
              grade: resultData.grade,
              gradePoint: resultData.gradePoint,
              remark: resultData.remark,
              status: 'DRAFT',
            },
          })

          results.push(result)
        }

        // Calculate positions
        const studentScores = results.map((r: any) => ({
          studentId: r.studentId,
          totalScore: Number(r.totalScore),
        }))
        const positions = calculatePositions(studentScores)
        const classAverage = calculateClassAverage(studentScores)

        // Update positions
        for (const result of results) {
          const pos = positions.get(result.studentId)
          if (pos) {
            await prisma.edu_result.update({
              where: { id: result.id },
              data: {
                classPosition: pos.position,
                classSize: pos.classSize,
              },
            })
          }
        }

        return NextResponse.json({
          success: true,
          message: `Results computed for ${results.length} students`,
          count: results.length,
          classAverage,
        })
      }

      case 'update-result-status': {
        const { id, newStatus, comment } = body

        if (!id || !newStatus) {
          return NextResponse.json({ error: 'Result ID and new status required' }, { status: 400 })
        }

        // Get current result
        const current = await prisma.edu_result.findFirst({ where: { id, tenantId } })
        if (!current) {
          return NextResponse.json({ error: 'Result not found' }, { status: 404 })
        }

        // Check if can modify
        const modifyCheck = canModifyResult(current as any)
        if (!modifyCheck.canModify) {
          return NextResponse.json({ error: modifyCheck.reason }, { status: 400 })
        }

        // Validate transition
        if (!isValidResultStatusTransition(current.status as any, newStatus)) {
          return NextResponse.json(
            { error: `Invalid status transition from ${current.status} to ${newStatus}` },
            { status: 400 }
          )
        }

        const now = new Date()
        const updateData: any = { status: newStatus, teacherComment: comment }

        if (newStatus === 'SUBMITTED') {
          updateData.submittedAt = now
          updateData.submittedById = body.submittedById
        } else if (newStatus === 'APPROVED') {
          updateData.approvedAt = now
          updateData.approvedById = body.approvedById
        } else if (newStatus === 'RELEASED') {
          updateData.releasedAt = now
        } else if (newStatus === 'LOCKED') {
          const lock = createResultLock(body.lockReason || 'Term completed')
          Object.assign(updateData, lock)
        }

        const result = await prisma.edu_result.update({
          where: { id },
          data: updateData,
        })

        return NextResponse.json({
          success: true,
          message: `Result status updated to ${newStatus}`,
          result,
        })
      }

      case 'bulk-approve': {
        const { resultIds, approvedById } = body

        if (!Array.isArray(resultIds) || resultIds.length === 0) {
          return NextResponse.json({ error: 'resultIds array required' }, { status: 400 })
        }

        const now = new Date()
        const updated = await prisma.edu_result.updateMany({
          where: {
            id: { in: resultIds },
            tenantId,
            status: 'SUBMITTED',
          },
          data: {
            status: 'APPROVED',
            approvedAt: now,
            approvedById,
          },
        })

        return NextResponse.json({
          success: true,
          message: `${updated.count} results approved`,
          count: updated.count,
        })
      }

      case 'release-results': {
        const { termId, classId } = body

        if (!termId) {
          return NextResponse.json({ error: 'termId required' }, { status: 400 })
        }

        const where: any = { tenantId, termId, status: 'APPROVED' }
        if (classId) where.classId = classId

        const now = new Date()
        const updated = await prisma.edu_result.updateMany({
          where,
          data: {
            status: 'RELEASED',
            releasedAt: now,
          },
        })

        return NextResponse.json({
          success: true,
          message: `${updated.count} results released`,
          count: updated.count,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Education Assessments API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
