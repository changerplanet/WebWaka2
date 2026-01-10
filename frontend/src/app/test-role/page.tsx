'use client'

/**
 * Role Context Test Page
 * 
 * Verifies the Platform Role Context works for both demo and production users.
 * This page is for testing/debugging only.
 * 
 * @module app/test-role
 * @foundation Phase 3.2 Verification
 */

import { 
  PlatformRoleProvider, 
  usePlatformRole,
  useCapabilities,
  useIsDemoMode,
  useRoleLevel
} from '@/lib/auth/role-context'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

function RoleDisplay() {
  const role = usePlatformRole()
  const capabilities = useCapabilities()
  const isDemoMode = useIsDemoMode()
  const roleLevel = useRoleLevel()
  
  if (role.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-600">Loading role context...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Authentication Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {role.isAuthenticated ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-slate-700">
              {role.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isDemoMode ? (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-slate-700">
              {isDemoMode ? 'Demo Mode' : 'Production Mode'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Role Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Role Information</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">Role Level</dt>
            <dd className="text-slate-900 font-medium">{roleLevel}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Role Name</dt>
            <dd className="text-slate-900 font-medium">{role.roleName}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-slate-500">Description</dt>
            <dd className="text-slate-900">{role.roleDescription}</dd>
          </div>
        </dl>
      </div>
      
      {/* Context Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Context Information</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">User Email</dt>
            <dd className="text-slate-900">{role.userEmail || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">User Name</dt>
            <dd className="text-slate-900">{role.userName || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Tenant</dt>
            <dd className="text-slate-900">{role.tenantSlug || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Suite</dt>
            <dd className="text-slate-900">{role.suiteName || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Partner</dt>
            <dd className="text-slate-900">{role.partnerSlug || '-'}</dd>
          </div>
        </dl>
      </div>
      
      {/* Capabilities */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Capabilities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(capabilities).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              {value ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300" />
              )}
              <span className={`text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`}>
                {key.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Raw Data */}
      <div className="bg-slate-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Raw Context Data</h2>
        <pre className="text-xs text-emerald-400 overflow-auto">
          {JSON.stringify(role, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default function TestRolePage() {
  return (
    <PlatformRoleProvider>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Platform Role Context Test
            </h1>
            <p className="text-slate-500 mt-2">
              Phase 3.2 — Foundation Verification
            </p>
          </div>
          
          <RoleDisplay />
          
          <div className="mt-8 text-center text-sm text-slate-400">
            <p>This page verifies the role context works for both demo and production users.</p>
            <p className="mt-1">
              <a href="/login" className="text-emerald-600 hover:underline">Login</a>
              {' | '}
              <a href="/login?demo=true" className="text-emerald-600 hover:underline">Demo Login</a>
            </p>
          </div>
        </div>
      </div>
    </PlatformRoleProvider>
  )
}
