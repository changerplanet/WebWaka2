import { prisma } from './prisma'
import { DomainStatus } from '@prisma/client'
import dns from 'dns/promises'

/**
 * DNS Record types for domain verification
 */
export type VerificationMethod = 'TXT' | 'CNAME'

export interface DomainVerificationInfo {
  domain: string
  method: VerificationMethod
  recordName: string  // e.g., "_saascore-verify.example.com"
  recordValue: string // The verification token value
  status: DomainStatus
  instructions: string
}

/**
 * Generate verification info for a custom domain
 */
export function getVerificationInfo(domain: string, token: string): DomainVerificationInfo {
  return {
    domain,
    method: 'TXT',
    recordName: `_saascore-verify.${domain}`,
    recordValue: token,
    status: 'PENDING',
    instructions: `Add a TXT record to your DNS with:\n\nName: _saascore-verify\nValue: ${token}\n\nNote: DNS changes may take up to 48 hours to propagate.`
  }
}

/**
 * Verify a custom domain by checking DNS records
 */
export async function verifyDomain(domain: string, expectedToken: string): Promise<{
  verified: boolean
  error?: string
  records?: string[]
}> {
  try {
    const recordName = `_saascore-verify.${domain}`
    
    // Look up TXT records
    const records = await dns.resolveTxt(recordName).catch(() => [])
    
    // Flatten the records array (TXT records can be split into chunks)
    const flatRecords = records.map(chunks => chunks.join(''))
    
    console.log(`[Domain Verification] Checking ${recordName}:`, flatRecords)
    
    // Check if any record matches the expected token
    const verified = flatRecords.some(record => record === expectedToken)
    
    if (verified) {
      return { verified: true, records: flatRecords }
    }
    
    return {
      verified: false,
      error: flatRecords.length > 0 
        ? 'TXT record found but value does not match' 
        : 'No TXT record found',
      records: flatRecords
    }
  } catch (error: any) {
    console.error(`[Domain Verification] Error for ${domain}:`, error.message)
    
    // Handle specific DNS errors
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return {
        verified: false,
        error: 'DNS record not found. Please ensure you have added the TXT record and wait for DNS propagation.'
      }
    }
    
    return {
      verified: false,
      error: `DNS lookup failed: ${error.message}`
    }
  }
}

/**
 * Verify domain and update database
 */
export async function verifyAndUpdateDomain(domainId: string): Promise<{
  success: boolean
  domain?: any
  error?: string
}> {
  const domainRecord = await prisma.tenantDomain.findUnique({
    where: { id: domainId }
  })
  
  if (!domainRecord) {
    return { success: false, error: 'Domain not found' }
  }
  
  if (domainRecord.type === 'SUBDOMAIN') {
    return { success: false, error: 'Subdomains do not require verification' }
  }
  
  if (domainRecord.status === 'VERIFIED') {
    return { success: true, domain: domainRecord }
  }
  
  if (!domainRecord.verificationToken) {
    return { success: false, error: 'No verification token found' }
  }
  
  const result = await verifyDomain(domainRecord.domain, domainRecord.verificationToken)
  
  if (result.verified) {
    const updated = await prisma.tenantDomain.update({
      where: { id: domainId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date()
      }
    })
    
    return { success: true, domain: updated }
  }
  
  // Update status to FAILED if verification fails after many attempts
  // For now, just return the error
  return { success: false, error: result.error }
}

/**
 * Check if a domain is available (not already in use)
 */
export async function isDomainAvailable(domain: string): Promise<boolean> {
  const existing = await prisma.tenantDomain.findUnique({
    where: { domain: domain.toLowerCase() }
  })
  
  return !existing
}
