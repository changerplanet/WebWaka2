/**
 * CIVIC SUITE: Units API
 * 
 * GET - List units, get unit by ID
 * POST - Create unit
 * 
 * @module api/civic/units
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as AgencyService from '@/lib/civic/services/agency-service'

// ============================================================================
// GET - List units or get by ID
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
    const departmentId = searchParams.get('departmentId')

    // Get unit by ID
    if (id) {
      const unit = await AgencyService.getUnit(tenantId, id)
      if (!unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, unit })
    }

    // List units for department
    if (!departmentId) {
      return NextResponse.json({ error: 'departmentId is required' }, { status: 400 })
    }

    const units = await AgencyService.listUnits(tenantId, departmentId)
    return NextResponse.json({ success: true, units })
  } catch (error) {
    console.error('Units GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create unit
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

    if (!body.departmentId || !body.code || !body.name) {
      return NextResponse.json({ error: 'departmentId, code, and name are required' }, { status: 400 })
    }

    const unit = await AgencyService.createUnit({
      tenantId,
      departmentId: body.departmentId,
      code: body.code,
      name: body.name,
      description: body.description,
    })

    return NextResponse.json({ success: true, unit })
  } catch (error) {
    console.error('Units POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
