/**
 * IDENTITY RESOLUTION
 * Wave J.2: Unified Customer Identity (Read-Only)
 * 
 * Deterministic identity resolution rules for customer matching.
 * 
 * Resolution priority:
 * 1. Email (case-insensitive, normalized)
 * 2. Phone (normalized to Nigerian format)
 * 3. Fallback: system-specific reference
 * 
 * IMPORTANT: If multiple records match, we DO NOT merge.
 * We return multiple CanonicalCustomer entries and flag ambiguity.
 * 
 * @module lib/commerce/canonical-customer/identity-resolution
 */

import { createHash } from 'crypto'

/**
 * Normalizes email for identity matching
 * - Lowercase
 * - Trim whitespace
 * - Remove dots from Gmail local part (optional, not implemented to avoid false positives)
 */
export function normalizeEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined
  return email.toLowerCase().trim()
}

/**
 * Normalizes phone number to Nigerian format
 * 
 * Handles:
 * - +234XXXXXXXXXX (international)
 * - 234XXXXXXXXXX (without plus)
 * - 0XXXXXXXXXX (local)
 * - XXXXXXXXXX (10 digits, assumes Nigerian mobile)
 * 
 * GAP: Phone format inconsistencies exist across systems.
 * This normalization is best-effort, not guaranteed accurate.
 */
export function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined
  
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }
  
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return `+${cleaned}`
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+234${cleaned.substring(1)}`
  }
  
  if (cleaned.length === 10 && /^[789]/.test(cleaned)) {
    return `+234${cleaned}`
  }
  
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return `+${cleaned}`
  }
  
  return phone.trim()
}

/**
 * Generates a deterministic canonical ID from identity attributes
 * 
 * Format: hash of normalized email (if present) or phone or source reference
 * This ensures the same identity always resolves to the same canonicalId
 * 
 * Priority:
 * 1. Email (primary identifier)
 * 2. Phone (secondary identifier)
 * 3. Fallback: deterministic hash from source system + ID
 */
export function generateCanonicalId(
  email: string | undefined,
  phone: string | undefined,
  sourceReference?: { system: string; id: string }
): string {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(phone)
  
  let identityString: string
  
  if (normalizedEmail) {
    identityString = `email:${normalizedEmail}`
  } else if (normalizedPhone) {
    identityString = `phone:${normalizedPhone}`
  } else if (sourceReference) {
    identityString = `source:${sourceReference.system}:${sourceReference.id}`
  } else {
    identityString = `unknown:no-identity`
  }
  
  const hash = createHash('sha256').update(identityString).digest('hex')
  return `cust_${hash.substring(0, 16)}`
}

/**
 * Checks if two identity sets potentially match
 * Used for ambiguity detection
 */
export function identitiesMatch(
  a: { email?: string; phone?: string },
  b: { email?: string; phone?: string }
): boolean {
  const aEmail = normalizeEmail(a.email)
  const bEmail = normalizeEmail(b.email)
  const aPhone = normalizePhone(a.phone)
  const bPhone = normalizePhone(b.phone)
  
  if (aEmail && bEmail && aEmail === bEmail) return true
  if (aPhone && bPhone && aPhone === bPhone) return true
  
  return false
}

/**
 * Detects potential ambiguity in identity resolution
 * 
 * Ambiguity occurs when:
 * - Same email with different phones
 * - Same phone with different emails
 * - Name variations with same contact info
 */
export function detectAmbiguity(
  records: Array<{ email?: string; phone?: string; name?: string }>
): { isAmbiguous: boolean; reason?: string } {
  if (records.length <= 1) {
    return { isAmbiguous: false }
  }
  
  const emails = new Set<string>()
  const phones = new Set<string>()
  const names = new Set<string>()
  
  for (const record of records) {
    const email = normalizeEmail(record.email)
    const phone = normalizePhone(record.phone)
    const name = record.name?.trim().toLowerCase()
    
    if (email) emails.add(email)
    if (phone) phones.add(phone)
    if (name) names.add(name)
  }
  
  if (emails.size > 1 && phones.size === 1) {
    return {
      isAmbiguous: true,
      reason: 'Multiple emails found for same phone number',
    }
  }
  
  if (phones.size > 1 && emails.size === 1) {
    return {
      isAmbiguous: true,
      reason: 'Multiple phone numbers found for same email',
    }
  }
  
  if (names.size > 1 && (emails.size === 1 || phones.size === 1)) {
    return {
      isAmbiguous: true,
      reason: 'Name variations detected for same contact info',
    }
  }
  
  return { isAmbiguous: false }
}
