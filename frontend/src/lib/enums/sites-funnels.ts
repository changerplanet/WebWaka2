/**
 * SITES & FUNNELS ENUM VALIDATORS
 * ================================
 * 
 * Phase 11C: Type-safe validators for sites-funnels module enums.
 * Uses Prisma schema as source of truth.
 * 
 * @module lib/enums/sites-funnels
 */

import { validateEnumValue } from './types'

// =============================================================================
// SITE STATUS (Prisma: SiteStatus)
// =============================================================================

export const SF_SITE_STATUS = [
  'DRAFT',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED'
] as const

export type SfSiteStatusType = typeof SF_SITE_STATUS[number]

export function validateSiteStatus(
  value: string | null | undefined
): SfSiteStatusType | undefined {
  return validateEnumValue(value, SF_SITE_STATUS, 'SiteStatus', 'API')
}

// =============================================================================
// FUNNEL STATUS (Prisma: FunnelStatus)
// =============================================================================

export const SF_FUNNEL_STATUS = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED'
] as const

export type SfFunnelStatusType = typeof SF_FUNNEL_STATUS[number]

export function validateFunnelStatus(
  value: string | null | undefined
): SfFunnelStatusType | undefined {
  return validateEnumValue(value, SF_FUNNEL_STATUS, 'FunnelStatus', 'API')
}

// =============================================================================
// AI CONTENT STATUS (Service layer)
// =============================================================================

export const SF_AI_CONTENT_STATUS = [
  'pending',
  'approved',
  'rejected',
  'edited'
] as const

export type SfAiContentStatusType = typeof SF_AI_CONTENT_STATUS[number]

export function validateAiContentStatus(
  value: string | null | undefined
): SfAiContentStatusType | undefined {
  return validateEnumValue(value, SF_AI_CONTENT_STATUS, 'AiContentStatus', 'API')
}

// =============================================================================
// AI CONTENT TYPE (Service layer)
// =============================================================================

export const SF_AI_CONTENT_TYPE = [
  'headline',
  'subheadline',
  'body',
  'cta',
  'bullet_points',
  'meta_description',
  'meta_title',
  'testimonial',
  'faq'
] as const

export type SfAiContentTypeType = typeof SF_AI_CONTENT_TYPE[number]

export function validateAiContentType(
  value: string | null | undefined
): SfAiContentTypeType | undefined {
  return validateEnumValue(value, SF_AI_CONTENT_TYPE, 'AiContentType', 'API')
}

// =============================================================================
// SITES/FUNNELS PERMISSION ACTIONS (Service layer)
// =============================================================================

/**
 * Valid permission actions for the sites-funnels module.
 * Used to construct permission strings like "SITES_FUNNELS_VIEW".
 */
export const SF_PERMISSION_ACTIONS = [
  'VIEW',
  'CREATE',
  'EDIT',
  'DELETE',
  'PUBLISH',
  'MANAGE',
  'ADMIN'
] as const

export type SfPermissionActionType = typeof SF_PERMISSION_ACTIONS[number]

/**
 * Constructs a type-safe sites/funnels permission string.
 * Replaces the `as any` cast in permissions-service.ts.
 */
export function constructSfPermissionAction(
  action: string
): `SITES_FUNNELS_${Uppercase<string>}` {
  return `SITES_FUNNELS_${action.toUpperCase()}` as `SITES_FUNNELS_${Uppercase<string>}`
}

// =============================================================================
// TEMPLATE BLOCKS TYPE (JSON Schema)
// =============================================================================

/**
 * Type definition for template block structure.
 * Replaces `blocks as any[]` casts in template-service.ts.
 */
export interface TemplateBlock {
  id: string
  type: string
  content?: unknown
  settings?: Record<string, unknown>
  children?: TemplateBlock[]
  [key: string]: unknown
}

/**
 * Safely casts blocks to typed array.
 * Returns empty array if blocks is null/undefined.
 */
export function parseTemplateBlocks(blocks: unknown): TemplateBlock[] {
  if (!blocks) return []
  if (!Array.isArray(blocks)) return []
  return blocks as TemplateBlock[]
}

// =============================================================================
// CONFIGURATION OBJECT TYPE
// =============================================================================

/**
 * Type for activation configuration object.
 * Used in entitlements-service.ts.
 */
export interface ActivationConfiguration {
  maxSites?: number
  maxFunnels?: number
  maxPagesPerSite?: number
  maxStepsPerFunnel?: number
  features?: string[]
  [key: string]: unknown
}

/**
 * Safely parses activation configuration.
 */
export function parseActivationConfig(config: unknown): ActivationConfiguration {
  if (!config || typeof config !== 'object') return {}
  return config as ActivationConfiguration
}
