'use client'

/**
 * PHASE 4A: Client Platform Management
 * 
 * Partner dashboard for viewing and managing client platforms.
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Building2, Plus, Search, Filter, MoreHorizontal, 
  ExternalLink, Settings, RefreshCw, Loader2, AlertCircle,
  CheckCircle, Clock, XCircle
} from 'lucide-react'
import { ClientCreationWizard } from './ClientCreationWizard'

interface ClientPlatform {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  activatedAt: string | null
  adminEmail?: string
  adminName?: string
  branding: {
    appName: string
    primaryColor: string
    secondaryColor: string
    logoUrl: string | null
  }
  domains: {
    id: string
    domain: string
    type: string
    status: string
    isPrimary: boolean
  }[]
  instances: {
    id: string
    name: string
    slug: string
    isDefault: boolean
    isActive: boolean
    suiteKeys: string[]
  }[]
}

interface ClientManagementProps {
  partnerId: string
}

export function ClientManagement({ partnerId }: ClientManagementProps) {
  const [clients, setClients] = useState<ClientPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientPlatform | null>(null)
  
  useEffect(() => {
    fetchClients()
  }, [partnerId])
  
  async function fetchClients() {
    try {
      const res = await fetch(`/api/partner/clients?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      
      if (data.success) {
        setClients(data.platforms || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }
  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      PENDING_ACTIVATION: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    }
    
    const style = styles[status] || styles.PENDING_ACTIVATION
    const Icon = style.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    )
  }
  
  if (showWizard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Create Client Platform</h2>
        </div>
        <ClientCreationWizard
          onComplete={() => {
            setShowWizard(false)
            fetchClients()
          }}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    )
  }
  
  return (
    <div className="space-y-6" data-testid="client-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Client Platforms
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your client business platforms
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          data-testid="create-client-btn"
        >
          <Plus className="w-4 h-4" />
          Create Client
        </button>
      </div>
      
      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={fetchClients}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-slate-600" />
        </button>
      </div>
      
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}
      
      {/* Clients List */}
      {!loading && filteredClients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
          <p className="text-slate-500 mb-4">
            Create your first client platform to get started
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Create Client
          </button>
        </div>
      )}
      
      {!loading && filteredClients.length > 0 && (
        <div className="grid gap-4">
          {filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition"
              data-testid={`client-card-${client.slug}`}
            >
              <div className="flex items-start gap-4">
                {/* Logo/Initial */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ backgroundColor: client.branding.primaryColor }}
                >
                  {client.branding.appName.charAt(0)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    {getStatusBadge(client.status)}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {client.slug}.webwaka.com
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {client.adminEmail && (
                      <span>Admin: {client.adminEmail}</span>
                    )}
                    <span>{client.instances.length} instance(s)</span>
                    <span>Created {new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/dashboard?tenant=${client.slug}`}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                    title="Open Platform"
                  >
                    <ExternalLink className="w-5 h-5 text-slate-500" />
                  </a>
                  <button
                    onClick={() => setSelectedClient(client)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>
              
              {/* Domains & Instances Summary */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Domains: </span>
                  {client.domains.slice(0, 2).map(d => (
                    <span key={d.id} className="text-slate-700 mr-2">
                      {d.type === 'SUBDOMAIN' ? `${d.domain}.webwaka.com` : d.domain}
                    </span>
                  ))}
                  {client.domains.length > 2 && (
                    <span className="text-slate-400">+{client.domains.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats */}
      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
            <p className="text-sm text-slate-500">Total Clients</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {clients.filter(c => c.status === 'ACTIVE').length}
            </p>
            <p className="text-sm text-slate-500">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {clients.filter(c => c.status === 'PENDING_ACTIVATION').length}
            </p>
            <p className="text-sm text-slate-500">Pending</p>
          </div>
        </div>
      )}
    </div>
  )
}
