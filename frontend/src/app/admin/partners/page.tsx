'use client'

/**
 * PARTNER MANAGEMENT ADMIN PAGE
 * 
 * Super Admin UI for managing Partners:
 * - List all partners with search/filter
 * - View partner details
 * - Approve/suspend/reinstate partners
 * - View partner tenants and instances
 * - Read-only revenue summary
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, Users, Store, Search, Loader2, ArrowLeft, Check,
  AlertTriangle, X, Eye, ChevronRight, Ban, RefreshCw, Shield,
  DollarSign, Clock, Globe, Mail, Phone
} from 'lucide-react'

interface Partner {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
  tier: string
  createdAt: string
  approvedAt: string | null
  referralCount: number
  userCount: number
  instanceCount: number
}

interface PartnerDetail {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  website: string | null
  status: string
  tier: string
  companyNumber: string | null
  taxId: string | null
  address: any
  createdAt: string
  approvedAt: string | null
  users: {
    id: string
    role: string
    isActive: boolean
    joinedAt: string
    user: { id: string; email: string; name: string | null; phone: string | null }
  }[]
  tenants: {
    id: string
    name: string
    slug: string
    status: string
    referredAt: string
  }[]
  instances: {
    id: string
    name: string
    slug: string
    tenantName: string
    isActive: boolean
    createdAt: string
  }[]
  revenueSummary: {
    totalEarnings: number
    totalPaidOut: number
    currency: string
  }
}

export default function PartnerManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // List state
  const [partners, setPartners] = useState<Partner[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Detail state
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadPartners()
  }, [statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPartners()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  async function loadPartners() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const res = await fetch(`/api/admin/partners?${params}`)
      const data = await res.json()

      if (data.success) {
        setPartners(data.partners)
        setStatusCounts(data.statusCounts)
        setPagination(data.pagination)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load partners')
    } finally {
      setLoading(false)
    }
  }

  async function loadPartnerDetail(partnerId: string) {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`)
      const data = await res.json()

      if (data.success) {
        setSelectedPartner(data.partner)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load partner details')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handlePartnerAction(action: string, partnerId: string, reason?: string) {
    setActionLoading(partnerId)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, partnerId, reason })
      })

      const data = await res.json()

      if (data.success) {
        loadPartners()
        if (selectedPartner?.id === partnerId) {
          loadPartnerDetail(partnerId)
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400'
      case 'SUSPENDED': return 'bg-red-500/20 text-red-400'
      case 'TERMINATED': return 'bg-slate-500/20 text-slate-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Partner Management</h1>
              <p className="text-slate-400">View and manage platform partners</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <X className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Partner List */}
          <div className="col-span-2 space-y-4">
            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  !statusFilter ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
              </button>
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    statusFilter === status ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {status} ({count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 outline-none"
                data-testid="partner-search"
              />
            </div>

            {/* Partner List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                </div>
              ) : partners.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No partners found</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {partners.map(partner => (
                    <div 
                      key={partner.id} 
                      className={`p-4 hover:bg-slate-700/30 transition cursor-pointer ${
                        selectedPartner?.id === partner.id ? 'bg-slate-700/50' : ''
                      }`}
                      onClick={() => loadPartnerDetail(partner.id)}
                      data-testid={`partner-row-${partner.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            <p className="text-sm text-slate-400">{partner.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(partner.status)}`}>
                            {partner.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {partner.userCount} users
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="w-4 h-4" /> {partner.referralCount} tenants
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" /> {partner.instanceCount} instances
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Partner Detail Panel */}
          <div className="col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden sticky top-6">
              {detailLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                </div>
              ) : selectedPartner ? (
                <div>
                  {/* Partner Header */}
                  <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedPartner.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedPartner.status)}`}>
                          {selectedPartner.status}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4">
                      {selectedPartner.status === 'PENDING' && (
                        <button
                          onClick={() => handlePartnerAction('approve', selectedPartner.id)}
                          disabled={actionLoading === selectedPartner.id}
                          className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                          data-testid="approve-partner-btn"
                        >
                          {actionLoading === selectedPartner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Approve
                        </button>
                      )}
                      {selectedPartner.status === 'ACTIVE' && (
                        <button
                          onClick={() => handlePartnerAction('suspend', selectedPartner.id)}
                          disabled={actionLoading === selectedPartner.id}
                          className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                          data-testid="suspend-partner-btn"
                        >
                          {actionLoading === selectedPartner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          Suspend
                        </button>
                      )}
                      {selectedPartner.status === 'SUSPENDED' && (
                        <button
                          onClick={() => handlePartnerAction('reinstate', selectedPartner.id)}
                          disabled={actionLoading === selectedPartner.id}
                          className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                          data-testid="reinstate-partner-btn"
                        >
                          {actionLoading === selectedPartner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Reinstate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-5 border-b border-slate-700 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-slate-500" />
                      {selectedPartner.email}
                    </div>
                    {selectedPartner.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500" />
                        {selectedPartner.phone}
                      </div>
                    )}
                    {selectedPartner.website && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Globe className="w-4 h-4 text-slate-500" />
                        {selectedPartner.website}
                      </div>
                    )}
                  </div>

                  {/* Revenue Summary */}
                  <div className="p-5 border-b border-slate-700">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      Revenue Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Total Earnings</p>
                        <p className="text-lg font-bold text-green-400">
                          {selectedPartner.revenueSummary.totalEarnings}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Paid Out</p>
                        <p className="text-lg font-bold">
                          ${selectedPartner.revenueSummary.totalPaidOut.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tenants */}
                  <div className="p-5 border-b border-slate-700">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-400" />
                      Tenants ({selectedPartner.tenants.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedPartner.tenants.slice(0, 5).map(tenant => (
                        <div key={tenant.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{tenant.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tenant.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {tenant.status}
                          </span>
                        </div>
                      ))}
                      {selectedPartner.tenants.length > 5 && (
                        <p className="text-xs text-slate-500">+{selectedPartner.tenants.length - 5} more</p>
                      )}
                    </div>
                  </div>

                  {/* Users */}
                  <div className="p-5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      Team ({selectedPartner.users.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedPartner.users.map(pu => (
                        <div key={pu.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{pu.user.email}</span>
                          <span className="text-xs text-slate-500">{pu.role.replace('PARTNER_', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a partner to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
