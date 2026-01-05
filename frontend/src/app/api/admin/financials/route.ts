/**
 * GLOBAL FINANCIAL OVERSIGHT API
 * 
 * Read-only financial overview for Super Admins.
 * Provides aggregate platform economics without operational capabilities.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    )
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get subscription stats
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      subscriptionsByStatus
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIALING' } }),
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ])

    // Get instance subscription stats
    const [
      totalInstanceSubs,
      activeInstanceSubs,
      instanceSubsByPlan
    ] = await Promise.all([
      prisma.instanceSubscription.count(),
      prisma.instanceSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.instanceSubscription.groupBy({
        by: ['planId'],
        _count: { id: true },
        _sum: { amount: true }
      })
    ])

    // Get revenue aggregates (from instance subscriptions - Phase 3 model)
    const revenueStats = await prisma.instanceSubscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: {
        amount: true,
        wholesaleCost: true,
        partnerMargin: true
      },
      _count: { id: true }
    })

    // Get partner earnings summary
    const [
      totalEarnings,
      pendingEarnings,
      clearedEarnings,
      paidEarnings
    ] = await Promise.all([
      prisma.partnerEarning.aggregate({
        _sum: { commissionAmount: true },
        _count: { id: true }
      }),
      prisma.partnerEarning.aggregate({
        where: { status: 'PENDING' },
        _sum: { commissionAmount: true },
        _count: { id: true }
      }),
      prisma.partnerEarning.aggregate({
        where: { status: 'CLEARED' },
        _sum: { commissionAmount: true },
        _count: { id: true }
      }),
      prisma.partnerEarning.aggregate({
        where: { status: 'PAID' },
        _sum: { commissionAmount: true },
        _count: { id: true }
      })
    ])

    // Get invoice stats
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      invoiceRevenue
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.invoice.count({ where: { status: { in: ['open', 'draft'] } } }),
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true }
      })
    ])

    // Get recent subscription events for trend
    const recentEvents = await prisma.subscriptionEvent.groupBy({
      by: ['eventType'],
      where: { occurredAt: { gte: thirtyDaysAgo } },
      _count: { id: true }
    })

    // Top partners by earnings
    const topPartners = await prisma.partnerEarning.groupBy({
      by: ['partnerId'],
      _sum: { commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 10
    })

    // Get partner names
    const partnerIds = topPartners.map(p => p.partnerId)
    const partners = await prisma.partner.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true }
    })
    const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]))

    return NextResponse.json({
      success: true,
      overview: {
        timestamp: now.toISOString(),
        period: 'current'
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trialing: trialSubscriptions,
        byStatus: Object.fromEntries(
          subscriptionsByStatus.map(s => [s.status, s._count.id])
        )
      },
      instanceSubscriptions: {
        total: totalInstanceSubs,
        active: activeInstanceSubs,
        byPlan: instanceSubsByPlan.map(p => ({
          planId: p.planId,
          count: p._count.id,
          totalAmount: p._sum.amount?.toNumber() || 0
        }))
      },
      revenue: {
        activeSubscriptionRevenue: revenueStats._sum.amount?.toNumber() || 0,
        wholesaleCosts: revenueStats._sum.wholesaleCost?.toNumber() || 0,
        partnerMargins: revenueStats._sum.partnerMargin?.toNumber() || 0,
        activeSubscriptionCount: revenueStats._count
      },
      partnerEarnings: {
        total: {
          amount: totalEarnings._sum.commissionAmount?.toNumber() || 0,
          count: totalEarnings._count.id
        },
        pending: {
          amount: pendingEarnings._sum.commissionAmount?.toNumber() || 0,
          count: pendingEarnings._count.id
        },
        cleared: {
          amount: clearedEarnings._sum.commissionAmount?.toNumber() || 0,
          count: clearedEarnings._count.id
        },
        paid: {
          amount: paidEarnings._sum.commissionAmount?.toNumber() || 0,
          count: paidEarnings._count.id
        }
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        paidRevenue: invoiceRevenue._sum.total?.toNumber() || 0
      },
      trends: {
        recentEvents: Object.fromEntries(
          recentEvents.map(e => [e.eventType, e._count.id])
        )
      },
      topPartners: topPartners.map(p => ({
        partnerId: p.partnerId,
        partnerName: partnerMap[p.partnerId] || 'Unknown',
        totalEarnings: p._sum.commissionAmount?.toNumber() || 0,
        earningCount: p._count.id
      }))
    })
  } catch (error) {
    console.error('Financial overview error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial data' },
      { status: 500 }
    )
  }
}
