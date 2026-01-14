'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Building2, Users, Globe, Shield, Settings, LogOut, Plus, Search, 
  MoreVertical, ChevronRight, Check, X, Loader2, AlertTriangle,
  Activity, RefreshCw, Eye, Trash2, UserPlus, Clock, Package,
  UserCog, DollarSign, Server
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  appName: string
  primaryColor: string
  secondaryColor: string
  createdAt: string
  domains: { id: string; domain: string; type: string; status: string }[]
  _count: { memberships: number }
}

interface User {
  id: string
  email: string
  name: string | null
  globalRole: string
  memberships: { tenantId: string; tenantSlug: string; role: string }[]
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Initialize from URL params for state persistence
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')

  // Update URL when filters change (for state persistence on back-navigation)
  const updateUrlParams = useCallback((search: string, status: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const newUrl = params.toString() ? `/admin?${params.toString()}` : '/admin'
    router.replace(newUrl, { scroll: false })
  }, [router])

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.authenticated) {
        router.push('/login')
        return
      }
      
      if (data.user.globalRole !== 'SUPER_ADMIN') {
        router.push('/')
        return
      }
      
      setUser(data.user)
    } catch (err) {
      router.push('/login')
    }
  }, [router])

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      
      // Update URL for state persistence
      updateUrlParams(searchQuery, statusFilter)
      
      const res = await fetch(`/api/admin/tenants?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setTenants(data.tenants)
      } else {
        setError(data.error || 'Failed to fetch tenants')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, updateUrlParams])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Fetch tenants when searchQuery or statusFilter changes (with debounce effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchTenants])

  async function handleStatusChange(tenantId: string, newStatus: string) {
    setActionLoading(tenantId)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await res.json()
      if (data.success) {
        fetchTenants()
      } else {
        alert(data.error || 'Failed to update tenant')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    suspended: tenants.filter(t => t.status === 'SUSPENDED').length,
    totalMembers: tenants.reduce((acc, t) => acc + t._count.memberships, 0)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold">Super Admin</h1>
              <p className="text-xs text-slate-400">Platform Control</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-6">
          {/* Core Management */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-4">Management</p>
            <ul className="space-y-1">
              {[
                { icon: Building2, label: 'Tenants', active: true, href: '/admin' },
                { icon: Users, label: 'All Users', href: '/admin/users' },
                { icon: Building2, label: 'Partners', href: '/admin/partners' },
                { icon: Package, label: 'Capabilities', href: '/admin/capabilities' },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => item.href && router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                      item.active 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Governance */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-4">Governance</p>
            <ul className="space-y-1">
              {[
                { icon: UserCog, label: 'Impersonation', href: '/admin/impersonation', color: 'text-amber-400' },
                { icon: Server, label: 'Platform Health', href: '/admin/health', color: 'text-blue-400' },
                { icon: DollarSign, label: 'Financials', href: '/admin/financials', color: 'text-emerald-400' },
                { icon: AlertTriangle, label: 'Error Logs', href: '/admin/errors', color: 'text-red-400' },
                { icon: Activity, label: 'Audit Logs', href: '/admin/audit-logs' },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => item.href && router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition text-slate-400 hover:bg-slate-700/50 hover:text-white`}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color || ''}`} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tenants</h1>
            <p className="text-slate-400 mt-1">Manage all platform tenants</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition"
          >
            <Plus className="w-5 h-5" />
            Create Tenant
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Tenants', value: stats.total, icon: Building2, color: 'bg-green-500/20 text-green-400' },
            { label: 'Active', value: stats.active, icon: Check, color: 'bg-green-500/20 text-green-400' },
            { label: 'Suspended', value: stats.suspended, icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400' },
            { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'bg-green-500/20 text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              data-testid="tenant-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
            data-testid="tenant-status-filter"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
          <button
            onClick={() => fetchTenants()}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition"
            data-testid="refresh-tenants"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
            <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tenants found</h3>
            <p className="text-slate-400 mb-6">Create your first tenant to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl transition"
            >
              <Plus className="w-5 h-5" />
              Create Tenant
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Tenant</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Domains</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Members</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Created</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: tenant.primaryColor }}
                        >
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{tenant.appName}</p>
                          <p className="text-sm text-slate-400">{tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'ACTIVE' 
                          ? 'bg-green-500/20 text-green-400'
                          : tenant.status === 'SUSPENDED'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tenant.status === 'ACTIVE' && <Check className="w-3 h-3" />}
                        {tenant.status === 'SUSPENDED' && <AlertTriangle className="w-3 h-3" />}
                        {tenant.status === 'DEACTIVATED' && <X className="w-3 h-3" />}
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{tenant.domains?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{tenant._count.memberships}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {tenant.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(tenant.id, 'SUSPENDED')}
                            disabled={actionLoading === tenant.id}
                            className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition"
                            title="Suspend Tenant"
                          >
                            {actionLoading === tenant.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </button>
                        ) : tenant.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleStatusChange(tenant.id, 'ACTIVE')}
                            disabled={actionLoading === tenant.id}
                            className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition"
                            title="Activate Tenant"
                          >
                            {actionLoading === tenant.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchTenants() }}
        />
      )}
    </div>
  )
}

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    appName: '',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    adminEmail: ''
  })

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm(prev => ({ ...prev, name, slug, appName: name || prev.appName }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (data.success) {
        onCreated()
      } else {
        setError(data.error || 'Failed to create tenant')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create New Tenant</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Organization Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subdomain *</label>
            <div className="flex">
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-l-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="acme"
              />
              <span className="px-4 py-3 bg-slate-700 border border-l-0 border-slate-700 rounded-r-xl text-slate-400">.webwaka.com</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">App Name</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => setForm(prev => ({ ...prev, appName: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Acme App"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => setForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={(e) => setForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Initial Admin Email (Optional)</label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm(prev => ({ ...prev, adminEmail: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="you@example.com"
            />
            <p className="text-xs text-slate-500 mt-1">This user will be created as Tenant Admin</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
