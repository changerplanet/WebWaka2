/**
 * CIVIC SUITE: Agencies API
 * 
 * GET - List agencies, get agency by ID/code
 * POST - Create agency
 * PATCH - Update agency
 * 
 * @module api/civic/agencies
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as AgencyService from '@/lib/civic/services/agency-service'

// ============================================================================
// GET - List agencies or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_agencies')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const code = searchParams.get('code')

    // Get agency by ID
    if (id) {
      const agency = await AgencyService.getAgency(tenantId, id)
      if (!agency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, agency })
    }

    // Get agency by code
    if (code) {
      const agency = await AgencyService.getAgencyByCode(tenantId, code)
      if (!agency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, agency })
    }

    // List agencies
    const jurisdiction = searchParams.get('jurisdiction') || undefined
    const isActive = searchParams.get('isActive') !== 'false'

    const agencies = await AgencyService.listAgencies(tenantId, {
      jurisdiction,
      isActive,
    })

    return NextResponse.json({ success: true, agencies })
  } catch (error) {
    console.error('Agencies GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create agency
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_agencies')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'code and name are required' }, { status: 400 })
    }

    const agency = await AgencyService.createAgency({
      tenantId,
      code: body.code,
      name: body.name,
      description: body.description,
      jurisdiction: body.jurisdiction,
      parentAgencyId: body.parentAgencyId,
      phone: body.phone,
      email: body.email,
      address: body.address,
      website: body.website,
      headName: body.headName,
      headTitle: body.headTitle,
    })

    return NextResponse.json({ success: true, agency })
  } catch (error) {
    console.error('Agencies POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update agency
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_agencies')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Agency ID is required' }, { status: 400 })
    }

    const agency = await AgencyService.updateAgency(tenantId, body.id, {
      code: body.code,
      name: body.name,
      description: body.description,
      jurisdiction: body.jurisdiction,
      phone: body.phone,
      email: body.email,
      address: body.address,
      website: body.website,
      headName: body.headName,
      headTitle: body.headTitle,
    })

    return NextResponse.json({ success: true, agency })
  } catch (error) {
    console.error('Agencies PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
