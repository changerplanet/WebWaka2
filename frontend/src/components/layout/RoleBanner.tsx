'use client'

/**
 * Platform Role Banner (FOUNDATION)
 * 
 * Informational banner displaying current user's role and authority context.
 * 
 * Key Principles:
 * - READ-ONLY, INFORMATIONAL ONLY
 * - NO role switching
 * - NO capability toggles
 * - NO demo overrides
 * - Data from PlatformRoleContext only
 * 
 * @module components/layout/RoleBanner
 * @foundation Phase 3.4
 */

import React from 'react'
import { 
  usePlatformRole,
  useIsDemoMode,
  useCapabilities,
  RoleLevel
} from '@/lib/auth/role-context'
import { 
  Shield, 
  User, 
  Building2, 
  Eye, 
  Lock,
  AlertTriangle,
  Info
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface RoleBannerProps {
  /** Compact mode for mobile or tight spaces */
  compact?: boolean
  /** Show capability tier summary */
  showCapabilityTier?: boolean
  /** Show governance notice */
  showGovernanceNotice?: boolean
}

// ============================================================================
// ROLE ICON MAPPING
// ============================================================================

function getRoleIcon(roleLevel: RoleLevel): React.ReactNode {
  switch (roleLevel) {
    case 'super_admin':
      return <Shield className="w-4 h-4" />
    case 'partner_owner':
    case 'partner_admin':
    case 'partner_staff':
      return <Building2 className="w-4 h-4" />
    case 'auditor':
      return <Eye className="w-4 h-4" />
    case 'guest':
      return <Lock className="w-4 h-4" />
    default:
      return <User className="w-4 h-4" />
  }
}

// ============================================================================
// CAPABILITY TIER LABELS
// ============================================================================

function getCapabilityTier(roleLevel: RoleLevel): { label: string; color: string } {
  switch (roleLevel) {
    case 'super_admin':
      return { label: 'Full Platform Access', color: 'text-purple-700 bg-purple-100' }
    case 'partner_owner':
      return { label: 'Full Partner Access', color: 'text-blue-700 bg-blue-100' }
    case 'partner_admin':
      return { label: 'Partner Admin', color: 'text-blue-600 bg-blue-50' }
    case 'partner_staff':
      return { label: 'Partner Staff', color: 'text-slate-600 bg-slate-100' }
    case 'tenant_owner':
      return { label: 'Full Business Access', color: 'text-emerald-700 bg-emerald-100' }
    case 'tenant_admin':
      return { label: 'Business Admin', color: 'text-emerald-600 bg-emerald-50' }
    case 'tenant_manager':
      return { label: 'Manager Access', color: 'text-amber-700 bg-amber-100' }
    case 'tenant_staff':
      return { label: 'Staff Access', color: 'text-slate-600 bg-slate-100' }
    case 'tenant_user':
      return { label: 'User Access', color: 'text-slate-500 bg-slate-50' }
    case 'auditor':
      return { label: 'Audit Read-Only', color: 'text-orange-700 bg-orange-100' }
    case 'guest':
      return { label: 'No Access', color: 'text-red-700 bg-red-100' }
    default:
      return { label: 'Unknown', color: 'text-slate-500 bg-slate-50' }
  }
}

// ============================================================================
// ROLE BANNER COMPONENT
// ============================================================================

export function RoleBanner({ 
  compact = false,
  showCapabilityTier = true,
  showGovernanceNotice = false
}: RoleBannerProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    roleLevel, 
    roleName, 
    tenantName,
    partnerName,
    suiteName
  } = usePlatformRole()
  const isDemoMode = useIsDemoMode()
  const capabilities = useCapabilities()
  
  // Don't render while loading
  if (isLoading) {
    return null
  }
  
  // Don't render for guests (they'll see login page)
  if (!isAuthenticated && roleLevel === 'guest') {
    return null
  }
  
  const capabilityTier = getCapabilityTier(roleLevel)
  const roleIcon = getRoleIcon(roleLevel)
  
  // Count restricted capabilities
  const totalCapabilities = Object.keys(capabilities).length
  const allowedCapabilities = Object.values(capabilities).filter(Boolean).length
  const restrictedCount = totalCapabilities - allowedCapabilities
  
  // Compact variant for mobile
  if (compact) {
    return (
      <div 
        className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white text-xs"
        data-testid="role-banner-compact"
      >
        <div className="flex items-center gap-2">
          {roleIcon}
          <span className="font-medium">{roleName}</span>
          {isDemoMode && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-amber-950 rounded text-[10px] font-bold">
              DEMO
            </span>
          )}
        </div>
        {showCapabilityTier && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${capabilityTier.color}`}>
            {capabilityTier.label}
          </span>
        )}
      </div>
    )
  }
  
  // Full banner
  return (
    <div 
      className="bg-slate-900 text-white border-b border-slate-800"
      data-testid="role-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Left: Role Info */}
          <div className="flex items-center gap-4">
            {/* Role Name & Icon */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-800 rounded">
                {roleIcon}
              </div>
              <div>
                <span className="font-medium text-sm">{roleName}</span>
                {(tenantName || partnerName) && (
                  <span className="text-slate-400 text-xs ml-2">
                    @ {tenantName || partnerName}
                  </span>
                )}
              </div>
            </div>
            
            {/* Capability Tier */}
            {showCapabilityTier && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${capabilityTier.color}`}>
                {capabilityTier.label}
              </span>
            )}
            
            {/* Suite Name (if applicable) */}
            {suiteName && (
              <span className="text-slate-400 text-xs">
                {suiteName} Suite
              </span>
            )}
          </div>
          
          {/* Right: Mode & Restrictions */}
          <div className="flex items-center gap-3">
            {/* Restricted Count */}
            {restrictedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="w-3 h-3" />
                <span>{restrictedCount} restricted</span>
              </div>
            )}
            
            {/* Demo Mode Indicator */}
            {isDemoMode && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500 text-amber-950 rounded text-xs font-bold">
                <AlertTriangle className="w-3 h-3" />
                DEMO MODE
              </div>
            )}
            
            {/* Governance Notice */}
            {showGovernanceNotice && !isDemoMode && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Info className="w-3 h-3" />
                <span>Governed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getRoleIcon, getCapabilityTier }
