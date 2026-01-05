/**
 * PHASE 4B: Client Subscription Lifecycle API
 * 
 * POST /api/partner/clients/[id]/subscription - Start subscription
 * PATCH /api/partner/clients/[id]/subscription - Update subscription
 * POST /api/partner/clients/[id]/subscription?action=pause - Pause
 * POST /api/partner/clients/[id]/subscription?action=resume - Resume
 * POST /api/partner/clients/[id]/subscription?action=cancel - Cancel
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  startClientSubscription,
  pauseClientSubscription,
  resumeClientSubscription,
  cancelClientSubscription,
  getClientSubscriptionStatus,
} from '@/lib/phase-4b/client-lifecycle'
import { hasPermission } from '@/lib/phase-4b/partner-staff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instanceId } = await params
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    // Verify instance belongs to partner
    const instance = await prisma.platformInstance.findUnique({
      where: { id: instanceId }
    })
    
    if (!instance || instance.createdByPartnerId !== partnerUser.partnerId) {
      return NextResponse.json(
        { error: 'Instance not found or access denied' },
        { status: 404 }
      )
    }
    
    const status = await getClientSubscriptionStatus(instanceId)
    
    return NextResponse.json({
      success: true,
      ...status,
    })
  } catch (error) {
    console.error('Subscription GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instanceId } = await params
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user
    
    const partnerUser = await prisma.partnerUser.findUnique({
      where: { userId: user.id }
    })
    
    if (!partnerUser) {
      return NextResponse.json(
        { error: 'Partner access required' },
        { status: 403 }
      )
    }
    
    const action = request.nextUrl.searchParams.get('action')
    const body = await request.json()
    
    // Handle lifecycle actions
    switch (action) {
      case 'pause': {
        if (!hasPermission(partnerUser.role, 'canSuspendClients')) {
          return NextResponse.json(
            { error: 'You do not have permission to pause subscriptions' },
            { status: 403 }
          )
        }
        
        const subscription = await prisma.instanceSubscription.findUnique({
          where: { platformInstanceId: instanceId }
        })
        
        if (!subscription) {
          return NextResponse.json(
            { error: 'No subscription found for this instance' },
            { status: 404 }
          )
        }
        
        const result = await pauseClientSubscription({
          subscriptionId: subscription.id,
          reason: body.reason,
          scheduledResumeDate: body.scheduledResumeDate ? new Date(body.scheduledResumeDate) : undefined,
        })
        
        if (!result.success) {
          return NextResponse.json(
            { error: result.error, errorCode: result.errorCode },
            { status: 400 }
          )
        }
        
        return NextResponse.json({ success: true, action: 'paused' })
      }
      
      case 'resume': {
        const subscription = await prisma.instanceSubscription.findUnique({
          where: { platformInstanceId: instanceId }
        })
        
        if (!subscription) {
          return NextResponse.json(
            { error: 'No subscription found for this instance' },
            { status: 404 }
          )
        }
        
        const result = await resumeClientSubscription(subscription.id)
        
        if (!result.success) {
          return NextResponse.json(
            { error: result.error, errorCode: result.errorCode },
            { status: 400 }
          )
        }
        
        return NextResponse.json({ success: true, action: 'resumed' })
      }
      
      case 'cancel': {
        if (!hasPermission(partnerUser.role, 'canSuspendClients')) {
          return NextResponse.json(
            { error: 'You do not have permission to cancel subscriptions' },
            { status: 403 }
          )
        }
        
        const subscription = await prisma.instanceSubscription.findUnique({
          where: { platformInstanceId: instanceId }
        })
        
        if (!subscription) {
          return NextResponse.json(
            { error: 'No subscription found for this instance' },
            { status: 404 }
          )
        }
        
        const result = await cancelClientSubscription({
          subscriptionId: subscription.id,
          reason: body.reason,
          cancelAtPeriodEnd: body.cancelAtPeriodEnd,
          feedback: body.feedback,
        })
        
        if (!result.success) {
          return NextResponse.json(
            { error: result.error, errorCode: result.errorCode },
            { status: 400 }
          )
        }
        
        return NextResponse.json({ success: true, action: 'cancelled' })
      }
      
      default: {
        // Start new subscription
        if (!hasPermission(partnerUser.role, 'canCreateClients')) {
          return NextResponse.json(
            { error: 'You do not have permission to create subscriptions' },
            { status: 403 }
          )
        }
        
        const result = await startClientSubscription({
          partnerId: partnerUser.partnerId,
          platformInstanceId: instanceId,
          packageId: body.packageId,
          customPricing: body.customPricing,
          wholesaleCost: body.wholesaleCost,
          metadata: body.metadata,
        })
        
        if (!result.success) {
          return NextResponse.json(
            { error: result.error, errorCode: result.errorCode },
            { status: 400 }
          )
        }
        
        return NextResponse.json({
          success: true,
          subscription: result.subscription,
        })
      }
    }
  } catch (error) {
    console.error('Subscription POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription action' },
      { status: 500 }
    )
  }
}
