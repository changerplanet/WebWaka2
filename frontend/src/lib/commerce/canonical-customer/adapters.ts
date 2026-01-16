/**
 * SOURCE ADAPTERS
 * Wave J.2: Unified Customer Identity (Read-Only)
 * 
 * Read-only adapters that extract customer identity from SVM, MVM, and ParkHub.
 * Each adapter reads from the source system and maps to CanonicalCustomer format.
 * 
 * CONSTRAINTS:
 * - ❌ No mutations
 * - ❌ No schema changes
 * - ✅ Read-only Prisma queries
 * - ✅ Tenant isolation enforced
 * 
 * @module lib/commerce/canonical-customer/adapters
 */

import { prisma } from '../../prisma'
import { CanonicalCustomer, SourceSystem } from './types'
import { 
  generateCanonicalId, 
  normalizeEmail, 
  normalizePhone 
} from './identity-resolution'

interface RawCustomerData {
  email?: string | null
  phone?: string | null
  name?: string | null
  sourceSystem: SourceSystem
  sourceId: string
}

/**
 * Extracts customer data from SVM orders
 * 
 * Data source: svm_orders (customerEmail, customerPhone, customerName)
 * GAP: No dedicated svm_customers table - identity derived from orders
 */
export async function extractSvmCustomers(
  tenantId: string,
  filter: { email?: string; phone?: string }
): Promise<RawCustomerData[]> {
  const whereClause: Record<string, unknown> = { tenantId }
  
  if (filter.email) {
    whereClause.customerEmail = filter.email
  }
  if (filter.phone) {
    whereClause.customerPhone = filter.phone
  }
  
  if (!filter.email && !filter.phone) {
    return []
  }
  
  const orders = await prisma.svm_orders.findMany({
    where: whereClause,
    select: {
      id: true,
      customerEmail: true,
      customerPhone: true,
      customerName: true,
    },
    distinct: ['customerEmail'],
  })
  
  return orders.map(order => ({
    email: order.customerEmail,
    phone: order.customerPhone,
    name: order.customerName,
    sourceSystem: 'SVM' as SourceSystem,
    sourceId: order.id,
  }))
}

/**
 * Extracts customer data from MVM parent orders
 * 
 * Data source: mvm_parent_order (customerEmail, customerPhone, customerName)
 */
export async function extractMvmCustomers(
  tenantId: string,
  filter: { email?: string; phone?: string }
): Promise<RawCustomerData[]> {
  const whereClause: Record<string, unknown> = { tenantId }
  
  if (filter.email) {
    whereClause.customerEmail = filter.email
  }
  if (filter.phone) {
    whereClause.customerPhone = filter.phone
  }
  
  if (!filter.email && !filter.phone) {
    return []
  }
  
  const orders = await prisma.mvm_parent_order.findMany({
    where: whereClause,
    select: {
      id: true,
      customerEmail: true,
      customerPhone: true,
      customerName: true,
    },
    distinct: ['customerEmail'],
  })
  
  return orders.map(order => ({
    email: order.customerEmail,
    phone: order.customerPhone,
    name: order.customerName,
    sourceSystem: 'MVM' as SourceSystem,
    sourceId: order.id,
  }))
}

/**
 * Extracts passenger data from ParkHub tickets
 * 
 * Data source: park_ticket (passengerPhone, passengerName)
 * GAP: ParkHub has NO email field - phone is primary identifier
 */
export async function extractParkHubCustomers(
  tenantId: string,
  filter: { email?: string; phone?: string }
): Promise<RawCustomerData[]> {
  if (filter.email && !filter.phone) {
    return []
  }
  
  if (!filter.phone) {
    return []
  }
  
  const tickets = await prisma.park_ticket.findMany({
    where: {
      tenantId,
      passengerPhone: filter.phone,
    },
    select: {
      id: true,
      passengerPhone: true,
      passengerName: true,
    },
    distinct: ['passengerPhone'],
  })
  
  return tickets.map(ticket => ({
    email: undefined,
    phone: ticket.passengerPhone,
    name: ticket.passengerName,
    sourceSystem: 'PARKHUB' as SourceSystem,
    sourceId: ticket.id,
  }))
}

/**
 * Aggregates raw customer data into a CanonicalCustomer
 * 
 * Groups by canonicalId and merges source information
 */
export function aggregateToCanonical(
  rawData: RawCustomerData[]
): CanonicalCustomer[] {
  const customerMap = new Map<string, CanonicalCustomer>()
  
  for (const data of rawData) {
    const normalizedEmail = normalizeEmail(data.email)
    const normalizedPhone = normalizePhone(data.phone)
    const canonicalId = generateCanonicalId(
      normalizedEmail, 
      normalizedPhone,
      { system: data.sourceSystem, id: data.sourceId }
    )
    
    const existing = customerMap.get(canonicalId)
    
    if (existing) {
      const systemAdded = !existing.sourceSystems.includes(data.sourceSystem)
      if (systemAdded) {
        existing.sourceSystems.push(data.sourceSystem)
      }
      
      if (data.sourceSystem === 'SVM') {
        if (!existing.originalReferences.svmOrderIds) {
          existing.originalReferences.svmOrderIds = []
        }
        if (!existing.originalReferences.svmOrderIds.includes(data.sourceId)) {
          existing.originalReferences.svmOrderIds.push(data.sourceId)
        }
      } else if (data.sourceSystem === 'MVM') {
        if (!existing.originalReferences.mvmOrderIds) {
          existing.originalReferences.mvmOrderIds = []
        }
        if (!existing.originalReferences.mvmOrderIds.includes(data.sourceId)) {
          existing.originalReferences.mvmOrderIds.push(data.sourceId)
        }
      } else if (data.sourceSystem === 'PARKHUB') {
        if (!existing.originalReferences.parkTicketIds) {
          existing.originalReferences.parkTicketIds = []
        }
        if (!existing.originalReferences.parkTicketIds.includes(data.sourceId)) {
          existing.originalReferences.parkTicketIds.push(data.sourceId)
        }
      }
      
      if (!existing.name && data.name) {
        existing.name = data.name
      }
      
      // B2-F2: Recompute fragmentation when source systems change
      if (systemAdded) {
        const hasEmail = !!existing.email
        const hasPhone = !!existing.phone
        existing.fragmentation.linkedSystems = [...existing.sourceSystems]
        existing.fragmentation.canMerge = hasEmail && hasPhone
        
        // Recompute unlinkable systems based on identity coverage
        if (hasEmail && hasPhone) {
          existing.fragmentation.unlinkableSystems = []
          existing.fragmentation.isFragmented = false
          existing.fragmentation.fragmentationLevel = 'NONE'
          existing.fragmentation.fragmentationReasons = []
          existing.fragmentation.mergeBlockers = undefined
        } else if (hasPhone && !hasEmail) {
          existing.fragmentation.unlinkableSystems = ['SVM', 'MVM'].filter(
            s => !existing.sourceSystems.includes(s as SourceSystem)
          ) as SourceSystem[]
        } else if (hasEmail && !hasPhone) {
          existing.fragmentation.unlinkableSystems = existing.sourceSystems.includes('PARKHUB') 
            ? [] 
            : ['PARKHUB']
        }
        
        // Update privacy limitations for cross-system linkability
        existing.privacyLimitations.crossSystemLinkable = hasEmail && hasPhone
      }
    } else {
      const hasEmail = !!normalizedEmail
      const hasPhone = !!normalizedPhone
      const isPhoneOnly = hasPhone && !hasEmail
      const isEmailOnly = hasEmail && !hasPhone
      
      const customer: CanonicalCustomer = {
        canonicalId,
        email: normalizedEmail,
        phone: normalizedPhone,
        name: data.name ?? undefined,
        sourceSystems: [data.sourceSystem],
        originalReferences: {},
        metadata: {},
        fragmentation: {
          isFragmented: data.sourceSystem === 'PARKHUB' && isPhoneOnly,
          fragmentationLevel: data.sourceSystem === 'PARKHUB' && isPhoneOnly ? 'MEDIUM' : 'NONE',
          fragmentationReasons: isPhoneOnly 
            ? ['Phone-only identity cannot link with email-based systems']
            : isEmailOnly 
              ? ['Email-only identity cannot link with ParkHub (phone required)']
              : [],
          linkedSystems: [data.sourceSystem],
          unlinkableSystems: isPhoneOnly ? ['SVM', 'MVM'] : isEmailOnly ? ['PARKHUB'] : [],
          canMerge: hasEmail && hasPhone,
          mergeBlockers: (!hasEmail || !hasPhone) 
            ? ['Missing ' + (!hasEmail ? 'email' : 'phone') + ' for full cross-system linking']
            : undefined,
        },
        privacyLimitations: {
          canFullyErase: false,
          erasureBlockers: [
            'No GDPR erasure workflow implemented',
            'Order history retained for tax compliance',
            data.sourceSystem === 'PARKHUB' ? 'ParkHub tickets require manifest retention' : 'Financial records retention required',
          ],
          dataRetentionDays: null,
          crossSystemLinkable: hasEmail && hasPhone,
          consentStatus: 'IMPLICIT',
          rightToPortability: false,
          portabilityFormat: 'NONE',
        },
      }
      
      if (data.sourceSystem === 'SVM') {
        customer.originalReferences.svmOrderIds = [data.sourceId]
      } else if (data.sourceSystem === 'MVM') {
        customer.originalReferences.mvmOrderIds = [data.sourceId]
      } else if (data.sourceSystem === 'PARKHUB') {
        customer.originalReferences.parkTicketIds = [data.sourceId]
      }
      
      customerMap.set(canonicalId, customer)
    }
  }
  
  return Array.from(customerMap.values())
}

/**
 * Resolves customer from an order reference
 * 
 * Attempts resolution in order: SVM → MVM → ParkHub
 */
export async function resolveCustomerFromOrder(
  tenantId: string,
  orderReference: string
): Promise<CanonicalCustomer | null> {
  const svmOrder = await prisma.svm_orders.findFirst({
    where: { tenantId, orderNumber: orderReference },
    select: {
      id: true,
      customerEmail: true,
      customerPhone: true,
      customerName: true,
    },
  })
  
  if (svmOrder) {
    const customers = aggregateToCanonical([{
      email: svmOrder.customerEmail,
      phone: svmOrder.customerPhone,
      name: svmOrder.customerName,
      sourceSystem: 'SVM',
      sourceId: svmOrder.id,
    }])
    return customers[0] || null
  }
  
  const mvmOrder = await prisma.mvm_parent_order.findFirst({
    where: { tenantId, orderNumber: orderReference },
    select: {
      id: true,
      customerEmail: true,
      customerPhone: true,
      customerName: true,
    },
  })
  
  if (mvmOrder) {
    const customers = aggregateToCanonical([{
      email: mvmOrder.customerEmail,
      phone: mvmOrder.customerPhone,
      name: mvmOrder.customerName,
      sourceSystem: 'MVM',
      sourceId: mvmOrder.id,
    }])
    return customers[0] || null
  }
  
  const ticket = await prisma.park_ticket.findFirst({
    where: { tenantId, ticketNumber: orderReference },
    select: {
      id: true,
      passengerPhone: true,
      passengerName: true,
    },
  })
  
  if (ticket) {
    const customers = aggregateToCanonical([{
      email: undefined,
      phone: ticket.passengerPhone,
      name: ticket.passengerName,
      sourceSystem: 'PARKHUB',
      sourceId: ticket.id,
    }])
    return customers[0] || null
  }
  
  return null
}
