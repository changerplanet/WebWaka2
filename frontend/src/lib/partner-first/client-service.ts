/**
 * PHASE 4A: Partner Client Creation Service
 * 
 * Enables Partners to create and manage client platforms.
 * Partners are the ONLY operators of client platforms.
 * 
 * FLOW:
 * 1. Partner creates client platform
 * 2. Default Platform Instance created automatically
 * 3. Domain assigned (optional)
 * 4. Tenant admin invited
 */

import { prisma } from '../prisma'
import { TenantStatus, Tenant, PlatformInstance, TenantDomain } from '@prisma/client'
import { requirePartnerOwner, requirePartnerAccess } from '../partner-authorization'
import { createDefaultInstanceForTenant } from '../platform-instance/default-instance'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// TYPES
// ============================================================================

export interface CreateClientPlatformInput {
  // Required
  name: string
  slug: string
  
  // Contact for invitation
  adminEmail: string
  adminName?: string
  adminPhone?: string
  
  // Branding (optional)
  branding?: {
    appName?: string
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
  }
  
  // Domain (optional)
  customDomain?: string
  
  // Capabilities to request
  requestedCapabilities?: string[]
  
  // Metadata
  notes?: string
}

export interface CreateClientPlatformResult {
  success: boolean
  tenant?: Tenant
  instance?: PlatformInstance
  domain?: TenantDomain
  invitationUrl?: string
  error?: string
  errorCode?: string
}

export interface ClientPlatform {
  id: string
  name: string
  slug: string
  status: TenantStatus
  createdAt: Date
  activatedAt: Date | null
  
  // Admin info
  adminEmail?: string
  adminName?: string
  
  // Branding
  branding: {
    appName: string
    primaryColor: string
    secondaryColor: string
    logoUrl: string | null
  }
  
  // Domains
  domains: {
    id: string
    domain: string
    type: string
    status: string
    isPrimary: boolean
  }[]
  
  // Instances
  instances: {
    id: string
    name: string
    slug: string
    isDefault: boolean
    isActive: boolean
    suiteKeys: string[]
  }[]
}

// ============================================================================
// CREATE CLIENT PLATFORM
// ============================================================================

/**
 * Partner creates a new client platform.
 * 
 * This creates:
 * 1. Tenant in PENDING_ACTIVATION state
 * 2. Default Platform Instance
 * 3. Subdomain
 * 4. Partner attribution
 */
export async function createClientPlatform(
  partnerId: string,
  input: CreateClientPlatformInput
): Promise<CreateClientPlatformResult> {
  // 1. Verify partner access (must be PARTNER_OWNER)
  const authResult = await requirePartnerOwner()
  if (!authResult.authorized) {
    return {
      success: false,
      error: authResult.error,
      errorCode: 'UNAUTHORIZED',
    }
  }
  
  // Verify the partner ID matches
  if (authResult.partner.id !== partnerId) {
    return {
      success: false,
      error: 'Cannot create client for a different partner',
      errorCode: 'UNAUTHORIZED',
    }
  }
  
  // 2. Validate partner is active
  if (authResult.partner.status !== 'ACTIVE') {
    return {
      success: false,
      error: 'Partner must be active to create clients',
      errorCode: 'PARTNER_INACTIVE',
    }
  }
  
  // 3. Validate input
  if (!input.name || !input.slug || !input.adminEmail) {
    return {
      success: false,
      error: 'Name, slug, and admin email are required',
      errorCode: 'INVALID_INPUT',
    }
  }
  
  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(input.slug)) {
    return {
      success: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens',
      errorCode: 'INVALID_SLUG',
    }
  }
  
  // 4. Check slug availability
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: input.slug }
  })
  
  if (existingTenant) {
    return {
      success: false,
      error: 'A platform with this slug already exists',
      errorCode: 'SLUG_EXISTS',
    }
  }
  
  // 5. Create everything in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        id: uuidv4(),
        name: input.name,
        slug: input.slug,
        status: 'PENDING_ACTIVATION',
        appName: input.branding?.appName || input.name,
        primaryColor: input.branding?.primaryColor || '#6366f1',
        secondaryColor: input.branding?.secondaryColor || '#8b5cf6',
        logoUrl: input.branding?.logoUrl || null,
        requestedModules: input.requestedCapabilities || [],
        activatedModules: [],
      }
    })
    
    // Create default subdomain
    const domain = await tx.tenantDomain.create({
      data: {
        id: uuidv4(),
        tenantId: tenant.id,
        domain: input.slug,
        type: 'SUBDOMAIN',
        status: 'VERIFIED',
        isPrimary: true,
      }
    })
    
    // Create custom domain if provided
    let customDomainRecord: TenantDomain | null = null
    if (input.customDomain) {
      customDomainRecord = await tx.tenantDomain.create({
        data: {
          id: uuidv4(),
          tenantId: tenant.id,
          domain: input.customDomain,
          type: 'CUSTOM',
          status: 'PENDING',
          isPrimary: false,
          verificationToken: uuidv4(),
        }
      })
    }
    
    // Create partner referral/attribution
    await tx.partnerReferral.create({
      data: {
        id: uuidv4(),
        partnerId,
        tenantId: tenant.id,
        attributionMethod: 'PARTNER_CREATED',
        referralSource: 'partner-dashboard',
        createdByUserId: authResult.user.id,
        metadata: {
          adminEmail: input.adminEmail,
          adminName: input.adminName,
          adminPhone: input.adminPhone,
          requestedCapabilities: input.requestedCapabilities,
          notes: input.notes,
        }
      }
    })
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'PARTNER_TENANT_CREATED',
        actorId: authResult.user.id,
        actorEmail: authResult.user.email || 'unknown',
        tenantId: tenant.id,
        targetType: 'Tenant',
        targetId: tenant.id,
        metadata: {
          partnerId,
          partnerName: authResult.partner.name,
          tenantSlug: tenant.slug,
          adminEmail: input.adminEmail,
        }
      }
    })
    
    return { tenant, domain, customDomain: customDomainRecord }
  })
  
  // Create default platform instance (outside transaction for separate error handling)
  let instance: any = null
  try {
    instance = await createDefaultInstanceForTenant(result.tenant.id)
  } catch (error) {
    console.error('Failed to create default instance:', error)
    // Continue - tenant is created, instance can be created later
  }
  
  // Generate invitation URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/signup/complete?tenant=${input.slug}&email=${encodeURIComponent(input.adminEmail)}`
  
  return {
    success: true,
    tenant: result.tenant,
    instance: instance || undefined,
    domain: result.domain,
    invitationUrl,
  }
}

// ============================================================================
// GET CLIENT PLATFORMS
// ============================================================================

/**
 * Get all client platforms for a partner
 */
export async function getClientPlatforms(
  partnerId: string,
  options?: {
    status?: TenantStatus[]
    search?: string
    limit?: number
    offset?: number
  }
): Promise<{ platforms: ClientPlatform[]; total: number }> {
  // Verify partner access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    return { platforms: [], total: 0 }
  }
  
  // Build where clause
  const where: any = {
    partnerId,
  }
  
  const tenantWhere: any = {}
  
  if (options?.status && options.status.length > 0) {
    tenantWhere.status = { in: options.status }
  }
  
  if (options?.search) {
    tenantWhere.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { slug: { contains: options.search, mode: 'insensitive' } },
    ]
  }
  
  if (Object.keys(tenantWhere).length > 0) {
    where.tenant = tenantWhere
  }
  
  // Get referrals with tenant data
  const [referrals, total] = await Promise.all([
    prisma.partnerReferral.findMany({
      where,
      include: {
        Tenant: {
          include: {
            domains: {
              select: {
                id: true,
                domain: true,
                type: true,
                status: true,
                isPrimary: true,
              }
            },
            platformInstances: {
              select: {
                id: true,
                name: true,
                slug: true,
                isDefault: true,
                isActive: true,
                suiteKeys: true,
              }
            }
          }
        }
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.partnerReferral.count({ where })
  ])
  
  // Map to client platform format
  const platforms: ClientPlatform[] = referrals.map(ref => {
    const tenant = ref.tenant
    const metadata = (ref.metadata as any) || {}
    
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt,
      activatedAt: tenant.activatedAt,
      adminEmail: metadata.adminEmail,
      adminName: metadata.adminName,
      branding: {
        appName: tenant.appName,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logoUrl: tenant.logoUrl,
      },
      domains: tenant.domains,
      instances: tenant.platformInstances,
    }
  })
  
  return { platforms, total }
}

/**
 * Get a single client platform by ID
 */
export async function getClientPlatform(
  partnerId: string,
  tenantId: string
): Promise<ClientPlatform | null> {
  // Verify partner access
  const authResult = await requirePartnerAccess(partnerId)
  if (!authResult.authorized) {
    return null
  }
  
  // Get referral with tenant
  const referral = await prisma.partnerReferral.findFirst({
    where: {
      partnerId,
      tenantId,
    },
    include: {
      Tenant: {
        include: {
          domains: {
            select: {
              id: true,
              domain: true,
              type: true,
              status: true,
              isPrimary: true,
            }
          },
          platformInstances: {
            select: {
              id: true,
              name: true,
              slug: true,
              isDefault: true,
              isActive: true,
              suiteKeys: true,
            }
          }
        }
      }
    }
  })
  
  if (!referral) {
    return null
  }
  
  const tenant = referral.tenant
  const metadata = (referral.metadata as any) || {}
  
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: tenant.createdAt,
    activatedAt: tenant.activatedAt,
    adminEmail: metadata.adminEmail,
    adminName: metadata.adminName,
    branding: {
      appName: tenant.appName,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      logoUrl: tenant.logoUrl,
    },
    domains: tenant.domains,
    instances: tenant.platformInstances,
  }
}

// ============================================================================
// CLIENT PLATFORM MANAGEMENT
// ============================================================================

/**
 * Update client platform branding
 */
export async function updateClientBranding(
  partnerId: string,
  tenantId: string,
  branding: {
    appName?: string
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  // Verify partner access
  const authResult = await requirePartnerOwner()
  if (!authResult.authorized) {
    return { success: false, error: authResult.error }
  }
  
  // Verify this tenant belongs to this partner
  const referral = await prisma.partnerReferral.findFirst({
    where: { partnerId, tenantId }
  })
  
  if (!referral) {
    return { success: false, error: 'Client not found' }
  }
  
  // Update tenant branding
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      appName: branding.appName,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      logoUrl: branding.logoUrl,
    }
  })
  
  return { success: true }
}

/**
 * Resend invitation to client admin
 */
export async function resendClientInvitation(
  partnerId: string,
  tenantId: string
): Promise<{ success: boolean; invitationUrl?: string; error?: string }> {
  // Verify partner access
  const authResult = await requirePartnerOwner()
  if (!authResult.authorized) {
    return { success: false, error: authResult.error }
  }
  
  // Verify this tenant belongs to this partner
  const referral = await prisma.partnerReferral.findFirst({
    where: { partnerId, tenantId },
    include: { Tenant: true }
  })
  
  if (!referral) {
    return { success: false, error: 'Client not found' }
  }
  
  const metadata = (referral.metadata as any) || {}
  const adminEmail = metadata.adminEmail
  
  if (!adminEmail) {
    return { success: false, error: 'No admin email on record' }
  }
  
  // Generate new invitation URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/signup/complete?tenant=${referral.tenant.slug}&email=${encodeURIComponent(adminEmail)}`
  
  // TODO: Actually send email via Resend
  
  return { success: true, invitationUrl }
}
