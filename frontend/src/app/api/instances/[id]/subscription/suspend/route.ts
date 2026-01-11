export const dynamic = 'force-dynamic'

/**
 * PHASE 3: Instance Subscription Suspend API
 * 
 * POST /api/instances/[id]/subscription/suspend - Suspend subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { suspendInstanceSubscription, getInstanceSubscription } from '@/lib/phase-3/instance-subscription'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get subscription
    const subscription = await getInstanceSubscription(params.id)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }
    
    // Verify partner ownership
    const partnerUser = await prisma.partnerUser.findFirst({
      where: {
        userId: session.user.id,
        partnerId: subscription.partnerId,
        isActive: true,
      }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const result = await suspendInstanceSubscription(subscription.id, body.reason)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to suspend subscription:', error)
    return NextResponse.json(
      { error: 'Failed to suspend subscription' },
      { status: 500 }
    )
  }
}
