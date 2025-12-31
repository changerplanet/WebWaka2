'use client'

import { useState, useEffect } from 'react'
import { Globe, Plus, Check, X, AlertCircle, Loader2, Trash2, Star, Copy, RefreshCw } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  type: 'SUBDOMAIN' | 'CUSTOM'
  status: 'PENDING' | 'VERIFIED' | 'FAILED'
  isPrimary: boolean
  verificationToken: string | null
  verifiedAt: string | null
  verificationInfo?: {
    recordName: string
    recordValue: string
    instructions: string
  }
}

interface DomainManagementProps {
  tenantSlug: string
}

export function DomainManagement({ tenantSlug }: DomainManagementProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)
  
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
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load domains')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleAddDomain() {
    if (!newDomain) return
    
    setAdding(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDomains([data.domain, ...domains])
        setNewDomain('')
        setShowAdd(false)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to add domain')
    } finally {
      setAdding(false)
    }
  }
  
  async function handleVerify(domainId: string) {
    setVerifying(domainId)
    setError(null)
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/domains/${domainId}`, {
        method: 'POST'
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDomains(domains.map(d => d.id === domainId ? data.domain : d))
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to verify domain')
    } finally {
      setVerifying(null)
    }
  }
  
  async function handleDelete(domainId: string) {
    if (!confirm('Are you sure you want to remove this domain?')) return
    
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/domains?domainId=${domainId}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDomains(domains.filter(d => d.id !== domainId))
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to remove domain')
    }
  }
  
  async function handleSetPrimary(domainId: string) {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDomains(domains.map(d => ({
          ...d,
          isPrimary: d.id === domainId
        })))
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to update domain')
    }
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }
  
  const subdomain = domains.find(d => d.type === 'SUBDOMAIN')
  const customDomains = domains.filter(d => d.type === 'CUSTOM')
  
  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Domains</h2>
            <p className="text-sm text-slate-500">Manage how users access your workspace</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Custom Domain
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {/* Add Domain Form */}
        {showAdd && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-3">Add Custom Domain</h3>
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                placeholder="app.yourdomain.com"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddDomain}
                disabled={adding || !newDomain}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
              </button>
            </div>
            <p className="text-sm text-slate-500">
              After adding, you'll need to configure DNS records to verify ownership.
            </p>
          </div>
        )}
        
        {/* Domains List */}
        <div className="space-y-4">
          {/* Default Subdomain */}
          {subdomain && (
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      {subdomain.domain}.saascore.com
                      {subdomain.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> Primary
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">Default subdomain</div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="w-4 h-4" /> Verified
                </span>
              </div>
            </div>
          )}
          
          {/* Custom Domains */}
          {customDomains.map(domain => (
            <div key={domain.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    domain.status === 'VERIFIED' ? 'bg-green-100' :
                    domain.status === 'PENDING' ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    <Globe className={`w-5 h-5 ${
                      domain.status === 'VERIFIED' ? 'text-green-600' :
                      domain.status === 'PENDING' ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      {domain.domain}
                      {domain.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> Primary
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">Custom domain</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.status === 'VERIFIED' ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" /> Verified
                    </span>
                  ) : domain.status === 'PENDING' ? (
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4" /> Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <X className="w-4 h-4" /> Failed
                    </span>
                  )}
                  
                  {domain.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerify(domain.id)}
                      disabled={verifying === domain.id}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                      title="Verify DNS"
                    >
                      {verifying === domain.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  )}
                  
                  {domain.status === 'VERIFIED' && !domain.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(domain.id)}
                      className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                    >
                      Set Primary
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(domain.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Remove domain"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              {/* Verification Instructions */}
              {domain.status === 'PENDING' && domain.verificationInfo && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">DNS Verification Required</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    Add the following TXT record to your DNS settings:
                  </p>
                  <div className="bg-white rounded-lg p-3 font-mono text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Name:</span>
                      <span className="text-slate-900">_saascore-verify</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Type:</span>
                      <span className="text-slate-900">TXT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 truncate max-w-[200px]">
                          {domain.verificationInfo.recordValue}
                        </span>
                        <button
                          onClick={() => copyToClipboard(domain.verificationInfo!.recordValue)}
                          className="p-1 hover:bg-slate-100 rounded"
                          title="Copy"
                        >
                          {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-3">
                    DNS changes may take up to 48 hours to propagate.
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {customDomains.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No custom domains configured</p>
              <p className="text-sm">Add a custom domain to use your own URL</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Help Card */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-medium text-slate-900 mb-3">Domain Configuration Help</h3>
        <div className="text-sm text-slate-600 space-y-2">
          <p><strong>Subdomain:</strong> Your default address at {tenantSlug}.saascore.com</p>
          <p><strong>Custom Domain:</strong> Use your own domain like app.yourdomain.com</p>
          <p><strong>DNS Setup:</strong> Add a CNAME record pointing to cname.saascore.com</p>
        </div>
      </div>
    </div>
  )
}
