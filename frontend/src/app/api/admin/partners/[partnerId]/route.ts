/**
 * PARTNER DETAIL ADMIN API
 * 
 * Get detailed information about a specific partner including
 * tenants, instances, and revenue summary.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{ partnerId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  const { partnerId } = await params

  try {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true
              }
            }
          }
        },
        referrals: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                appName: true,
                status: true
              }
            }
          },
          take: 50
        },
        createdInstances: {
          include: {
            tenant: {
              select: {
                name: true,
                slug: true
              }
            }
          },
          take: 50
        },
        agreements: {
          where: { status: 'ACTIVE' },
          take: 1
        },
        instanceEarnings: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Calculate revenue summary
    const [earningsAgg, totalEarnings] = await Promise.all([
      prisma.partnerEarning.aggregate({
        where: { partnerId, status: 'PAID' },
        _sum: { commissionAmount: true }
      }),
      prisma.partnerEarning.count({ where: { partnerId } })
    ])

    const revenueSummary = {
      totalEarnings: totalEarnings,
      totalPaidOut: earningsAgg._sum.commissionAmount?.toNumber() || 0,
      currency: 'USD'
    }

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        email: partner.email,
        phone: partner.phone,
        website: partner.website,
        status: partner.status,
        tier: partner.tier,
        companyNumber: partner.companyNumber,
        taxId: partner.taxId,
        address: partner.address,
        createdAt: partner.createdAt,
        approvedAt: partner.approvedAt,
        users: partner.users.map(pu => ({
          id: pu.id,
          role: pu.role,
          isActive: pu.isActive,
          joinedAt: pu.joinedAt,
          user: pu.user
        })),
        tenants: partner.referrals.map(r => ({
          id: r.tenant.id,
          name: r.tenant.appName || r.tenant.name,
          slug: r.tenant.slug,
          status: r.tenant.status,
          referredAt: r.referredAt
        })),
        instances: partner.createdInstances.map(i => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          tenantName: i.tenant.name,
          isActive: i.isActive,
          createdAt: i.createdAt
        })),
        activeAgreement: partner.agreements[0] || null,
        revenueSummary
      }
    })
  } catch (error) {
    console.error('Partner detail error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner details' },
      { status: 500 }
    )
  }
}
