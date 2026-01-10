/**
 * HEALTH SUITE: Prescriptions API
 * 
 * Prescription facts management.
 * Health records facts only - fulfillment is external.
 * 
 * GET - List prescriptions or get by ID
 * POST - Create prescription
 * PATCH - Record dispensing, cancel
 * 
 * @module api/health/prescriptions
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthPrescriptionStatus } from '@prisma/client'

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

    if (id) {
      const prescription = await prisma.health_prescription.findFirst({
        where: { id, tenantId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
          prescriber: { select: { id: true, firstName: true, lastName: true, title: true, licenseNumber: true } },
          encounter: { select: { id: true, encounterDate: true } },
        },
      })
      if (!prescription) {
        return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, prescription })
    }

    // Get active prescriptions for a patient
    if (searchParams.get('patientId') && searchParams.get('active') === 'true') {
      const patientId = searchParams.get('patientId')!
      const prescriptions = await prisma.health_prescription.findMany({
        where: {
          tenantId,
          patientId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        orderBy: { prescribedAt: 'desc' },
        include: {
          prescriber: { select: { id: true, firstName: true, lastName: true, title: true } },
        },
      })
      return NextResponse.json({ success: true, prescriptions })
    }

    // List with filters
    const patientId = searchParams.get('patientId')
    const prescriberId = searchParams.get('prescriberId')
    const encounterId = searchParams.get('encounterId')
    const status = searchParams.get('status') as HealthPrescriptionStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (patientId) where.patientId = patientId
    if (prescriberId) where.prescriberId = prescriberId
    if (encounterId) where.encounterId = encounterId
    if (status) where.status = status

    const [prescriptions, total] = await Promise.all([
      prisma.health_prescription.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { prescribedAt: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          prescriber: { select: { id: true, firstName: true, lastName: true, title: true } },
        },
      }),
      prisma.health_prescription.count({ where }),
    ])

    return NextResponse.json({ success: true, prescriptions, total, page, limit })
  } catch (error) {
    console.error('Prescriptions GET error:', error)
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

    if (!body.patientId || !body.encounterId || !body.prescriberId || !body.medication || !body.dosage || !body.frequency || !body.duration) {
      return NextResponse.json({ error: 'patientId, encounterId, prescriberId, medication, dosage, frequency, and duration are required' }, { status: 400 })
    }

    // Default expiry: 30 days
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const prescription = await prisma.health_prescription.create({
      data: {
        tenantId,
        patientId: body.patientId,
        encounterId: body.encounterId,
        prescriberId: body.prescriberId,
        medication: body.medication,
        dosage: body.dosage,
        frequency: body.frequency,
        duration: body.duration,
        quantity: body.quantity,
        route: body.route,
        instructions: body.instructions,
        status: 'ACTIVE',
        expiresAt,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        prescriber: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    })

    return NextResponse.json({ success: true, prescription })
  } catch (error) {
    console.error('Prescriptions POST error:', error)
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
    const action = body.action || 'dispense'

    if (!body.id) {
      return NextResponse.json({ error: 'Prescription ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'dispense': {
        // Record dispensing (callback from pharmacy)
        const prescription = await prisma.health_prescription.update({
          where: { id: body.id, tenantId },
          data: {
            status: body.partial ? 'PARTIALLY_DISPENSED' : 'DISPENSED',
            dispensedAt: new Date(),
            dispensedBy: body.dispensedBy || session.user.id,
            dispensingNote: body.dispensingNote,
          },
        })
        return NextResponse.json({ success: true, prescription })
      }

      case 'cancel': {
        const prescription = await prisma.health_prescription.update({
          where: { id: body.id, tenantId },
          data: { status: 'CANCELLED', updatedAt: new Date() },
        })
        return NextResponse.json({ success: true, prescription })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: dispense, cancel' }, { status: 400 })
    }
  } catch (error) {
    console.error('Prescriptions PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
