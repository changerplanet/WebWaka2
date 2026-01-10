'use client'

/**
 * Platform Permission Gate (FOUNDATION)
 * 
 * Canonical permission enforcement component for ALL users - demo and production.
 * 
 * Key Principles:
 * - CAPABILITY-DRIVEN, not role-driven
 * - Check `canEdit`, not `role === 'admin'`
 * - Same gate for demo and production
 * - No demo-specific gates
 * 
 * Usage:
 * ```tsx
 * <PermissionGate capability="canEdit">
 *   <EditButton />
 * </PermissionGate>
 * 
 * <PermissionGate capability="canDelete" fallback={<DisabledButton />}>
 *   <DeleteButton />
 * </PermissionGate>
 * ```
 * 
 * @module components/auth/PermissionGate
 * @foundation Phase 3.3
 */

import React, { ReactNode } from 'react'
import { 
  usePlatformRole, 
  useCapabilities, 
  useHasCapability,
  Capabilities 
} from '@/lib/auth/role-context'
import { AlertTriangle, Lock, Info } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type CapabilityKey = keyof Capabilities

interface PermissionGateProps {
  /** Single capability to check */
  capability?: CapabilityKey
  /** Multiple capabilities - ALL must be true (AND logic) */
  capabilities?: CapabilityKey[]
  /** Multiple capabilities - ANY must be true (OR logic) */
  anyCapability?: CapabilityKey[]
  /** Content to show if permission granted */
  children: ReactNode
  /** Content to show if permission denied (default: hidden) */
  fallback?: ReactNode
  /** Show a blocked message instead of fallback */
  showBlockedMessage?: boolean
  /** Custom blocked message */
  blockedMessage?: string
  /** Render as disabled instead of hidden */
  renderDisabled?: boolean
  /** Wrap children in a disabled container */
  disabledWrapper?: (children: ReactNode) => ReactNode
}

interface RouteGateProps {
  /** Single capability to check */
  capability?: CapabilityKey
  /** Multiple capabilities - ALL must be true */
  capabilities?: CapabilityKey[]
  /** Content to show if permission granted */
  children: ReactNode
  /** Redirect URL if permission denied */
  redirectTo?: string
  /** Show 403 page instead of redirect */
  show403?: boolean
}

interface ActionGateProps {
  /** Single capability to check */
  capability?: CapabilityKey
  /** Multiple capabilities - ALL must be true */
  capabilities?: CapabilityKey[]
  /** Action to perform if permitted */
  onAction: () => void | Promise<void>
  /** Children receive onClick handler */
  children: (props: { 
    onClick: () => void; 
    disabled: boolean; 
    blocked: boolean;
    reason?: string;
  }) => ReactNode
}

// ============================================================================
// CAPABILITY CHECK HELPERS
// ============================================================================

/**
 * Check if user has the required capability/capabilities
 * Foundation logic - same for demo and production
 */
function checkCapabilities(
  capabilities: Capabilities,
  required?: CapabilityKey,
  requiredAll?: CapabilityKey[],
  requiredAny?: CapabilityKey[]
): { allowed: boolean; missingCapabilities: CapabilityKey[] } {
  const missing: CapabilityKey[] = []
  
  // Single capability check
  if (required) {
    if (!capabilities[required]) {
      missing.push(required)
    }
  }
  
  // ALL capabilities check
  if (requiredAll && requiredAll.length > 0) {
    for (const cap of requiredAll) {
      if (!capabilities[cap]) {
        missing.push(cap)
      }
    }
  }
  
  // ANY capability check (if none required, always pass)
  if (requiredAny && requiredAny.length > 0) {
    const hasAny = requiredAny.some(cap => capabilities[cap])
    if (!hasAny) {
      // All are missing if none match
      missing.push(...requiredAny)
    }
  }
  
  return {
    allowed: missing.length === 0,
    missingCapabilities: missing
  }
}

/**
 * Get human-readable capability name
 */
function getCapabilityLabel(capability: CapabilityKey): string {
  const labels: Record<CapabilityKey, string> = {
    canViewDashboard: 'View Dashboard',
    canViewReports: 'View Reports',
    canViewAuditLog: 'View Audit Log',
    canViewFinancials: 'View Financial Data',
    canCreate: 'Create Records',
    canEdit: 'Edit Records',
    canDelete: 'Delete Records',
    canApprove: 'Approve Actions',
    canManageUsers: 'Manage Users',
    canManageSettings: 'Manage Settings',
    canManageRoles: 'Manage Roles',
    canManageBilling: 'Manage Billing',
    canExport: 'Export Data',
    canImport: 'Import Data',
    canProcessTransactions: 'Process Transactions',
    canAccessAdmin: 'Access Admin Panel',
  }
  return labels[capability] || capability
}

// ============================================================================
// MAIN PERMISSION GATE
// ============================================================================

/**
 * Permission Gate - Hides or shows content based on capability
 * 
 * Foundation component - same behavior for demo and production users.
 * Checks CAPABILITIES, not roles.
 */
export function PermissionGate({
  capability,
  capabilities: requiredCapabilities,
  anyCapability,
  children,
  fallback = null,
  showBlockedMessage = false,
  blockedMessage,
  renderDisabled = false,
  disabledWrapper,
}: PermissionGateProps) {
  const { isAuthenticated, isLoading, roleName, isDemoMode } = usePlatformRole()
  const capabilities = useCapabilities()
  
  // While loading, show nothing (prevents flash)
  if (isLoading) {
    return null
  }
  
  // Check capabilities
  const { allowed, missingCapabilities } = checkCapabilities(
    capabilities,
    capability,
    requiredCapabilities,
    anyCapability
  )
  
  // Permission granted
  if (allowed) {
    return <>{children}</>
  }
  
  // Permission denied - render disabled wrapper if requested
  if (renderDisabled && disabledWrapper) {
    return <>{disabledWrapper(children)}</>
  }
  
  // Permission denied - show blocked message if requested
  if (showBlockedMessage) {
    const message = blockedMessage || 
      `You don't have permission to ${getCapabilityLabel(missingCapabilities[0] || 'canViewDashboard').toLowerCase()}.`
    
    return (
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500"
        data-testid="permission-blocked"
      >
        <Lock className="w-4 h-4 text-slate-400" />
        <span>{message}</span>
        {isDemoMode && (
          <span className="text-xs text-amber-600 ml-2">
            (Role: {roleName})
          </span>
        )}
      </div>
    )
  }
  
  // Permission denied - show fallback or nothing
  return <>{fallback}</>
}

// ============================================================================
// ROUTE GATE
// ============================================================================

/**
 * Route Gate - Blocks access to entire routes/pages
 * 
 * Shows 403 page or redirects if user lacks capability.
 */
export function RouteGate({
  capability,
  capabilities: requiredCapabilities,
  children,
  redirectTo,
  show403 = true,
}: RouteGateProps) {
  const { isAuthenticated, isLoading, roleName, roleDescription, isDemoMode } = usePlatformRole()
  const capabilities = useCapabilities()
  
  // While loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400">Checking permissions...</div>
      </div>
    )
  }
  
  // Check capabilities
  const { allowed, missingCapabilities } = checkCapabilities(
    capabilities,
    capability,
    requiredCapabilities
  )
  
  // Permission granted
  if (allowed) {
    return <>{children}</>
  }
  
  // Redirect if specified
  if (redirectTo && typeof window !== 'undefined') {
    window.location.href = redirectTo
    return null
  }
  
  // Show 403 page
  if (show403) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50"
        data-testid="permission-403"
      >
        <div className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">
            You don't have permission to access this page.
          </p>
          <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600">
            <p><strong>Your Role:</strong> {roleName}</p>
            <p className="text-xs text-slate-500 mt-1">{roleDescription}</p>
            {missingCapabilities.length > 0 && (
              <p className="mt-2 text-xs text-red-600">
                Missing: {missingCapabilities.map((c: any) => getCapabilityLabel(c)).join(', ')}
              </p>
            )}
            {isDemoMode && (
              <p className="mt-2 text-xs text-amber-600">
                Demo Mode - Some features are restricted
              </p>
            )}
          </div>
          <a 
            href="/" 
            className="inline-block mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Return Home
          </a>
        </div>
      </div>
    )
  }
  
  return null
}

// ============================================================================
// ACTION GATE
// ============================================================================

/**
 * Action Gate - Wraps actions/buttons with permission check
 * 
 * Provides onClick handler that checks permission before executing.
 * Passes disabled/blocked state to children for UI feedback.
 */
export function ActionGate({
  capability,
  capabilities: requiredCapabilities,
  onAction,
  children,
}: ActionGateProps) {
  const { roleName, isDemoMode } = usePlatformRole()
  const capabilities = useCapabilities()
  
  // Check capabilities
  const { allowed, missingCapabilities } = checkCapabilities(
    capabilities,
    capability,
    requiredCapabilities
  )
  
  // Create click handler
  const handleClick = () => {
    if (allowed) {
      onAction()
    }
  }
  
  // Build reason message
  const reason = !allowed 
    ? `Your role (${roleName}) cannot ${getCapabilityLabel(missingCapabilities[0] || 'canEdit').toLowerCase()}`
    : undefined
  
  return (
    <>
      {children({
        onClick: handleClick,
        disabled: !allowed,
        blocked: !allowed,
        reason,
      })}
    </>
  )
}

// ============================================================================
// CONVENIENCE GATES (Pre-configured for common use cases)
// ============================================================================

/**
 * Gate for create/add operations
 */
export function CreateGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canCreate" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for edit/update operations
 */
export function EditGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canEdit" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for delete operations
 */
export function DeleteGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canDelete" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for approval operations
 */
export function ApproveGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canApprove" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for financial data viewing
 */
export function FinancialsGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canViewFinancials" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for transaction processing
 */
export function TransactionGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canProcessTransactions" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for settings management
 */
export function SettingsGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canManageSettings" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for admin panel access
 */
export function AdminGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canAccessAdmin" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

/**
 * Gate for audit log viewing
 */
export function AuditLogGate({ children, fallback, showBlockedMessage }: Omit<PermissionGateProps, 'capability'>) {
  return (
    <PermissionGate 
      capability="canViewAuditLog" 
      fallback={fallback}
      showBlockedMessage={showBlockedMessage}
    >
      {children}
    </PermissionGate>
  )
}

// ============================================================================
// BLOCKED ACTIONS SUMMARY
// ============================================================================

interface BlockedActionsSummaryProps {
  /** Show even if no actions are blocked */
  showWhenEmpty?: boolean
}

/**
 * Summary of blocked actions for current user
 * Useful for showing what the user cannot do
 */
export function BlockedActionsSummary({ showWhenEmpty = false }: BlockedActionsSummaryProps) {
  const { roleName, roleDescription, isDemoMode } = usePlatformRole()
  const capabilities = useCapabilities()
  
  // Find blocked capabilities
  const blockedCapabilities = (Object.entries(capabilities) as [CapabilityKey, boolean][])
    .filter(([_, allowed]) => !allowed)
    .map(([key]) => key)
  
  if (blockedCapabilities.length === 0 && !showWhenEmpty) {
    return null
  }
  
  return (
    <div 
      className="bg-amber-50 border border-amber-200 rounded-lg p-4"
      data-testid="blocked-actions-summary"
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">
            Role: {roleName}
            {isDemoMode && <span className="ml-2 text-xs">(Demo Mode)</span>}
          </p>
          <p className="text-sm text-amber-700 mt-1">{roleDescription}</p>
          
          {blockedCapabilities.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-amber-800 mb-2">
                Restricted Actions ({blockedCapabilities.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {blockedCapabilities.map(cap => (
                  <span 
                    key={cap}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded"
                  >
                    <Lock className="w-3 h-3" />
                    {getCapabilityLabel(cap)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export { checkCapabilities, getCapabilityLabel }
export type { PermissionGateProps, RouteGateProps, ActionGateProps, CapabilityKey }
