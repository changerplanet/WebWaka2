/**
 * EDUCATION SUITE: Guardians API
 * 
 * GET - List guardians
 * POST - Create/update guardian
 * 
 * @module api/education/guardians
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { createGuardianEntity, validateGuardianInput } from '@/lib/education'

// ============================================================================
// GET - List guardians
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

    // Single guardian fetch
    const id = searchParams.get('id')
    if (id) {
      const guardian = await prisma.edu_guardian.findFirst({
        where: { id, tenantId },
        include: {
          students: {
            include: { student: true },
          },
        },
      })

      if (!guardian) {
        return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, guardian })
    }

    // List with filters
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId, isActive: true }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [guardians, total] = await Promise.all([
      prisma.edu_guardian.findMany({
        where,
        include: {
          students: {
            include: { student: { select: { id: true, fullName: true, studentId: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.edu_guardian.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      guardians,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Education Guardians API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create/update guardian
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
        // Validate input
        const validation = validateGuardianInput({ ...body, tenantId })
        if (!validation.valid) {
          return NextResponse.json(
            { error: 'Validation failed', errors: validation.errors },
            { status: 400 }
          )
        }

        // Create guardian entity
        const guardianData = createGuardianEntity({ ...body, tenantId })

        // Create in database
        const guardian = await prisma.edu_guardian.create({
          data: guardianData as any,
        })

        return NextResponse.json({
          success: true,
          message: 'Guardian created successfully',
          guardian,
        })
      }

      case 'update': {
        const { id, ...updateData } = body
        if (!id) {
          return NextResponse.json({ error: 'Guardian ID required' }, { status: 400 })
        }

        const guardian = await prisma.edu_guardian.update({
          where: { id },
          data: {
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            middleName: updateData.middleName,
            fullName: [updateData.firstName, updateData.middleName, updateData.lastName]
              .filter(Boolean)
              .join(' '),
            email: updateData.email,
            phone: updateData.phone,
            whatsapp: updateData.whatsapp,
            address: updateData.address,
            city: updateData.city,
            state: updateData.state,
            occupation: updateData.occupation,
            employer: updateData.employer,
            preferSms: updateData.preferSms,
            preferEmail: updateData.preferEmail,
            preferWhatsApp: updateData.preferWhatsApp,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Guardian updated',
          guardian,
        })
      }

      case 'deactivate': {
        const { id } = body
        if (!id) {
          return NextResponse.json({ error: 'Guardian ID required' }, { status: 400 })
        }

        const guardian = await prisma.edu_guardian.update({
          where: { id },
          data: { isActive: false },
        })

        return NextResponse.json({
          success: true,
          message: 'Guardian deactivated',
          guardian,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Education Guardians API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
