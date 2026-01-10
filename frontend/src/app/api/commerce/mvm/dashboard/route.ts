/**
 * MVM Dashboard API
 * 
 * GET /api/commerce/mvm/dashboard - Admin dashboard
 * GET /api/commerce/mvm/dashboard?vendorId=... - Vendor dashboard
 * 
 * @module api/commerce/mvm/dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkCapabilityGuard, extractTenantId } from '@/lib/capabilities'
import { 
  VendorService, 
  OrderSplitService,
  CommissionService, 
  PayoutService,
  MarketplaceConfigService 
} from '@/lib/mvm'
import { prisma } from '@/lib/prisma'

// ============================================================================
// GET - Dashboard Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const guardResult = await checkCapabilityGuard(request, 'mvm')
    if (guardResult) return guardResult

    const tenantId = await extractTenantId(request)
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    // Vendor-specific dashboard
    if (vendorId) {
      const dashboard = await VendorService.getDashboardSummary(tenantId, vendorId)
      
      if (!dashboard) {
        return NextResponse.json(
          { success: false, error: 'Vendor not found' },
          { status: 404 }
        )
      }

      // Get order counts by status
      const orderCounts = await OrderSplitService.getVendorOrderCounts(vendorId)

      // Get payout summary
      const payoutSummary = await PayoutService.getVendorPayoutSummary(vendorId)

      return NextResponse.json({
        success: true,
        data: {
          vendor: dashboard.vendor,
          metrics: dashboard.metrics,
          orderCounts,
          payoutSummary,
          recentOrders: dashboard.recentOrders,
          topProducts: dashboard.topProducts
        }
      })
    }

    // Admin/Marketplace dashboard
    const [
      config,
      vendorStats,
      orderStats,
      commissionSummary,
      eligibleVendors
    ] = await Promise.all([
      MarketplaceConfigService.getSummary(tenantId),
      
      // Vendor stats
      prisma.mvm_vendor.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true }
      }),
      
      // Order stats (last 30 days)
      prisma.mvm_parent_order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        _count: true,
        _sum: { grandTotal: true }
      }),
      
      // Commission summary
      CommissionService.getSummary(tenantId),
      
      // Vendors eligible for payout
      PayoutService.getEligibleVendors(tenantId)
    ])

    // Format vendor stats
    const vendorCounts: Record<string, number> = {
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      SUSPENDED: 0,
      REJECTED: 0,
      CHURNED: 0
    }
    for (const stat of vendorStats) {
      vendorCounts[stat.status] = stat._count.status
    }

    return NextResponse.json({
      success: true,
      data: {
        config,
        vendors: {
          counts: vendorCounts,
          total: Object.values(vendorCounts).reduce((a: any, b: any) => a + b, 0),
          pendingApproval: vendorCounts.PENDING_APPROVAL,
          active: vendorCounts.APPROVED
        },
        orders: {
          last30Days: orderStats._count,
          revenue: orderStats._sum.grandTotal?.toNumber() || 0
        },
        commissions: commissionSummary,
        payouts: {
          eligibleVendors: eligibleVendors.length,
          totalPayable: eligibleVendors.reduce((sum: number, v: { availableAmount: number }) => sum + v.availableAmount, 0)
        }
      }
    })
  } catch (error) {
    console.error('[MVM Dashboard API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
