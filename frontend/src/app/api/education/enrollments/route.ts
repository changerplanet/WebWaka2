export const dynamic = 'force-dynamic'

/**
 * EDUCATION SUITE: Enrollments API
 * 
 * GET - List enrollments
 * POST - Manage enrollments
 * 
 * @module api/education/enrollments
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

// ============================================================================
// GET - List enrollments
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

    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const sessionId = searchParams.get('sessionId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (studentId) where.studentId = studentId
    if (classId) where.classId = classId
    if (sessionId) where.sessionId = sessionId
    if (status) where.status = status

    const [enrollments, total] = await Promise.all([
      prisma.edu_enrollment.findMany({
        where,
        include: {
          student: { select: { id: true, fullName: true, studentId: true, status: true } },
          class: { select: { id: true, name: true, code: true } },
          session: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.edu_enrollment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      enrollments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[Education Enrollments API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Manage enrollments
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
      case 'enroll': {
        const { studentId, classId, sessionId, isRepeating, repeatReason } = body

        if (!studentId || !classId || !sessionId) {
          return NextResponse.json(
            { error: 'studentId, classId, and sessionId are required' },
            { status: 400 }
          )
        }

        // Check if already enrolled
        const existing = await prisma.edu_enrollment.findFirst({
          where: { studentId, classId, sessionId },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Student is already enrolled in this class for this session' },
            { status: 400 }
          )
        }

        // Check student exists and is active
        const student = await prisma.edu_student.findFirst({
          where: { id: studentId, tenantId },
        })

        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Create enrollment
        const enrollment = await prisma.edu_enrollment.create({
          data: {
            tenantId,
            studentId,
            classId,
            sessionId,
            status: 'ENROLLED',
            enrollmentDate: new Date(),
            isRepeating: isRepeating || false,
            repeatReason,
          },
          include: {
            student: true,
            class: true,
            session: true,
          },
        })

        // Update student status if prospective
        if (student.status === 'PROSPECTIVE') {
          await prisma.edu_student.update({
            where: { id: studentId },
            data: { status: 'ACTIVE', statusChangedAt: new Date() },
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Student enrolled successfully',
          enrollment,
        })
      }

      case 'bulk-enroll': {
        const { studentIds, classId, sessionId } = body

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
          return NextResponse.json({ error: 'studentIds array required' }, { status: 400 })
        }

        // Get existing enrollments
        const existing = await prisma.edu_enrollment.findMany({
          where: { classId, sessionId, studentId: { in: studentIds } },
          select: { studentId: true },
        })
        const existingIds = new Set(existing.map((e: any) => e.studentId))

        // Filter out already enrolled
        const toEnroll = studentIds.filter((id: string) => !existingIds.has(id))

        if (toEnroll.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'All students already enrolled',
            enrolled: 0,
            skipped: studentIds.length,
          })
        }

        // Bulk create
        const created = await prisma.edu_enrollment.createMany({
          data: toEnroll.map((studentId: string) => ({
            tenantId,
            studentId,
            classId,
            sessionId,
            status: 'ENROLLED',
            enrollmentDate: new Date(),
            isRepeating: false,
          })),
        })

        // Update prospective students to active
        await prisma.edu_student.updateMany({
          where: {
            id: { in: toEnroll },
            status: 'PROSPECTIVE',
          },
          data: { status: 'ACTIVE', statusChangedAt: new Date() },
        })

        return NextResponse.json({
          success: true,
          message: `${created.count} students enrolled`,
          enrolled: created.count,
          skipped: studentIds.length - created.count,
        })
      }

      case 'update-status': {
        const { id, newStatus, reason } = body

        if (!id || !newStatus) {
          return NextResponse.json(
            { error: 'Enrollment ID and new status required' },
            { status: 400 }
          )
        }

        const enrollment = await prisma.edu_enrollment.update({
          where: { id },
          data: {
            status: newStatus,
            statusChangedAt: new Date(),
            statusReason: reason,
            ...(newStatus === 'CANCELLED' && { withdrawalDate: new Date() }),
          },
        })

        return NextResponse.json({
          success: true,
          message: `Enrollment status updated to ${newStatus}`,
          enrollment,
        })
      }

      case 'transfer': {
        const { enrollmentId, newClassId } = body

        if (!enrollmentId || !newClassId) {
          return NextResponse.json(
            { error: 'Enrollment ID and new class ID required' },
            { status: 400 }
          )
        }

        // Get current enrollment
        const current = await prisma.edu_enrollment.findFirst({
          where: { id: enrollmentId, tenantId },
        })

        if (!current) {
          return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
        }

        // Cancel current enrollment
        await prisma.edu_enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'CANCELLED',
            statusChangedAt: new Date(),
            statusReason: `Transferred to new class`,
          },
        })

        // Create new enrollment
        const newEnrollment = await prisma.edu_enrollment.create({
          data: {
            tenantId,
            studentId: current.studentId,
            classId: newClassId,
            sessionId: current.sessionId,
            status: 'ENROLLED',
            enrollmentDate: new Date(),
            isRepeating: false,
          },
          include: {
            student: true,
            class: true,
            session: true,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Student transferred to new class',
          enrollment: newEnrollment,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Education Enrollments API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
