/**
 * PRISMA DEFAULTS HELPER
 * ======================
 * 
 * Foundation-level utility for Prisma create operations.
 * 
 * This is the ONLY approved mechanism for satisfying required Prisma fields:
 * - id: Required UUID primary key
 * - updatedAt: Required timestamp field
 * 
 * All .create() calls in the codebase MUST use this helper.
 * Direct insertion of id/updatedAt outside this helper is prohibited.
 * 
 * @example
 * import { withPrismaDefaults } from '@/lib/db/prismaDefaults'
 * 
 * // Usage in any model create call
 * data: withPrismaDefaults({ tenantId, name, ...otherFields })
 */

import { v4 as uuidv4 } from 'uuid'

/**
 * Adds required `id` and `updatedAt` fields to Prisma create data.
 * 
 * @param data - The data object for prisma.*.create()
 * @returns Data object with id and updatedAt prepended
 */
export function withPrismaDefaults<T extends object>(data: T) {
  return {
    id: uuidv4(),
    updatedAt: new Date(),
    ...data,
  }
}
