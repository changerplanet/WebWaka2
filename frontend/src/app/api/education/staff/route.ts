/**
 * EDUCATION SUITE: Staff API Routes
 * 
 * GET - List staff members
 * POST - Create/update staff, manage assignments
 * 
 * Note: This is "light" staff management.
 * Full HR (payroll, leave) is out of scope.
 * 
 * @module api/education/staff
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

// ============================================================================
// GET - List staff
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

    // Single staff fetch
    const id = searchParams.get('id')
    if (id) {
      const staff = await prisma.edu_staff.findFirst({
        where: { id, tenantId },
        include: {
          classesAsTeacher: { select: { id: true, name: true, code: true } },
          subjectAssignments: {
            include: {
              class: { select: { id: true, name: true } },
              subject: { select: { id: true, name: true } },
            },
          },
        },
      })

      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, staff })
    }

    // List with filters
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (activeOnly) where.isActive = true
    if (role) where.role = role
    if (department) where.department = department
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { staffId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [staff, total] = await Promise.all([
      prisma.edu_staff.findMany({
        where,
        include: {
          classesAsTeacher: { select: { id: true, name: true } },
        },
        orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.edu_staff.count({ where }),
    ])

    // Group by role
    const byRole = staff.reduce((acc: any, s) => {
      const r = s.role
      if (!acc[r]) acc[r] = []
      acc[r].push(s)
      return acc
    }, {} as Record<string, typeof staff>)

    return NextResponse.json({
      success: true,
      staff,
      byRole,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Education Staff API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Manage staff
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
      case 'create': {
        const { firstName, lastName, middleName, email, phone, role, department, qualifications } = body

        if (!firstName || !lastName || !role) {
          return NextResponse.json(
            { error: 'firstName, lastName, and role are required' },
            { status: 400 }
          )
        }

        // Generate staff ID
        const config = await prisma.edu_config.findUnique({ where: { tenantId } })
        const prefix = config?.staffIdPrefix || 'TCH'
        const nextSeq = config?.staffIdNextSeq || 1
        const year = new Date().getFullYear()
        const staffId = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`

        // Compute full name
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')

        // Create staff
        const staff = await prisma.edu_staff.create({
          data: {
            tenantId,
            staffId,
            firstName,
            lastName,
            middleName,
            fullName,
            email,
            phone,
            role,
            department,
            qualifications,
            employmentDate: body.employmentDate ? new Date(body.employmentDate) : new Date(),
            isActive: true,
          },
        })

        // Update sequence
        await prisma.edu_config.update({
          where: { tenantId },
          data: { staffIdNextSeq: nextSeq + 1 },
        })

        return NextResponse.json({
          success: true,
          message: 'Staff member created',
          staff,
        })
      }

      case 'update': {
        const { id, ...updateData } = body

        if (!id) {
          return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
        }

        const fullName = [updateData.firstName, updateData.middleName, updateData.lastName]
          .filter(Boolean)
          .join(' ')

        const staff = await prisma.edu_staff.update({
          where: { id },
          data: {
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            middleName: updateData.middleName,
            fullName,
            email: updateData.email,
            phone: updateData.phone,
            role: updateData.role,
            department: updateData.department,
            qualifications: updateData.qualifications,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Staff updated',
          staff,
        })
      }

      case 'assign-class-teacher': {
        // Assign staff as class teacher
        const { staffId, classId } = body

        if (!staffId || !classId) {
          return NextResponse.json(
            { error: 'staffId and classId required' },
            { status: 400 }
          )
        }

        // Update the class
        const eduClass = await prisma.edu_class.update({
          where: { id: classId },
          data: { classTeacherId: staffId },
          include: { classTeacher: true },
        })

        return NextResponse.json({
          success: true,
          message: 'Class teacher assigned',
          class: eduClass,
        })
      }

      case 'assign-subject-teacher': {
        // Assign staff to teach a subject in a class
        const { staffId, classId, subjectId, caWeight, examWeight } = body

        if (!staffId || !classId || !subjectId) {
          return NextResponse.json(
            { error: 'staffId, classId, and subjectId required' },
            { status: 400 }
          )
        }

        const assignment = await prisma.edu_class_subject.upsert({
          where: { classId_subjectId: { classId, subjectId } },
          create: {
            tenantId,
            classId,
            subjectId,
            teacherId: staffId,
            caWeight: caWeight || 40,
            examWeight: examWeight || 60,
            isActive: true,
          },
          update: {
            teacherId: staffId,
            caWeight: caWeight || 40,
            examWeight: examWeight || 60,
          },
          include: {
            teacher: true,
            class: true,
            subject: true,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Subject teacher assigned',
          assignment,
        })
      }

      case 'deactivate': {
        const { id } = body

        if (!id) {
          return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
        }

        const staff = await prisma.edu_staff.update({
          where: { id },
          data: { isActive: false },
        })

        return NextResponse.json({
          success: true,
          message: 'Staff member deactivated',
          staff,
        })
      }

      case 'link-user': {
        // Link staff to a platform user account
        const { staffId, userId } = body

        if (!staffId || !userId) {
          return NextResponse.json(
            { error: 'staffId and userId required' },
            { status: 400 }
          )
        }

        const staff = await prisma.edu_staff.update({
          where: { id: staffId },
          data: { userId },
        })

        return NextResponse.json({
          success: true,
          message: 'Staff linked to user account',
          staff,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Education Staff API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
