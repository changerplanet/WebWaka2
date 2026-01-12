'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  Settings2,
  RefreshCw,
  Plus,
  Eye
} from 'lucide-react'

interface CapabilityWithStats {
  id: string
  key: string
  displayName: string
  domain: string
  description: string | null
  dependencies: string[]
  isCore: boolean
  isAvailable: boolean
  icon: string | null
  sortOrder: number
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  stats?: {
    totalActivations: number
    active: number
    inactive: number
    suspended: number
  }
}

interface DomainGroup {
  domain: string
  label: string
  capabilities: CapabilityWithStats[]
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

export default function AdminCapabilitiesPage() {
  const router = useRouter()

  const [capabilities, setCapabilities] = useState<CapabilityWithStats[]>([])
  const [byDomain, setByDomain] = useState<DomainGroup[]>([])
  const [stats, setStats] = useState({
    totalCapabilities: 0,
    coreCapabilities: 0,
    availableCapabilities: 0,
    domainCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['commerce', 'core']))
  const [seedLoading, setSeedLoading] = useState(false)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [selectedCapability, setSelectedCapability] = useState<CapabilityWithStats | null>(null)

  useEffect(() => {
    fetchCapabilities()
  }, [filterDomain])

  async function fetchCapabilities() {
    try {
      setLoading(true)
      const url = filterDomain === 'all' 
        ? '/api/admin/capabilities?includeStats=true'
        : `/api/admin/capabilities?domain=${filterDomain}&includeStats=true`
      
      const res = await fetch(url)
      
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 403) {
          throw new Error('Super Admin access required')
        }
        throw new Error(data.error || 'Failed to fetch capabilities')
      }

      const data = await res.json()
      setCapabilities(data.capabilities)
      setByDomain(data.byDomain)
      setStats(data.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capabilities')
    } finally {
      setLoading(false)
    }
  }

  async function seedCapabilities() {
    try {
      setSeedLoading(true)
      const res = await fetch('/api/capabilities/seed', { method: 'POST' })
      
      if (!res.ok) {
        throw new Error('Failed to seed capabilities')
      }

      await fetchCapabilities()
      alert('Capabilities synced from registry successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to seed capabilities')
    } finally {
      setSeedLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="text-green-600 hover:underline"
          >
            Back to Admin
          </button>
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
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Capability Registry</h1>
              <p className="text-sm text-gray-500">Manage system capabilities and tenant activations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={seedCapabilities}
              disabled={seedLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              data-testid="sync-capabilities-btn"
            >
              {seedLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync from Registry
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Capabilities</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCapabilities}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Core (Always Active)</p>
            <p className="text-2xl font-bold text-blue-600">{stats.coreCapabilities}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{stats.availableCapabilities}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Domains</p>
            <p className="text-2xl font-bold text-purple-600">{stats.domainCount}</p>
          </div>
        </div>

        {/* Domain Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDomain('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterDomain === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Domains
          </button>
          {Object.entries(domainLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterDomain(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterDomain === key
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Capabilities by Domain */}
        <div className="space-y-4">
          {byDomain.map((group) => {
            const isExpanded = expandedDomains.has(group.domain)

            return (
              <div key={group.domain} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleDomain(group.domain)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500">
                      {group.domain === 'core' ? (
                        <Shield className="h-5 w-5" />
                      ) : group.domain === 'commerce' ? (
                        <Package className="h-5 w-5" />
                      ) : (
                        <Box className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{group.label}</p>
                      <p className="text-sm text-gray-500">{group.capabilities.length} capabilities</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capability</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Active Tenants</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.capabilities.map((cap) => (
                          <tr key={cap.key} className="hover:bg-gray-50" data-testid={`admin-capability-row-${cap.key}`}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{cap.displayName}</p>
                              {cap.description && (
                                <p className="text-sm text-gray-500 truncate max-w-xs">{cap.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{cap.key}</code>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {cap.isCore ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Lock className="h-3 w-3" />
                                  Core
                                </span>
                              ) : cap.isAvailable ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="h-3 w-3" />
                                  Hidden
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {cap.stats && (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-green-600 font-medium">{cap.stats.active}</span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-gray-600">{cap.stats.totalActivations}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setSelectedCapability(cap)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View details"
                              >
                                <Eye className="h-4 w-4 text-gray-500" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
            <p className="text-gray-600 mb-4">No capabilities found</p>
            <button
              onClick={seedCapabilities}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Seed Capabilities
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedCapability && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedCapability.displayName}</h2>
                <button
                  onClick={() => setSelectedCapability(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Key</label>
                  <p className="mt-1"><code className="bg-gray-100 px-2 py-1 rounded">{selectedCapability.key}</code></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Domain</label>
                  <p className="mt-1">{domainLabels[selectedCapability.domain] || selectedCapability.domain}</p>
                </div>
                {selectedCapability.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-gray-700">{selectedCapability.description}</p>
                  </div>
                )}
                {selectedCapability.dependencies.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dependencies</label>
                    <p className="mt-1">{selectedCapability.dependencies.join(', ')}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1">
                    {selectedCapability.isCore ? 'Core (Cannot be deactivated)' : 'Optional'}
                  </p>
                </div>
                {selectedCapability.stats && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Activation Stats</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="bg-green-50 p-2 rounded text-center">
                        <p className="text-lg font-bold text-green-600">{selectedCapability.stats.active}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <p className="text-lg font-bold text-gray-600">{selectedCapability.stats.inactive}</p>
                        <p className="text-xs text-gray-500">Inactive</p>
                      </div>
                      <div className="bg-red-50 p-2 rounded text-center">
                        <p className="text-lg font-bold text-red-600">{selectedCapability.stats.suspended}</p>
                        <p className="text-xs text-gray-500">Suspended</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedCapability.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <pre className="mt-1 bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                      {JSON.stringify(selectedCapability.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
