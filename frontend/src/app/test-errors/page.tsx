'use client'

/**
 * Error Boundary Test Page
 * 
 * Verifies the Platform Error Boundary works correctly.
 * Tests all error categories with audit event emission.
 * 
 * @module app/test-errors
 * @foundation Phase 3.5 Verification
 */

import { useState } from 'react'
import { PlatformRoleProvider, usePlatformRole } from '@/lib/auth/role-context'
import { 
  ErrorBoundary,
  ThrowPermissionError,
  ThrowGovernanceError,
  ThrowUserActionError,
  ThrowSystemError,
} from '@/components/ErrorBoundary'
import { RoleBanner } from '@/components/layout/RoleBanner'
import { 
  AlertTriangle, 
  Lock, 
  Shield, 
  AlertCircle, 
  PlayCircle,
  RefreshCw
} from 'lucide-react'

// ============================================================================
// ERROR TRIGGER BUTTONS
// ============================================================================

function ErrorTriggerButton({ 
  type, 
  onClick 
}: { 
  type: 'permission' | 'governance' | 'user' | 'system'
  onClick: () => void 
}) {
  const configs = {
    permission: {
      label: 'Permission Error',
      icon: Lock,
      color: 'bg-amber-600 hover:bg-amber-700',
      description: 'Simulates a permission denied error'
    },
    governance: {
      label: 'Governance Block',
      icon: Shield,
      color: 'bg-violet-600 hover:bg-violet-700',
      description: 'Simulates a governance policy block'
    },
    user: {
      label: 'User Action Error',
      icon: AlertCircle,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Simulates a validation/input error'
    },
    system: {
      label: 'System Error',
      icon: AlertTriangle,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Simulates an unexpected system failure'
    },
  }
  
  const config = configs[type]
  const Icon = config.icon
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${config.color} text-white rounded-lg transition`}
        data-testid={`trigger-${type}-error`}
      >
        <PlayCircle className="w-5 h-5" />
        Trigger {config.label}
      </button>
      <p className="text-xs text-slate-500 text-center mt-2">{config.description}</p>
    </div>
  )
}

// ============================================================================
// ERROR CONTAINER (with boundary)
// ============================================================================

function ErrorContainer({ 
  errorType, 
  isDemoMode,
  role,
  tenant
}: { 
  errorType: string | null
  isDemoMode: boolean
  role: string | null
  tenant: string | null
}) {
  if (!errorType) {
    return (
      <div className="bg-slate-100 rounded-xl p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Select an error type above to trigger</p>
        <p className="text-xs text-slate-400 mt-2">The error will be caught by the ErrorBoundary</p>
      </div>
    )
  }
  
  return (
    <ErrorBoundary 
      isDemoMode={isDemoMode}
      role={role}
      tenant={tenant}
    >
      {errorType === 'permission' && <ThrowPermissionError />}
      {errorType === 'governance' && <ThrowGovernanceError />}
      {errorType === 'user' && <ThrowUserActionError />}
      {errorType === 'system' && <ThrowSystemError />}
    </ErrorBoundary>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function ErrorTestContent() {
  const { isDemoMode, roleName, tenantSlug } = usePlatformRole()
  const [errorType, setErrorType] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  
  const triggerError = (type: string) => {
    setErrorType(type)
    setKey(k => k + 1) // Force re-render of ErrorBoundary
  }
  
  const reset = () => {
    setErrorType(null)
    setKey(k => k + 1)
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Role Banner */}
      <RoleBanner showCapabilityTier showGovernanceNotice />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Error Boundary Test</h1>
          <p className="text-slate-500 mt-1">
            Phase 3.5 — Platform Error Boundary Verification
          </p>
        </div>
        
        {/* Current Context */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <h2 className="font-semibold text-slate-900 mb-2">Current Context</h2>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-slate-500">Mode:</span>{' '}
              <span className={isDemoMode ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                {isDemoMode ? 'Demo' : 'Production'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Role:</span>{' '}
              <span className="font-medium">{roleName}</span>
            </div>
            <div>
              <span className="text-slate-500">Tenant:</span>{' '}
              <span className="font-medium">{tenantSlug || 'None'}</span>
            </div>
          </div>
        </div>
        
        {/* Error Triggers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ErrorTriggerButton type="permission" onClick={() => triggerError('permission')} />
          <ErrorTriggerButton type="governance" onClick={() => triggerError('governance')} />
          <ErrorTriggerButton type="user" onClick={() => triggerError('user')} />
          <ErrorTriggerButton type="system" onClick={() => triggerError('system')} />
        </div>
        
        {/* Reset Button */}
        {errorType && (
          <div className="text-center mb-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Error Boundary
            </button>
          </div>
        )}
        
        {/* Error Display Area */}
        <div key={key} className="rounded-xl overflow-hidden border border-slate-200">
          <ErrorContainer 
            errorType={errorType}
            isDemoMode={isDemoMode}
            role={roleName}
            tenant={tenantSlug}
          />
        </div>
        
        {/* Info */}
        <div className="mt-8 bg-slate-100 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-2">What This Tests</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• <strong>Permission Error</strong> → Access Restricted UI</li>
            <li>• <strong>Governance Block</strong> → Action Not Permitted UI</li>
            <li>• <strong>User Action Error</strong> → Action Could Not Be Completed UI</li>
            <li>• <strong>System Error</strong> → Something Went Wrong UI</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Check browser console for audit events (🔒 Error Boundary Audit Event)
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function TestErrorsPage() {
  return (
    <PlatformRoleProvider>
      <ErrorTestContent />
    </PlatformRoleProvider>
  )
}
