/**
 * PRISMA JSON FIELD VALIDATION
 * ============================
 * 
 * Type-safe utilities for parsing JSON fields from Prisma queries.
 * Uses Zod for runtime validation to ensure type safety when reading
 * JSON columns that Prisma types as `JsonValue`.
 * 
 * @module lib/db/jsonValidation
 */

import { z, ZodSchema, ZodError } from 'zod'

/**
 * Parses a Prisma JSON field with Zod validation.
 * Returns the validated data or a default value on failure.
 * 
 * @example
 * import { parseJsonField, TierConfigSchema } from '@/lib/db/jsonValidation'
 * 
 * // Before (unsafe)
 * const config = program.tierConfig as unknown as TierConfig
 * 
 * // After (type-safe with validation)
 * const config = parseJsonField(program.tierConfig, TierConfigSchema, DEFAULT_CONFIG)
 * 
 * @param value - The JSON value from Prisma (typed as JsonValue)
 * @param schema - Zod schema for validation
 * @param defaultValue - Fallback value if parsing fails
 * @returns Validated and typed data
 */
export function parseJsonField<T>(
  value: unknown,
  schema: ZodSchema<T>,
  defaultValue: T
): T {
  try {
    return schema.parse(value)
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn('[JSON Validation] Parse failed, using default:', error.issues)
    }
    return defaultValue
  }
}

/**
 * Parses a Prisma JSON field, throwing on validation failure.
 * Use when the field is required and must be valid.
 * 
 * @param value - The JSON value from Prisma
 * @param schema - Zod schema for validation
 * @param fieldName - Name for error messages
 * @returns Validated and typed data
 * @throws Error if validation fails
 */
export function parseJsonFieldStrict<T>(
  value: unknown,
  schema: ZodSchema<T>,
  fieldName: string
): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(`Invalid JSON field '${fieldName}': ${result.error.message}`)
  }
  return result.data
}

/**
 * Parses a nullable Prisma JSON field.
 * Returns null if the value is null/undefined or invalid.
 * 
 * @param value - The JSON value from Prisma (may be null)
 * @param schema - Zod schema for validation
 * @returns Validated data or null
 */
export function parseNullableJsonField<T>(
  value: unknown,
  schema: ZodSchema<T>
): T | null {
  if (value === null || value === undefined) {
    return null
  }
  const result = schema.safeParse(value)
  return result.success ? result.data : null
}

// ============================================
// DOMAIN SCHEMAS
// ============================================

/**
 * CRM Loyalty Tier Configuration Schema
 */
export const TierConfigSchema = z.object({
  tiers: z.array(z.object({
    name: z.string(),
    minPoints: z.number(),
    maxPoints: z.number().optional(),
    multiplier: z.number().optional(),
    benefits: z.array(z.string()).optional(),
  })).optional(),
  pointsPerUnit: z.number().optional(),
  currencyPerPoint: z.number().optional(),
  pointsExpireMonths: z.number().optional(),
})

export type TierConfig = z.infer<typeof TierConfigSchema>

export const DEFAULT_TIER_CONFIG: TierConfig = {
  tiers: [
    { name: 'Bronze', minPoints: 0, maxPoints: 999 },
    { name: 'Silver', minPoints: 1000, maxPoints: 4999, multiplier: 1.25 },
    { name: 'Gold', minPoints: 5000, maxPoints: 9999, multiplier: 1.5 },
    { name: 'Platinum', minPoints: 10000, multiplier: 2.0 },
  ],
  pointsPerUnit: 1,
  currencyPerPoint: 0.01,
  pointsExpireMonths: 12,
}

/**
 * B2B Bulk Order Item Schema
 */
export const BulkOrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  discountPercent: z.number().optional(),
  vendorId: z.string().optional(),
})

export type BulkOrderItem = z.infer<typeof BulkOrderItemSchema>

export const BulkOrderItemsSchema = z.array(BulkOrderItemSchema)

/**
 * Commission Tier Schema
 * Matches the CommissionTier interface in commission-engine.ts
 */
export const CommissionTierSchema = z.object({
  minVolume: z.number(),
  maxVolume: z.number().nullable(),
  rate: z.number(),
  fixedAmount: z.number().optional(),
})

export type CommissionTier = z.infer<typeof CommissionTierSchema>

export const CommissionTiersSchema = z.array(CommissionTierSchema)

/**
 * Rule Condition Schema (for hybrid commission rules)
 */
export const RuleConditionSchema = z.object({
  field: z.enum(['eventType', 'grossAmount', 'module', 'isFirstPayment', 'period']),
  operator: z.enum(['equals', 'in', 'gt', 'gte', 'lt', 'lte']),
  value: z.any(),
})

/**
 * Hybrid Rule Schema (for commission rules)
 * Matches the HybridRule interface in commission-engine.ts
 */
export const HybridRuleSchema = z.object({
  condition: RuleConditionSchema,
  type: z.string(),
  rate: z.number().optional(),
  fixedAmount: z.number().optional(),
  tiers: z.array(CommissionTierSchema).optional(),
})

export type HybridRule = z.infer<typeof HybridRuleSchema>

export const CommissionRulesSchema = z.object({
  rules: z.array(HybridRuleSchema),
})

export type CommissionRules = z.infer<typeof CommissionRulesSchema>
