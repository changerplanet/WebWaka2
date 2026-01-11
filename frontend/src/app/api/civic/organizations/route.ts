export const dynamic = 'force-dynamic'

/**
 * CIVIC SUITE: Organizations API
 * 
 * GET - List organizations, get organization by ID/number
 * POST - Create organization, upload document
 * PATCH - Update organization, verify organization
 * 
 * @module api/civic/organizations
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as CitizenService from '@/lib/civic/services/citizen-service'

// ============================================================================
// GET - List organizations or get by ID
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
    const orgNumber = searchParams.get('orgNumber')
    const action = searchParams.get('action')

    // Get organization by ID
    if (id) {
      if (action === 'documents') {
        const documents = await CitizenService.getOrganizationDocuments(tenantId, id)
        return NextResponse.json({ success: true, documents })
      }

      const organization = await CitizenService.getOrganization(tenantId, id)
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, organization })
    }

    // Get organization by number
    if (orgNumber) {
      const organization = await CitizenService.getOrganizationByNumber(tenantId, orgNumber)
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, organization })
    }

    // List organizations
    const search = searchParams.get('search') || undefined
    const isVerified = searchParams.get('isVerified') === 'true' ? true : searchParams.get('isVerified') === 'false' ? false : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await CitizenService.listOrganizations(tenantId, {
      search,
      isVerified,
      page,
      limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Organizations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create organization or upload document
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
      if (!body.organizationId || !body.documentType || !body.documentName) {
        return NextResponse.json({ error: 'organizationId, documentType, and documentName are required' }, { status: 400 })
      }

      const document = await CitizenService.uploadDocument({
        tenantId,
        organizationId: body.organizationId,
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

    // Create organization
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const organization = await CitizenService.createOrganization({
      tenantId,
      name: body.name,
      tradeName: body.tradeName,
      registrationType: body.registrationType,
      rcNumber: body.rcNumber,
      taxId: body.taxId,
      phone: body.phone,
      email: body.email,
      website: body.website,
      address: body.address,
      contactPerson: body.contactPerson,
      contactPersonPhone: body.contactPersonPhone,
      contactPersonEmail: body.contactPersonEmail,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error('Organizations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update organization or verify
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
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Handle verify action
    if (body.action === 'verify') {
      const organization = await CitizenService.verifyOrganization(
        tenantId,
        body.id,
        session.user.id
      )
      return NextResponse.json({ success: true, organization })
    }

    // Update organization
    const organization = await CitizenService.updateOrganization(tenantId, body.id, {
      name: body.name,
      tradeName: body.tradeName,
      registrationType: body.registrationType,
      rcNumber: body.rcNumber,
      taxId: body.taxId,
      phone: body.phone,
      email: body.email,
      website: body.website,
      address: body.address,
      contactPerson: body.contactPerson,
      contactPersonPhone: body.contactPersonPhone,
      contactPersonEmail: body.contactPersonEmail,
      notes: body.notes,
    })

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error('Organizations PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
