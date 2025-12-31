import { PrismaClient } from '@prisma/client'
import { createTenantIsolationMiddleware } from './tenant-isolation'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  
  // Add tenant isolation middleware
  client.$use(createTenantIsolationMiddleware())
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-export tenant isolation utilities
export {
  withIsolatedContext,
  withIsolatedContextSync,
  contextHolder,
  TenantIsolationError,
  isTenantScopedModel,
  getViolationLogs,
  clearViolationLogs,
  TENANT_SCOPED_MODELS,
  type TenantContext
} from './tenant-isolation'
