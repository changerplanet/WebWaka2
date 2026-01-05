'use client'

/**
 * DOMAIN-INSTANCE MAPPING (Phase 2.1)
 * 
 * UI for mapping domains to platform instances.
 * Mapping only - no DNS verification logic.
 * 
 * PHASE 2 BOUNDARIES:
 * - Mapping UI only
 * - No DNS verification
 * - No SSL provisioning
 */

import { useState, useEffect } from 'react'
import { Globe, Link2, Loader2, AlertCircle, Check, ChevronDown, Layers, Building2 } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  type: 'SUBDOMAIN' | 'CUSTOM'
  status: 'PENDING' | 'VERIFIED' | 'FAILED'
  isPrimary: boolean
  platformInstanceId: string | null
}

interface PlatformInstance {
  id: string
  name: string
  slug: string
  displayName: string | null
  primaryColor: string | null
  isDefault: boolean
}

interface DomainInstanceMappingProps {
  tenantSlug: string
  instances: PlatformInstance[]
  onMappingChange?: () => void
}

export function DomainInstanceMapping({ 
  tenantSlug, 
  instances,
  onMappingChange 
}: DomainInstanceMappingProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchDomains()
  }, [tenantSlug])

  async function fetchDomains() {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/domains`)
      const data = await res.json()
      
      if (data.success) {
        setDomains(data.domains)
      } else {
        setError(data.error || 'Failed to load domains')
      }
    } catch (err) {
      setError('Failed to load domains')
    } finally {
      setLoading(false)
    }
  }

  async function handleMappingChange(domainId: string, instanceId: string | null) {
    setUpdating(domainId)
    setMessage(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/domains/${domainId}/instance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformInstanceId: instanceId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDomains(domains.map(d => 
          d.id === domainId 
            ? { ...d, platformInstanceId: instanceId }
            : d
        ))
        setMessage({ type: 'success', text: 'Domain mapping updated' })
        onMappingChange?.()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update mapping' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update mapping' })
    } finally {
      setUpdating(null)
    }
  }

  // Get instance details by ID
  function getInstanceById(id: string | null): PlatformInstance | undefined {
    if (!id) return undefined
    return instances.find(i => i.id === id)
  }

  // Get default instance
  const defaultInstance = instances.find(i => i.isDefault)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200" data-testid="domain-instance-mapping">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Domain → Instance Mapping</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Choose which platform instance each domain should load
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Mappings Table */}
      <div className="p-6">
        {domains.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No domains configured</p>
            <p className="text-sm">Add domains in the Domains settings tab</p>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map(domain => {
              const mappedInstance = getInstanceById(domain.platformInstanceId)
              const displayDomain = domain.type === 'SUBDOMAIN' 
                ? `${domain.domain}.webwaka.com`
                : domain.domain

              return (
                <div 
                  key={domain.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                  data-testid={`domain-mapping-${domain.id}`}
                >
                  {/* Domain Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      domain.status === 'VERIFIED' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      <Globe className={`w-5 h-5 ${
                        domain.status === 'VERIFIED' ? 'text-green-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{displayDomain}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {domain.type === 'SUBDOMAIN' ? 'Subdomain' : 'Custom'}
                        {domain.isPrimary && (
                          <span className="text-amber-600">• Primary</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-slate-400">→</div>

                  {/* Instance Selector */}
                  <div className="relative w-56">
                    <select
                      value={domain.platformInstanceId || ''}
                      onChange={(e) => handleMappingChange(
                        domain.id, 
                        e.target.value || null
                      )}
                      disabled={updating === domain.id}
                      className="w-full appearance-none px-4 py-2.5 pr-10 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
                      data-testid={`instance-select-${domain.id}`}
                    >
                      <option value="">
                        Default Instance {defaultInstance ? `(${defaultInstance.name})` : ''}
                      </option>
                      {instances.filter(i => !i.isDefault).map(instance => (
                        <option key={instance.id} value={instance.id}>
                          {instance.displayName || instance.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Dropdown icon or loader */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {updating === domain.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="w-24 text-right">
                    {mappedInstance ? (
                      <div 
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${mappedInstance.primaryColor || '#6366f1'}15`,
                          color: mappedInstance.primaryColor || '#6366f1'
                        }}
                      >
                        <Layers className="w-3 h-3" />
                        Custom
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <Building2 className="w-3 h-3" />
                        Default
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-100">
        <p className="text-xs text-slate-500">
          <strong>Note:</strong> When a domain has no mapping, it will use the tenant's default platform instance.
          Users visiting mapped domains will see the configured instance's branding and navigation.
        </p>
      </div>
    </div>
  )
}
