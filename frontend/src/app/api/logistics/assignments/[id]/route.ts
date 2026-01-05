/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Assignment Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { AssignmentService } from '@/lib/logistics/assignment-service'
import { ProofService } from '@/lib/logistics/proof-service'
import { EntitlementsService } from '@/lib/logistics/entitlements-service'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/logistics/assignments/[id]
 * Get assignment by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params

    const assignment = await AssignmentService.getAssignmentById(tenantId, id)

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error getting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/logistics/assignments/[id]
 * Update assignment
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    const assignment = await AssignmentService.updateAssignment(tenantId, id, body)

    return NextResponse.json({
      success: true,
      assignment,
    })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/logistics/assignments/[id]
 * Cancel assignment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const reason = searchParams.get('reason') || 'Cancelled by admin'

    await AssignmentService.cancelAssignment(tenantId, id, reason, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Assignment cancelled',
    })
  } catch (error) {
    console.error('Error cancelling assignment:', error)
    
    if (error instanceof Error && error.message.includes('Invalid status')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/logistics/assignments/[id]
 * Perform actions: assign, status, proof, rate, auto-assign
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const { id } = await params
    const body = await request.json()

    switch (body.action) {
      case 'assign': {
        if (!body.agentId) {
          return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
        }
        const assignment = await AssignmentService.assignAgent(
          tenantId,
          id,
          body.agentId,
          session.user.id,
          false
        )
        return NextResponse.json({ success: true, assignment })
      }

      case 'auto-assign': {
        await EntitlementsService.enforceEntitlement(tenantId, 'auto_assignment_enabled')
        const assignment = await AssignmentService.autoAssign(
          tenantId,
          id,
          body.algorithm || 'NEAREST',
          session.user.id
        )
        return NextResponse.json({ success: true, assignment })
      }

      case 'status': {
        if (!body.status) {
          return NextResponse.json({ error: 'status is required' }, { status: 400 })
        }
        const assignment = await AssignmentService.updateStatus(tenantId, id, {
          status: body.status,
          latitude: body.latitude,
          longitude: body.longitude,
          address: body.address,
          notes: body.notes,
          changedBy: session.user.id,
          changedByType: 'ADMIN',
          offlineId: body.offlineId,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
        })
        return NextResponse.json({ success: true, assignment })
      }

      case 'proof': {
        if (!body.proofType) {
          return NextResponse.json({ error: 'proofType is required' }, { status: 400 })
        }
        const proof = await ProofService.captureProof(tenantId, {
          assignmentId: id,
          proofType: body.proofType,
          imageUrl: body.imageUrl,
          signatureData: body.signatureData,
          pinCode: body.pinCode,
          otpCode: body.otpCode,
          recipientName: body.recipientName,
          notes: body.notes,
          latitude: body.latitude,
          longitude: body.longitude,
          capturedBy: session.user.id,
          capturedByType: 'AGENT',
          capturedAt: body.capturedAt ? new Date(body.capturedAt) : undefined,
          offlineId: body.offlineId,
          metadata: body.metadata,
        })
        return NextResponse.json({ success: true, proof })
      }

      case 'rate': {
        if (!body.rating || body.rating < 1 || body.rating > 5) {
          return NextResponse.json({ error: 'rating (1-5) is required' }, { status: 400 })
        }
        const assignment = await AssignmentService.rateDelivery(tenantId, id, {
          rating: body.rating,
          review: body.review,
        })
        return NextResponse.json({ success: true, assignment })
      }

      case 'verify-pin': {
        if (!body.pinCode) {
          return NextResponse.json({ error: 'pinCode is required' }, { status: 400 })
        }
        const valid = await ProofService.verifyPin(tenantId, { assignmentId: id, pinCode: body.pinCode })
        return NextResponse.json({ valid })
      }

      case 'verify-otp': {
        if (!body.otpCode) {
          return NextResponse.json({ error: 'otpCode is required' }, { status: 400 })
        }
        const valid = await ProofService.verifyOtp(tenantId, { assignmentId: id, otpCode: body.otpCode })
        return NextResponse.json({ valid })
      }

      case 'generate-pin': {
        const pin = await ProofService.generateDeliveryPin(tenantId, id)
        return NextResponse.json({ pin })
      }

      case 'generate-otp': {
        const otp = await ProofService.generateDeliveryOtp(tenantId, id)
        return NextResponse.json({ otp })
      }

      case 'check-proofs': {
        const proofStatus = await ProofService.hasRequiredProofs(tenantId, id)
        return NextResponse.json(proofStatus)
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: assign, auto-assign, status, proof, rate, verify-pin, verify-otp, generate-pin, generate-otp, check-proofs' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing assignment action:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('Invalid status') || error.message.includes('Cannot')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('not allowed') || error.message.includes('not available')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
