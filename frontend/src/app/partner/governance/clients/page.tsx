'use client'

/**
 * PARTNER ADMIN - CLIENT MANAGEMENT
 * 
 * Create and manage clients within capability limits.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, ArrowLeft, Plus, Search, MoreVertical, Building2,
  Check, X, Loader2, AlertTriangle, Pause, Play, Eye
} from 'lucide-react'
import { usePartner } from '@/lib/partner-governance/partner-context'
import { CapabilityGuard, CapabilityRequired, LimitWarning } from '@/lib/partner-governance/capability-guard'
import { createGovernanceAuditEvent } from '@/lib/partner-governance/audit'
import { v4 as uuidv4 } from 'uuid'

// Demo clients data
interface Client {
  id: string
  name: string
  email: string
  domain: string
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
  suites: string[]
}

const DEMO_CLIENTS: Client[] = [
  { id: 'client-001', name: 'TechCorp Ltd', email: 'admin@techcorp.com', domain: 'techcorp.webwaka.com', status: 'active', createdAt: '2026-01-01', suites: ['commerce', 'inventory'] },
  { id: 'client-002', name: 'EduFirst School', email: 'admin@edufirst.edu', domain: 'edufirst.webwaka.com', status: 'active', createdAt: '2026-01-02', suites: ['education'] },
  { id: 'client-003', name: 'HealthPlus Clinic', email: 'admin@healthplus.com', domain: 'healthplus.webwaka.com', status: 'active', createdAt: '2026-01-03', suites: ['health'] },
  { id: 'client-004', name: 'RetailMax Store', email: 'admin@retailmax.com', domain: 'retailmax.webwaka.com', status: 'suspended', createdAt: '2026-01-04', suites: ['commerce'] },
  { id: 'client-005', name: 'Sunrise Hotel', email: 'admin@sunrisehotel.com', domain: 'sunrise.webwaka.com', status: 'active', createdAt: '2026-01-05', suites: ['hospitality'] },
]

export default function ClientManagementPage() {
  const router = useRouter()
  const { partner, capabilities, can, canWithinLimit, clientCount } = usePartner()
  const [clients, setClients] = useState<Client[]>(DEMO_CLIENTS)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const filteredClients = clients.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const canCreateMore = canWithinLimit('canCreateClients', clients.length)

  const handleCreateClient = (newClient: Omit<Client, 'id' | 'createdAt' | 'status'>) => {
    const client: Client = {
      ...newClient,
      id: uuidv4(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    }
    setClients(prev => [...prev, client])
    
    // Audit event
    createGovernanceAuditEvent({
      action: 'partner.type.assigned', // Using existing action type
      actorId: partner?.id || 'unknown',
      actorType: 'partner-admin',
      actorEmail: partner?.email || 'unknown',
      scope: { partnerId: partner?.id, clientId: client.id },
      changeType: 'create',
      newValue: { clientName: client.name, clientEmail: client.email },
    })
    
    setShowCreateModal(false)
  }

  const handleSuspendClient = (clientId: string) => {
    setClients(prev => prev.map((c: any) => 
      c.id === clientId ? { ...c, status: 'suspended' as const } : c
    ))
    
    // Audit event
    createGovernanceAuditEvent({
      action: 'partner.capabilities.updated',
      actorId: partner?.id || 'unknown',
      actorType: 'partner-admin',
      actorEmail: partner?.email || 'unknown',
      scope: { partnerId: partner?.id, clientId },
      changeType: 'update',
      previousValue: { status: 'active' },
      newValue: { status: 'suspended' },
      reason: 'Partner suspended client',
    })
  }

  const handleReactivateClient = (clientId: string) => {
    setClients(prev => prev.map((c: any) => 
      c.id === clientId ? { ...c, status: 'active' as const } : c
    ))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/partner/governance')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-governance"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Governance Portal
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Client Management</h1>
                <p className="text-slate-400">Create and manage your clients</p>
              </div>
            </div>

            {/* Create Button */}
            <CapabilityGuard capability="canCreateClients" currentCount={clients.length} mode="disable">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!canCreateMore}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl transition"
                data-testid="create-client-btn"
              >
                <Plus className="w-5 h-5" />
                Create Client
              </button>
            </CapabilityGuard>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <CapabilityRequired
          capability="canCreateClients"
          title="Client Management Not Available"
          description="Your account does not have permission to create or manage clients."
        >
          {/* Limit Warning */}
          <LimitWarning capability="canCreateClients" currentCount={clients.length} />

          {/* Search */}
          <div className="mb-6 mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Total Clients</p>
              <p className="text-2xl font-bold">
                {clients.length}
                {capabilities.maxClients !== null && (
                  <span className="text-sm text-slate-500 ml-1">/ {capabilities.maxClients}</span>
                )}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Active</p>
              <p className="text-2xl font-bold text-green-400">
                {clients.filter((c: any) => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Suspended</p>
              <p className="text-2xl font-bold text-red-400">
                {clients.filter((c: any) => c.status === 'suspended').length}
              </p>
            </div>
          </div>

          {/* Client List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Client</th>
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Domain</th>
                  <th className="text-left py-4 px-5 text-sm text-slate-400">Suites</th>
                  <th className="text-center py-4 px-5 text-sm text-slate-400">Status</th>
                  <th className="text-right py-4 px-5 text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-slate-500">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <code className="text-sm text-slate-400">{client.domain}</code>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex gap-1">
                        {client.suites.map(suite => (
                          <span key={suite} className="px-2 py-0.5 bg-slate-700 rounded text-xs capitalize">
                            {suite}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        client.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                        
                        {can('canSuspendClients') && client.status === 'active' && (
                          <button
                            onClick={() => handleSuspendClient(client.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition"
                            title="Suspend client"
                          >
                            <Pause className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                        
                        {can('canSuspendClients') && client.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivateClient(client.id)}
                            className="p-2 hover:bg-green-500/20 rounded-lg transition"
                            title="Reactivate client"
                          >
                            <Play className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClients.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No clients found</p>
              </div>
            )}
          </div>
        </CapabilityRequired>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateClient}
          allowedSuites={capabilities.allowedSuites}
        />
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  )
}

function CreateClientModal({
  onClose,
  onCreated,
  allowedSuites,
}: {
  onClose: () => void
  onCreated: (client: Omit<Client, 'id' | 'createdAt' | 'status'>) => void
  allowedSuites: string[]
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    domain: '',
    suites: [] as string[],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!form.name || !form.email) return
    setLoading(true)
    setTimeout(() => {
      onCreated({
        ...form,
        domain: form.domain || `${form.name.toLowerCase().replace(/\s+/g, '-')}.webwaka.com`,
      })
      setLoading(false)
    }, 500)
  }

  const toggleSuite = (suite: string) => {
    setForm(prev => ({
      ...prev,
      suites: prev.suites.includes(suite)
        ? prev.suites.filter((s: any) => s !== suite)
        : [...prev.suites, suite],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create Client</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Client Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g., TechCorp Ltd"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Admin Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g., admin@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Domain (optional)</label>
            <input
              type="text"
              value={form.domain}
              onChange={(e) => setForm(prev => ({ ...prev, domain: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Auto-generated if empty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Enabled Suites</label>
            <div className="flex flex-wrap gap-2">
              {allowedSuites.map(suite => (
                <button
                  key={suite}
                  type="button"
                  onClick={() => toggleSuite(suite)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    form.suites.includes(suite)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-slate-700 text-slate-400 border border-transparent'
                  }`}
                >
                  {suite}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Select suites this client can access</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.email}
              className="flex-1 px-4 py-3 bg-green-500 rounded-xl hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientDetailModal({
  client,
  onClose,
}: {
  client: Client
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Client Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{client.name}</h3>
              <p className="text-slate-400">{client.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Domain</p>
              <code className="text-sm">{client.domain}</code>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Status</p>
              <span className={`px-2 py-0.5 rounded text-sm ${
                client.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {client.status}
              </span>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm">{client.createdAt}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Suites</p>
              <div className="flex gap-1 mt-1">
                {client.suites.map((s: any) => (
                  <span key={s} className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
