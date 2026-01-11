/**
 * PHASE 4B: Client Portal API
 * 
 * GET /api/client-portal - Client's view of their platforms
 * 
 * RULES:
 * - Client sees partner branding, not WebWaka
 * - Client cannot change pricing
 * - Client cannot bypass partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    // Get user's tenant memberships using correct model name
    const tenantMemberships = await prisma.tenantMembership.findMany({
      where: { userId: user.id },
      include: {
        tenant: {
          include: {
            platformInstances: {
              include: {
                createdByPartner: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    email: true,
                    phone: true,
                    website: true,
                  }
                },
                domains: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    domain: true,
                    type: true,
                  }
                },
                subscriptions: {
                  where: {
                    status: { not: 'CANCELLED' }
                  },
                  select: {
                    id: true,
                    status: true,
                    amount: true,
                    currency: true,
                    currentPeriodEnd: true,
                    trialEnd: true,
                  }
                }
              }
            }
          }
        }
      }
    })
    
    // Build client-friendly view
    const platforms = tenantMemberships.flatMap((tm: { tenant: { platformInstances: Array<{ id: string; name: string; slug: string; isActive: boolean; suspendedAt: Date | null; subscriptions: Array<{ status: string; currentPeriodEnd: Date | null; trialEnd: Date | null }>; createdByPartner: { name: string; email: string; phone: string | null; website: string | null } | null; domains: Array<{ domain: string; type: string }> }> } }) => {
      return tm.tenant.platformInstances.map((instance: { id: string; name: string; slug: string; isActive: boolean; suspendedAt: Date | null; subscriptions: Array<{ status: string; currentPeriodEnd: Date | null; trialEnd: Date | null }>; createdByPartner: { name: string; email: string; phone: string | null; website: string | null } | null; domains: Array<{ domain: string; type: string }> }) => {
        const subscription = instance.subscriptions[0]
        const partner = instance.createdByPartner
        const primaryDomain = instance.domains[0]
        
        return {
          id: instance.id,
          name: instance.name,
          domain: primaryDomain?.domain || instance.slug,
          status: instance.isActive && !instance.suspendedAt ? 'active' : 'suspended',
          subscription: subscription ? {
            status: subscription.status,
            nextBillingDate: subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEnd,
          } : null,
          // Partner branding (never expose WebWaka)
          operator: partner ? {
            name: partner.name,
            supportEmail: partner.email,
            supportPhone: partner.phone,
            website: partner.website,
          } : null,
        }
      })
    })
    
    return NextResponse.json({
      success: true,
      platforms,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
  } catch (error) {
    console.error('Client portal API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portal data' },
      { status: 500 }
    )
  }
}
