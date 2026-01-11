export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Public API
 * 
 * GET - Public tracking status lookup (no authentication required)
 * 
 * This endpoint allows citizens to check the status of their requests
 * using the tracking code provided at submission.
 * 
 * @module api/civic/public
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import * as RequestService from '@/lib/civic/services/request-service'
import * as AuditService from '@/lib/civic/services/audit-service'

// ============================================================================
// GET - Public status lookup (no auth required)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingCode = searchParams.get('trackingCode')

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'Tracking code is required' },
        { status: 400 }
      )
    }

    // Validate tracking code format (basic validation)
    if (trackingCode.length < 6 || trackingCode.length > 20) {
      return NextResponse.json(
        { error: 'Invalid tracking code format' },
        { status: 400 }
      )
    }

    // Try to get public status from audit service first
    const publicStatus = await AuditService.getPublicStatus(trackingCode)
    if (publicStatus) {
      return NextResponse.json({
        success: true,
        status: {
          trackingCode: publicStatus.trackingCode,
          serviceName: publicStatus.serviceName,
          currentStatus: publicStatus.currentStatus,
          submittedDate: publicStatus.submittedDate,
          lastUpdateDate: publicStatus.lastUpdateDate,
          progressStage: publicStatus.progressStage,
          progressNote: publicStatus.progressNote,
          estimatedCompletionDate: publicStatus.estimatedCompletionDate,
        },
      })
    }

    // Fall back to request lookup
    const requestStatus = await RequestService.getRequestByTrackingCode(trackingCode)
    if (requestStatus) {
      return NextResponse.json({
        success: true,
        status: {
          trackingCode: trackingCode, // Use the input tracking code
          serviceName: requestStatus.serviceName,
          currentStatus: requestStatus.status,
          submittedDate: requestStatus.submittedAt,
          lastUpdateDate: requestStatus.acknowledgedAt || requestStatus.submittedAt,
          progressStage: getProgressStage(requestStatus.status),
          progressNote: getProgressNote(requestStatus.status),
        },
      })
    }

    return NextResponse.json(
      { error: 'Request not found. Please check your tracking code.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Public status lookup error:', error)
    return NextResponse.json(
      { error: 'Unable to retrieve status. Please try again later.' },
      { status: 500 }
    )
  }
}

// Helper function to map status to progress stage
function getProgressStage(status: string): number {
  const stages: Record<string, number> = {
    DRAFT: 0,
    SUBMITTED: 1,
    UNDER_REVIEW: 2,
    PENDING_DOCUMENTS: 2,
    PENDING_INSPECTION: 3,
    PENDING_PAYMENT: 4,
    PENDING_APPROVAL: 5,
    APPROVED: 6,
    REJECTED: 6,
    CANCELLED: 6,
    EXPIRED: 6,
  }
  return stages[status] || 0
}

// Helper function to get user-friendly progress note
function getProgressNote(status: string): string {
  const notes: Record<string, string> = {
    DRAFT: 'Your application has been saved as a draft.',
    SUBMITTED: 'Your application has been submitted and is awaiting review.',
    UNDER_REVIEW: 'Your application is currently under review by our team.',
    PENDING_DOCUMENTS: 'Additional documents are required for your application.',
    PENDING_INSPECTION: 'Your application requires a field inspection.',
    PENDING_PAYMENT: 'Payment is required to proceed with your application.',
    PENDING_APPROVAL: 'Your application is awaiting final approval.',
    APPROVED: 'Your application has been approved.',
    REJECTED: 'Unfortunately, your application has been rejected.',
    CANCELLED: 'Your application has been cancelled.',
    EXPIRED: 'Your application has expired.',
  }
  return notes[status] || 'Status information not available.'
}
