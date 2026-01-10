/**
 * HEALTH SUITE: Appointments API
 * 
 * GET - List appointments or get by ID
 * POST - Create appointment (scheduled or walk-in)
 * PATCH - Update appointment status
 * 
 * @module api/health/appointments
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthAppointmentStatus, HealthAppointmentType } from '@prisma/client'

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
    const action = searchParams.get('action')

    if (id) {
      const appointment = await prisma.health_appointment.findFirst({
        where: { id, tenantId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
          integration_providers: { select: { id: true, firstName: true, lastName: true, title: true } },
          facility: { select: { id: true, name: true } },
          visit: true,
        },
      })
      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, appointment })
    }

    // Get today's schedule for a provider
    if (action === 'today' && searchParams.get('providerId')) {
      const providerId = searchParams.get('providerId')!
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const appointments = await prisma.health_appointment.findMany({
        where: {
          tenantId,
          providerId,
          appointmentDate: { gte: today, lt: tomorrow },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        },
        orderBy: { appointmentTime: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
        },
      })

      return NextResponse.json({ success: true, appointments })
    }

    // List with filters
    const patientId = searchParams.get('patientId')
    const providerId = searchParams.get('providerId')
    const facilityId = searchParams.get('facilityId')
    const status = searchParams.get('status') as HealthAppointmentStatus | null
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
      where.appointmentDate = {}
      if (dateFrom) (where.appointmentDate as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) (where.appointmentDate as Record<string, Date>).lte = new Date(dateTo)
    }

    const [appointments, total] = await Promise.all([
      prisma.health_appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          integration_providers: { select: { id: true, firstName: true, lastName: true, title: true } },
          facility: { select: { id: true, name: true } },
        },
      }),
      prisma.health_appointment.count({ where }),
    ])

    return NextResponse.json({ success: true, appointments, total, page, limit })
  } catch (error) {
    console.error('Appointments GET error:', error)
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

    if (!body.patientId || !body.appointmentDate) {
      return NextResponse.json({ error: 'patientId and appointmentDate are required' }, { status: 400 })
    }

    const isWalkIn = body.isWalkIn || false

    const appointment = await prisma.health_appointment.create({
      data: {
        tenantId,
        patientId: body.patientId,
        providerId: body.providerId,
        facilityId: body.facilityId,
        appointmentDate: new Date(body.appointmentDate),
        appointmentTime: body.appointmentTime,
        duration: body.duration || 30,
        type: (body.type as HealthAppointmentType) || (isWalkIn ? 'WALK_IN' : 'CONSULTATION'),
        isWalkIn,
        status: isWalkIn ? 'CHECKED_IN' : 'SCHEDULED',
        reason: body.reason,
        notes: body.notes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        integration_providers: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    console.error('Appointments POST error:', error)
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
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }

    if (body.status) {
      updateData.status = body.status as HealthAppointmentStatus
      if (body.status === 'CONFIRMED') {
        updateData.confirmedAt = new Date()
        updateData.confirmedBy = session.user.id
      } else if (body.status === 'CHECKED_IN') {
        updateData.checkedInAt = new Date()
      } else if (body.status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = session.user.id
        updateData.cancellationReason = body.reason
      }
    }

    // Reschedule
    if (body.appointmentDate) {
      updateData.appointmentDate = new Date(body.appointmentDate)
      updateData.status = 'RESCHEDULED'
    }
    if (body.appointmentTime) updateData.appointmentTime = body.appointmentTime
    if (body.providerId) updateData.providerId = body.providerId

    const appointment = await prisma.health_appointment.update({
      where: { id: body.id, tenantId },
      data: updateData,
    })

    return NextResponse.json({ success: true, appointment })
  } catch (error) {
    console.error('Appointments PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
