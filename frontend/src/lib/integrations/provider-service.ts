/**
 * MODULE 15: ECOSYSTEM & INTEGRATIONS HUB
 * Provider Registry Service
 * 
 * Manages the global registry of integration providers.
 * Providers are Super Admin-managed; tenants can only enable from approved list.
 */

import { IntegrationCategory, IntegrationProviderStatus } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
import { prisma } from '@/lib/prisma'

/**
 * List all providers with optional filters
 */
export async function listProviders(options?: {
  category?: IntegrationCategory
  status?: IntegrationProviderStatus
  nigeriaFirstOnly?: boolean
  page?: number
  limit?: number
}) {
  const where: any = {}
  
  if (options?.category) {
    where.category = options.category
  }
  if (options?.status) {
    where.status = options.status
  } else {
    // Default to active providers only
    where.status = IntegrationProviderStatus.ACTIVE
  }
  if (options?.nigeriaFirstOnly) {
    where.isNigeriaFirst = true
  }
  
  const page = options?.page || 1
  const limit = options?.limit || 50
  const skip = (page - 1) * limit
  
  const [providers, total] = await Promise.all([
    prisma.integration_providers.findMany({
      where,
      orderBy: [
        { isNigeriaFirst: 'desc' },
        { name: 'asc' },
      ],
      skip,
      take: limit,
    }),
    prisma.integration_providers.count({ where }),
  ])
  
  return {
    providers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get provider by key
 */
export async function getProviderByKey(key: string) {
  const provider = await prisma.integration_providers.findUnique({
    where: { key },
    include: {
      integration_instances: {
        select: {
          id: true,
          tenantId: true,
          status: true,
          environment: true,
          activatedAt: true,
        },
      },
    },
  })
  
  if (!provider) {
    return null
  }
  
  return {
    ...provider,
    instanceCount: provider.integration_instances.length,
    activeInstanceCount: provider.integration_instances.filter(i => i.status === 'ACTIVE').length,
  }
}

/**
 * Get provider by ID
 */
export async function getProviderById(id: string) {
  return prisma.integration_providers.findUnique({
    where: { id },
  })
}

/**
 * Register a new provider (Super Admin only)
 */
export async function registerProvider(data: {
  key: string
  name: string
  category: IntegrationCategory
  description?: string
  logoUrl?: string
  websiteUrl?: string
  documentationUrl?: string
  apiBaseUrl?: string
  apiVersion?: string
  isNigeriaFirst?: boolean
  supportedScopes: string[]
  requiredCredentials: string[]
  supportsWebhooks?: boolean
  webhookSignatureAlgo?: string
  defaultRateLimit?: number
  createdBy?: string
}) {
  // Check if key already exists
  const existing = await prisma.integration_providers.findUnique({
    where: { key: data.key },
  })
  
  if (existing) {
    throw new Error(`Provider with key '${data.key}' already exists`)
  }
  
  const provider = await prisma.integration_providers.create({
    data: withPrismaDefaults({
      key: data.key,
      name: data.name,
      category: data.category,
      description: data.description,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      documentationUrl: data.documentationUrl,
      apiBaseUrl: data.apiBaseUrl,
      apiVersion: data.apiVersion,
      isNigeriaFirst: data.isNigeriaFirst ?? false,
      supportedScopes: data.supportedScopes,
      requiredCredentials: data.requiredCredentials,
      supportsWebhooks: data.supportsWebhooks ?? false,
      webhookSignatureAlgo: data.webhookSignatureAlgo,
      defaultRateLimit: data.defaultRateLimit,
      status: IntegrationProviderStatus.ACTIVE,
      createdBy: data.createdBy,
    }),
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      eventType: 'PROVIDER_REGISTERED',
      eventData: {
        providerKey: data.key,
        providerName: data.name,
        category: data.category,
        isNigeriaFirst: data.isNigeriaFirst,
      },
      providerId: provider.id,
      actorId: data.createdBy,
      actorType: 'super_admin',
    }),
  })
  
  return provider
}

/**
 * Update provider (Super Admin only)
 */
export async function updateProvider(
  providerId: string,
  data: {
    name?: string
    description?: string
    logoUrl?: string
    websiteUrl?: string
    documentationUrl?: string
    apiBaseUrl?: string
    apiVersion?: string
    supportedScopes?: string[]
    requiredCredentials?: string[]
    supportsWebhooks?: boolean
    webhookSignatureAlgo?: string
    defaultRateLimit?: number
    updatedBy?: string
  }
) {
  const provider = await prisma.integration_providers.update({
    where: { id: providerId },
    data: {
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl,
      websiteUrl: data.websiteUrl,
      documentationUrl: data.documentationUrl,
      apiBaseUrl: data.apiBaseUrl,
      apiVersion: data.apiVersion,
      supportedScopes: data.supportedScopes,
      requiredCredentials: data.requiredCredentials,
      supportsWebhooks: data.supportsWebhooks,
      webhookSignatureAlgo: data.webhookSignatureAlgo,
      defaultRateLimit: data.defaultRateLimit,
    },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      eventType: 'PROVIDER_UPDATED',
      eventData: { providerId, changes: data },
      providerId,
      actorId: data.updatedBy,
      actorType: 'super_admin',
    }),
  })
  
  return provider
}

/**
 * Update provider status (Super Admin only)
 */
export async function updateProviderStatus(
  providerId: string,
  status: IntegrationProviderStatus,
  updatedBy?: string
) {
  const provider = await prisma.integration_providers.update({
    where: { id: providerId },
    data: { status },
  })
  
  // Log event
  await prisma.integration_event_logs.create({
    data: withPrismaDefaults({
      eventType: 'PROVIDER_STATUS_CHANGED',
      eventData: { providerId, newStatus: status },
      providerId,
      actorId: updatedBy,
      actorType: 'super_admin',
    }),
  })
  
  return provider
}

/**
 * List providers by category
 */
export async function listProvidersByCategory() {
  const providers = await prisma.integration_providers.findMany({
    where: { status: IntegrationProviderStatus.ACTIVE },
    orderBy: { name: 'asc' },
  })
  
  const byCategory: Record<string, typeof providers> = {}
  
  for (const provider of providers) {
    const category = provider.category
    if (!byCategory[category]) {
      byCategory[category] = []
    }
    byCategory[category].push(provider)
  }
  
  return byCategory
}

/**
 * Get Nigeria-first providers
 */
export async function getNigeriaFirstProviders() {
  return prisma.integration_providers.findMany({
    where: {
      isNigeriaFirst: true,
      status: IntegrationProviderStatus.ACTIVE,
    },
    orderBy: { name: 'asc' },
  })
}

/**
 * Get available categories
 */
export function getAvailableCategories() {
  return Object.values(IntegrationCategory).map(cat => ({
    key: cat,
    name: formatCategoryName(cat),
  }))
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}
