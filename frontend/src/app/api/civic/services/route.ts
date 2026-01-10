/**
 * CIVIC SUITE: Services API
 * 
 * GET - List services, get service by ID/code, public catalogue
 * POST - Create service
 * PATCH - Update service
 * 
 * @module api/civic/services
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import * as ServiceCatalogueService from '@/lib/civic/services/service-catalogue-service'
import { CivicServiceCategory } from '@prisma/client'

// ============================================================================
// GET - List services or get by ID
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_services')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const code = searchParams.get('code')
    const agencyId = searchParams.get('agencyId')
    const action = searchParams.get('action')

    // Get public catalogue (grouped by category)
    if (action === 'publicCatalogue') {
      const catalogue = await ServiceCatalogueService.getPublicServiceCatalogue(tenantId)
      return NextResponse.json({ success: true, catalogue })
    }

    // Get services requiring renewal
    if (action === 'renewalRequired') {
      const services = await ServiceCatalogueService.getServicesRequiringRenewal(tenantId)
      return NextResponse.json({ success: true, services })
    }

    // Get service by ID
    if (id) {
      const service = await ServiceCatalogueService.getService(tenantId, id)
      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }

      // Calculate fees
      const fees = ServiceCatalogueService.calculateServiceFees(service)

      return NextResponse.json({ success: true, service, fees })
    }

    // Get service by code
    if (code && agencyId) {
      const service = await ServiceCatalogueService.getServiceByCode(tenantId, agencyId, code)
      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, service })
    }

    // List services by category
    const category = searchParams.get('category')
    if (category) {
      const services = await ServiceCatalogueService.listServicesByCategory(
        tenantId,
        category as CivicServiceCategory
      )
      return NextResponse.json({ success: true, services })
    }

    // List services with filters
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('isActive') !== 'false'

    const services = await ServiceCatalogueService.listServices(tenantId, {
      agencyId: agencyId || undefined,
      category: undefined,
      isActive,
      search,
    })

    return NextResponse.json({ success: true, services })
  } catch (error) {
    console.error('Services GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create service
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_services')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.agencyId || !body.code || !body.name) {
      return NextResponse.json({ error: 'agencyId, code, and name are required' }, { status: 400 })
    }

    const service = await ServiceCatalogueService.createService({
      tenantId,
      agencyId: body.agencyId,
      code: body.code,
      name: body.name,
      description: body.description,
      category: body.category,
      eligibility: body.eligibility,
      processFlow: body.processFlow,
      requiredDocuments: body.requiredDocuments,
      baseFee: body.baseFee,
      processingFee: body.processingFee,
      inspectionFee: body.inspectionFee,
      vatApplicable: body.vatApplicable,
      slaBusinessDays: body.slaBusinessDays,
      validityDays: body.validityDays,
      renewalRequired: body.renewalRequired,
      renewalNoticeDays: body.renewalNoticeDays,
    })

    return NextResponse.json({ success: true, service })
  } catch (error) {
    console.error('Services POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PATCH - Update service
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'civic_services')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    const service = await ServiceCatalogueService.updateService(tenantId, body.id, {
      code: body.code,
      name: body.name,
      description: body.description,
      category: body.category,
      eligibility: body.eligibility,
      processFlow: body.processFlow,
      requiredDocuments: body.requiredDocuments,
      baseFee: body.baseFee,
      processingFee: body.processingFee,
      inspectionFee: body.inspectionFee,
      vatApplicable: body.vatApplicable,
      slaBusinessDays: body.slaBusinessDays,
      validityDays: body.validityDays,
      renewalRequired: body.renewalRequired,
      renewalNoticeDays: body.renewalNoticeDays,
      isActive: body.isActive,
    })

    return NextResponse.json({ success: true, service })
  } catch (error) {
    console.error('Services PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
