'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { 
  Box, 
  Package, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lock,
  Settings2
} from 'lucide-react'

interface CapabilityInfo {
  key: string
  displayName: string
  domain: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  isCore: boolean
  activatedAt?: string
  activatedBy?: 'SELF' | 'ADMIN' | 'SYSTEM'
  dependencies: string[]
  dependents: string[]
}

interface DomainGroup {
  [domain: string]: CapabilityInfo[]
}

const domainLabels: Record<string, string> = {
  core: 'Core Platform',
  commerce: 'Commerce & Retail',
  education: 'Education',
  hospitality: 'Hospitality',
  healthcare: 'Healthcare',
  finance: 'Finance',
  logistics: 'Logistics',
  hr: 'Human Resources',
  crm: 'Customer Relations',
  general: 'General',
}

const domainIcons: Record<string, React.ReactNode> = {
  core: <Shield className="h-5 w-5" />,
  commerce: <Package className="h-5 w-5" />,
  education: <Box className="h-5 w-5" />,
  hospitality: <Box className="h-5 w-5" />,
  healthcare: <Box className="h-5 w-5" />,
  finance: <Box className="h-5 w-5" />,
  logistics: <Box className="h-5 w-5" />,
  hr: <Box className="h-5 w-5" />,
  crm: <Box className="h-5 w-5" />,
  general: <Settings2 className="h-5 w-5" />,
}

export default function CapabilitiesPage() {
  const { activeTenantId, activeTenant, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [capabilities, setCapabilities] = useState<CapabilityInfo[]>([])
  const [byDomain, setByDomain] = useState<DomainGroup>({})
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number; suspended: number; core: number }>({
    total: 0, active: 0, inactive: 0, suspended: 0, core: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['commerce', 'core']))
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    if (!authLoading && activeTenantId) {
      fetchCapabilities()
    } else if (!authLoading && !activeTenantId) {
      setError('No business selected')
      setLoading(false)
    }
  }, [activeTenantId, authLoading])

  async function fetchCapabilities() {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/capabilities/tenant')
      
      if (res.status === 401) {
        setError('Authentication required. Please log in again.')
        setLoading(false)
        return
      }
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch capabilities')
      }

      const data = await res.json()
      setCapabilities(data.capabilities || [])
      setByDomain(data.byDomain || {})
      setStats(data.stats || { total: 0, active: 0, inactive: 0, suspended: 0, core: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capabilities')
    } finally {
      setLoading(false)
    }
  }

  async function toggleCapability(key: string, currentStatus: string) {
    if (currentStatus === 'ACTIVE') {
      await deactivateCapability(key)
    } else {
      await activateCapability(key)
    }
  }

  async function activateCapability(key: string) {
    try {
      setActionLoading(key)
      const res = await fetch(`/api/capabilities/tenant/${key}/activate`, {
        method: 'POST'
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate capability')
      }

      await fetchCapabilities()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate capability')
    } finally {
      setActionLoading(null)
    }
  }

  async function deactivateCapability(key: string) {
    try {
      setActionLoading(key)
      const res = await fetch(`/api/capabilities/tenant/${key}/deactivate`, {
        method: 'POST'
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to deactivate capability')
      }

      await fetchCapabilities()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate capability')
    } finally {
      setActionLoading(null)
    }
  }

  function toggleDomain(domain: string) {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain)
    } else {
      newExpanded.add(domain)
    }
    setExpandedDomains(newExpanded)
  }

  function getFilteredCapabilities(caps: CapabilityInfo[]) {
    if (filter === 'all') return caps
    if (filter === 'active') return caps.filter(c => c.status === 'ACTIVE')
    if (filter === 'inactive') return caps.filter(c => c.status === 'INACTIVE' || c.status === 'SUSPENDED')
    return caps
  }

  function getStatusBadge(status: string, isCore: boolean) {
    if (isCore) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Lock className="h-3 w-3" />
          Core (Always Active)
        </span>
      )
    }
    
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        )
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3" />
            Suspended
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3" />
            Inactive
          </span>
        )
    }
  }

  // Loading state (waiting for auth context)
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading capabilities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Capabilities</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => fetchCapabilities()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Capabilities</h1>
              <p className="text-sm text-gray-500">
                {activeTenant?.tenantName || 'Manage your active modules and features'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Suspended</p>
            <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Core</p>
            <p className="text-2xl font-bold text-blue-600">{stats.core}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Inactive / Suspended
          </button>
        </div>

        {/* Capabilities by Domain */}
        <div className="space-y-4">
          {Object.entries(byDomain).map(([domain, caps]) => {
            const filteredCaps = getFilteredCapabilities(caps)
            if (filteredCaps.length === 0) return null

            const isExpanded = expandedDomains.has(domain)
            const activeCnt = caps.filter(c => c.status === 'ACTIVE').length

            return (
              <div key={domain} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleDomain(domain)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500">
                      {domainIcons[domain] || <Box className="h-5 w-5" />}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{domainLabels[domain] || domain}</p>
                      <p className="text-sm text-gray-500">{activeCnt} of {caps.length} active</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 divide-y divide-gray-100">
                    {filteredCaps.map((cap) => (
                      <div
                        key={cap.key}
                        className="px-4 py-4 flex items-center justify-between"
                        data-testid={`capability-row-${cap.key}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{cap.displayName}</p>
                            {getStatusBadge(cap.status, cap.isCore)}
                          </div>
                          {cap.description && (
                            <p className="text-sm text-gray-500 mt-1">{cap.description}</p>
                          )}
                          {cap.dependencies.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Requires: {cap.dependencies.join(', ')}
                            </p>
                          )}
                          {cap.activatedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Activated: {new Date(cap.activatedAt).toLocaleDateString()}
                              {cap.activatedBy && ` by ${cap.activatedBy.toLowerCase()}`}
                            </p>
                          )}
                        </div>
                        
                        {!cap.isCore && cap.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => toggleCapability(cap.key, cap.status)}
                            disabled={actionLoading === cap.key}
                            data-testid={`capability-toggle-${cap.key}`}
                            className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              cap.status === 'ACTIVE'
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            } disabled:opacity-50`}
                          >
                            {actionLoading === cap.key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : cap.status === 'ACTIVE' ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        )}
                        
                        {cap.status === 'SUSPENDED' && (
                          <span className="ml-4 text-sm text-red-600">
                            Contact admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {capabilities.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No capabilities available</p>
          </div>
        )}
      </main>
    </div>
  )
}
