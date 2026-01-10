/**
 * HEALTH SUITE: Billing Facts API
 * 
 * CRITICAL: Commerce Reuse Boundary
 * 
 * Health emits BILLING FACTS only.
 * Health NEVER:
 * - Calculates totals
 * - Applies VAT (healthcare is VAT-exempt)
 * - Creates invoices
 * - Records payments
 * - Touches accounting journals
 * 
 * Canonical flow:
 * Health [Billing Facts] → Commerce Billing → Payments → Accounting
 * 
 * GET - List billing facts
 * POST - Create billing fact
 * PATCH - Mark as billed, waive, cancel
 * 
 * @module api/health/billing-facts
 * @phase S3
 * @standard Platform Standardisation v2
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { checkCapabilityForSession } from '@/lib/capabilities'
import { prisma } from '@/lib/prisma'
import { HealthBillingFactType, HealthBillingFactStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const billingFact = await prisma.health_billing_fact.findFirst({
        where: { id, tenantId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          visit: { select: { id: true, visitNumber: true, visitDate: true } },
          encounter: { select: { id: true, encounterDate: true } },
        },
      })
      if (!billingFact) {
        return NextResponse.json({ error: 'Billing fact not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, billingFact })
    }

    // Get pending billing facts
    if (searchParams.get('pending') === 'true') {
      const billingFacts = await prisma.health_billing_fact.findMany({
        where: { tenantId, status: 'PENDING' },
        orderBy: { serviceDate: 'asc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          visit: { select: { id: true, visitNumber: true } },
        },
      })
      return NextResponse.json({ success: true, billingFacts })
    }

    // Get billing facts for a visit
    if (searchParams.get('visitId')) {
      const billingFacts = await prisma.health_billing_fact.findMany({
        where: { tenantId, visitId: searchParams.get('visitId')! },
        orderBy: { createdAt: 'asc' },
      })
      return NextResponse.json({ success: true, billingFacts })
    }

    // Get billing facts for a patient
    if (searchParams.get('patientId')) {
      const patientId = searchParams.get('patientId')!
      const status = searchParams.get('status') as HealthBillingFactStatus | null
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const where: Record<string, unknown> = { tenantId, patientId }
      if (status) where.status = status

      const [billingFacts, total] = await Promise.all([
        prisma.health_billing_fact.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { serviceDate: 'desc' },
        }),
        prisma.health_billing_fact.count({ where }),
      ])

      return NextResponse.json({ success: true, billingFacts, total, page, limit })
    }

    // List with filters
    const factType = searchParams.get('factType') as HealthBillingFactType | null
    const status = searchParams.get('status') as HealthBillingFactStatus | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { tenantId }
    if (factType) where.factType = factType
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.serviceDate = {}
      if (dateFrom) (where.serviceDate as Record<string, Date>).gte = new Date(dateFrom)
      if (dateTo) (where.serviceDate as Record<string, Date>).lte = new Date(dateTo)
    }

    const [billingFacts, total] = await Promise.all([
      prisma.health_billing_fact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { serviceDate: 'desc' },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        },
      }),
      prisma.health_billing_fact.count({ where }),
    ])

    return NextResponse.json({ success: true, billingFacts, total, page, limit })
  } catch (error) {
    console.error('Billing Facts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Validate required fields
    if (!body.patientId || !body.factType || !body.description || body.amount === undefined) {
      return NextResponse.json({ 
        error: 'patientId, factType, description, and amount are required',
        note: 'Health emits FACTS only. Commerce Billing creates invoices.',
      }, { status: 400 })
    }

    // NOTE: Health does NOT calculate totals or apply VAT
    // Healthcare is VAT-exempt in Nigeria
    const billingFact = await prisma.health_billing_fact.create({
      data: {
        tenantId,
        patientId: body.patientId,
        visitId: body.visitId,
        encounterId: body.encounterId,
        factType: body.factType as HealthBillingFactType,
        description: body.description,
        code: body.code,
        amount: body.amount,
        quantity: body.quantity || 1,
        providerId: body.providerId,
        providerName: body.providerName,
        serviceDate: body.serviceDate ? new Date(body.serviceDate) : new Date(),
        status: 'PENDING',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      },
    })

    return NextResponse.json({ 
      success: true, 
      billingFact,
      message: 'Billing fact created. Commerce Billing will convert to invoice.',
      vatNote: 'Healthcare is VAT-exempt. No VAT applied.',
    })
  } catch (error) {
    console.error('Billing Facts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.user || !session.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guardResult = await checkCapabilityForSession(session.activeTenantId, 'health')
    if (guardResult) return guardResult

    const tenantId = session.activeTenantId
    const body = await request.json()
    const action = body.action || 'mark_billed'

    if (!body.id) {
      return NextResponse.json({ error: 'Billing fact ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'mark_billed': {
        // Called by Commerce Billing when invoice is created
        // NOTE: Health does NOT create the invoice
        if (!body.billingInvoiceId) {
          return NextResponse.json({ error: 'billingInvoiceId is required (from Commerce)' }, { status: 400 })
        }

        const billingFact = await prisma.health_billing_fact.update({
          where: { id: body.id, tenantId },
          data: {
            status: 'BILLED',
            billingInvoiceId: body.billingInvoiceId,
            billedAt: new Date(),
          },
        })

        return NextResponse.json({ 
          success: true, 
          billingFact,
          message: 'Billing fact marked as billed. Commerce now owns the invoice.',
        })
      }

      case 'waive': {
        // Waive a billing fact (admin decision)
        if (!body.reason) {
          return NextResponse.json({ error: 'Waiver reason is required' }, { status: 400 })
        }

        const billingFact = await prisma.health_billing_fact.update({
          where: { id: body.id, tenantId },
          data: {
            status: 'WAIVED',
            waivedAt: new Date(),
            waivedBy: session.user.id,
            waiverReason: body.reason,
          },
        })

        return NextResponse.json({ success: true, billingFact })
      }

      case 'cancel': {
        const billingFact = await prisma.health_billing_fact.update({
          where: { id: body.id, tenantId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        })

        return NextResponse.json({ success: true, billingFact })
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: mark_billed, waive, cancel' }, { status: 400 })
    }
  } catch (error) {
    console.error('Billing Facts PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
