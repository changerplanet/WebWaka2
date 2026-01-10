'use client'

/**
 * Platform Role Context (FOUNDATION)
 * 
 * Central role context for ALL users - demo and production.
 * This is the SINGLE SOURCE OF TRUTH for role information.
 * 
 * Role Resolution Order:
 * 1. Auth session (production users)
 * 2. Demo session cookie (demo users)
 * 
 * NO demo-specific providers. NO query param overrides.
 * Demo users flow through the exact same context.
 * 
 * @module lib/auth/role-context
 * @foundation Phase 3.2
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

/**
 * User role levels - hierarchical
 */
export type RoleLevel = 
  | 'super_admin'      // Platform super admin
  | 'partner_owner'    // Partner organization owner
  | 'partner_admin'    // Partner admin
  | 'partner_staff'    // Partner staff (sales, support, etc.)
  | 'tenant_owner'     // Tenant/business owner
  | 'tenant_admin'     // Tenant admin
  | 'tenant_manager'   // Tenant manager
  | 'tenant_staff'     // Tenant staff
  | 'tenant_user'      // End user / customer
  | 'auditor'          // Read-only audit access
  | 'guest'            // Unauthenticated

/**
 * Capability flags - what the user CAN do
 */
export interface Capabilities {
  // Read capabilities
  canViewDashboard: boolean
  canViewReports: boolean
  canViewAuditLog: boolean
  canViewFinancials: boolean
  
  // Write capabilities
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  
  // Admin capabilities
  canManageUsers: boolean
  canManageSettings: boolean
  canManageRoles: boolean
  canManageBilling: boolean
  
  // Special capabilities
  canExport: boolean
  canImport: boolean
  canProcessTransactions: boolean
  canAccessAdmin: boolean
}

/**
 * Platform role context value
 */
export interface PlatformRoleContextValue {
  // Identity
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean
  
  // Role info
  roleLevel: RoleLevel
  roleName: string           // Display name (e.g., "Store Owner", "Partner Admin")
  roleDescription: string    // Description of what this role can do
  
  // Context info
  tenantSlug: string | null
  tenantName: string | null
  suiteName: string | null   // Commerce, Education, Health, etc.
  partnerSlug: string | null
  partnerName: string | null
  
  // Capabilities
  capabilities: Capabilities
  
  // User info
  userEmail: string | null
  userName: string | null
  userAvatar: string | null
  
  // Actions
  refreshRole: () => Promise<void>
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_CAPABILITIES: Capabilities = {
  canViewDashboard: false,
  canViewReports: false,
  canViewAuditLog: false,
  canViewFinancials: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
  canManageUsers: false,
  canManageSettings: false,
  canManageRoles: false,
  canManageBilling: false,
  canExport: false,
  canImport: false,
  canProcessTransactions: false,
  canAccessAdmin: false,
}

const DEFAULT_CONTEXT: PlatformRoleContextValue = {
  isAuthenticated: false,
  isLoading: true,
  isDemoMode: false,
  roleLevel: 'guest',
  roleName: 'Guest',
  roleDescription: 'Unauthenticated user',
  tenantSlug: null,
  tenantName: null,
  suiteName: null,
  partnerSlug: null,
  partnerName: null,
  capabilities: DEFAULT_CAPABILITIES,
  userEmail: null,
  userName: null,
  userAvatar: null,
  refreshRole: async () => {},
}

// ============================================================================
// ROLE CAPABILITY MAPPING
// ============================================================================

/**
 * Map role names to capabilities
 * This is the FOUNDATION capability resolver - works for demo AND production
 */
function resolveCapabilities(roleName: string, roleLevel: RoleLevel): Capabilities {
  const normalizedRole = roleName.toLowerCase()
  
  // Super Admin - full access
  if (roleLevel === 'super_admin') {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canViewReports: true,
      canViewAuditLog: true,
      canViewFinancials: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canManageUsers: true,
      canManageSettings: true,
      canManageRoles: true,
      canManageBilling: true,
      canExport: true,
      canImport: true,
      canProcessTransactions: true,
      canAccessAdmin: true,
    }
  }
  
  // Auditor - read-only across everything
  if (roleLevel === 'auditor' || normalizedRole.includes('auditor')) {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canViewReports: true,
      canViewAuditLog: true,
      canViewFinancials: true,
      canExport: true,
    }
  }
  
  // Owner roles - full access within scope
  if (roleLevel === 'partner_owner' || roleLevel === 'tenant_owner' || 
      normalizedRole.includes('owner') || normalizedRole.includes('proprietor') ||
      normalizedRole.includes('director') || normalizedRole.includes('senior partner')) {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canViewReports: true,
      canViewAuditLog: true,
      canViewFinancials: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canManageUsers: true,
      canManageSettings: true,
      canManageRoles: true,
      canManageBilling: true,
      canExport: true,
      canImport: true,
      canProcessTransactions: true,
      canAccessAdmin: true,
    }
  }
  
  // Admin roles - most access except billing/roles
  if (roleLevel === 'partner_admin' || roleLevel === 'tenant_admin' ||
      normalizedRole.includes('admin') || normalizedRole.includes('general manager') ||
      normalizedRole.includes('principal')) {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canViewReports: true,
      canViewAuditLog: true,
      canViewFinancials: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canManageUsers: true,
      canManageSettings: true,
      canExport: true,
      canImport: true,
      canProcessTransactions: true,
      canAccessAdmin: true,
    }
  }
  
  // Manager roles - operational access
  if (roleLevel === 'tenant_manager' || normalizedRole.includes('manager') ||
      normalizedRole.includes('supervisor') || normalizedRole.includes('coordinator')) {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canViewReports: true,
      canViewAuditLog: false,
      canViewFinancials: false,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canApprove: true,
      canManageUsers: false,
      canManageSettings: false,
      canExport: true,
      canProcessTransactions: true,
    }
  }
  
  // Staff roles - limited operational access
  if (roleLevel === 'partner_staff' || roleLevel === 'tenant_staff' ||
      normalizedRole.includes('staff') || normalizedRole.includes('cashier') ||
      normalizedRole.includes('front desk') || normalizedRole.includes('agent') ||
      normalizedRole.includes('picker') || normalizedRole.includes('driver') ||
      normalizedRole.includes('nurse') || normalizedRole.includes('teacher') ||
      normalizedRole.includes('associate') || normalizedRole.includes('recruiter')) {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canViewReports: false,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canProcessTransactions: true,
    }
  }
  
  // End user roles - minimal access
  if (roleLevel === 'tenant_user' || normalizedRole.includes('customer') ||
      normalizedRole.includes('patient') || normalizedRole.includes('parent') ||
      normalizedRole.includes('guest') || normalizedRole.includes('tenant') ||
      normalizedRole.includes('citizen') || normalizedRole.includes('member') ||
      normalizedRole.includes('candidate') || normalizedRole.includes('client')) {
    return {
      ...DEFAULT_CAPABILITIES,
      canViewDashboard: true,
      canCreate: false,
      canEdit: false,
    }
  }
  
  // Default - minimal
  return DEFAULT_CAPABILITIES
}

/**
 * Map role name to role level
 */
function resolveRoleLevel(roleName: string, isPartner: boolean, globalRole?: string): RoleLevel {
  const normalized = roleName.toLowerCase()
  
  // Check global role first
  if (globalRole === 'SUPER_ADMIN') return 'super_admin'
  
  // Auditor detection
  if (normalized.includes('auditor')) return 'auditor'
  
  // Partner roles
  if (isPartner) {
    if (normalized.includes('owner')) return 'partner_owner'
    if (normalized.includes('admin')) return 'partner_admin'
    return 'partner_staff'
  }
  
  // Tenant/Business roles
  if (normalized.includes('owner') || normalized.includes('proprietor') || 
      normalized.includes('director') || normalized.includes('chairman') ||
      normalized.includes('senior partner')) {
    return 'tenant_owner'
  }
  if (normalized.includes('admin') || normalized.includes('principal') ||
      normalized.includes('general manager')) {
    return 'tenant_admin'
  }
  if (normalized.includes('manager') || normalized.includes('supervisor') ||
      normalized.includes('coordinator')) {
    return 'tenant_manager'
  }
  if (normalized.includes('staff') || normalized.includes('cashier') ||
      normalized.includes('agent') || normalized.includes('doctor') ||
      normalized.includes('nurse') || normalized.includes('teacher') ||
      normalized.includes('driver') || normalized.includes('picker') ||
      normalized.includes('associate') || normalized.includes('recruiter')) {
    return 'tenant_staff'
  }
  
  // End users
  if (normalized.includes('customer') || normalized.includes('patient') ||
      normalized.includes('parent') || normalized.includes('guest') ||
      normalized.includes('tenant') || normalized.includes('citizen') ||
      normalized.includes('member') || normalized.includes('candidate') ||
      normalized.includes('client')) {
    return 'tenant_user'
  }
  
  return 'tenant_user'
}

/**
 * Get role description
 */
function getRoleDescription(roleLevel: RoleLevel): string {
  const descriptions: Record<RoleLevel, string> = {
    super_admin: 'Full platform access including governance and system settings',
    partner_owner: 'Full partner organization access including billing and user management',
    partner_admin: 'Partner administrative access excluding billing configuration',
    partner_staff: 'Partner operational access for assigned functions',
    tenant_owner: 'Full business access including settings and user management',
    tenant_admin: 'Business administrative access excluding billing',
    tenant_manager: 'Operational management and approval authority',
    tenant_staff: 'Daily operational access for assigned tasks',
    tenant_user: 'End user access to self-service features',
    auditor: 'Read-only access for audit and compliance review',
    guest: 'Unauthenticated visitor',
  }
  return descriptions[roleLevel]
}

// ============================================================================
// CONTEXT
// ============================================================================

const PlatformRoleContext = createContext<PlatformRoleContextValue>(DEFAULT_CONTEXT)

// ============================================================================
// PROVIDER
// ============================================================================

interface PlatformRoleProviderProps {
  children: ReactNode
}

export function PlatformRoleProvider({ children }: PlatformRoleProviderProps) {
  const [state, setState] = useState<Omit<PlatformRoleContextValue, 'refreshRole'>>({
    ...DEFAULT_CONTEXT,
  })
  
  /**
   * Fetch and resolve role from session
   * This is the SAME function for demo AND production users
   */
  const fetchRole = useCallback(async () => {
    setState((prev: any) => ({ ...prev, isLoading: true }))
    
    try {
      // Step 1: Check for demo session cookie (set by unified auth in Phase 3.1)
      const demoSessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('demo_session='))
      
      if (demoSessionCookie) {
        try {
          const demoSession = JSON.parse(decodeURIComponent(demoSessionCookie.split('=')[1]))
          
          // Validate demo session hasn't expired
          if (new Date(demoSession.expiresAt) > new Date()) {
            const roleLevel = resolveRoleLevel(
              demoSession.role, 
              demoSession.isPartnerAccount,
              undefined
            )
            
            setState({
              isAuthenticated: true,
              isLoading: false,
              isDemoMode: true,
              roleLevel,
              roleName: demoSession.role,
              roleDescription: getRoleDescription(roleLevel),
              tenantSlug: demoSession.tenantSlug,
              tenantName: demoSession.tenantSlug ? demoSession.tenantSlug.replace('demo-', '').replace(/-/g, ' ') : null,
              suiteName: demoSession.suiteName || null,
              partnerSlug: demoSession.isPartnerAccount ? 'webwaka-demo' : null,
              partnerName: demoSession.isPartnerAccount ? 'WebWaka Demo Partner' : null,
              capabilities: resolveCapabilities(demoSession.role, roleLevel),
              userEmail: demoSession.email,
              userName: demoSession.role,
              userAvatar: null,
            })
            return
          }
        } catch {
          // Invalid demo session, continue to check regular session
        }
      }
      
      // Step 2: Check regular auth session
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      
      if (data.authenticated && data.user) {
        const user = data.user
        const isPartner = !!user.isPartner
        
        // Determine primary role
        let roleName = 'User'
        if (user.globalRole === 'SUPER_ADMIN') {
          roleName = 'Super Admin'
        } else if (isPartner && user.partner) {
          roleName = user.partner.role.replace('PARTNER_', '').replace(/_/g, ' ')
          roleName = roleName.charAt(0) + roleName.slice(1).toLowerCase()
        } else if (user.memberships && user.memberships.length > 0) {
          const activeMembership = user.memberships.find(
            (m: any) => m.tenantId === data.activeTenantId
          ) || user.memberships[0]
          roleName = activeMembership.role.replace('TENANT_', '').replace(/_/g, ' ')
          roleName = roleName.charAt(0) + roleName.slice(1).toLowerCase()
        }
        
        const roleLevel = resolveRoleLevel(roleName, isPartner, user.globalRole)
        
        // Get active tenant info
        const activeMembership = user.memberships?.find(
          (m: any) => m.tenantId === data.activeTenantId
        ) || user.memberships?.[0]
        
        setState({
          isAuthenticated: true,
          isLoading: false,
          isDemoMode: false,
          roleLevel,
          roleName,
          roleDescription: getRoleDescription(roleLevel),
          tenantSlug: activeMembership?.tenantSlug || null,
          tenantName: activeMembership?.tenantName || null,
          suiteName: null, // Would need tenant metadata to determine
          partnerSlug: user.partner?.slug || null,
          partnerName: user.partner?.name || null,
          capabilities: resolveCapabilities(roleName, roleLevel),
          userEmail: user.email,
          userName: user.name,
          userAvatar: user.avatarUrl,
        })
        return
      }
      
      // Not authenticated
      setState({
        ...DEFAULT_CONTEXT,
        isLoading: false,
      })
      
    } catch (error) {
      console.error('Role context fetch error:', error)
      setState({
        ...DEFAULT_CONTEXT,
        isLoading: false,
      })
    }
  }, [])
  
  // Fetch role on mount
  useEffect(() => {
    fetchRole()
  }, [fetchRole])
  
  // Listen for auth changes (e.g., login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_change') {
        fetchRole()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [fetchRole])
  
  const value: PlatformRoleContextValue = {
    ...state,
    refreshRole: fetchRole,
  }
  
  return (
    <PlatformRoleContext.Provider value={value}>
      {children}
    </PlatformRoleContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Use platform role context
 * @throws Error if used outside provider
 */
export function usePlatformRole(): PlatformRoleContextValue {
  const context = useContext(PlatformRoleContext)
  if (context === undefined) {
    throw new Error('usePlatformRole must be used within a PlatformRoleProvider')
  }
  return context
}

/**
 * Use platform role context (optional - returns null if outside provider)
 */
export function usePlatformRoleOptional(): PlatformRoleContextValue | null {
  const context = useContext(PlatformRoleContext)
  if (context === undefined || context.isLoading === undefined) {
    return null
  }
  return context
}

/**
 * Use capabilities directly
 */
export function useCapabilities(): Capabilities {
  const { capabilities } = usePlatformRole()
  return capabilities
}

/**
 * Check if user has a specific capability
 */
export function useHasCapability(capability: keyof Capabilities): boolean {
  const capabilities = useCapabilities()
  return capabilities[capability]
}

/**
 * Check if user is in demo mode
 */
export function useIsDemoMode(): boolean {
  const { isDemoMode } = usePlatformRole()
  return isDemoMode
}

/**
 * Get role level for comparison
 */
export function useRoleLevel(): RoleLevel {
  const { roleLevel } = usePlatformRole()
  return roleLevel
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { resolveCapabilities, resolveRoleLevel, getRoleDescription }
export type { RoleLevel as PlatformRoleLevel }
