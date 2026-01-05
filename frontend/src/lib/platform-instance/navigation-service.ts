/**
 * INSTANCE NAVIGATION SERVICE (Phase 2)
 * 
 * Provides instance-aware navigation filtering.
 * 
 * KEY CONCEPT:
 * - Navigation is filtered by instance's suiteKeys
 * - This is VISIBILITY scoping, NOT permission rewriting
 * - RBAC remains tenant-wide
 * - Capability activation is still checked globally
 * 
 * USAGE:
 * 1. Get active capabilities for tenant (existing logic)
 * 2. Filter by instance's suiteKeys (new Phase 2 logic)
 * 3. Render navigation based on filtered capabilities
 */

import { PlatformInstance } from '@prisma/client'

// Standard navigation item structure
export interface NavigationItem {
  key: string
  label: string
  icon?: string
  href: string
  capability?: string  // Capability key required for this item
  adminOnly?: boolean  // Only show to tenant admins
  children?: NavigationItem[]
}

// Instance with minimal fields needed for navigation
export interface InstanceForNavigation {
  id: string
  name: string
  suiteKeys: string[]
  navigationConfig: object | null
  isDefault: boolean
}

/**
 * Filter navigation items by instance's suite keys
 * 
 * Items without a capability key are always shown (e.g., Dashboard, Settings)
 * Items with a capability key are only shown if that key is in suiteKeys
 * 
 * If suiteKeys is empty, all items are shown (default instance behavior)
 */
export function filterNavigationByInstance(
  items: NavigationItem[],
  instance: InstanceForNavigation | null,
  activeCapabilities: Set<string>
): NavigationItem[] {
  // If no instance or no suite keys, show all capability-enabled items
  if (!instance || !instance.suiteKeys || instance.suiteKeys.length === 0) {
    return items.filter(item => {
      // No capability required - always show
      if (!item.capability) return true
      // Check if capability is active
      return activeCapabilities.has(item.capability)
    })
  }
  
  const suiteKeysSet = new Set(instance.suiteKeys)
  
  return items.filter(item => {
    // No capability required - always show (Dashboard, Settings, etc.)
    if (!item.capability) return true
    
    // Must be in instance's suite keys AND active
    if (!suiteKeysSet.has(item.capability)) return false
    if (!activeCapabilities.has(item.capability)) return false
    
    return true
  }).map(item => {
    // Also filter children if present
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: filterNavigationByInstance(item.children, instance, activeCapabilities)
      }
    }
    return item
  })
}

/**
 * Check if a capability should be visible in the current instance
 * 
 * This is a VISIBILITY check, not a permission check.
 * Even if visible, the user still needs proper RBAC permissions.
 */
export function isCapabilityVisibleInInstance(
  capabilityKey: string,
  instance: InstanceForNavigation | null
): boolean {
  // No instance = show everything
  if (!instance) return true
  
  // Empty suiteKeys = default instance, show everything
  if (!instance.suiteKeys || instance.suiteKeys.length === 0) return true
  
  return instance.suiteKeys.includes(capabilityKey)
}

/**
 * Get capabilities that should be visible in the instance
 * Intersects instance suiteKeys with tenant's active capabilities
 */
export function getVisibleCapabilities(
  activeCapabilities: string[],
  instance: InstanceForNavigation | null
): string[] {
  // No instance = all active capabilities
  if (!instance) return activeCapabilities
  
  // Empty suiteKeys = all active capabilities (default instance)
  if (!instance.suiteKeys || instance.suiteKeys.length === 0) {
    return activeCapabilities
  }
  
  // Filter to only capabilities in both active AND suiteKeys
  const suiteKeysSet = new Set(instance.suiteKeys)
  return activeCapabilities.filter(cap => suiteKeysSet.has(cap))
}

/**
 * Build the standard dashboard navigation with capability requirements
 * This defines which capabilities control which nav items
 */
export function getDashboardNavigation(tenantSlug: string): NavigationItem[] {
  return [
    // Core - always visible
    { key: 'dashboard', label: 'Dashboard', href: `/dashboard?tenant=${tenantSlug}` },
    { key: 'users', label: 'Users', href: `/dashboard?tenant=${tenantSlug}#users`, adminOnly: true },
    
    // Commerce capabilities
    { key: 'pos', label: 'POS', href: `/pos?tenant=${tenantSlug}`, capability: 'pos' },
    { key: 'svm', label: 'Storefront', href: `/store?tenant=${tenantSlug}`, capability: 'svm' },
    { key: 'mvm', label: 'Marketplace', href: `/vendor?tenant=${tenantSlug}`, capability: 'mvm' },
    
    // Operations
    { key: 'inventory', label: 'Inventory', href: `/dashboard/inventory?tenant=${tenantSlug}`, capability: 'inventory' },
    { key: 'accounting', label: 'Accounting', href: `/dashboard/accounting?tenant=${tenantSlug}`, capability: 'accounting' },
    { key: 'crm', label: 'CRM', href: `/dashboard/crm?tenant=${tenantSlug}`, capability: 'crm' },
    { key: 'logistics', label: 'Logistics', href: `/dashboard/logistics?tenant=${tenantSlug}`, capability: 'logistics' },
    { key: 'hr', label: 'HR & Payroll', href: `/dashboard/hr?tenant=${tenantSlug}`, capability: 'hr_payroll' },
    { key: 'procurement', label: 'Procurement', href: `/dashboard/procurement?tenant=${tenantSlug}`, capability: 'procurement' },
    
    // Growth
    { key: 'analytics', label: 'Analytics', href: `/dashboard/analytics?tenant=${tenantSlug}`, capability: 'analytics' },
    { key: 'marketing', label: 'Marketing', href: `/dashboard/marketing?tenant=${tenantSlug}`, capability: 'marketing' },
    { key: 'b2b', label: 'B2B & Wholesale', href: `/dashboard/b2b?tenant=${tenantSlug}`, capability: 'b2b' },
    
    // Platform
    { key: 'payments', label: 'Payments', href: `/dashboard/payments?tenant=${tenantSlug}`, capability: 'payments' },
    { key: 'subscriptions', label: 'Subscriptions', href: `/dashboard/subscriptions?tenant=${tenantSlug}`, capability: 'subscriptions_billing' },
    { key: 'compliance', label: 'Compliance', href: `/dashboard/compliance?tenant=${tenantSlug}`, capability: 'compliance_tax' },
    { key: 'ai', label: 'AI & Automation', href: `/dashboard/ai?tenant=${tenantSlug}`, capability: 'ai_automation' },
    { key: 'integrations', label: 'Integrations', href: `/dashboard/integrations?tenant=${tenantSlug}`, capability: 'integrations_hub' },
    
    // Admin-only
    { key: 'partner', label: 'Partners', href: `/dashboard/partner?tenant=${tenantSlug}`, adminOnly: true },
    { key: 'billing', label: 'Billing', href: `/dashboard/billing?tenant=${tenantSlug}`, adminOnly: true },
    { key: 'capabilities', label: 'Capabilities', href: `/dashboard/capabilities?tenant=${tenantSlug}`, adminOnly: true },
    { key: 'settings', label: 'Settings', href: `/dashboard/settings?tenant=${tenantSlug}`, adminOnly: true },
  ]
}

/**
 * Check if user can access an instance
 * Users can access any instance within their tenant (no per-instance restrictions)
 */
export function canUserAccessInstance(
  userTenantId: string,
  instanceTenantId: string
): boolean {
  // Phase 2: Users can access any instance within their tenant
  // This preserves tenant-wide user access
  return userTenantId === instanceTenantId
}

/**
 * Get custom navigation config from instance
 * Returns null if using default navigation
 */
export function getInstanceNavigationConfig(
  instance: InstanceForNavigation | null
): object | null {
  if (!instance?.navigationConfig) return null
  if (typeof instance.navigationConfig === 'object' && Object.keys(instance.navigationConfig).length === 0) {
    return null
  }
  return instance.navigationConfig
}
