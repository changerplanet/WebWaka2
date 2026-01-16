export const dynamic = 'force-dynamic'

/**
 * Cancel Payout Batch API
 * Wave L.1: Payout Execution (Live Money Movement)
 * 
 * POST /api/commerce/payouts/cancel-batch
 * 
 * Cancels a pending/approved payout batch before execution.
 * 
 * CONSTRAINTS:
 * - Session-based authentication required
 * - Role: TENANT_ADMIN or SUPER_ADMIN
 * - Tenant isolation enforced via session
 * - Cannot cancel PROCESSING or COMPLETED batches
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPayoutExecutionService } from '@/lib/commerce/payout-execution/payout-execution-service'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { batchId, reason, tenantId: requestTenantId } = body

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

    if (batch.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'Cannot cancel batch that is currently processing' },
        { status: 400 }
      )
    }

    if (batch.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel batch that has already completed' },
        { status: 400 }
      )
    }

    const payoutService = createPayoutExecutionService(batch.tenantId)
    
    const result = await payoutService.cancelBatch({
      batchId,
      cancelledBy: session.user.id,
      cancelledByName: session.user.name || session.user.email || undefined,
      reason: reason || 'Cancelled by admin'
    })

    return NextResponse.json({
      success: true,
      batch: result,
      message: 'Batch cancelled successfully. Commissions have been restored.'
    })
  } catch (error) {
    console.error('Cancel batch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel batch' },
      { status: 500 }
    )
  }
}
