'use client'

/**
 * TENANT DETAIL PAGE (Super Admin)
 * 
 * Shows detailed information about a specific tenant.
 * Includes: Basic info, domains, members, capabilities, instances.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  Building2, Users, Globe, Package, ArrowLeft, Loader2, AlertTriangle,
  Check, X, Clock, Shield, Eye, Trash2, RefreshCw, Layers
} from 'lucide-react'

interface TenantDetail {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  appName: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
  createdAt: string
  updatedAt: string
  domains: { id: string; domain: string; type: string; status: string }[]
  memberships: { 
    id: string
    role: string
    user: { id: string; email: string; name: string | null }
  }[]
  capabilities: { key: string; isActive: boolean; activatedAt: string | null }[]
  platformInstances: { 
    id: string
    name: string
    slug: string
    isDefault: boolean
    suiteKeys: string[]
  }[]
}

export default function TenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string
  
  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails()
    }
  }, [tenantId])

  async function fetchTenantDetails() {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`)
      const data = await res.json()
      
      if (data.success && data.tenant) {
        setTenant(data.tenant)
      } else {
        setError(data.error || 'Tenant not found')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!tenant) return
    
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await res.json()
      if (data.success) {
        fetchTenantDetails()
      } else {
        alert(data.error || 'Failed to update tenant')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error || 'Tenant not found'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-admin"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tenants
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                {tenant.appName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{tenant.appName}</h1>
                <p className="text-slate-400">{tenant.slug}.webwaka.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                tenant.status === 'ACTIVE' 
                  ? 'bg-green-500/20 text-green-400'
                  : tenant.status === 'SUSPENDED'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              }`}>
                {tenant.status === 'ACTIVE' && <Check className="w-4 h-4" />}
                {tenant.status === 'SUSPENDED' && <AlertTriangle className="w-4 h-4" />}
                {tenant.status === 'DEACTIVATED' && <X className="w-4 h-4" />}
                {tenant.status}
              </span>
              
              {tenant.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleStatusChange('SUSPENDED')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Suspend
                </button>
              ) : tenant.status === 'SUSPENDED' ? (
                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Activate
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenant.memberships.length}</p>
                <p className="text-slate-400 text-sm">Members</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenant.domains.length}</p>
                <p className="text-slate-400 text-sm">Domains</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenant.capabilities.filter(c => c.isActive).length}</p>
                <p className="text-slate-400 text-sm">Capabilities</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenant.platformInstances.length}</p>
                <p className="text-slate-400 text-sm">Instances</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Members */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Members
              </h3>
            </div>
            <div className="divide-y divide-slate-700/50">
              {tenant.memberships.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No members</div>
              ) : (
                tenant.memberships.map(m => (
                  <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{m.user.name || m.user.email}</p>
                      <p className="text-sm text-slate-400">{m.user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      m.role === 'TENANT_ADMIN' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {m.role.replace('TENANT_', '')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Domains */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                Domains
              </h3>
            </div>
            <div className="divide-y divide-slate-700/50">
              {tenant.domains.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No custom domains</div>
              ) : (
                tenant.domains.map(d => (
                  <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{d.domain}</p>
                      <p className="text-sm text-slate-400">{d.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.status === 'ACTIVE' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Capabilities */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                Active Capabilities
              </h3>
            </div>
            <div className="p-5">
              {tenant.capabilities.filter(c => c.isActive).length === 0 ? (
                <div className="text-center text-slate-500">No active capabilities</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tenant.capabilities.filter(c => c.isActive).map(c => (
                    <span key={c.key} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {c.key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Platform Instances */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Platform Instances
              </h3>
            </div>
            <div className="divide-y divide-slate-700/50">
              {tenant.platformInstances.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No platform instances</div>
              ) : (
                tenant.platformInstances.map(i => (
                  <div key={i.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {i.name}
                        {i.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Default</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-400">{i.slug}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {i.suiteKeys.length === 0 ? 'All capabilities' : `${i.suiteKeys.length} capabilities`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Metadata */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-semibold mb-4">Tenant Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400">ID</p>
              <p className="font-mono text-xs break-all">{tenant.id}</p>
            </div>
            <div>
              <p className="text-slate-400">Created</p>
              <p>{new Date(tenant.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Last Updated</p>
              <p>{new Date(tenant.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
