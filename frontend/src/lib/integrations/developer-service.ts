/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * Developer API & SDK Service
 * 
 * Manages developer applications and API keys.
 * Features:
 * - API key generation per tenant
 * - Access scope definitions
 * - Rate limits per key
 * - IP restrictions
 */

import { PrismaClient, ApiKeyStatus, AccessScopeType } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Generate a secure API key
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `emw_${crypto.randomBytes(32).toString('hex')}`
  const prefix = key.slice(0, 12)
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return { key, prefix, hash }
}

/**
 * Create a developer app
 */
export async function createDeveloperApp(data: {
  tenantId?: string
  name: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  developerName: string
  developerEmail: string
  redirectUris?: string[]
  allowedScopes: string[]
}) {
  // Generate client credentials
  const clientId = `client_${crypto.randomBytes(16).toString('hex')}`
  const clientSecret = `secret_${crypto.randomBytes(32).toString('hex')}`
  
  const app = await prisma.developer_apps.create({
    data: {
      tenantId: data.tenantId,
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      developerName: data.developerName,
      developerEmail: data.developerEmail,
      clientId,
      clientSecret: crypto.createHash('sha256').update(clientSecret).digest('hex'),
      redirectUris: data.redirectUris || [],
      allowedScopes: data.allowedScopes,
      isVerified: false,
      isActive: true,
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: data.tenantId,
      eventType: 'DEVELOPER_APP_CREATED',
      eventData: {
        appId: app.id,
        name: data.name,
        developerEmail: data.developerEmail,
      },
      appId: app.id,
    },
  })
  
  // Return with unencrypted secret (only shown once!)
  return {
    ...app,
    clientSecret,
    _secretWarning: 'Save this client secret - it will not be shown again!',
  }
}

/**
 * List developer apps
 */
export async function listDeveloperApps(options?: {
  tenantId?: string
  verifiedOnly?: boolean
  page?: number
  limit?: number
}) {
  const where: any = {}
  
  if (options?.tenantId) {
    where.tenantId = options.tenantId
  }
  if (options?.verifiedOnly) {
    where.isVerified = true
  }
  where.isActive = true
  
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit
  
  const [apps, total] = await Promise.all([
    prisma.developer_apps.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        websiteUrl: true,
        developerName: true,
        developerEmail: true,
        clientId: true,
        allowedScopes: true,
        isVerified: true,
        totalRequests: true,
        lastRequestAt: true,
        createdAt: true,
        _count: {
          select: { api_keys: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.developer_apps.count({ where }),
  ])
  
  return {
    apps,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get developer app by ID
 */
export async function getDeveloperApp(appId: string) {
  return prisma.developer_apps.findUnique({
    where: { id: appId },
    include: {
      api_keys: {
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          status: true,
          expiresAt: true,
          lastUsedAt: true,
          usageCount: true,
          createdAt: true,
        },
      },
    },
  })
}

/**
 * Verify developer app (Super Admin)
 */
export async function verifyDeveloperApp(
  appId: string,
  verifiedBy: string
) {
  const app = await prisma.developer_apps.update({
    where: { id: appId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy,
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      eventType: 'DEVELOPER_APP_VERIFIED',
      eventData: { appId, verifiedBy },
      appId,
      actorId: verifiedBy,
      actorType: 'super_admin',
    },
  })
  
  return app
}

/**
 * Generate API key for app
 */
export async function generateApiKeyForApp(
  appId: string,
  data: {
    name: string
    tenantId?: string
    scopes: string[]
    expiresAt?: Date
    rateLimit?: number
    allowedIps?: string[]
  }
) {
  const app = await prisma.developer_apps.findUnique({
    where: { id: appId },
  })
  
  if (!app) {
    throw new Error('Developer app not found')
  }
  
  if (!app.isActive) {
    throw new Error('Developer app is not active')
  }
  
  // Validate scopes are within app's allowed scopes
  const invalidScopes = data.scopes.filter(s => !app.allowedScopes.includes(s))
  if (invalidScopes.length > 0) {
    throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`)
  }
  
  // Generate key
  const { key, prefix, hash } = generateApiKey()
  
  const apiKey = await prisma.api_keys.create({
    data: {
      appId,
      tenantId: data.tenantId,
      name: data.name,
      keyPrefix: prefix,
      keyHash: hash,
      scopes: data.scopes,
      status: ApiKeyStatus.ACTIVE,
      expiresAt: data.expiresAt,
      rateLimit: data.rateLimit,
      allowedIps: data.allowedIps || [],
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: data.tenantId,
      eventType: 'API_KEY_GENERATED',
      eventData: {
        keyId: apiKey.id,
        name: data.name,
        scopes: data.scopes,
      },
      appId,
      keyId: apiKey.id,
    },
  })
  
  // Return with unencrypted key (only shown once!)
  return {
    ...apiKey,
    key,
    _keyWarning: 'Save this API key - it will not be shown again!',
  }
}

/**
 * Validate API key
 */
export async function validateApiKey(
  key: string,
  requiredScopes?: string[],
  clientIp?: string
): Promise<{
  valid: boolean
  keyId?: string
  appId?: string
  tenantId?: string
  scopes?: string[]
  error?: string
}> {
  // Extract prefix and hash key
  const prefix = key.slice(0, 12)
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  
  // Find key by hash
  const apiKey = await prisma.api_keys.findFirst({
    where: {
      keyPrefix: prefix,
      keyHash: hash,
    },
    include: {
      developer_apps: true,
    },
  })
  
  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' }
  }
  
  // Check status
  if (apiKey.status !== ApiKeyStatus.ACTIVE) {
    return { valid: false, error: `API key is ${apiKey.status.toLowerCase()}` }
  }
  
  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    await prisma.api_keys.update({
      where: { id: apiKey.id },
      data: { status: ApiKeyStatus.EXPIRED },
    })
    return { valid: false, error: 'API key has expired' }
  }
  
  // Check IP restrictions
  if (clientIp && apiKey.allowedIps.length > 0 && !apiKey.allowedIps.includes(clientIp)) {
    return { valid: false, error: 'IP address not allowed' }
  }
  
  // Check required scopes
  if (requiredScopes && requiredScopes.length > 0) {
    const missingScopes = requiredScopes.filter(s => !apiKey.scopes.includes(s))
    if (missingScopes.length > 0) {
      return { valid: false, error: `Missing scopes: ${missingScopes.join(', ')}` }
    }
  }
  
  // Check app is active
  if (!apiKey.app.isActive) {
    return { valid: false, error: 'Developer app is not active' }
  }
  
  // Update usage tracking
  await Promise.all([
    prisma.api_keys.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    }),
    prisma.developer_apps.update({
      where: { id: apiKey.appId },
      data: {
        totalRequests: { increment: 1 },
        lastRequestAt: new Date(),
      },
    }),
  ])
  
  return {
    valid: true,
    keyId: apiKey.id,
    appId: apiKey.appId,
    tenantId: apiKey.tenantId || undefined,
    scopes: apiKey.scopes,
  }
}

/**
 * Revoke API key
 */
export async function revokeApiKey(
  keyId: string,
  reason: string,
  revokedBy: string
) {
  const apiKey = await prisma.api_keys.update({
    where: { id: keyId },
    data: {
      status: ApiKeyStatus.REVOKED,
      revokedAt: new Date(),
      revokedBy,
      revokedReason: reason,
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: apiKey.tenantId,
      eventType: 'API_KEY_REVOKED',
      eventData: { keyId, reason },
      keyId,
      actorId: revokedBy,
    },
  })
  
  return apiKey
}

/**
 * List API keys for app
 */
export async function listApiKeysForApp(
  appId: string,
  options?: {
    tenantId?: string
    status?: ApiKeyStatus
    page?: number
    limit?: number
  }
) {
  const where: any = { appId }
  
  if (options?.tenantId) {
    where.tenantId = options.tenantId
  }
  if (options?.status) {
    where.status = options.status
  }
  
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit
  
  const [keys, total] = await Promise.all([
    prisma.api_keys.findMany({
      where,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        usageCount: true,
        allowedIps: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.api_keys.count({ where }),
  ])
  
  return {
    keys,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * List available access scopes
 */
export async function listAccessScopes(options?: {
  resource?: string
  permission?: AccessScopeType
  moduleKey?: string
}) {
  const where: any = { isActive: true }
  
  if (options?.resource) {
    where.resource = options.resource
  }
  if (options?.permission) {
    where.permission = options.permission
  }
  if (options?.moduleKey) {
    where.moduleKey = options.moduleKey
  }
  
  return prisma.accessScope.findMany({
    where,
    orderBy: [{ resource: 'asc' }, { permission: 'asc' }],
  })
}

/**
 * Get scope by key
 */
export async function getScopeByKey(key: string) {
  return prisma.accessScope.findUnique({
    where: { key },
  })
}

/**
 * Check rate limit for API key
 */
export async function checkRateLimit(keyId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const apiKey = await prisma.api_keys.findUnique({
    where: { id: keyId },
    include: { developer_apps: true },
  })
  
  if (!apiKey) {
    return { allowed: false, remaining: 0, resetAt: new Date() }
  }
  
  const rateLimit = apiKey.rateLimit || apiKey.app.rateLimit
  const windowMs = 60000 // 1 minute window
  const windowStart = new Date(Date.now() - windowMs)
  
  // Count requests in window (from integration logs)
  const requestCount = await prisma.integration_logs.count({
    where: {
      createdAt: { gte: windowStart },
      // Would need to add keyId to IntegrationLog for accurate tracking
      // For now, use app-level tracking
      tenantId: apiKey.tenantId || undefined,
    },
  })
  
  const remaining = Math.max(0, rateLimit - requestCount)
  const resetAt = new Date(Date.now() + windowMs)
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
  }
}
