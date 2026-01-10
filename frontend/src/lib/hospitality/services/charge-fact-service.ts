/**
 * HOSPITALITY SUITE: Charge Fact Service
 * 
 * Emits billing facts to Commerce (NEVER handles money).
 * 
 * COMMERCE BOUNDARY: This service emits facts only.
 * Flow: Hospitality [Charge Facts] → Billing [Invoice] → Payments → Accounting
 * 
 * @module lib/hospitality/services/charge-fact-service
 * @phase S2
 * @standard Platform Standardisation v2
 */

import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '../../prisma'
import { HospitalityChargeFactType, HospitalityChargeFactStatus } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateChargeFactInput {
  tenantId: string
  guestId?: string
  stayId?: string
  orderId?: string
  factType: HospitalityChargeFactType
  description: string
  quantity?: number
  unitAmount: number
  serviceDate?: Date
  servicedById?: string
  servicedByName?: string
  referenceType?: string
  referenceId?: string
}

export interface ChargeFactSearchOptions {
  guestId?: string
  stayId?: string
  orderId?: string
  factType?: HospitalityChargeFactType
  status?: HospitalityChargeFactStatus
  dateFrom?: Date
  dateTo?: Date
  pending?: boolean
  page?: number
  limit?: number
}

// ============================================================================
// CHARGE FACT OPERATIONS
// ============================================================================

/**
 * Creates a charge fact (billing event).
 * CRITICAL: This emits facts ONLY. No invoicing, no payment recording.
 */
export async function createChargeFact(input: CreateChargeFactInput) {
  const quantity = input.quantity || 1
  const amount = quantity * input.unitAmount

  return prisma.hospitality_charge_fact.create({
    data: withPrismaDefaults({
      tenantId: input.tenantId,
      guestId: input.guestId,
      stayId: input.stayId,
      orderId: input.orderId,
      factType: input.factType,
      description: input.description,
      quantity,
      unitAmount: input.unitAmount,
      amount,
      serviceDate: input.serviceDate || new Date(),
      servicedById: input.servicedById,
      servicedByName: input.servicedByName,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      status: 'PENDING'
    }),
    include: { guest: true, stay: true, svm_orders: true }
  })
}

export async function getChargeFact(tenantId: string, factId: string) {
  return prisma.hospitality_charge_fact.findFirst({
    where: { id: factId, tenantId },
    include: { guest: true, stay: true, svm_orders: true }
  })
}

export async function listChargeFacts(tenantId: string, options?: ChargeFactSearchOptions) {
  const page = options?.page || 1
  const limit = options?.limit || 50
  const skip = (page - 1) * limit

  const where = {
    tenantId,
    ...(options?.guestId && { guestId: options.guestId }),
    ...(options?.stayId && { stayId: options.stayId }),
    ...(options?.orderId && { orderId: options.orderId }),
    ...(options?.factType && { factType: options.factType }),
    ...(options?.status && { status: options.status as HospitalityChargeFactStatus }),
    ...(options?.pending && { status: 'PENDING' as const }),
    ...(options?.dateFrom && options?.dateTo && {
      serviceDate: { gte: options.dateFrom, lte: options.dateTo }
    })
  }

  const [facts, total] = await Promise.all([
    prisma.hospitality_charge_fact.findMany({
      where,
      include: { guest: true, stay: true, svm_orders: true },
      skip,
      take: limit,
      orderBy: { serviceDate: 'desc' }
    }),
    prisma.hospitality_charge_fact.count({ where })
  ])

  return { facts, total, page, limit }
}

// ============================================================================
// COMMERCE BOUNDARY METHODS
// ============================================================================

/**
 * Called by Commerce Billing when invoice is created.
 * Links the charge fact to the billing invoice.
 */
export async function markAsBilled(tenantId: string, factId: string, billingInvoiceId: string) {
  return prisma.hospitality_charge_fact.update({
    where: { id: factId },
    data: {
      status: 'BILLED',
      billingInvoiceId,
      billedAt: new Date(),
      updatedAt: new Date()
    }
  })
}

/**
 * Marks multiple charge facts as billed (batch operation).
 */
export async function markMultipleAsBilled(tenantId: string, factIds: string[], billingInvoiceId: string) {
  return prisma.hospitality_charge_fact.updateMany({
    where: { id: { in: factIds }, tenantId },
    data: {
      status: 'BILLED',
      billingInvoiceId,
      billedAt: new Date(),
      updatedAt: new Date()
    }
  })
}

/**
 * Gets pending charge facts ready for billing.
 */
export async function getPendingChargeFacts(tenantId: string, guestId?: string, stayId?: string) {
  return prisma.hospitality_charge_fact.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      ...(guestId && { guestId }),
      ...(stayId && { stayId })
    },
    include: { guest: true, stay: true, svm_orders: true },
    orderBy: { serviceDate: 'asc' }
  })
}

// ============================================================================
// WAIVER OPERATIONS
// ============================================================================

export async function waiveChargeFact(tenantId: string, factId: string, waivedBy: string, reason: string) {
  return prisma.hospitality_charge_fact.update({
    where: { id: factId },
    data: {
      status: 'WAIVED',
      waivedAt: new Date(),
      waivedBy,
      waiverReason: reason,
      updatedAt: new Date()
    }
  })
}

export async function cancelChargeFact(tenantId: string, factId: string) {
  return prisma.hospitality_charge_fact.update({
    where: { id: factId },
    data: { status: 'CANCELLED', updatedAt: new Date() }
  })
}

// ============================================================================
// ROOM NIGHT CHARGE GENERATION
// ============================================================================

/**
 * Generates room night charge facts for a stay.
 * Called during check-out or daily audit.
 */
export async function generateRoomNightCharges(tenantId: string, stayId: string) {
  const stay = await prisma.hospitality_stay.findFirst({
    where: { id: stayId, tenantId },
    include: { guest: true, room: true }
  })

  if (!stay) throw new Error('Stay not found')

  const charges: Array<Awaited<ReturnType<typeof createChargeFact>>> = []
  
  // Generate charge for each night
  const checkIn = new Date(stay.checkInDate)
  const checkOut = new Date(stay.checkOutDate)
  
  for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
    const nightDate = new Date(d)
    
    // Check if charge already exists for this night
    const existing = await prisma.hospitality_charge_fact.findFirst({
      where: {
        tenantId,
        stayId,
        factType: 'ROOM_NIGHT',
        serviceDate: {
          gte: new Date(nightDate.setHours(0, 0, 0, 0)),
          lt: new Date(nightDate.setHours(23, 59, 59, 999))
        }
      }
    })
    
    if (!existing) {
      const charge = await createChargeFact({
        tenantId,
        guestId: stay.guestId,
        stayId,
        factType: 'ROOM_NIGHT',
        description: `Room ${stay.room.roomNumber} - ${nightDate.toISOString().split('T')[0]}`,
        quantity: 1,
        unitAmount: Number(stay.nightlyRate),
        serviceDate: nightDate,
        referenceType: 'STAY',
        referenceId: stayId
      })
      charges.push(charge)
    }
  }
  
  return charges
}

// ============================================================================
// ORDER CHARGE GENERATION
// ============================================================================

/**
 * Generates charge facts for an order.
 * Called when order is completed.
 */
export async function generateOrderCharges(tenantId: string, orderId: string) {
  const order = await prisma.hospitality_order.findFirst({
    where: { id: orderId, tenantId },
    include: { guest: true, inv_audit_items: true, stay: true }
  })

  if (!order) throw new Error('Order not found')

  // Check if charges already exist
  const existing = await prisma.hospitality_charge_fact.findFirst({
    where: { tenantId, orderId, factType: 'FOOD_BEVERAGE' }
  })
  
  if (existing) return [] // Charges already generated

  // Calculate order total
  const orderTotal = order.items.reduce((sum: any, item: any) => {
    if (item.status === 'CANCELLED') return sum
    const modifierTotal = (item.modifiers as { price?: number }[] || [])
      .reduce((m, mod) => m + (mod.price || 0), 0)
    return sum + (Number(item.unitPrice) + modifierTotal) * item.quantity
  }, 0)

  const factType = order.orderType === 'ROOM_SERVICE' ? 'ROOM_SERVICE' : 'FOOD_BEVERAGE'

  const charge = await createChargeFact({
    tenantId,
    guestId: order.guestId || undefined,
    stayId: order.stayId || undefined,
    orderId,
    factType,
    description: `Order ${order.orderNumber} - ${order.items.length} items`,
    quantity: 1,
    unitAmount: orderTotal,
    serviceDate: order.completedAt || new Date(),
    referenceType: 'ORDER',
    referenceId: orderId
  })

  return [charge]
}

// ============================================================================
// SERVICE EVENT CHARGE GENERATION
// ============================================================================

/**
 * Generates charge fact for a chargeable service event.
 */
export async function generateServiceEventCharge(tenantId: string, eventId: string) {
  const event = await prisma.hospitality_service_event.findFirst({
    where: { id: eventId, tenantId },
    include: { room: true, stay: { include: { guest: true } } }
  })

  if (!event) throw new Error('Service event not found')
  if (!event.isChargeable) return null

  // Check if charge already exists
  const existing = await prisma.hospitality_charge_fact.findFirst({
    where: { tenantId, referenceType: 'SERVICE_EVENT', referenceId: eventId }
  })
  
  if (existing) return null

  // Map event type to charge fact type
  const factTypeMap: Record<string, HospitalityChargeFactType> = {
    'LAUNDRY': 'LAUNDRY',
    'MINIBAR_REFILL': 'MINIBAR',
    'ROOM_SERVICE': 'ROOM_SERVICE'
  }

  const factType = factTypeMap[event.eventType] || 'OTHER'

  return createChargeFact({
    tenantId,
    guestId: event.stay?.guestId,
    stayId: event.stayId || undefined,
    factType,
    description: event.description || `${event.eventType} service`,
    quantity: 1,
    unitAmount: Number(event.chargeAmount),
    serviceDate: event.completedAt || new Date(),
    servicedById: event.assignedToId || undefined,
    servicedByName: event.assignedToName || undefined,
    referenceType: 'SERVICE_EVENT',
    referenceId: eventId
  })
}

// ============================================================================
// BILLING SUMMARY
// ============================================================================

export async function getGuestBillingSummary(tenantId: string, guestId: string) {
  const [pending, billed, waived] = await Promise.all([
    prisma.hospitality_charge_fact.aggregate({
      where: { tenantId, guestId, status: 'PENDING' },
      _sum: { amount: true },
      _count: true
    }),
    prisma.hospitality_charge_fact.aggregate({
      where: { tenantId, guestId, status: 'BILLED' },
      _sum: { amount: true },
      _count: true
    }),
    prisma.hospitality_charge_fact.aggregate({
      where: { tenantId, guestId, status: 'WAIVED' },
      _sum: { amount: true },
      _count: true
    })
  ])

  return {
    pending: {
      count: pending._count,
      total: Number(pending._sum.amount) || 0
    },
    billed: {
      count: billed._count,
      total: Number(billed._sum.amount) || 0
    },
    waived: {
      count: waived._count,
      total: Number(waived._sum.amount) || 0
    }
  }
}

export async function getStayBillingSummary(tenantId: string, stayId: string) {
  const facts = await prisma.hospitality_charge_fact.findMany({
    where: { tenantId, stayId },
    orderBy: { serviceDate: 'asc' }
  })

  const byType: Record<string, { count: number; total: number }> = {}
  let totalPending = 0
  let totalBilled = 0

  for (const fact of facts) {
    if (!byType[fact.factType]) {
      byType[fact.factType] = { count: 0, total: 0 }
    }
    byType[fact.factType].count++
    byType[fact.factType].total += Number(fact.amount)

    if (fact.status === 'PENDING') {
      totalPending += Number(fact.amount)
    } else if (fact.status === 'BILLED') {
      totalBilled += Number(fact.amount)
    }
  }

  return {
    facts,
    byType,
    totalPending,
    totalBilled,
    grandTotal: totalPending + totalBilled
  }
}
