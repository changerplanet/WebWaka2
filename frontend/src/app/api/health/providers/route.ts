/**
 * HEALTH SUITE: Providers API
 * 
 * GET - List providers or get by ID
 * POST - Create provider
 * PATCH - Update provider
 * 
 * @module api/health/providers
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthProviderRole } from '@prisma/client'

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
      const provider = await prisma.health_provider.findFirst({
        where: { id, tenantId },
        include: { facility: true },
      })
      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, provider })
    }

    const role = searchParams.get('role') as HealthProviderRole | null
    const facilityId = searchParams.get('facilityId')
    const specialty = searchParams.get('specialty')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId, isActive: true }
    if (role) where.role = role
    if (facilityId) where.facilityId = facilityId
    if (specialty) where.specialty = specialty

    const [providers, total] = await Promise.all([
      prisma.health_provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastName: 'asc' },
        include: { facility: { select: { id: true, name: true } } },
      }),
      prisma.health_provider.count({ where }),
    ])

    return NextResponse.json({ success: true, providers, total, page, limit })
  } catch (error) {
    console.error('Providers GET error:', error)
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

    if (!body.firstName || !body.lastName || !body.role) {
      return NextResponse.json({ error: 'firstName, lastName, and role are required' }, { status: 400 })
    }

    const provider = await prisma.health_provider.create({
      data: {
        tenantId,
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title,
        role: body.role as HealthProviderRole,
        specialty: body.specialty,
        licenseNumber: body.licenseNumber,
        qualifications: body.qualifications,
        phone: body.phone,
        email: body.email,
        facilityId: body.facilityId,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error('Providers POST error:', error)
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
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const provider = await prisma.health_provider.update({
      where: { id: body.id, tenantId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title,
        specialty: body.specialty,
        licenseNumber: body.licenseNumber,
        qualifications: body.qualifications,
        phone: body.phone,
        email: body.email,
        facilityId: body.facilityId,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error('Providers PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
