export const dynamic = 'force-dynamic'

/**
 * MODULE 9: B2B & WHOLESALE
 * Main API Route
 * 
 * CRITICAL: This module augments ordering logic only.
 * No duplication of customers or orders.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { B2BConfigService } from '@/lib/b2b/config-service'
import { B2BCustomerService } from '@/lib/b2b/customer-service'
import { B2BPricingService } from '@/lib/b2b/pricing-service'
import { B2BInvoiceService } from '@/lib/b2b/invoice-service'
import { B2BBulkOrderService } from '@/lib/b2b/bulk-order-service'
import { B2BEntitlementsService, B2BValidationService } from '@/lib/b2b/entitlements-service'

/**
 * GET /api/b2b
 * Get B2B status, profiles, tiers, invoices, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Status
    if (action === 'status' || !action) {
      const status = await B2BConfigService.getStatus(tenantId)
      return NextResponse.json(status)
    }

    // List profiles
    if (action === 'profiles') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const result = await B2BCustomerService.listProfiles(tenantId, { page, limit })
      return NextResponse.json(result)
    }

    // Get single profile
    if (action === 'profile') {
      const customerId = searchParams.get('customerId')
      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
      }
      const profile = await B2BCustomerService.getProfile(tenantId, customerId)
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      return NextResponse.json({ profile })
    }

    // Profile statistics
    if (action === 'profile-statistics') {
      const stats = await B2BCustomerService.getStatistics(tenantId)
      return NextResponse.json({ statistics: stats })
    }

    // List price tiers
    if (action === 'price-tiers') {
      const activeOnly = searchParams.get('activeOnly') !== 'false'
      const tiers = await B2BPricingService.listPriceTiers(tenantId, activeOnly)
      return NextResponse.json({ tiers })
    }

    // List price rules
    if (action === 'price-rules') {
      const productId = searchParams.get('productId') || undefined
      const categoryId = searchParams.get('categoryId') || undefined
      const rules = await B2BPricingService.listPriceRules(tenantId, { productId, categoryId })
      return NextResponse.json({ rules })
    }

    // Resolve price
    if (action === 'resolve-price') {
      const productId = searchParams.get('productId')
      const quantity = parseInt(searchParams.get('quantity') || '1')
      const customerId = searchParams.get('customerId') || undefined
      
      if (!productId) {
        return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
      }
      
      const pricing = await B2BPricingService.resolvePrice(tenantId, productId, quantity, { customerId })
      return NextResponse.json({ pricing })
    }

    // List invoices
    if (action === 'invoices') {
      const profileId = searchParams.get('profileId') || undefined
      const overdue = searchParams.get('overdue') === 'true'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const result = await B2BInvoiceService.listInvoices(tenantId, { profileId, overdue, page, limit })
      return NextResponse.json(result)
    }

    // Get single invoice
    if (action === 'invoice') {
      const invoiceId = searchParams.get('invoiceId')
      if (!invoiceId) {
        return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
      }
      const invoice = await B2BInvoiceService.getInvoice(tenantId, invoiceId)
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      return NextResponse.json({ invoice })
    }

    // Invoice statistics
    if (action === 'invoice-statistics') {
      const stats = await B2BInvoiceService.getStatistics(tenantId)
      return NextResponse.json({ statistics: stats })
    }

    // Credit ledger
    if (action === 'credit-ledger') {
      const profileId = searchParams.get('profileId')
      if (!profileId) {
        return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
      }
      const limit = parseInt(searchParams.get('limit') || '50')
      const entries = await B2BInvoiceService.getCreditLedger(tenantId, profileId, limit)
      return NextResponse.json({ entries })
    }

    // List bulk order drafts
    if (action === 'bulk-orders') {
      const profileId = searchParams.get('profileId') || undefined
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const result = await B2BBulkOrderService.listDrafts(tenantId, { profileId, page, limit })
      return NextResponse.json(result)
    }

    // Get single bulk order draft
    if (action === 'bulk-order') {
      const draftId = searchParams.get('draftId')
      if (!draftId) {
        return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })
      }
      const draft = await B2BBulkOrderService.getDraft(tenantId, draftId)
      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }
      return NextResponse.json({ draft })
    }

    // Bulk order statistics
    if (action === 'bulk-order-statistics') {
      const stats = await B2BBulkOrderService.getStatistics(tenantId)
      return NextResponse.json({ statistics: stats })
    }

    // Entitlements
    if (action === 'entitlements') {
      const entitlements = await B2BEntitlementsService.getEntitlements(tenantId)
      return NextResponse.json(entitlements)
    }

    // Validation
    if (action === 'validate') {
      const result = await B2BValidationService.validateModule(tenantId)
      return NextResponse.json(result)
    }

    // Manifest
    if (action === 'manifest') {
      const manifest = B2BValidationService.getManifest()
      return NextResponse.json(manifest)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('B2B GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/b2b
 * Initialize, create profiles, tiers, rules, invoices, bulk orders
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Initialize
    if (body.action === 'initialize') {
      const config = await B2BConfigService.initialize(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Create B2B profile for existing customer
    if (body.action === 'create-profile') {
      // Check entitlement
      const canAdd = await B2BEntitlementsService.canAddB2BCustomer(tenantId)
      if (!canAdd.allowed) {
        return NextResponse.json({ error: canAdd.reason }, { status: 403 })
      }

      const profile = await B2BCustomerService.createProfile(tenantId, body.profile)
      return NextResponse.json({ success: true, profile })
    }

    // Verify profile
    if (body.action === 'verify-profile') {
      const profile = await B2BCustomerService.verifyProfile(tenantId, body.profileId, session.user.id)
      return NextResponse.json({ success: true, profile })
    }

    // Create price tier
    if (body.action === 'create-price-tier') {
      const tier = await B2BPricingService.createPriceTier(tenantId, body.tier)
      return NextResponse.json({ success: true, tier })
    }

    // Create price rule
    if (body.action === 'create-price-rule') {
      const rule = await B2BPricingService.createPriceRule(tenantId, body.rule, session.user.id)
      return NextResponse.json({ success: true, rule })
    }

    // Create invoice
    if (body.action === 'create-invoice') {
      const invoice = await B2BInvoiceService.createInvoice(tenantId, body.invoice, session.user.id)
      return NextResponse.json({ success: true, invoice })
    }

    // Send invoice
    if (body.action === 'send-invoice') {
      const invoice = await B2BInvoiceService.sendInvoice(tenantId, body.invoiceId)
      return NextResponse.json({ success: true, invoice })
    }

    // Record payment
    if (body.action === 'record-payment') {
      const invoice = await B2BInvoiceService.recordPayment(
        tenantId,
        body.invoiceId,
        body.amount,
        body.paymentReference
      )
      return NextResponse.json({ success: true, invoice })
    }

    // Create bulk order draft
    if (body.action === 'create-bulk-order') {
      const draft = await B2BBulkOrderService.createDraft(tenantId, body.draft, session.user.id)
      return NextResponse.json({ success: true, draft })
    }

    // Submit bulk order
    if (body.action === 'submit-bulk-order') {
      const draft = await B2BBulkOrderService.submitDraft(tenantId, body.draftId, session.user.id)
      return NextResponse.json({ success: true, draft })
    }

    // Approve bulk order
    if (body.action === 'approve-bulk-order') {
      const draft = await B2BBulkOrderService.approveDraft(tenantId, body.draftId)
      return NextResponse.json({ success: true, draft })
    }

    // Reject bulk order
    if (body.action === 'reject-bulk-order') {
      const draft = await B2BBulkOrderService.rejectDraft(tenantId, body.draftId, body.reason)
      return NextResponse.json({ success: true, draft })
    }

    // Mark bulk order as converted
    if (body.action === 'convert-bulk-order') {
      const draft = await B2BBulkOrderService.markConverted(tenantId, body.draftId, body.orderId)
      return NextResponse.json({ success: true, draft })
    }

    // Cancel bulk order
    if (body.action === 'cancel-bulk-order') {
      const draft = await B2BBulkOrderService.cancelDraft(tenantId, body.draftId)
      return NextResponse.json({ success: true, draft })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('B2B POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/b2b
 * Update configuration, profiles, drafts
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session?.activeTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.activeTenantId
    const body = await request.json()

    // Update config
    if (body.action === 'update-config') {
      const config = await B2BConfigService.updateConfig(tenantId, body.config)
      return NextResponse.json({ success: true, config })
    }

    // Update profile
    if (body.action === 'update-profile') {
      const profile = await B2BCustomerService.updateProfile(tenantId, body.profileId, body.profile)
      return NextResponse.json({ success: true, profile })
    }

    // Update bulk order draft
    if (body.action === 'update-bulk-order') {
      const draft = await B2BBulkOrderService.updateDraft(tenantId, body.draftId, body.draft)
      return NextResponse.json({ success: true, draft })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('B2B PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
