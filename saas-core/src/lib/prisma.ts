import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-export tenant isolation utilities
export {
  validateTenantAccess,
  validatePartnerAccess,
  createTenantContext,
  createPartnerContext,
  withTenantFilter,
  withTenantData,
  withPartnerFilter,
  withPartnerData,
  TenantIsolationError,
  isTenantScopedModel,
  isPartnerScopedModel,
  getViolationLogs,
  clearViolationLogs,
  logViolation,
  TENANT_SCOPED_MODELS,
  PARTNER_SCOPED_MODELS,
  PLATFORM_MODELS,
  type TenantContext,
  type PartnerContext,
  type TenantScopedModel,
  type PartnerScopedModel,
  type PlatformModel
} from './tenant-isolation'
