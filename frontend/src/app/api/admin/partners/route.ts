/**
 * PARTNER MANAGEMENT ADMIN API
 * 
 * Admin endpoints for Super Admin to manage Partners.
 * Provides read-only financial overview and administrative actions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

/**
 * GET /api/admin/partners
 * List all partners with optional filtering
 */
export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          _count: {
            select: {
              referrals: true,
              users: true,
              createdInstances: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.partner.count({ where })
    ])

    // Get aggregated stats
    const stats = await prisma.partner.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    const statusCounts = {
      PENDING: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
      TERMINATED: 0,
      ...Object.fromEntries(stats.map(s => [s.status, s._count.id]))
    }

    return NextResponse.json({
      success: true,
      partners: partners.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        email: p.email,
        phone: p.phone,
        status: p.status,
        tier: p.tier,
        createdAt: p.createdAt,
        approvedAt: p.approvedAt,
        referralCount: p._count.referrals,
        userCount: p._count.users,
        instanceCount: p._count.createdInstances
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statusCounts
    })
  } catch (error) {
    console.error('Partners list error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/partners
 * Perform admin actions on partners (approve, suspend, reinstate)
 */
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  try {
    const body = await request.json()
    const { action, partnerId, reason } = body

    if (!action || !partnerId) {
      return NextResponse.json(
        { success: false, error: 'action and partnerId required' },
        { status: 400 }
      )
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    switch (action) {
      case 'approve': {
        if (partner.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'Partner is not pending approval' },
            { status: 400 }
          )
        }

        await prisma.partner.update({
          where: { id: partnerId },
          data: { status: 'ACTIVE', approvedAt: new Date() }
        })

        await createAuditLog({
          action: 'PARTNER_APPROVED',
          actorId: authResult.user.id,
          actorEmail: authResult.user.email || 'unknown',
          targetType: 'Partner',
          targetId: partnerId,
          metadata: { partnerName: partner.name, ipAddress, userAgent }
        })

        return NextResponse.json({ success: true, message: 'Partner approved' })
      }

      case 'suspend': {
        if (partner.status !== 'ACTIVE') {
          return NextResponse.json(
            { success: false, error: 'Can only suspend active partners' },
            { status: 400 }
          )
        }

        await prisma.partner.update({
          where: { id: partnerId },
          data: { status: 'SUSPENDED' }
        })

        await createAuditLog({
          action: 'PARTNER_SUSPENDED',
          actorId: authResult.user.id,
          actorEmail: authResult.user.email || 'unknown',
          targetType: 'Partner',
          targetId: partnerId,
          metadata: { partnerName: partner.name, reason: reason || 'No reason provided', ipAddress, userAgent }
        })

        return NextResponse.json({ success: true, message: 'Partner suspended' })
      }

      case 'reinstate': {
        if (partner.status !== 'SUSPENDED') {
          return NextResponse.json(
            { success: false, error: 'Can only reinstate suspended partners' },
            { status: 400 }
          )
        }

        await prisma.partner.update({
          where: { id: partnerId },
          data: { status: 'ACTIVE' }
        })

        await createAuditLog({
          action: 'PARTNER_UPDATED',
          actorId: authResult.user.id,
          actorEmail: authResult.user.email || 'unknown',
          targetType: 'Partner',
          targetId: partnerId,
          metadata: { partnerName: partner.name, action: 'reinstated', ipAddress, userAgent }
        })

        return NextResponse.json({ success: true, message: 'Partner reinstated' })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Partner action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}
