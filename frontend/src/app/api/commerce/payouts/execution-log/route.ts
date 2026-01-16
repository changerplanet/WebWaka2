export const dynamic = 'force-dynamic'

/**
 * Payout Execution Log API
 * Wave L.1: Payout Execution (Live Money Movement)
 * 
 * GET /api/commerce/payouts/execution-log
 * 
 * Retrieves immutable audit log for payout batch execution.
 * 
 * CONSTRAINTS:
 * - Session-based authentication required
 * - Role: TENANT_ADMIN or SUPER_ADMIN
 * - Tenant isolation enforced via session
 * - Logs are immutable (read-only endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPayoutExecutionService } from '@/lib/commerce/payout-execution/payout-execution-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const membership = await prisma.tenantMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: 'TENANT_ADMIN'
      },
      select: { tenantId: true, role: true }
    })

    const isSuperAdmin = session.user.globalRole === 'SUPER_ADMIN'

    if (!membership && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires TENANT_ADMIN or SUPER_ADMIN role.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const requestTenantId = searchParams.get('tenantId')

    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
    }

    let tenantId: string
    if (isSuperAdmin && requestTenantId) {
      tenantId = requestTenantId
    } else if (session.activeTenantId) {
      tenantId = session.activeTenantId
    } else if (membership?.tenantId) {
      tenantId = membership.tenantId
    } else {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 })
    }

    const batch = await prisma.mvm_payout_batch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (batch.tenantId !== tenantId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    const payoutService = createPayoutExecutionService(batch.tenantId)
    
    const logs = await payoutService.getBatchLogs(batchId)
    const payouts = await payoutService.getBatchPayouts(batchId)

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        status: batch.status,
        isDemo: batch.isDemo,
        totalNet: Number(batch.totalNet),
        vendorCount: batch.vendorCount,
        payoutCount: batch.payoutCount,
        createdAt: batch.createdAt,
        processedAt: batch.processedAt,
        completedAt: batch.completedAt
      },
      payouts: payouts.map(p => ({
        id: p.id,
        payoutNumber: p.payoutNumber,
        vendorName: p.vendorName,
        status: p.status,
        netAmount: p.netAmount,
        paymentRef: p.paymentRef,
        failureReason: p.failureReason,
        processedAt: p.processedAt,
        completedAt: p.completedAt
      })),
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        fromStatus: l.fromStatus,
        toStatus: l.toStatus,
        details: l.details,
        performedBy: l.performedBy,
        performedByName: l.performedByName,
        performedAt: l.performedAt
      }))
    })
  } catch (error) {
    console.error('Execution log error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch execution log' },
      { status: 500 }
    )
  }
}
