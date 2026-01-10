/**
 * HEALTH SUITE: Patients API
 * 
 * GET - List patients, get patient by ID
 * POST - Create patient
 * PATCH - Update patient (non-clinical fields only)
 * 
 * @module api/health/patients
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthPatientStatus, HealthGender, HealthBloodGroup, HealthGenotype } from '@prisma/client'

// ============================================================================
// GET - List patients or get by ID
// ============================================================================

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
    const mrn = searchParams.get('mrn')

    // Get single patient by ID or MRN
    if (id || mrn) {
      const patient = await prisma.health_patient.findFirst({
        where: {
          tenantId,
          ...(id ? { id } : { mrn: mrn! }),
        },
        include: {
          guardians: true,
        },
      })

      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, patient })
    }

    // List patients with filters
    const search = searchParams.get('search')
    const status = searchParams.get('status') as HealthPatientStatus | null
    const gender = searchParams.get('gender') as HealthGender | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (status) where.status = status
    if (gender) where.gender = gender
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { mrn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const [patients, total] = await Promise.all([
      prisma.health_patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mrn: true,
          firstName: true,
          lastName: true,
          middleName: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          genotype: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.health_patient.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      patients,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Patients GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create patient
// ============================================================================

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
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
    }

    // Generate MRN if not provided
    let mrn = body.mrn
    if (!mrn) {
      const config = await prisma.health_config.upsert({
        where: { tenantId },
        create: { tenantId },
        update: {},
      })
      const prefix = config.patientMrnPrefix || 'MRN'
      const seq = config.patientMrnNextSeq || 1
      const year = new Date().getFullYear()
      mrn = `${prefix}-${year}-${String(seq).padStart(5, '0')}`

      await prisma.health_config.update({
        where: { tenantId },
        data: { patientMrnNextSeq: seq + 1 },
      })
    }

    const patient = await prisma.health_patient.create({
      data: {
        tenantId,
        mrn,
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender as HealthGender,
        bloodGroup: (body.bloodGroup as HealthBloodGroup) || 'UNKNOWN',
        genotype: (body.genotype as HealthGenotype) || 'UNKNOWN',
        phone: body.phone,
        email: body.email,
        address: body.address,
        nationalId: body.nationalId,
        nextOfKin: body.nextOfKin,
        allergies: body.allergies,
        conditions: body.conditions,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      patient,
      mrn: patient.mrn,
    })
  } catch (error) {
    console.error('Patients POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update patient (non-clinical fields only)
// ============================================================================

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
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Only allow updating non-clinical fields
    const allowedFields = [
      'firstName', 'lastName', 'middleName', 'dateOfBirth', 'gender',
      'bloodGroup', 'genotype', 'phone', 'email', 'address', 'nationalId',
      'nextOfKin', 'status',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dateOfBirth') {
          updateData[field] = new Date(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Update isActive based on status
    if (body.status) {
      updateData.isActive = body.status === 'ACTIVE'
    }

    const patient = await prisma.health_patient.update({
      where: { id: body.id, tenantId },
      data: updateData,
    })

    return NextResponse.json({ success: true, patient })
  } catch (error) {
    console.error('Patients PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
