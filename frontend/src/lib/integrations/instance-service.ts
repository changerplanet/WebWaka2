/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * Tenant Integration Instance Service
 * 
 * Manages tenant-specific integration instances.
 * Tenants enable integrations from approved providers.
 * Credentials are encrypted at rest.
 */

import { PrismaClient, IntegrationInstanceStatus, IntegrationProviderStatus } from '@prisma/client'
import crypto from 'crypto'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

const prisma = new PrismaClient()

// Simple encryption for credentials (in production, use AWS KMS or similar)
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-32-char-encryption-key!!'
const ALGORITHM = 'aes-256-gcm'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function maskValue(value: string): string {
  if (value.length <= 4) return '****'
  return '*'.repeat(value.length - 4) + value.slice(-4)
}

/**
 * List integration instances for a tenant
 */
export async function listInstancesForTenant(
  tenantId: string,
  options?: {
    status?: IntegrationInstanceStatus
    providerId?: string
    page?: number
    limit?: number
  }
) {
  const where: any = { tenantId }
  
  if (options?.status) {
    where.status = options.status
  }
  if (options?.providerId) {
    where.providerId = options.providerId
  }
  
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit
  
  const [instances, total] = await Promise.all([
    prisma.integration_instances.findMany({
      where,
      include: {
        integration_providers: {
          select: {
            key: true,
            name: true,
            category: true,
            logoUrl: true,
            isNigeriaFirst: true,
          },
        },
        integration_credentials: {
          select: {
            key: true,
            maskedValue: true,
            isRequired: true,
            lastRotated: true,
            expiresAt: true,
          },
        },
        integration_webhooks: {
          select: {
            id: true,
            name: true,
            direction: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.integration_instances.count({ where }),
  ])
  
  return {
    instances,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get integration instance by ID
 */
export async function getInstanceById(instanceId: string, tenantId?: string) {
  const where: any = { id: instanceId }
  if (tenantId) {
    where.tenantId = tenantId
  }
  
  return prisma.integration_instances.findFirst({
    where,
    include: {
      integration_providers: true,
      integration_credentials: {
        select: {
          id: true,
          key: true,
          maskedValue: true,
          isRequired: true,
          lastRotated: true,
          expiresAt: true,
        },
      },
      integration_webhooks: true,
    },
  })
}

/**
 * Enable integration for tenant
 * Requires explicit tenant approval
 */
export async function enableIntegration(
  tenantId: string,
  data: {
    providerKey: string
    displayName?: string
    environment?: 'sandbox' | 'production'
    enabledScopes: string[]
    configuration?: Record<string, any>
    activatedBy: string
  }
) {
  // Get provider
  const provider = await prisma.integration_providers.findUnique({
    where: { key: data.providerKey },
  })
  
  if (!provider) {
    throw new Error(`Provider '${data.providerKey}' not found`)
  }
  
  if (provider.status !== IntegrationProviderStatus.ACTIVE) {
    throw new Error(`Provider '${data.providerKey}' is not active`)
  }
  
  // Check if instance already exists
  const existing = await prisma.integration_instances.findUnique({
    where: {
      tenantId_providerId_environment: {
        tenantId,
        providerId: provider.id,
        environment: data.environment || 'production',
      },
    },
  })
  
  if (existing) {
    throw new Error(`Integration '${data.providerKey}' already enabled for this tenant`)
  }
  
  // Validate scopes
  const invalidScopes = data.enabledScopes.filter(s => !provider.supportedScopes.includes(s))
  if (invalidScopes.length > 0) {
    throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`)
  }
  
  // Create instance
  const instance = await prisma.integration_instances.create({
    data: withPrismaDefaults({
      tenantId,
      providerId: provider.id,
      displayName: data.displayName || provider.name,
      environment: data.environment || 'production',
      status: IntegrationInstanceStatus.PENDING_SETUP,
      enabledScopes: data.enabledScopes,
      configuration: data.configuration,
    }),
    include: {
      integration_providers: true,
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      tenantId,
      eventType: 'INTEGRATION_ENABLED',
      eventData: {
        providerKey: data.providerKey,
        environment: data.environment,
        enabledScopes: data.enabledScopes,
      },
      providerId: provider.id,
      instanceId: instance.id,
      actorId: data.activatedBy,
      actorType: 'tenant_admin',
    }),
  })
  
  return instance
}

/**
 * Configure credentials for integration instance
 */
export async function configureCredentials(
  instanceId: string,
  credentials: Record<string, string>,
  configuredBy: string
) {
  const instance = await prisma.integration_instances.findUnique({
    where: { id: instanceId },
    include: { integration_providers: true },
  })
  
  if (!instance) {
    throw new Error('Integration instance not found')
  }
  
  // Validate required credentials
  const missing = instance.integration_providers.requiredCredentials.filter(
    key => !credentials[key]
  )
  if (missing.length > 0) {
    throw new Error(`Missing required credentials: ${missing.join(', ')}`)
  }
  
  // Store credentials (encrypted)
  for (const [key, value] of Object.entries(credentials)) {
    await prisma.integration_credentials.upsert({
      where: {
        instanceId_key: {
          instanceId,
          key,
        },
      },
      update: {
        encryptedValue: encrypt(value),
        maskedValue: maskValue(value),
        lastRotated: new Date(),
        createdBy: configuredBy,
      },
      create: withPrismaDefaults({
        instanceId,
        key,
        encryptedValue: encrypt(value),
        maskedValue: maskValue(value),
        isRequired: instance.integration_providers.requiredCredentials.includes(key),
        createdBy: configuredBy,
      }),
    })
  }
  
  // Update instance status to ACTIVE
  const updated = await prisma.integration_instances.update({
    where: { id: instanceId },
    data: {
      status: IntegrationInstanceStatus.ACTIVE,
      activatedAt: new Date(),
      activatedBy: configuredBy,
    },
    include: {
      integration_providers: true,
      integration_credentials: {
        select: {
          key: true,
          maskedValue: true,
        },
      },
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: instance.tenantId,
      eventType: 'CREDENTIALS_CONFIGURED',
      eventData: {
        instanceId,
        credentialKeys: Object.keys(credentials),
      },
      instanceId,
      actorId: configuredBy,
      actorType: 'tenant_admin',
    },
  })
  
  return updated
}

/**
 * Get decrypted credentials (internal use only)
 */
export async function getDecryptedCredentials(instanceId: string): Promise<Record<string, string>> {
  const credentials = await prisma.integration_credentials.findMany({
    where: { instanceId },
  })
  
  const decrypted: Record<string, string> = {}
  for (const cred of credentials) {
    try {
      decrypted[cred.key] = decrypt(cred.encryptedValue)
    } catch {
      decrypted[cred.key] = ''
    }
  }
  
  return decrypted
}

/**
 * Suspend integration instance
 */
export async function suspendInstance(
  instanceId: string,
  reason: string,
  suspendedBy: string
) {
  const instance = await prisma.integration_instances.update({
    where: { id: instanceId },
    data: {
      status: IntegrationInstanceStatus.SUSPENDED,
      suspendedAt: new Date(),
      suspendedBy,
      suspensionReason: reason,
    },
    include: { integration_providers: true },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: instance.tenantId,
      eventType: 'INTEGRATION_SUSPENDED',
      eventData: { instanceId, reason },
      instanceId,
      actorId: suspendedBy,
      actorType: 'system',
    },
  })
  
  return instance
}

/**
 * Reactivate suspended instance
 */
export async function reactivateInstance(
  instanceId: string,
  reactivatedBy: string
) {
  const instance = await prisma.integration_instances.update({
    where: { id: instanceId },
    data: {
      status: IntegrationInstanceStatus.ACTIVE,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
    },
    include: { integration_providers: true },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: instance.tenantId,
      eventType: 'INTEGRATION_REACTIVATED',
      eventData: { instanceId },
      instanceId,
      actorId: reactivatedBy,
      actorType: 'tenant_admin',
    },
  })
  
  return instance
}

/**
 * Revoke integration (permanent)
 */
export async function revokeInstance(
  instanceId: string,
  reason: string,
  revokedBy: string
) {
  const instance = await prisma.integration_instances.update({
    where: { id: instanceId },
    data: {
      status: IntegrationInstanceStatus.REVOKED,
      revokedAt: new Date(),
      revokedBy,
      revocationReason: reason,
    },
    include: { integration_providers: true },
  })
  
  // Delete credentials for security
  await prisma.integration_credentials.deleteMany({
    where: { instanceId },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: {
      tenantId: instance.tenantId,
      eventType: 'INTEGRATION_REVOKED',
      eventData: { instanceId, reason },
      instanceId,
      actorId: revokedBy,
      actorType: 'system',
    },
  })
  
  return instance
}

/**
 * Update health status
 */
export async function updateHealthStatus(
  instanceId: string,
  status: 'healthy' | 'degraded' | 'unhealthy',
  error?: string
) {
  return prisma.integration_instances.update({
    where: { id: instanceId },
    data: {
      lastHealthCheck: new Date(),
      healthStatus: status,
      lastError: error,
      errorCount: status === 'unhealthy' ? { increment: 1 } : 0,
    },
  })
}
