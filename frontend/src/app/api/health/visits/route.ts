/**
 * HEALTH SUITE: Visits API
 * 
 * GET - List visits or get by ID
 * POST - Create visit (from appointment or walk-in)
 * PATCH - Update visit status
 * 
 * @module api/health/visits
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthVisitStatus } from '@prisma/client'

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
    const visitNumber = searchParams.get('visitNumber')
    const action = searchParams.get('action')

    if (id || visitNumber) {
      const visit = await prisma.health_visit.findFirst({
        where: {
          tenantId,
          ...(id ? { id } : { visitNumber: visitNumber! }),
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true, allergies: true } },
          provider: { select: { id: true, firstName: true, lastName: true, title: true } },
          facility: { select: { id: true, name: true } },
          appointment: true,
          encounters: { orderBy: { createdAt: 'desc' } },
          billingFacts: true,
        },
      })
      if (!visit) {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, visit })
    }

    // Get waiting queue
    if (action === 'queue') {
      const facilityId = searchParams.get('facilityId')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const where: Record<string, unknown> = {
        tenantId,
        visitDate: { gte: today },
        status: { in: ['REGISTERED', 'WAITING', 'IN_LAB'] },
      }
      if (facilityId) where.facilityId = facilityId

      const queue = await prisma.health_visit.findMany({
        where,
        orderBy: { registeredAt: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        },
      })

      return NextResponse.json({ success: true, queue })
    }

    // List with filters
    const patientId = searchParams.get('patientId')
    const providerId = searchParams.get('providerId')
    const facilityId = searchParams.get('facilityId')
    const status = searchParams.get('status') as HealthVisitStatus | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (patientId) where.patientId = patientId
    if (providerId) where.providerId = providerId
    if (facilityId) where.facilityId = facilityId
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.visitDate = {}
      if (dateFrom) (where.visitDate as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) (where.visitDate as Record<string, Date>).lte = new Date(dateTo)
    }

    const [visits, total] = await Promise.all([
      prisma.health_visit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          provider: { select: { id: true, firstName: true, lastName: true, title: true } },
          facility: { select: { id: true, name: true } },
        },
      }),
      prisma.health_visit.count({ where }),
    ])

    return NextResponse.json({ success: true, visits, total, page, limit })
  } catch (error) {
    console.error('Visits GET error:', error)
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

    if (!body.patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    // Generate visit number
    const config = await prisma.health_config.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    })
    const prefix = config.visitNumberPrefix || 'VST'
    const seq = config.visitNumberNextSeq || 1
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const visitNumber = `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`

    await prisma.health_config.update({
      where: { tenantId },
      data: { visitNumberNextSeq: seq + 1 },
    })

    const isWalkIn = body.isWalkIn || !body.appointmentId

    const visit = await prisma.health_visit.create({
      data: {
        tenantId,
        visitNumber,
        patientId: body.patientId,
        appointmentId: body.appointmentId,
        providerId: body.providerId,
        facilityId: body.facilityId,
        chiefComplaint: body.chiefComplaint,
        isWalkIn,
        status: 'REGISTERED',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    })

    // Update appointment status if linked
    if (body.appointmentId) {
      await prisma.health_appointment.update({
        where: { id: body.appointmentId },
        data: { status: 'IN_PROGRESS' },
      })
    }

    return NextResponse.json({ success: true, visit, visitNumber })
  } catch (error) {
    console.error('Visits POST error:', error)
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
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (body.status) {
      updateData.status = body.status as HealthVisitStatus
      if (body.status === 'IN_CONSULTATION') {
        updateData.consultStartAt = new Date()
      } else if (body.status === 'COMPLETED' || body.status === 'DISCHARGED') {
        updateData.consultEndAt = new Date()
        updateData.dischargedAt = new Date()
      }
    }

    if (body.providerId) updateData.providerId = body.providerId
    if (body.chiefComplaint) updateData.chiefComplaint = body.chiefComplaint

    const visit = await prisma.health_visit.update({
      where: { id: body.id, tenantId },
      data: updateData,
    })

    // Update linked appointment
    if (visit.appointmentId && (body.status === 'COMPLETED' || body.status === 'DISCHARGED')) {
      await prisma.health_appointment.update({
        where: { id: visit.appointmentId },
        data: { status: 'COMPLETED' },
      })
    }

    return NextResponse.json({ success: true, visit })
  } catch (error) {
    console.error('Visits PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
