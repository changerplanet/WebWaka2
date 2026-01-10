'use client'

/**
 * Layout Test Page
 * 
 * Verifies the Platform App Layout and Role Banner work correctly.
 * 
 * @module app/test-layout
 * @foundation Phase 3.4 Verification
 */

import { AppLayout, AdminLayout } from '@/components/layout'
import { usePlatformRole } from '@/lib/auth/role-context'
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  FileText, 
  BarChart3,
  CreditCard,
  Shield
} from 'lucide-react'

function DashboardContent() {
  const { roleName, roleLevel, isDemoMode, tenantName, partnerName, suiteName } = usePlatformRole()
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Platform Layout with Role Banner - Phase 3.4 Verification
        </p>
      </div>
      
      {/* Session Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Current Session
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs text-slate-500 uppercase tracking-wide">Role</dt>
            <dd className="text-slate-900 font-medium">{roleName}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase tracking-wide">Level</dt>
            <dd className="text-slate-900 font-medium">{roleLevel}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase tracking-wide">Context</dt>
            <dd className="text-slate-900 font-medium">{tenantName || partnerName || '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 uppercase tracking-wide">Mode</dt>
            <dd className="text-slate-900 font-medium">
              {isDemoMode ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-sm">Demo</span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm">Production</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">128</p>
              <p className="text-sm text-slate-500">Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">₦2.4M</p>
              <p className="text-sm text-slate-500">Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">56</p>
              <p className="text-sm text-slate-500">Documents</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">89%</p>
              <p className="text-sm text-slate-500">Completion</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <a 
          href="/test-role" 
          className="bg-white rounded-xl border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-md transition"
        >
          <LayoutDashboard className="w-8 h-8 text-emerald-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Role Context Test</h3>
          <p className="text-sm text-slate-500 mt-1">View current role and capabilities</p>
        </a>
        
        <a 
          href="/test-permissions" 
          className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition"
        >
          <Shield className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Permission Gates Test</h3>
          <p className="text-sm text-slate-500 mt-1">Test capability-based UI gates</p>
        </a>
        
        <a 
          href="/login" 
          className="bg-white rounded-xl border border-slate-200 p-6 hover:border-violet-300 hover:shadow-md transition"
        >
          <Settings className="w-8 h-8 text-violet-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Switch Account</h3>
          <p className="text-sm text-slate-500 mt-1">Login with a different role</p>
        </a>
      </div>
      
      {/* Footer */}
      <div className="mt-12 text-center text-sm text-slate-400">
        <p>Platform Layout with Role Banner</p>
        <p className="mt-1">Phase 3.4 — Foundation Verification</p>
      </div>
    </div>
  )
}

export default function TestLayoutPage() {
  return (
    <AppLayout showGovernanceNotice>
      <DashboardContent />
    </AppLayout>
  )
}
