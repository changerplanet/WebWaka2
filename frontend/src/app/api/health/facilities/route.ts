/**
 * HEALTH SUITE: Facilities API
 * 
 * GET - List facilities or get by ID
 * POST - Create facility
 * PATCH - Update facility
 * 
 * @module api/health/facilities
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthFacilityType } from '@prisma/client'

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
      const facility = await prisma.health_facility.findFirst({
        where: { id, tenantId },
        include: {
          providers: { where: { isActive: true } },
          _count: { select: { appointments: true, visits: true } },
        },
      })
      if (!facility) {
        return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, facility })
    }

    const type = searchParams.get('type') as HealthFacilityType | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (type) where.type = type

    const [facilities, total] = await Promise.all([
      prisma.health_facility.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.health_facility.count({ where }),
    ])

    return NextResponse.json({ success: true, facilities, total, page, limit })
  } catch (error) {
    console.error('Facilities GET error:', error)
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

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
    }

    const facility = await prisma.health_facility.create({
      data: {
        tenantId,
        name: body.name,
        code: body.code,
        type: body.type as HealthFacilityType,
        description: body.description,
        phone: body.phone,
        email: body.email,
        address: body.address,
        location: body.location,
        operatingHours: body.operatingHours,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, facility })
  } catch (error) {
    console.error('Facilities POST error:', error)
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
      return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 })
    }

    const facility = await prisma.health_facility.update({
      where: { id: body.id, tenantId },
      data: {
        name: body.name,
        description: body.description,
        phone: body.phone,
        email: body.email,
        address: body.address,
        location: body.location,
        operatingHours: body.operatingHours,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({ success: true, facility })
  } catch (error) {
    console.error('Facilities PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
