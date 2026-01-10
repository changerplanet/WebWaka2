/**
 * HEALTH SUITE: Patient Guardians API
 * 
 * Guardian management for patients.
 * Used for minors and patients requiring care authorization.
 * 
 * GET - List guardians for a patient
 * POST - Add guardian to patient
 * PATCH - Update guardian
 * DELETE - Remove guardian
 * 
 * @module api/health/guardians
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const patientId = searchParams.get('patientId')

    // Get single guardian by ID
    if (id) {
      const guardian = await prisma.health_patient_guardian.findFirst({
        where: { id, tenantId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        },
      })
      if (!guardian) {
        return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, guardian })
    }

    // Get guardians for a patient
    if (patientId) {
      const guardians = await prisma.health_patient_guardian.findMany({
        where: { tenantId, patientId },
        orderBy: [{ isPrimaryContact: 'desc' }, { createdAt: 'asc' }],
      })
      return NextResponse.json({ success: true, guardians })
    }

    // List all guardians (paginated)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [guardians, total] = await Promise.all([
      prisma.health_patient_guardian.findMany({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        },
      }),
      prisma.health_patient_guardian.count({ where: { tenantId } }),
    ])

    return NextResponse.json({ success: true, guardians, total, page, limit })
  } catch (error) {
    console.error('Guardians GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Validate required fields
    if (!body.patientId || !body.fullName || !body.relationship || !body.phone) {
      return NextResponse.json({ 
        error: 'patientId, fullName, relationship, and phone are required' 
      }, { status: 400 })
    }

    // Verify patient exists
    const patient = await prisma.health_patient.findFirst({
      where: { id: body.patientId, tenantId },
    })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // If setting as primary contact, unset others first
    if (body.isPrimaryContact) {
      await prisma.health_patient_guardian.updateMany({
        where: { tenantId, patientId: body.patientId },
        data: { isPrimaryContact: false },
      })
    }

    const guardian = await prisma.health_patient_guardian.create({
      data: {
        tenantId,
        patientId: body.patientId,
        fullName: body.fullName,
        relationship: body.relationship,
        phone: body.phone,
        email: body.email,
        address: body.address,
        isPrimaryContact: body.isPrimaryContact || false,
        canAuthorize: body.canAuthorize ?? true,
      },
    })

    return NextResponse.json({ success: true, guardian })
  } catch (error) {
    console.error('Guardians POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Guardian ID is required' }, { status: 400 })
    }

    // Get existing guardian
    const existing = await prisma.health_patient_guardian.findFirst({
      where: { id: body.id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
    }

    // If setting as primary contact, unset others first
    if (body.isPrimaryContact && !existing.isPrimaryContact) {
      await prisma.health_patient_guardian.updateMany({
        where: { tenantId, patientId: existing.patientId, id: { not: body.id } },
        data: { isPrimaryContact: false },
      })
    }

    const guardian = await prisma.health_patient_guardian.update({
      where: { id: body.id },
      data: {
        fullName: body.fullName,
        relationship: body.relationship,
        phone: body.phone,
        email: body.email,
        address: body.address,
        isPrimaryContact: body.isPrimaryContact,
        canAuthorize: body.canAuthorize,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, guardian })
  } catch (error) {
    console.error('Guardians PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Guardian ID is required' }, { status: 400 })
    }

    // Verify guardian exists and belongs to tenant
    const existing = await prisma.health_patient_guardian.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 })
    }

    await prisma.health_patient_guardian.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Guardian removed' })
  } catch (error) {
    console.error('Guardians DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
