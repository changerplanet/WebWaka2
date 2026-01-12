/**
 * URL PARAMETER UTILITIES
 * =======================
 * 
 * Type-safe helpers for extracting and validating URL search parameters.
 * Eliminates `as any` casts when converting string params to enum types.
 * 
 * @module lib/utils/urlParams
 */

/**
 * Safely extracts an enum value from URL search params.
 * Returns undefined if the value is null or not in the valid set.
 * 
 * @example
 * const status = getEnumParam(searchParams, 'status', ['ACTIVE', 'INACTIVE'] as const);
 * // status is 'ACTIVE' | 'INACTIVE' | undefined
 */
export function getEnumParam<T extends string>(
  params: URLSearchParams,
  key: string,
  validValues: readonly T[]
): T | undefined {
  const value = params.get(key);
  if (value && (validValues as readonly string[]).includes(value)) {
    return value as T;
  }
  return undefined;
}

/**
 * Safely extracts multiple enum values from a comma-separated URL param.
 * Filters out any values not in the valid set.
 * 
 * @example
 * const statuses = getEnumArrayParam(searchParams, 'status', ['OPEN', 'CLOSED'] as const);
 * // statuses is ('OPEN' | 'CLOSED')[] | undefined
 */
export function getEnumArrayParam<T extends string>(
  params: URLSearchParams,
  key: string,
  validValues: readonly T[]
): T[] | undefined {
  const value = params.get(key);
  if (!value) return undefined;
  
  const values = value.split(',').filter(v => 
    (validValues as readonly string[]).includes(v)
  ) as T[];
  
  return values.length > 0 ? values : undefined;
}

/**
 * Extracts a string param with a default value.
 * Useful for orderBy/orderDir params.
 */
export function getStringParam(
  params: URLSearchParams,
  key: string,
  defaultValue: string
): string {
  return params.get(key) || defaultValue;
}

/**
 * Extracts a sort direction param.
 */
export function getSortDirection(
  params: URLSearchParams,
  key: string = 'orderDir'
): 'asc' | 'desc' {
  const value = params.get(key);
  return value === 'asc' ? 'asc' : 'desc';
}
