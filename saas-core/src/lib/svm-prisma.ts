/**
 * SVM Module Prisma Client
 * 
 * This provides access to SVM-owned entities (ShippingZone, ShippingRate, Promotion, etc.)
 * from the SaaS Core API routes.
 * 
 * IMPORTANT: This client uses the SAME database as the Core but accesses SVM tables.
 * The SVM schema must be migrated to the same database.
 */

import { PrismaClient as SvmPrismaClient } from '../../../modules/svm/node_modules/.prisma/svm-client'

const globalForSvmPrisma = globalThis as unknown as {
  svmPrisma: SvmPrismaClient | undefined
}

export const svmPrisma = globalForSvmPrisma.svmPrisma ?? new SvmPrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForSvmPrisma.svmPrisma = svmPrisma

export type { SvmPrismaClient }
