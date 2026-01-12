/**
 * ENUM MAPPING UTILITIES - SHARED TYPES
 * ======================================
 * 
 * Common types and utilities for enum normalization across the application.
 * 
 * SAFETY PRINCIPLES:
 * - All mappers preserve existing values where possible
 * - Unknown values are logged but not thrown
 * - No mapper modifies auth/billing/subscription enums
 * 
 * @module lib/enums/types
 */

/**
 * Result of an enum mapping operation
 */
export interface EnumMappingResult<T> {
  /** The mapped value (or fallback if unknown) */
  value: T
  /** Whether the input was a known value */
  isKnown: boolean
  /** Original input value for debugging */
  originalValue: string | undefined
}

/**
 * Creates a type-safe enum mapper with logging for unknown values
 * 
 * @param name - Name of the enum (for logging)
 * @param mapping - Object mapping input values to output values
 * @param fallback - Default value for unknown inputs
 */
export function createEnumMapper<TInput extends string, TOutput extends string>(
  name: string,
  mapping: Record<TInput, TOutput>,
  fallback: TOutput
): (input: string | null | undefined) => TOutput {
  const knownValues = new Set(Object.keys(mapping))
  
  return (input: string | null | undefined): TOutput => {
    if (!input) {
      return fallback
    }
    
    if (knownValues.has(input)) {
      return mapping[input as TInput]
    }
    
    // Log unknown value but don't throw
    console.warn(`[EnumMapper:${name}] Unknown value: "${input}", using fallback: "${fallback}"`)
    return fallback
  }
}

/**
 * Creates a type-safe enum mapper that returns detailed result
 * 
 * @param name - Name of the enum (for logging)
 * @param mapping - Object mapping input values to output values
 * @param fallback - Default value for unknown inputs
 */
export function createEnumMapperWithResult<TInput extends string, TOutput extends string>(
  name: string,
  mapping: Record<TInput, TOutput>,
  fallback: TOutput
): (input: string | null | undefined) => EnumMappingResult<TOutput> {
  const knownValues = new Set(Object.keys(mapping))
  
  return (input: string | null | undefined): EnumMappingResult<TOutput> => {
    if (!input) {
      return { value: fallback, isKnown: false, originalValue: undefined }
    }
    
    if (knownValues.has(input)) {
      return { 
        value: mapping[input as TInput], 
        isKnown: true, 
        originalValue: input 
      }
    }
    
    console.warn(`[EnumMapper:${name}] Unknown value: "${input}", using fallback: "${fallback}"`)
    return { value: fallback, isKnown: false, originalValue: input }
  }
}

/**
 * Type guard to check if a value is a valid enum member
 */
export function isValidEnumValue<T extends string>(
  value: string | null | undefined,
  validValues: readonly T[]
): value is T {
  return value !== null && value !== undefined && (validValues as readonly string[]).includes(value)
}

/**
 * Validates an enum value and returns it or undefined
 * Does NOT log - use when unknown values are expected
 */
export function validateEnumValue<T extends string>(
  value: string | null | undefined,
  validValues: readonly T[]
): T | undefined {
  if (isValidEnumValue(value, validValues)) {
    return value
  }
  return undefined
}
