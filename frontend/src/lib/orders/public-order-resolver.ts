/**
 * CUSTOMER ORDER PORTAL PUBLIC RESOLVER
 * Wave I.5: Customer Order Portal (Public / End-User)
 * 
 * Server-side resolution for public order views.
 * Uses ONLY existing Prisma models and read-only queries.
 * 
 * CONSTRAINTS (Wave I.5 - ALL ENFORCED):
 * - ❌ No new business logic - only Prisma read queries
 * - ❌ No schema changes - uses existing models
 * - ❌ No automation - no background jobs
 * - ❌ No payments - read-only
 * - ❌ No refunds - read-only
 * - ❌ No messaging - read-only
 * - ❌ No cancellations - read-only
 * - ❌ No cross-tenant access
 * 
 * DATA SOURCES (existing only):
 * - tenant: Tenant resolution with activatedModules
 * - svm_orders: SVM orders with items
 * - mvm_parent_order: MVM orders with items and sub-orders
 * - park_ticket: ParkHub tickets
 * 
 * ============================================================================
 * WAVE I.5 GAP DOCUMENTATION (per spec requirement)
 * ============================================================================
 * 
 * GAP 1: No unified "order" abstraction across SVM/MVM/ParkHub
 * - What is missing: Single Order model aggregating all order types
 * - Current workaround: Querying each order type separately, transforming to unified interface
 * - Why it cannot be solved in Wave I: Schema changes forbidden
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 2: Inconsistent status enums across order types
 * - What is missing: Unified status enum across SVM/MVM/ParkHub
 * - Current workaround: Displaying raw status from each order type
 * - Why it cannot be solved in Wave I: Would require schema changes or business logic
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 3: Missing customer identity linkage
 * - What is missing: Unified customer ID linking orders across types
 * - Current workaround: Using email/phone as customer identifier
 * - Why it cannot be solved in Wave I: Would require new schema/business logic
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 4: Missing receipt association
 * - What is missing: Receipt records linked to orders
 * - Current workaround: Showing order details as "receipt" view
 * - Why it cannot be solved in Wave I: Receipt model may not exist or link differently
 * - Deferred to: Post-Wave I gap resolution
 * 
 * GAP 5: Authentication/session for customer order access
 * - What is missing: Secure customer authentication to view their orders
 * - Current workaround: 
 *   - Demo tenants allow unauthenticated access (all orders visible)
 *   - Live tenants require email/phone query param to filter orders
 *   - Order detail accessible via direct orderRef (order number acts as token)
 * - Why it cannot be solved in Wave I: Would require new auth infrastructure
 * - Security note: Email/phone enumeration is possible but no cross-tenant access
 * - Deferred to: Post-Wave I gap resolution - proper auth tokens needed
 * 
 * GAP 6: Order tracking UI components
 * - What is missing: Real-time tracking display, maps, delivery status
 * - Current workaround: Static status display
 * - Why it cannot be solved in Wave I: Would require new components and integrations
 * - Deferred to: Post-Wave I gap resolution
 * 
 * @module lib/orders/public-order-resolver
 */

import { prisma } from '../prisma'
import { TenantStatus } from '@prisma/client'
import { getSvmOrderReceipt, getMvmOrderReceipt } from '../commerce/receipt/order-receipt-service'

export type OrderType = 'SVM' | 'MVM' | 'PARKHUB'

export interface OrderPortalTenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  activatedModules: string[]
  isDemo: boolean
}

export interface UnifiedOrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl: string | null
  variantName: string | null
}

export interface UnifiedOrder {
  id: string
  tenantId: string
  orderNumber: string
  orderType: OrderType
  orderTypeLabel: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  status: string
  paymentStatus: string
  paymentMethod: string | null
  currency: string
  grandTotal: number
  createdAt: Date
  items: UnifiedOrderItem[]
  trackingNumber: string | null
  trackingUrl: string | null
  shippingAddress: any
  receiptUrl: string | null
  verificationUrl: string | null
}

export interface ParkHubTicket {
  id: string
  tenantId: string
  ticketNumber: string
  passengerName: string
  passengerPhone: string | null
  seatNumber: string | null
  price: number
  totalPaid: number
  paymentMethod: string
  paymentStatus: string
  soldAt: Date
  status: string
  tripId: string
  verificationUrl: string | null
  manifestUrl: string | null
}

export type TenantResolutionResult = 
  | { success: true; tenant: OrderPortalTenant }
  | { success: false; reason: 'not_found' | 'suspended' | 'orders_disabled' }

export type OrdersListResult = 
  | { success: true; orders: UnifiedOrder[]; tenant: OrderPortalTenant }
  | { success: false; reason: 'tenant_not_found' | 'suspended' | 'orders_disabled' }

export type OrderDetailResult = 
  | { success: true; order: UnifiedOrder; tenant: OrderPortalTenant }
  | { success: false; reason: 'tenant_not_found' | 'order_not_found' | 'suspended' }

export type TicketDetailResult = 
  | { success: true; ticket: ParkHubTicket; tenant: OrderPortalTenant }
  | { success: false; reason: 'tenant_not_found' | 'ticket_not_found' | 'suspended' }

function isDemo(tenant: { slug: string; name: string }): boolean {
  return tenant.slug.toLowerCase().startsWith('demo') || 
         tenant.name.toLowerCase().includes('demo')
}

function hasOrdersCapability(modules: string[]): boolean {
  const orderModules = ['svm', 'mvm', 'commerce', 'store', 'marketplace', 'parkhub', 'transport']
  return modules.some(m => orderModules.includes(m.toLowerCase()))
}

/**
 * Wave B2-Fix (B2-F1): Phone Normalization
 * 
 * Normalizes phone numbers for comparison with tolerance for:
 * - Formatting characters (spaces, dashes, dots, parens)
 * - Nigerian country code variations (+234, 234, 0)
 */
function normalizePhoneForVerification(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '')
  if (normalized.startsWith('+234')) {
    normalized = '0' + normalized.slice(4)
  } else if (normalized.startsWith('234') && normalized.length > 10) {
    normalized = '0' + normalized.slice(3)
  }
  return normalized.toLowerCase()
}

function normalizeEmailForVerification(email: string | null | undefined): string | undefined {
  if (!email) return undefined
  return email.toLowerCase().trim()
}

/**
 * Wave B2-Fix (B2-F1): Verify customer identity against a specific order
 * 
 * Called AFTER order is located to verify customer owns that specific order.
 * This prevents cross-system ref collision verification issues.
 */
function verifyCustomerAgainstOrder(
  verification: { email?: string; phone?: string },
  order: { customerEmail?: string | null; customerPhone?: string | null; passengerPhone?: string | null }
): boolean {
  const normalizedInputEmail = normalizeEmailForVerification(verification.email)
  const normalizedInputPhone = normalizePhoneForVerification(verification.phone)
  
  const orderEmail = normalizeEmailForVerification(order.customerEmail)
  const orderPhone = normalizePhoneForVerification(order.customerPhone || order.passengerPhone)
  
  const emailMatch = !!(normalizedInputEmail && orderEmail && normalizedInputEmail === orderEmail)
  const phoneMatch = !!(normalizedInputPhone && orderPhone && normalizedInputPhone === orderPhone)
  
  return emailMatch || phoneMatch
}

export async function resolveOrderPortalTenant(tenantSlug: string): Promise<TenantResolutionResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      appName: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      secondaryColor: true,
      activatedModules: true,
    }
  })

  if (!tenant) {
    return { success: false, reason: 'not_found' }
  }

  const tenantIsDemo = isDemo(tenant)

  if (!tenantIsDemo && tenant.status === 'SUSPENDED') {
    return { success: false, reason: 'suspended' }
  }

  if (!tenantIsDemo && tenant.status !== 'ACTIVE') {
    return { success: false, reason: 'suspended' }
  }

  if (!tenantIsDemo && !hasOrdersCapability(tenant.activatedModules)) {
    return { success: false, reason: 'orders_disabled' }
  }

  return {
    success: true,
    tenant: {
      ...tenant,
      isDemo: tenantIsDemo,
    }
  }
}

export async function resolveCustomerOrders(
  tenantSlug: string,
  customerIdentifier?: { email?: string; phone?: string }
): Promise<OrdersListResult> {
  const tenantResult = await resolveOrderPortalTenant(tenantSlug)
  if (!tenantResult.success) {
    return { success: false, reason: tenantResult.reason === 'not_found' ? 'tenant_not_found' : tenantResult.reason }
  }

  const tenant = tenantResult.tenant
  const orders: UnifiedOrder[] = []

  const hasCustomerFilter = customerIdentifier?.email || customerIdentifier?.phone
  if (!tenant.isDemo && !hasCustomerFilter) {
    return { success: true, orders: [], tenant }
  }

  const svmOrders = await prisma.svm_orders.findMany({
    where: {
      tenantId: tenant.id,
      ...(customerIdentifier?.email && { customerEmail: customerIdentifier.email }),
      ...(customerIdentifier?.phone && { customerPhone: customerIdentifier.phone }),
    },
    include: {
      svm_order_items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  for (const order of svmOrders) {
    // Wave C1: Check for linked receipt
    const orderExt = order as typeof order & { receiptId?: string | null }
    const receiptId = orderExt.receiptId
    const receiptUrl = receiptId 
      ? `/${tenantSlug}/orders/${order.orderNumber}/receipt` 
      : null

    orders.push({
      id: order.id,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
      orderType: 'SVM',
      orderTypeLabel: 'Store Order',
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      grandTotal: Number(order.grandTotal),
      createdAt: order.createdAt,
      items: order.svm_order_items.map(item => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.lineTotal),
        imageUrl: item.imageUrl,
        variantName: item.variantName,
      })),
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      shippingAddress: order.shippingAddress,
      receiptUrl,
      verificationUrl: null,
    })
  }

  const mvmOrders = await prisma.mvm_parent_order.findMany({
    where: {
      tenantId: tenant.id,
      ...(customerIdentifier?.email && { customerEmail: customerIdentifier.email }),
      ...(customerIdentifier?.phone && { customerPhone: customerIdentifier.phone }),
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  for (const order of mvmOrders) {
    // Wave C1: Check for linked receipt
    const orderExt = order as typeof order & { receiptId?: string | null }
    const receiptId = orderExt.receiptId
    const receiptUrl = receiptId 
      ? `/${tenantSlug}/orders/${order.orderNumber}/receipt` 
      : null

    orders.push({
      id: order.id,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
      orderType: 'MVM',
      orderTypeLabel: 'Marketplace Order',
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      grandTotal: Number(order.grandTotal),
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.lineTotal),
        imageUrl: item.imageUrl,
        variantName: item.variantName,
      })),
      trackingNumber: null,
      trackingUrl: null,
      shippingAddress: order.shippingAddress,
      receiptUrl,
      verificationUrl: null,
    })
  }

  const tickets = await prisma.park_ticket.findMany({
    where: {
      tenantId: tenant.id,
      ...(customerIdentifier?.phone && { passengerPhone: customerIdentifier.phone }),
    },
    orderBy: { soldAt: 'desc' },
    take: 50,
  })

  for (const ticket of tickets) {
    orders.push({
      id: ticket.id,
      tenantId: ticket.tenantId,
      orderNumber: ticket.ticketNumber,
      orderType: 'PARKHUB',
      orderTypeLabel: 'Transport Ticket',
      customerName: ticket.passengerName,
      customerEmail: null,
      customerPhone: ticket.passengerPhone,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus,
      paymentMethod: ticket.paymentMethod,
      currency: 'NGN',
      grandTotal: Number(ticket.totalPaid),
      createdAt: ticket.soldAt,
      items: [{
        id: ticket.id,
        name: `Seat ${ticket.seatNumber || 'Unassigned'}`,
        quantity: 1,
        unitPrice: Number(ticket.price),
        totalPrice: Number(ticket.totalPaid),
        imageUrl: null,
        variantName: null,
      }],
      trackingNumber: null,
      trackingUrl: null,
      shippingAddress: null,
      receiptUrl: null,
      verificationUrl: `/${tenantSlug}/orders/ticket/${ticket.ticketNumber}`,
    })
  }

  orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return { success: true, orders, tenant }
}

/**
 * Wave B2-Fix (B2-F1): Order Access Hardening
 * 
 * SECURITY MODEL:
 * - For DEMO tenants: Order reference alone grants access (preserved behavior)
 * - For LIVE tenants: Order reference alone is INSUFFICIENT
 *   - Requires customer verification via email or phone
 *   - Order is located FIRST, then verified against that specific record
 *   - This prevents cross-system ref collision verification attacks
 * 
 * This function returns a verification-required flag for live tenants without credentials.
 * UI layer MUST redirect to verification page if verification is required.
 * 
 * GAP-5 CLOSURE: Order number is no longer a bearer token for live tenants.
 */
export async function resolveOrderByRef(
  tenantSlug: string,
  orderRef: string,
  verification?: { email?: string; phone?: string }
): Promise<OrderDetailResult | { success: false; reason: 'verification_required'; tenant: OrderPortalTenant }> {
  const tenantResult = await resolveOrderPortalTenant(tenantSlug)
  if (!tenantResult.success) {
    return { success: false, reason: tenantResult.reason === 'not_found' ? 'tenant_not_found' : 'suspended' }
  }

  const tenant = tenantResult.tenant
  const requiresVerification = !tenant.isDemo
  const hasVerification = verification?.email || verification?.phone

  // B2-F1: For live tenants without credentials, prompt for verification
  if (requiresVerification && !hasVerification) {
    return { success: false, reason: 'verification_required', tenant }
  }

  // STEP 1: Locate the order FIRST across all systems
  const svmOrder = await prisma.svm_orders.findFirst({
    where: {
      tenantId: tenant.id,
      orderNumber: orderRef,
    },
    include: {
      svm_order_items: true,
    },
  })

  if (svmOrder) {
    // B2-F1: Verify against THIS specific order
    if (requiresVerification && verification) {
      const verified = verifyCustomerAgainstOrder(verification, {
        customerEmail: svmOrder.customerEmail,
        customerPhone: svmOrder.customerPhone,
      })
      if (!verified) {
        // Generic error - do NOT reveal order exists
        return { success: false, reason: 'order_not_found' }
      }
    }
    
    return {
      success: true,
      order: {
        id: svmOrder.id,
        tenantId: svmOrder.tenantId,
        orderNumber: svmOrder.orderNumber,
        orderType: 'SVM',
        orderTypeLabel: 'Store Order',
        customerName: svmOrder.customerName,
        customerEmail: svmOrder.customerEmail,
        customerPhone: svmOrder.customerPhone,
        status: svmOrder.status,
        paymentStatus: svmOrder.paymentStatus,
        paymentMethod: svmOrder.paymentMethod,
        currency: svmOrder.currency,
        grandTotal: Number(svmOrder.grandTotal),
        createdAt: svmOrder.createdAt,
        items: svmOrder.svm_order_items.map(item => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.lineTotal),
          imageUrl: item.imageUrl,
          variantName: item.variantName,
        })),
        trackingNumber: svmOrder.trackingNumber,
        trackingUrl: svmOrder.trackingUrl,
        shippingAddress: svmOrder.shippingAddress,
        receiptUrl: null,
        verificationUrl: null,
      },
      tenant,
    }
  }

  const mvmOrder = await prisma.mvm_parent_order.findFirst({
    where: {
      tenantId: tenant.id,
      orderNumber: orderRef,
    },
    include: {
      items: true,
    },
  })

  if (mvmOrder) {
    // B2-F1: Verify against THIS specific order
    if (requiresVerification && verification) {
      const verified = verifyCustomerAgainstOrder(verification, {
        customerEmail: mvmOrder.customerEmail,
        customerPhone: mvmOrder.customerPhone,
      })
      if (!verified) {
        return { success: false, reason: 'order_not_found' }
      }
    }
    
    return {
      success: true,
      order: {
        id: mvmOrder.id,
        tenantId: mvmOrder.tenantId,
        orderNumber: mvmOrder.orderNumber,
        orderType: 'MVM',
        orderTypeLabel: 'Marketplace Order',
        customerName: mvmOrder.customerName,
        customerEmail: mvmOrder.customerEmail,
        customerPhone: mvmOrder.customerPhone,
        status: mvmOrder.status,
        paymentStatus: mvmOrder.paymentStatus,
        paymentMethod: mvmOrder.paymentMethod,
        currency: mvmOrder.currency,
        grandTotal: Number(mvmOrder.grandTotal),
        createdAt: mvmOrder.createdAt,
        items: mvmOrder.items.map(item => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.lineTotal),
          imageUrl: item.imageUrl,
          variantName: item.variantName,
        })),
        trackingNumber: null,
        trackingUrl: null,
        shippingAddress: mvmOrder.shippingAddress,
        receiptUrl: null,
        verificationUrl: null,
      },
      tenant,
    }
  }

  const ticket = await prisma.park_ticket.findFirst({
    where: {
      tenantId: tenant.id,
      ticketNumber: orderRef,
    },
  })

  if (ticket) {
    // B2-F1: Verify against THIS specific ticket (phone only for ParkHub)
    if (requiresVerification && verification) {
      const verified = verifyCustomerAgainstOrder(verification, {
        passengerPhone: ticket.passengerPhone,
      })
      if (!verified) {
        return { success: false, reason: 'order_not_found' }
      }
    }
    
    return {
      success: true,
      order: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        orderNumber: ticket.ticketNumber,
        orderType: 'PARKHUB',
        orderTypeLabel: 'Transport Ticket',
        customerName: ticket.passengerName,
        customerEmail: null,
        customerPhone: ticket.passengerPhone,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        paymentMethod: ticket.paymentMethod,
        currency: 'NGN',
        grandTotal: Number(ticket.totalPaid),
        createdAt: ticket.soldAt,
        items: [{
          id: ticket.id,
          name: `Seat ${ticket.seatNumber || 'Unassigned'}`,
          quantity: 1,
          unitPrice: Number(ticket.price),
          totalPrice: Number(ticket.totalPaid),
          imageUrl: null,
          variantName: null,
        }],
        trackingNumber: null,
        trackingUrl: null,
        shippingAddress: null,
        receiptUrl: null,
        verificationUrl: `/${tenantSlug}/orders/ticket/${ticket.ticketNumber}`,
      },
      tenant,
    }
  }

  return { success: false, reason: 'order_not_found' }
}

export type TicketDetailResultWithVerification = 
  | { success: true; ticket: ParkHubTicket; tenant: OrderPortalTenant }
  | { success: false; reason: 'tenant_not_found' | 'ticket_not_found' | 'suspended' | 'verification_required'; tenant?: OrderPortalTenant }

export async function resolveTicketByRef(
  tenantSlug: string,
  ticketRef: string,
  verification?: { phone?: string }
): Promise<TicketDetailResultWithVerification> {
  const tenantResult = await resolveOrderPortalTenant(tenantSlug)
  if (!tenantResult.success) {
    return { success: false, reason: tenantResult.reason === 'not_found' ? 'tenant_not_found' : 'suspended' }
  }

  const tenant = tenantResult.tenant
  const requiresVerification = !tenant.isDemo
  const hasVerification = !!verification?.phone

  if (requiresVerification && !hasVerification) {
    return { success: false, reason: 'verification_required', tenant }
  }

  const ticket = await prisma.park_ticket.findFirst({
    where: {
      tenantId: tenant.id,
      ticketNumber: ticketRef,
    },
  })

  if (!ticket) {
    return { success: false, reason: 'ticket_not_found' }
  }

  if (requiresVerification && verification?.phone) {
    const verified = verifyCustomerAgainstOrder(
      { phone: verification.phone },
      { passengerPhone: ticket.passengerPhone }
    )
    if (!verified) {
      return { success: false, reason: 'ticket_not_found' }
    }
  }

  return {
    success: true,
    ticket: {
      id: ticket.id,
      tenantId: ticket.tenantId,
      ticketNumber: ticket.ticketNumber,
      passengerName: ticket.passengerName,
      passengerPhone: ticket.passengerPhone,
      seatNumber: ticket.seatNumber,
      price: Number(ticket.price),
      totalPaid: Number(ticket.totalPaid),
      paymentMethod: ticket.paymentMethod,
      paymentStatus: ticket.paymentStatus,
      soldAt: ticket.soldAt,
      status: ticket.status,
      tripId: ticket.tripId,
      verificationUrl: null,
      manifestUrl: null,
    },
    tenant,
  }
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getOrderStatusColor(status: string): string {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('complete') || statusLower.includes('delivered') || statusLower.includes('paid')) {
    return 'bg-green-100 text-green-800'
  }
  if (statusLower.includes('pending') || statusLower.includes('processing')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (statusLower.includes('cancel') || statusLower.includes('refund') || statusLower.includes('failed')) {
    return 'bg-red-100 text-red-800'
  }
  if (statusLower.includes('shipped') || statusLower.includes('transit')) {
    return 'bg-blue-100 text-blue-800'
  }
  return 'bg-gray-100 text-gray-800'
}

export function getPaymentMethodLabel(method: string | null): string {
  if (!method) return 'Not specified'
  const methodLower = method.toLowerCase()
  if (methodLower.includes('card')) return 'Card'
  if (methodLower.includes('bank') || methodLower.includes('transfer')) return 'Bank Transfer'
  if (methodLower.includes('ussd')) return 'USSD'
  if (methodLower.includes('cash') || methodLower.includes('cod') || methodLower.includes('pod')) return 'Cash'
  if (methodLower.includes('mobile') || methodLower.includes('money')) return 'Mobile Money'
  return method
}

export function getOrderTypeIcon(orderType: OrderType): string {
  switch (orderType) {
    case 'SVM':
      return '🛒'
    case 'MVM':
      return '🏪'
    case 'PARKHUB':
      return '🚌'
    default:
      return '📦'
  }
}
