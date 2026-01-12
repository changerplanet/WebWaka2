export const dynamic = 'force-dynamic'

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
            Tenant: {
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

    const partnerAny = partner as any
    
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
        users: partnerAny.users.map((pu: any) => ({
          id: pu.id,
          role: pu.role,
          isActive: pu.isActive,
          joinedAt: pu.joinedAt,
          user: pu.user
        })),
        tenants: partnerAny.referrals.map((r: any) => ({
          id: r.Tenant.id,
          name: r.Tenant.appName || r.Tenant.name,
          slug: r.Tenant.slug,
          status: r.Tenant.status,
          referredAt: r.referredAt
        })),
        instances: partnerAny.createdInstances.map((i: any) => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          tenantName: i.tenant.name,
          isActive: i.isActive,
          createdAt: i.createdAt
        })),
        activeAgreement: partnerAny.agreements[0] || null,
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
