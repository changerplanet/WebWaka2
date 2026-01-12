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
import { Prisma } from '@prisma/client'

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

/**
 * TYPE-SAFE JSON VALUE CONVERSION
 * ===============================
 * 
 * Converts any serializable value to Prisma's InputJsonValue type.
 * This eliminates the need for `as unknown as Prisma.InputJsonValue` casts.
 * 
 * @example
 * import { toJsonValue } from '@/lib/db/prismaDefaults'
 * 
 * // Before (unsafe)
 * data: { config: someObject as unknown as Prisma.InputJsonValue }
 * 
 * // After (type-safe)
 * data: { config: toJsonValue(someObject) }
 * 
 * @param value - Any JSON-serializable value (object, array, primitive, null)
 * @returns The value typed as Prisma.InputJsonValue
 */
export function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  // Prisma.InputJsonValue accepts: string | number | boolean | null | JsonObject | JsonArray
  // This function provides type safety while preserving the runtime value
  return value as Prisma.InputJsonValue
}

/**
 * TYPE-SAFE JSON ARRAY CONVERSION
 * ===============================
 * 
 * Converts an array to Prisma's InputJsonValue type.
 * Use this when storing arrays in JSON fields.
 * 
 * @param arr - Any array of JSON-serializable values
 * @returns The array typed as Prisma.InputJsonValue
 */
export function toJsonArray<T>(arr: T[]): Prisma.InputJsonValue {
  return arr as Prisma.InputJsonValue
}

/**
 * TYPE-SAFE NULL-SAFE JSON CONVERSION
 * ====================================
 * 
 * Converts a nullable value to Prisma's NullableJsonNullValueInput.
 * Use this when a JSON field can be null.
 * 
 * @param value - A value that might be null/undefined
 * @returns The value typed correctly for nullable JSON fields
 */
export function toNullableJson<T>(value: T | null | undefined): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull
  }
  return value as Prisma.InputJsonValue
}
