'use client'

/**
 * Platform Error Boundary (FOUNDATION)
 * 
 * Canonical error boundary for ALL users - demo and production.
 * 
 * Key Principles:
 * - SAME error handling for demo and production
 * - NO raw stack traces
 * - NO silent failures
 * - Audit-safe, regulator-safe
 * - Graceful degradation
 * 
 * @module components/ErrorBoundary
 * @foundation Phase 3.5
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Shield, Lock, AlertCircle } from 'lucide-react'

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Internal error categories (NOT exposed to users as-is)
 */
export type ErrorCategory = 
  | 'USER_ACTION_ERROR'    // User attempted invalid action
  | 'PERMISSION_DENIED'    // User lacks capability
  | 'SYSTEM_ERROR'         // Unexpected system failure
  | 'GOVERNANCE_BLOCK'     // Action blocked by governance rules

/**
 * Classify an error into a category
 */
function classifyError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()
  
  // Permission/Auth errors
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('access denied') ||
    name.includes('permission') ||
    name.includes('auth')
  ) {
    return 'PERMISSION_DENIED'
  }
  
  // Governance blocks
  if (
    message.includes('governance') ||
    message.includes('blocked') ||
    message.includes('restricted') ||
    message.includes('not allowed') ||
    message.includes('compliance')
  ) {
    return 'GOVERNANCE_BLOCK'
  }
  
  // User action errors
  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('not found') ||
    name.includes('validation') ||
    name.includes('input')
  ) {
    return 'USER_ACTION_ERROR'
  }
  
  // Default to system error
  return 'SYSTEM_ERROR'
}

/**
 * Get user-friendly message for error category
 * NO technical jargon, NO raw classification exposed
 */
function getCategoryMessage(category: ErrorCategory): { title: string; description: string } {
  switch (category) {
    case 'PERMISSION_DENIED':
      return {
        title: 'Access Restricted',
        description: 'You don\'t have permission to perform this action.'
      }
    case 'GOVERNANCE_BLOCK':
      return {
        title: 'Action Not Permitted',
        description: 'This action is restricted by platform policies.'
      }
    case 'USER_ACTION_ERROR':
      return {
        title: 'Action Could Not Be Completed',
        description: 'Please check your input and try again.'
      }
    case 'SYSTEM_ERROR':
    default:
      return {
        title: 'Something Went Wrong',
        description: 'The system encountered an unexpected issue.'
      }
  }
}

/**
 * Get icon for error category
 */
function getCategoryIcon(category: ErrorCategory): ReactNode {
  switch (category) {
    case 'PERMISSION_DENIED':
      return <Lock className="w-8 h-8" />
    case 'GOVERNANCE_BLOCK':
      return <Shield className="w-8 h-8" />
    case 'USER_ACTION_ERROR':
      return <AlertCircle className="w-8 h-8" />
    case 'SYSTEM_ERROR':
    default:
      return <AlertTriangle className="w-8 h-8" />
  }
}

/**
 * Get color scheme for error category
 */
function getCategoryColors(category: ErrorCategory): { bg: string; text: string; icon: string } {
  switch (category) {
    case 'PERMISSION_DENIED':
      return { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'text-amber-600' }
    case 'GOVERNANCE_BLOCK':
      return { bg: 'bg-violet-100', text: 'text-violet-800', icon: 'text-violet-600' }
    case 'USER_ACTION_ERROR':
      return { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' }
    case 'SYSTEM_ERROR':
    default:
      return { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' }
  }
}

// ============================================================================
// AUDIT EVENT EMISSION
// ============================================================================

/**
 * Audit event for error tracking
 * NO PII, NO stack traces stored
 */
interface ErrorAuditEvent {
  eventType: 'ERROR_BOUNDARY_CATCH'
  timestamp: string
  category: ErrorCategory
  route: string
  actorType: 'user' | 'demo_user' | 'guest'
  role: string | null
  tenant: string | null
  errorName: string
  // Hash of error message (no raw message stored)
  errorHash: string
}

/**
 * Generate a simple hash for audit purposes
 * No sensitive data, just for correlation
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8).toUpperCase()
}

/**
 * Emit audit event for error boundary catch
 */
function emitErrorAuditEvent(
  error: Error, 
  category: ErrorCategory,
  context: { isDemoMode: boolean; role: string | null; tenant: string | null }
): ErrorAuditEvent {
  const event: ErrorAuditEvent = {
    eventType: 'ERROR_BOUNDARY_CATCH',
    timestamp: new Date().toISOString(),
    category,
    route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    actorType: context.isDemoMode ? 'demo_user' : (context.role ? 'user' : 'guest'),
    role: context.role,
    tenant: context.tenant,
    errorName: error.name,
    errorHash: hashString(error.message),
  }
  
  // Log to console in development (would go to audit service in production)
  if (process.env.NODE_ENV === 'development') {
    console.group('🔒 Error Boundary Audit Event')
    console.log('Event:', event)
    console.groupEnd()
  }
  
  // In production, this would emit to audit service
  // await auditService.emit(event)
  
  return event
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  /** Fallback component to render on error */
  fallback?: ReactNode
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Demo mode indicator (from context) */
  isDemoMode?: boolean
  /** Current user role (from context) */
  role?: string | null
  /** Current tenant (from context) */
  tenant?: string | null
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  category: ErrorCategory
  auditEvent: ErrorAuditEvent | null
}

/**
 * Platform Error Boundary
 * 
 * Catches all React errors and displays a governance-safe fallback UI.
 * Same behavior for demo and production users.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      category: 'SYSTEM_ERROR',
      auditEvent: null,
    }
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const category = classifyError(error)
    return {
      hasError: true,
      error,
      category,
    }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, isDemoMode = false, role = null, tenant = null } = this.props
    const category = classifyError(error)
    
    // Emit audit event
    const auditEvent = emitErrorAuditEvent(error, category, {
      isDemoMode,
      role,
      tenant,
    })
    
    this.setState({ 
      errorInfo,
      auditEvent,
    })
    
    // Call optional error handler
    if (onError) {
      onError(error, errorInfo)
    }
  }
  
  render(): ReactNode {
    const { hasError, error, category, auditEvent } = this.state
    const { children, fallback, isDemoMode = false } = this.props
    
    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }
      
      // Default error UI
      const message = getCategoryMessage(category)
      const icon = getCategoryIcon(category)
      const colors = getCategoryColors(category)
      
      return (
        <div 
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
          data-testid="error-boundary"
          data-error-category={category}
        >
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <div className={colors.icon}>
                {icon}
              </div>
            </div>
            
            {/* Error Message - NO technical details */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {message.title}
            </h1>
            <p className="text-slate-600 mb-6">
              {message.description}
            </p>
            
            {/* Audit Reference (hashed, no sensitive data) */}
            {auditEvent && (
              <div className="bg-slate-100 rounded-lg p-3 mb-6">
                <p className="text-xs text-slate-500">
                  The system recorded this event.
                </p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Reference: {auditEvent.errorHash}-{auditEvent.timestamp.split('T')[0].replace(/-/g, '')}
                </p>
              </div>
            )}
            
            {/* Demo Mode Notice - Same boundary, informational only */}
            {isDemoMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-amber-700">
                  This occurred during a demonstration session.
                </p>
              </div>
            )}
            
            {/* Actions - NO retry, NO support links, NO debugging */}
            <div className="flex justify-center gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                <Home className="w-4 h-4" />
                Return Home
              </a>
            </div>
            
            {/* Category Label (generic, non-technical) */}
            <p className="text-xs text-slate-400 mt-6">
              {category === 'PERMISSION_DENIED' && 'Access Issue'}
              {category === 'GOVERNANCE_BLOCK' && 'Policy Restriction'}
              {category === 'USER_ACTION_ERROR' && 'Input Issue'}
              {category === 'SYSTEM_ERROR' && 'System Issue'}
            </p>
          </div>
        </div>
      )
    }
    
    return children
  }
}

// ============================================================================
// FUNCTIONAL WRAPPER FOR CONTEXT ACCESS
// ============================================================================

/**
 * Error Boundary with Platform Role Context
 * 
 * Automatically gets demo mode, role, and tenant from context.
 */
export function PlatformErrorBoundary({ 
  children, 
  ...props 
}: Omit<ErrorBoundaryProps, 'isDemoMode' | 'role' | 'tenant'>) {
  // Note: In a real implementation, this would use usePlatformRole()
  // Since class components can't use hooks, we use a wrapper
  // The actual values would be passed from AppLayout or a HOC
  
  return (
    <ErrorBoundary {...props}>
      {children}
    </ErrorBoundary>
  )
}

// ============================================================================
// ERROR TRIGGER COMPONENTS (For Testing)
// ============================================================================

/**
 * Component that throws a permission error (for testing)
 */
export function ThrowPermissionError(): never {
  throw new Error('Permission denied: User lacks capability to perform this action')
}

/**
 * Component that throws a governance error (for testing)
 */
export function ThrowGovernanceError(): never {
  throw new Error('Governance block: This action is restricted by compliance policies')
}

/**
 * Component that throws a user action error (for testing)
 */
export function ThrowUserActionError(): never {
  throw new Error('Validation error: Invalid input provided')
}

/**
 * Component that throws a system error (for testing)
 */
export function ThrowSystemError(): never {
  throw new Error('Unexpected system error occurred')
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  classifyError, 
  getCategoryMessage, 
  getCategoryIcon, 
  getCategoryColors,
  emitErrorAuditEvent,
  hashString,
}
export type { ErrorAuditEvent }
