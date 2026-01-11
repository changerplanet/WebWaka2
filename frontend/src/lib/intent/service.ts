/**
 * CTA INTENT SERVICE
 * 
 * Manages user intent capture from marketing CTAs.
 * Intent is advisory-only and influences onboarding guidance,
 * NOT capability activation.
 * 
 * CORE PRINCIPLES:
 * - CTAs map to intent, NOT modules
 * - Intent is domain-agnostic
 * - Same mechanism works for all future domains
 * - Intent survives signup/login flows
 * - ZERO capabilities activated from intent
 */

import { PrismaClient, IntentDomain, IntentSource } from '@prisma/client'
import { withPrismaDefaults } from '@/lib/db/prismaDefaults'

const prisma = new PrismaClient()

// ============================================================================
// INTENT REGISTRY
// All supported intents with their metadata
// Future modules can add new intents without code changes
// ============================================================================

export interface IntentDefinition {
  key: string
  domain: IntentDomain
  label: string
  description: string
  suggestedCapabilities: string[] // Advisory only - shown as suggestions
  icon?: string
  priority?: number // For sorting in UI
}

// Commerce domain intents
const COMMERCE_INTENTS: IntentDefinition[] = [
  {
    key: 'sell_in_store',
    domain: 'COMMERCE',
    label: 'Sell In-Store',
    description: 'I want to sell products in my physical shop',
    suggestedCapabilities: ['pos', 'inventory', 'accounting'],
    icon: 'store',
    priority: 1,
  },
  {
    key: 'sell_online',
    domain: 'COMMERCE',
    label: 'Sell Online',
    description: 'I want to sell products online via WhatsApp or web store',
    suggestedCapabilities: ['svm', 'inventory', 'crm'],
    icon: 'globe',
    priority: 2,
  },
  {
    key: 'run_marketplace',
    domain: 'COMMERCE',
    label: 'Run a Marketplace',
    description: 'I want to run a multi-vendor marketplace',
    suggestedCapabilities: ['mvm', 'payments_wallets', 'analytics'],
    icon: 'shopping-bag',
    priority: 3,
  },
  {
    key: 'manage_inventory',
    domain: 'COMMERCE',
    label: 'Manage Inventory',
    description: 'I want to track and manage my inventory',
    suggestedCapabilities: ['inventory', 'procurement', 'analytics'],
    icon: 'package',
    priority: 4,
  },
  {
    key: 'track_finances',
    domain: 'COMMERCE',
    label: 'Track Finances',
    description: 'I want to manage my business finances',
    suggestedCapabilities: ['accounting', 'payments_wallets', 'compliance_tax'],
    icon: 'calculator',
    priority: 5,
  },
  {
    key: 'manage_customers',
    domain: 'COMMERCE',
    label: 'Manage Customers',
    description: 'I want to track and engage with my customers',
    suggestedCapabilities: ['crm', 'marketing', 'analytics'],
    icon: 'users',
    priority: 6,
  },
  {
    key: 'manage_team',
    domain: 'COMMERCE',
    label: 'Manage My Team',
    description: 'I want to manage employees and payroll',
    suggestedCapabilities: ['hr_payroll', 'accounting'],
    icon: 'user-check',
    priority: 7,
  },
  {
    key: 'manage_deliveries',
    domain: 'COMMERCE',
    label: 'Manage Deliveries',
    description: 'I need to handle order deliveries and logistics',
    suggestedCapabilities: ['logistics', 'svm', 'integrations_hub'],
    icon: 'truck',
    priority: 8,
  },
]

// Partner domain intents
const PARTNER_INTENTS: IntentDefinition[] = [
  {
    key: 'become_partner',
    domain: 'COMMERCE',
    label: 'Become a Partner',
    description: 'I want to resell or refer WebWaka',
    suggestedCapabilities: ['partner_reseller'],
    icon: 'handshake',
    priority: 10,
  },
]

// General domain intents
const GENERAL_INTENTS: IntentDefinition[] = [
  {
    key: 'explore_platform',
    domain: 'GENERAL',
    label: 'Explore the Platform',
    description: 'I want to explore what WebWaka offers',
    suggestedCapabilities: [],
    icon: 'compass',
    priority: 99,
  },
]

// Future domain intents (placeholders)
const EDUCATION_INTENTS: IntentDefinition[] = [
  {
    key: 'run_school',
    domain: 'EDUCATION',
    label: 'Run a School',
    description: 'I want to manage a school or educational institution',
    suggestedCapabilities: [], // Will be populated when education module is built
    icon: 'graduation-cap',
    priority: 1,
  },
]

const HEALTHCARE_INTENTS: IntentDefinition[] = [
  {
    key: 'manage_clinic',
    domain: 'HEALTHCARE',
    label: 'Manage a Clinic',
    description: 'I want to manage a clinic or healthcare facility',
    suggestedCapabilities: [], // Will be populated when healthcare module is built
    icon: 'heart-pulse',
    priority: 1,
  },
]

const HOSPITALITY_INTENTS: IntentDefinition[] = [
  {
    key: 'manage_hotel',
    domain: 'HOSPITALITY',
    label: 'Manage a Hotel',
    description: 'I want to manage a hotel or hospitality business',
    suggestedCapabilities: ['hotel_management'], // Already have this!
    icon: 'building',
    priority: 1,
  },
  {
    key: 'run_restaurant',
    domain: 'HOSPITALITY',
    label: 'Run a Restaurant',
    description: 'I want to manage a restaurant or food service',
    suggestedCapabilities: ['pos', 'inventory', 'crm'],
    icon: 'utensils',
    priority: 2,
  },
]

// Combined registry
export const INTENT_REGISTRY: IntentDefinition[] = [
  ...COMMERCE_INTENTS,
  ...PARTNER_INTENTS,
  ...GENERAL_INTENTS,
  ...EDUCATION_INTENTS,
  ...HEALTHCARE_INTENTS,
  ...HOSPITALITY_INTENTS,
]

// ============================================================================
// INTENT SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all registered intents
 */
export function getAllIntents(): IntentDefinition[] {
  return INTENT_REGISTRY.sort((a, b) => (a.priority || 99) - (b.priority || 99))
}

/**
 * Get intents by domain
 */
export function getIntentsByDomain(domain: IntentDomain): IntentDefinition[] {
  return INTENT_REGISTRY
    .filter(i => i.domain === domain)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
}

/**
 * Get intent definition by key
 */
export function getIntentByKey(key: string): IntentDefinition | undefined {
  return INTENT_REGISTRY.find(i => i.key === key)
}

/**
 * Capture intent from CTA parameters
 */
export async function captureIntent(data: {
  intentKey: string
  userId?: string
  tenantId?: string
  source?: IntentSource
  sourceUrl?: string
  campaignId?: string
  referralCode?: string
  metadata?: Record<string, any>
}) {
  const intentDef = getIntentByKey(data.intentKey)
  
  const intent = await prisma.user_intents.create({
    data: {
      intentKey: data.intentKey,
      intentDomain: intentDef?.domain || 'GENERAL',
      intentSource: data.source || 'DIRECT',
      userId: data.userId,
      tenantId: data.tenantId,
      sourceUrl: data.sourceUrl,
      campaignId: data.campaignId,
      referralCode: data.referralCode,
      metadata: data.metadata,
      capturedAt: new Date(),
    },
  })
  
  return intent
}

/**
 * Get pending intent for user (before tenant creation)
 */
export async function getPendingIntentForUser(userId: string) {
  return prisma.user_intents.findFirst({
    where: {
      userId,
      isProcessed: false,
      tenantId: null, // Not yet attached to a tenant
    },
    orderBy: { capturedAt: 'desc' },
  })
}

/**
 * Attach intent to tenant (after tenant creation)
 */
export async function attachIntentToTenant(intentId: string, tenantId: string) {
  return prisma.user_intents.update({
    where: { id: intentId },
    data: { tenantId },
  })
}

/**
 * Get intents for tenant
 */
export async function getIntentsForTenant(tenantId: string) {
  return prisma.user_intents.findMany({
    where: { tenantId },
    orderBy: { capturedAt: 'desc' },
  })
}

/**
 * Mark intent as processed
 */
export async function markIntentProcessed(intentId: string) {
  return prisma.user_intents.update({
    where: { id: intentId },
    data: {
      isProcessed: true,
      processedAt: new Date(),
    },
  })
}

/**
 * Get suggested capabilities based on intent
 * This is ADVISORY ONLY - does not activate anything
 */
export function getSuggestedCapabilities(intentKey: string): string[] {
  const intent = getIntentByKey(intentKey)
  return intent?.suggestedCapabilities || []
}

/**
 * Parse intent from URL parameters
 */
export function parseIntentFromUrl(url: string): {
  intentKey?: string
  source?: IntentSource
  campaignId?: string
  referralCode?: string
} {
  try {
    const urlObj = new URL(url, 'http://localhost')
    const params = urlObj.searchParams
    
    return {
      intentKey: params.get('intent') || undefined,
      source: (params.get('source') as IntentSource) || 'MARKETING_PAGE',
      campaignId: params.get('utm_campaign') || params.get('campaign') || undefined,
      referralCode: params.get('ref') || params.get('referral') || undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Build CTA URL with intent parameters
 */
export function buildCtaUrl(
  basePath: string,
  intentKey: string,
  options?: {
    source?: IntentSource
    campaignId?: string
    referralCode?: string
  }
): string {
  const params = new URLSearchParams()
  params.set('intent', intentKey)
  
  if (options?.source) {
    params.set('source', options.source)
  }
  if (options?.campaignId) {
    params.set('utm_campaign', options.campaignId)
  }
  if (options?.referralCode) {
    params.set('ref', options.referralCode)
  }
  
  return `${basePath}?${params.toString()}`
}

// ============================================================================
// STANDARD CTA ROUTES
// All CTAs must route through /signup or /login
// ============================================================================

export const STANDARD_CTA_ROUTES = {
  // Commerce CTAs
  SELL_IN_STORE: '/signup?intent=sell_in_store',
  SELL_ONLINE: '/signup?intent=sell_online',
  RUN_MARKETPLACE: '/signup?intent=run_marketplace',
  MANAGE_INVENTORY: '/signup?intent=manage_inventory',
  TRACK_FINANCES: '/signup?intent=track_finances',
  MANAGE_CUSTOMERS: '/signup?intent=manage_customers',
  MANAGE_TEAM: '/signup?intent=manage_team',
  MANAGE_DELIVERIES: '/signup?intent=manage_deliveries',
  
  // Partner CTAs
  BECOME_PARTNER: '/signup?intent=become_partner&source=PARTNER_LINK',
  
  // General CTAs
  GET_STARTED: '/signup?intent=explore_platform',
  LOGIN: '/login',
  
  // Future domain CTAs
  RUN_SCHOOL: '/signup?intent=run_school',
  MANAGE_CLINIC: '/signup?intent=manage_clinic',
  MANAGE_HOTEL: '/signup?intent=manage_hotel',
  RUN_RESTAURANT: '/signup?intent=run_restaurant',
}

// ============================================================================
// EXTENSION PATTERN
// How future modules add new intents
// ============================================================================

/**
 * Register a new intent (for future modules)
 * Call this from module initialization
 */
export function registerIntent(intent: IntentDefinition): void {
  // Check if intent already exists
  const existing = INTENT_REGISTRY.find(i => i.key === intent.key)
  if (existing) {
    // Update existing
    Object.assign(existing, intent)
  } else {
    // Add new
    INTENT_REGISTRY.push(intent)
  }
}

/**
 * Example: How a future Education module would register intents
 * 
 * // In /lib/education/init.ts
 * import { registerIntent } from '@/lib/intent/service'
 * 
 * registerIntent({
 *   key: 'run_school',
 *   domain: 'EDUCATION',
 *   label: 'Run a School',
 *   description: 'Manage students, teachers, and curriculum',
 *   suggestedCapabilities: ['school_management', 'accounting', 'hr_payroll'],
 *   icon: 'graduation-cap',
 *   priority: 1,
 * })
 */
