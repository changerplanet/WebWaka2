'use client'

/**
 * SUPER ADMIN IMPERSONATION PAGE
 * 
 * Allows Super Admins to temporarily impersonate Partners or Tenants
 * for support, diagnostics, and government pilot assistance.
 * 
 * SAFETY FEATURES:
 * - Clear visual indicator when impersonating
 * - One-click exit from impersonation
 * - Full audit logging
 * - Time-bound sessions (auto-expire)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, UserCog, Building2, Store, Clock, AlertTriangle, 
  LogOut, Eye, History, Search, Loader2, CheckCircle, X, ArrowLeft
} from 'lucide-react'

interface Partner {
  id: string
  name: string
  status: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
}

interface ImpersonationContext {
  active: boolean
  targetType: 'PARTNER' | 'TENANT' | 'INSTANCE'
  targetId: string
  targetName: string
  startedAt: string
  expiresAt: string
}

interface ImpersonationLog {
  id: string
  action: string
  actorEmail: string
  targetType: string | null
  targetId: string | null
  metadata: any
  createdAt: string
}

export default function ImpersonationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Impersonation state
  const [currentContext, setCurrentContext] = useState<ImpersonationContext | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [logs, setLogs] = useState<ImpersonationLog[]>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState<'impersonate' | 'logs'>('impersonate')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'PARTNER' | 'TENANT'>('PARTNER')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load current status and targets in parallel
      const [statusRes, targetsRes, logsRes] = await Promise.all([
        fetch('/api/admin/impersonation?action=status'),
        fetch('/api/admin/impersonation'),
        fetch('/api/admin/impersonation?action=logs')
      ])

      const [statusData, targetsData, logsData] = await Promise.all([
        statusRes.json(),
        targetsRes.json(),
        logsRes.json()
      ])

      if (statusData.success && statusData.impersonating) {
        setCurrentContext(statusData.context)
      }

      if (targetsData.success) {
        setPartners(targetsData.targets.partners || [])
        setTenants(targetsData.targets.tenants || [])
      }

      if (logsData.success) {
        setLogs(logsData.logs || [])
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleStartImpersonation(targetType: 'PARTNER' | 'TENANT', targetId: string) {
    setActionLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', targetType, targetId })
      })

      const data = await res.json()

      if (data.success) {
        setCurrentContext(data.context)
        loadData() // Refresh logs
      } else {
        setError(data.error || 'Failed to start impersonation')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleEndImpersonation() {
    setActionLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' })
      })

      const data = await res.json()

      if (data.success) {
        setCurrentContext(null)
        loadData() // Refresh logs
      } else {
        setError(data.error || 'Failed to end impersonation')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Impersonation Banner */}
      {currentContext && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-black px-4 py-3 z-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">
              You are impersonating: {currentContext.targetName}
            </span>
            <span className="text-sm opacity-75">
              ({currentContext.targetType})
            </span>
            <span className="text-sm opacity-75">
              Expires: {new Date(currentContext.expiresAt).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={handleEndImpersonation}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg font-medium transition"
            data-testid="exit-impersonation-btn"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Header */}
      <div className={`bg-slate-800 border-b border-slate-700 ${currentContext ? 'mt-14' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Super Admin Impersonation</h1>
              <p className="text-slate-400">Temporarily act as a Partner or Tenant for support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-200 font-medium">Security Notice</p>
            <p className="text-slate-400 text-sm mt-1">
              Impersonation sessions are logged and audited. Destructive actions are blocked.
              Sessions automatically expire after 60 minutes. Use only for legitimate support purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <X className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('impersonate')}
            className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
              activeTab === 'impersonate'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Impersonate
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
              activeTab === 'logs'
                ? 'text-amber-400 border-amber-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Audit Logs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === 'impersonate' && (
          <div className="space-y-6">
            {/* Type Selector */}
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedType('PARTNER')}
                className={`flex-1 p-4 rounded-xl border transition ${
                  selectedType === 'PARTNER'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Building2 className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Partner</p>
                <p className="text-xs opacity-60">{partners.length} available</p>
              </button>
              <button
                onClick={() => setSelectedType('TENANT')}
                className={`flex-1 p-4 rounded-xl border transition ${
                  selectedType === 'TENANT'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Store className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Tenant</p>
                <p className="text-xs opacity-60">{tenants.length} available</p>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${selectedType.toLowerCase()}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                data-testid="impersonation-search"
              />
            </div>

            {/* Target List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {selectedType === 'PARTNER' ? (
                filteredPartners.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No partners found</div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {filteredPartners.map(partner => (
                      <div key={partner.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              partner.status === 'ACTIVE' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {partner.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartImpersonation('PARTNER', partner.id)}
                          disabled={actionLoading || !!currentContext}
                          className="px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          data-testid={`impersonate-partner-${partner.id}`}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          Impersonate
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                filteredTenants.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No tenants found</div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {filteredTenants.map(tenant => (
                      <div key={tenant.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Store className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-slate-400">{tenant.slug}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartImpersonation('TENANT', tenant.id)}
                          disabled={actionLoading || !!currentContext}
                          className="px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          data-testid={`impersonate-tenant-${tenant.id}`}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          Impersonate
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Impersonation Audit Log
              </h3>
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No impersonation logs yet</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {logs.map(log => (
                  <div key={log.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.action === 'SUPER_ADMIN_IMPERSONATION_START' ? (
                          <Eye className="w-4 h-4 text-amber-400" />
                        ) : (
                          <LogOut className="w-4 h-4 text-green-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          log.action === 'SUPER_ADMIN_IMPERSONATION_START' 
                            ? 'text-amber-400' 
                            : 'text-green-400'
                        }`}>
                          {log.action === 'SUPER_ADMIN_IMPERSONATION_START' ? 'Started' : 'Ended'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="text-slate-400">Actor:</span> {log.actorEmail}
                    </div>
                    <div className="text-sm text-slate-300">
                      <span className="text-slate-400">Target:</span> {log.targetType} - {log.metadata?.targetName || log.targetId}
                    </div>
                    {log.metadata?.duration && (
                      <div className="text-sm text-slate-300">
                        <span className="text-slate-400">Duration:</span> {log.metadata.duration}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
