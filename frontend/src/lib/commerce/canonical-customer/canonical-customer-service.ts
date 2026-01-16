/**
 * CANONICAL CUSTOMER SERVICE
 * Wave J.2: Unified Customer Identity (Read-Only)
 * 
 * High-level service for resolving and accessing canonical customer identities.
 * Aggregates data from SVM, MVM, and ParkHub into unified customer views.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes
 * - ❌ No data mutations
 * - ❌ No authentication
 * - ❌ No customer accounts
 * - ✅ Read-only aggregation
 * - ✅ Tenant isolation enforced
 * 
 * @module lib/commerce/canonical-customer/canonical-customer-service
 */

import { prisma } from '../../prisma'
import { 
  CanonicalCustomer, 
  CustomerResolutionResult, 
  AmbiguousCustomerEntry 
} from './types'
import { 
  normalizeEmail, 
  normalizePhone, 
  detectAmbiguity 
} from './identity-resolution'
import {
  extractSvmCustomers,
  extractMvmCustomers,
  extractParkHubCustomers,
  aggregateToCanonical,
  resolveCustomerFromOrder,
} from './adapters'

/**
 * Gets customer by email
 * 
 * Searches across SVM and MVM (ParkHub has no email)
 */
export async function getByEmail(
  tenantId: string,
  email: string
): Promise<CustomerResolutionResult> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return { customers: [], isAmbiguous: false }
  }
  
  const [svmData, mvmData] = await Promise.all([
    extractSvmCustomers(tenantId, { email: normalizedEmail }),
    extractMvmCustomers(tenantId, { email: normalizedEmail }),
  ])
  
  const allData = [...svmData, ...mvmData]
  const customers = aggregateToCanonical(allData)
  
  const ambiguityCheck = detectAmbiguity(
    allData.map(d => ({ email: d.email ?? undefined, phone: d.phone ?? undefined, name: d.name ?? undefined }))
  )
  
  return {
    customers,
    isAmbiguous: ambiguityCheck.isAmbiguous,
    ambiguityReason: ambiguityCheck.reason,
  }
}

/**
 * Gets customer by phone
 * 
 * Searches across SVM, MVM, and ParkHub
 */
export async function getByPhone(
  tenantId: string,
  phone: string
): Promise<CustomerResolutionResult> {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) {
    return { customers: [], isAmbiguous: false }
  }
  
  const [svmData, mvmData, parkData] = await Promise.all([
    extractSvmCustomers(tenantId, { phone: normalizedPhone }),
    extractMvmCustomers(tenantId, { phone: normalizedPhone }),
    extractParkHubCustomers(tenantId, { phone: normalizedPhone }),
  ])
  
  const allData = [...svmData, ...mvmData, ...parkData]
  const customers = aggregateToCanonical(allData)
  
  const ambiguityCheck = detectAmbiguity(
    allData.map(d => ({ email: d.email ?? undefined, phone: d.phone ?? undefined, name: d.name ?? undefined }))
  )
  
  return {
    customers,
    isAmbiguous: ambiguityCheck.isAmbiguous,
    ambiguityReason: ambiguityCheck.reason,
  }
}

/**
 * Resolves customer identity from an order reference
 */
export async function resolveFromOrder(
  tenantId: string,
  orderReference: string
): Promise<CanonicalCustomer | null> {
  return resolveCustomerFromOrder(tenantId, orderReference)
}

/**
 * Lists potentially ambiguous customer identities for a tenant
 * 
 * Finds cases where:
 * - Same email appears with different phones
 * - Same phone appears with different emails
 * - Name variations exist for same contact info
 * 
 * GAP: No pagination - returns all ambiguous entries
 * GAP: Performance may degrade with large datasets
 */
export async function listAmbiguous(
  tenantId: string,
  limit: number = 50
): Promise<AmbiguousCustomerEntry[]> {
  const ambiguous: AmbiguousCustomerEntry[] = []
  
  const svmOrders = await prisma.svm_orders.findMany({
    where: { tenantId },
    select: {
      customerEmail: true,
      customerPhone: true,
      customerName: true,
    },
    take: 500,
  })
  
  const emailToPhones = new Map<string, Set<string>>()
  const phoneToEmails = new Map<string, Set<string>>()
  
  for (const order of svmOrders) {
    const email = normalizeEmail(order.customerEmail)
    const phone = normalizePhone(order.customerPhone)
    
    if (email && phone) {
      if (!emailToPhones.has(email)) {
        emailToPhones.set(email, new Set())
      }
      emailToPhones.get(email)!.add(phone)
      
      if (!phoneToEmails.has(phone)) {
        phoneToEmails.set(phone, new Set())
      }
      phoneToEmails.get(phone)!.add(email)
    }
  }
  
  for (const [email, phones] of emailToPhones.entries()) {
    if (phones.size > 1 && ambiguous.length < limit) {
      const result = await getByEmail(tenantId, email)
      if (result.customers.length > 0) {
        ambiguous.push({
          canonicalId: result.customers[0].canonicalId,
          email,
          phone: Array.from(phones)[0],
          sourceSystems: result.customers[0].sourceSystems,
          reason: `Email "${email}" has ${phones.size} different phone numbers`,
          fragmentationLevel: phones.size > 2 ? 'HIGH' : 'MEDIUM',
        })
      }
    }
  }
  
  for (const [phone, emails] of phoneToEmails.entries()) {
    if (emails.size > 1 && ambiguous.length < limit) {
      const result = await getByPhone(tenantId, phone)
      if (result.customers.length > 0) {
        ambiguous.push({
          canonicalId: result.customers[0].canonicalId,
          email: Array.from(emails)[0],
          phone,
          sourceSystems: result.customers[0].sourceSystems,
          reason: `Phone "${phone}" has ${emails.size} different email addresses`,
          fragmentationLevel: emails.size > 2 ? 'HIGH' : 'MEDIUM',
        })
      }
    }
  }
  
  return ambiguous.slice(0, limit)
}

export const CanonicalCustomerService = {
  getByEmail,
  getByPhone,
  resolveFromOrder,
  listAmbiguous,
}
