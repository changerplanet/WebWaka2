export const dynamic = 'force-dynamic'

/**
 * PHASE 3: Instance Subscription API
 * 
 * GET /api/instances/[id]/subscription - Get subscription
 * POST /api/instances/[id]/subscription - Create subscription
 * PATCH /api/instances/[id]/subscription - Update subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getInstanceSubscription,
  createInstanceSubscription,
  updateInstanceSubscription,
} from '@/lib/phase-3/instance-subscription'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscription = await getInstanceSubscription(params.id)
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No subscription found for this instance' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error('Failed to get instance subscription:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current session
    const session = await getCurrentSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user's partner membership
    const partnerUser = await prisma.partnerUser.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        role: 'PARTNER_OWNER',
      },
      include: {
        partner: { select: { id: true, status: true } }
      }
    })
    
    if (!partnerUser || partnerUser.partner.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    const result = await createInstanceSubscription({
      platformInstanceId: params.id,
      partnerId: partnerUser.partner.id,
      planId: body.planId,
      billingInterval: body.billingInterval || 'monthly',
      amount: body.amount,
      currency: body.currency || 'NGN',
      wholesaleCost: body.wholesaleCost,
      trialDays: body.trialDays,
      metadata: body.metadata,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true, subscription: result.subscription })
  } catch (error) {
    console.error('Failed to create instance subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current session
    const session = await getCurrentSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get existing subscription
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
        { error: 'You do not have permission to update this subscription' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    const result = await updateInstanceSubscription(subscription.id, {
      amount: body.amount,
      wholesaleCost: body.wholesaleCost,
      billingInterval: body.billingInterval,
      metadata: body.metadata,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true, subscription: result.subscription })
  } catch (error) {
    console.error('Failed to update instance subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
