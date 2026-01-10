/**
 * PAYMENTS & COLLECTIONS SUITE
 * Proof of Payment API
 * 
 * S4 - API Exposure & Guarding
 * 
 * POST /api/commerce/payments/proof - Upload proof of payment
 * GET /api/commerce/payments/proof - Get proof details or pending list
 * PUT /api/commerce/payments/proof - Verify proof (admin)
 * 
 * @module api/commerce/payments/proof
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { PaymentProofService } from '@/lib/payments'

/**
 * GET /api/commerce/payments/proof
 * Get proof details for a payment or list pending verifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    
    const paymentId = searchParams.get('paymentId')
    const action = searchParams.get('action')

    // Get specific proof
    if (paymentId) {
      const proof = await PaymentProofService.getProof(tenantId, paymentId)
      
      if (!proof) {
        return NextResponse.json({ error: 'No proof found for this payment' }, { status: 404 })
      }

      return NextResponse.json({ proof })
    }

    // List pending verifications (admin)
    if (action === 'pending') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const result = await PaymentProofService.getPendingVerifications(tenantId, { page, limit })

      return NextResponse.json({
        payments: result.payments,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      })
    }

    return NextResponse.json({ 
      error: 'Provide paymentId or action=pending' 
    }, { status: 400 })
  } catch (error) {
    console.error('[Proof API] Get error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/commerce/payments/proof
 * Upload proof of payment attachment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    const { paymentId, proofUrl } = body

    if (!paymentId || !proofUrl) {
      return NextResponse.json(
        { error: 'paymentId and proofUrl are required' },
        { status: 400 }
      )
    }

    const proof = await PaymentProofService.attachProof(
      tenantId,
      paymentId,
      proofUrl,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      proof
    })
  } catch (error) {
    console.error('[Proof API] Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/commerce/payments/proof
 * Verify or reject proof of payment (admin action)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Capability guard
    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'payments')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    const { paymentId, approved, rejectionReason } = body

    if (!paymentId || approved === undefined) {
      return NextResponse.json(
        { error: 'paymentId and approved are required' },
        { status: 400 }
      )
    }

    if (!approved && !rejectionReason) {
      return NextResponse.json(
        { error: 'rejectionReason is required when rejecting' },
        { status: 400 }
      )
    }

    const result = await PaymentProofService.verifyProof(
      tenantId,
      paymentId,
      session.user.id,
      approved,
      rejectionReason
    )

    return NextResponse.json({
      success: result.success,
      result
    })
  } catch (error) {
    console.error('[Proof API] Verify error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
