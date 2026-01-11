export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Citizens API
 * 
 * GET - List citizens, get citizen by ID/number/phone
 * POST - Create citizen, upload document
 * PATCH - Update citizen, verify citizen
 * 
 * @module api/civic/citizens
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as CitizenService from '@/lib/civic/services/citizen-service'

// ============================================================================
// GET - List citizens or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const citizenNumber = searchParams.get('citizenNumber')
    const phone = searchParams.get('phone')
    const action = searchParams.get('action')

    // Get citizen by ID
    if (id) {
      if (action === 'documents') {
        const documents = await CitizenService.getCitizenDocuments(tenantId, id)
        return NextResponse.json({ success: true, documents })
      }

      const citizen = await CitizenService.getCitizen(tenantId, id)
      if (!citizen) {
        return NextResponse.json({ error: 'Citizen not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, citizen })
    }

    // Get citizen by number
    if (citizenNumber) {
      const citizen = await CitizenService.getCitizenByNumber(tenantId, citizenNumber)
      if (!citizen) {
        return NextResponse.json({ error: 'Citizen not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, citizen })
    }

    // Get citizen by phone
    if (phone) {
      const citizen = await CitizenService.getCitizenByPhone(tenantId, phone)
      if (!citizen) {
        return NextResponse.json({ error: 'Citizen not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, citizen })
    }

    // List citizens
    const search = searchParams.get('search') || undefined
    const isVerified = searchParams.get('isVerified') === 'true' ? true : searchParams.get('isVerified') === 'false' ? false : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await CitizenService.listCitizens(tenantId, {
      search,
      isVerified,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Citizens GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create citizen or upload document
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Handle document upload action
    if (body.action === 'uploadDocument') {
      if (!body.citizenId || !body.documentType || !body.documentName) {
        return NextResponse.json({ error: 'citizenId, documentType, and documentName are required' }, { status: 400 })
      }

      const document = await CitizenService.uploadDocument({
        tenantId,
        citizenId: body.citizenId,
        documentType: body.documentType,
        documentName: body.documentName,
        description: body.description,
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      })

      return NextResponse.json({ success: true, document })
    }

    // Create citizen
    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
    }

    const citizen = await CitizenService.createCitizen({
      tenantId,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      title: body.title,
      phone: body.phone,
      email: body.email,
      address: body.address,
      nationalIdRef: body.nationalIdRef,
      voterIdRef: body.voterIdRef,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gender: body.gender,
      occupation: body.occupation,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, citizen })
  } catch (error) {
    console.error('Citizens POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update citizen or verify
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_registry')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Citizen ID is required' }, { status: 400 })
    }

    // Handle verify action
    if (body.action === 'verify') {
      const citizen = await CitizenService.verifyCitizen(
        tenantId,
        body.id,
        session.user.id
      )
      return NextResponse.json({ success: true, citizen })
    }

    // Handle document verification
    if (body.action === 'verifyDocument') {
      if (!body.documentId || !body.status) {
        return NextResponse.json({ error: 'documentId and status are required' }, { status: 400 })
      }

      const document = await CitizenService.verifyDocument(
        tenantId,
        body.documentId,
        session.user.id,
        body.status,
        body.verifierNote
      )
      return NextResponse.json({ success: true, document })
    }

    // Update citizen
    const citizen = await CitizenService.updateCitizen(tenantId, body.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      title: body.title,
      phone: body.phone,
      email: body.email,
      address: body.address,
      nationalIdRef: body.nationalIdRef,
      voterIdRef: body.voterIdRef,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gender: body.gender,
      occupation: body.occupation,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, citizen })
  } catch (error) {
    console.error('Citizens PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
