/**
 * HEALTH SUITE: Lab Orders API
 * 
 * Lab/diagnostic orders and results.
 * Results are IMMUTABLE after creation.
 * 
 * GET - List lab orders, get by ID, get results
 * POST - Create order, record result
 * PATCH - Update order status, verify result
 * 
 * @module api/health/lab-orders
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthLabOrderStatus, HealthLabOrderUrgency, HealthResultInterpretation } from '@prisma/client'

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
    const entity = searchParams.get('entity')

    if (id) {
      const labOrder = await prisma.health_lab_order.findFirst({
        where: { id, tenantId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
          orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
          encounter: { select: { id: true, encounterDate: true } },
          results: { orderBy: { createdAt: 'asc' } },
        },
      })
      if (!labOrder) {
        return NextResponse.json({ error: 'Lab order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, labOrder })
    }

    // Get results for a lab order
    if (entity === 'results' && searchParams.get('labOrderId')) {
      const results = await prisma.health_lab_result.findMany({
        where: { tenantId, labOrderId: searchParams.get('labOrderId')! },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ success: true, results })
    }

    // Get pending lab orders (queue)
    if (searchParams.get('pending') === 'true') {
      const labOrders = await prisma.health_lab_order.findMany({
        where: {
          tenantId,
          status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] },
        },
        orderBy: [{ urgency: 'desc' }, { orderedAt: 'asc' }],
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
          orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
        },
      })
      return NextResponse.json({ success: true, labOrders })
    }

    // Get patient lab history
    if (searchParams.get('patientId') && searchParams.get('history') === 'true') {
      const patientId = searchParams.get('patientId')!
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const [labOrders, total] = await Promise.all([
        prisma.health_lab_order.findMany({
          where: { tenantId, patientId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { orderedAt: 'desc' },
          include: {
            orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
            results: true,
          },
        }),
        prisma.health_lab_order.count({ where: { tenantId, patientId } }),
      ])

      return NextResponse.json({ success: true, labOrders, total, page, limit })
    }

    // List with filters
    const patientId = searchParams.get('patientId')
    const orderedById = searchParams.get('orderedById')
    const encounterId = searchParams.get('encounterId')
    const status = searchParams.get('status') as HealthLabOrderStatus | null
    const urgency = searchParams.get('urgency') as HealthLabOrderUrgency | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (patientId) where.patientId = patientId
    if (orderedById) where.orderedById = orderedById
    if (encounterId) where.encounterId = encounterId
    if (status) where.status = status
    if (urgency) where.urgency = urgency

    const [labOrders, total] = await Promise.all([
      prisma.health_lab_order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ urgency: 'desc' }, { orderedAt: 'desc' }],
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
          results: true,
        },
      }),
      prisma.health_lab_order.count({ where }),
    ])

    return NextResponse.json({ success: true, labOrders, total, page, limit })
  } catch (error) {
    console.error('Lab Orders GET error:', error)
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
    const action = body.action || 'create_order'

    switch (action) {
      case 'create_order': {
        if (!body.patientId || !body.encounterId || !body.orderedById || !body.testName) {
          return NextResponse.json({ error: 'patientId, encounterId, orderedById, and testName are required' }, { status: 400 })
        }

        const labOrder = await prisma.health_lab_order.create({
          data: {
            tenantId,
            patientId: body.patientId,
            encounterId: body.encounterId,
            orderedById: body.orderedById,
            testName: body.testName,
            testCode: body.testCode,
            testType: body.testType,
            urgency: (body.urgency as HealthLabOrderUrgency) || 'ROUTINE',
            clinicalInfo: body.clinicalInfo,
            status: 'ORDERED',
          },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
            orderedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
          },
        })

        return NextResponse.json({ success: true, labOrder })
      }

      case 'record_result': {
        // IMMUTABLE: Results cannot be edited after creation
        if (!body.labOrderId || !body.parameterName || !body.resultValue) {
          return NextResponse.json({ error: 'labOrderId, parameterName, and resultValue are required' }, { status: 400 })
        }

        const result = await prisma.health_lab_result.create({
          data: {
            tenantId,
            labOrderId: body.labOrderId,
            parameterName: body.parameterName,
            resultValue: body.resultValue,
            unit: body.unit,
            referenceRange: body.referenceRange,
            interpretation: (body.interpretation as HealthResultInterpretation) || 'NORMAL',
            comment: body.comment,
            resultedBy: body.resultedBy || session.user.id,
            resultedByName: body.resultedByName || session.user.name,
          },
        })

        return NextResponse.json({ success: true, result, message: 'Result recorded (immutable)' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: create_order, record_result' }, { status: 400 })
    }
  } catch (error) {
    console.error('Lab Orders POST error:', error)
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
    const action = body.action || 'update_status'

    switch (action) {
      case 'update_status': {
        if (!body.id || !body.status) {
          return NextResponse.json({ error: 'Lab order ID and status are required' }, { status: 400 })
        }

        const updateData: Record<string, unknown> = {
          status: body.status as HealthLabOrderStatus,
          updatedAt: new Date(),
        }

        if (body.status === 'SAMPLE_COLLECTED') {
          updateData.sampleCollectedAt = new Date()
        } else if (body.status === 'COMPLETED') {
          updateData.processedAt = new Date()
        }

        const labOrder = await prisma.health_lab_order.update({
          where: { id: body.id, tenantId },
          data: updateData,
        })

        return NextResponse.json({ success: true, labOrder })
      }

      case 'cancel': {
        if (!body.id) {
          return NextResponse.json({ error: 'Lab order ID is required' }, { status: 400 })
        }

        const labOrder = await prisma.health_lab_order.update({
          where: { id: body.id, tenantId },
          data: { status: 'CANCELLED', updatedAt: new Date() },
        })

        return NextResponse.json({ success: true, labOrder })
      }

      case 'verify_result': {
        // Verify an existing result (cannot modify the result itself)
        if (!body.resultId) {
          return NextResponse.json({ error: 'resultId is required' }, { status: 400 })
        }

        const result = await prisma.health_lab_result.update({
          where: { id: body.resultId, tenantId },
          data: {
            verifiedAt: new Date(),
            verifiedBy: session.user.id,
            verifiedByName: session.user.name,
          },
        })

        return NextResponse.json({ success: true, result, message: 'Result verified (immutable)' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: update_status, cancel, verify_result' }, { status: 400 })
    }
  } catch (error) {
    console.error('Lab Orders PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
