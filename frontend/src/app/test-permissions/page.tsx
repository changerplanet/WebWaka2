'use client'

/**
 * Permission Gate Test Page
 * 
 * Verifies the Platform Permission Gates work for both demo and production users.
 * Tests capability-based enforcement, not role-based.
 * 
 * @module app/test-permissions
 * @foundation Phase 3.3 Verification
 */

import { 
  PlatformRoleProvider, 
  usePlatformRole,
} from '@/lib/auth/role-context'
import {
  PermissionGate,
  CreateGate,
  EditGate,
  DeleteGate,
  ApproveGate,
  FinancialsGate,
  AdminGate,
  AuditLogGate,
  BlockedActionsSummary,
  ActionGate,
} from '@/components/auth/PermissionGate'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  DollarSign, 
  Settings, 
  FileText,
  Lock,
  Loader2,
  Shield
} from 'lucide-react'

function PermissionTestContent() {
  const { isLoading, roleName, roleLevel, isDemoMode, isAuthenticated } = usePlatformRole()
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-600">Loading permissions...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Current Role Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Session</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${isAuthenticated ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="font-medium">{roleName}</span>
          </div>
          <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">{roleLevel}</span>
          {isDemoMode && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">Demo Mode</span>
          )}
        </div>
      </div>
      
      {/* Blocked Actions Summary */}
      <BlockedActionsSummary showWhenEmpty />
      
      {/* Permission Gate Tests */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Permission Gate Tests</h2>
        <p className="text-sm text-slate-500 mb-4">
          These buttons are wrapped in capability-based permission gates. 
          They will be hidden, disabled, or shown based on your capabilities.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Create Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">CreateGate</p>
            <CreateGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="create-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Create
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                data-testid="create-allowed"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </CreateGate>
          </div>
          
          {/* Edit Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">EditGate</p>
            <EditGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="edit-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Edit
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="edit-allowed"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </EditGate>
          </div>
          
          {/* Delete Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">DeleteGate</p>
            <DeleteGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="delete-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Delete
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                data-testid="delete-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </DeleteGate>
          </div>
          
          {/* Approve Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">ApproveGate</p>
            <ApproveGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="approve-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Approve
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                data-testid="approve-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </ApproveGate>
          </div>
          
          {/* Financials Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">FinancialsGate</p>
            <FinancialsGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="financials-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Financials
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                data-testid="financials-allowed"
              >
                <DollarSign className="w-4 h-4" />
                Financials
              </button>
            </FinancialsGate>
          </div>
          
          {/* Admin Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">AdminGate</p>
            <AdminGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="admin-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Admin
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                data-testid="admin-allowed"
              >
                <Settings className="w-4 h-4" />
                Admin
              </button>
            </AdminGate>
          </div>
          
          {/* Audit Log Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">AuditLogGate</p>
            <AuditLogGate 
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="audit-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Audit Log
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                data-testid="audit-allowed"
              >
                <FileText className="w-4 h-4" />
                Audit Log
              </button>
            </AuditLogGate>
          </div>
          
          {/* Generic Permission Gate */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Multiple Caps</p>
            <PermissionGate 
              capabilities={['canCreate', 'canEdit', 'canDelete']}
              fallback={
                <button 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                  data-testid="multi-blocked"
                >
                  <Lock className="w-4 h-4" />
                  Full CRUD
                </button>
              }
            >
              <button 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                data-testid="multi-allowed"
              >
                <Shield className="w-4 h-4" />
                Full CRUD
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
      
      {/* Action Gate Test */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">ActionGate Test</h2>
        <p className="text-sm text-slate-500 mb-4">
          ActionGate provides click handler with permission check built in.
        </p>
        
        <ActionGate
          capability="canDelete"
          onAction={() => alert('Delete action executed!')}
        >
          {({ onClick, disabled, blocked, reason }) => (
            <button
              onClick={onClick}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                blocked 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              title={reason}
              data-testid="action-gate-button"
            >
              {blocked ? <Lock className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              {blocked ? 'Delete (Blocked)' : 'Delete Item'}
            </button>
          )}
        </ActionGate>
      </div>
      
      {/* Blocked Message Test */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Blocked Message Test</h2>
        <p className="text-sm text-slate-500 mb-4">
          Gates can show a blocked message instead of hiding content.
        </p>
        
        <div className="space-y-3">
          <PermissionGate 
            capability="canManageBilling"
            showBlockedMessage
            blockedMessage="Billing management requires owner-level access."
          >
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
              Manage Billing
            </button>
          </PermissionGate>
          
          <PermissionGate 
            capability="canManageRoles"
            showBlockedMessage
          >
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
              Manage Roles
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  )
}

export default function TestPermissionsPage() {
  return (
    <PlatformRoleProvider>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Platform Permission Gates Test
            </h1>
            <p className="text-slate-500 mt-2">
              Phase 3.3 — Foundation Verification
            </p>
          </div>
          
          <PermissionTestContent />
          
          <div className="mt-8 text-center text-sm text-slate-400">
            <p>Test different roles to see permission gates in action:</p>
            <div className="mt-2 flex justify-center gap-4">
              <a href="/login" className="text-emerald-600 hover:underline">Login</a>
              <span>|</span>
              <a href="/test-role" className="text-emerald-600 hover:underline">Role Context</a>
            </div>
          </div>
        </div>
      </div>
    </PlatformRoleProvider>
  )
}
