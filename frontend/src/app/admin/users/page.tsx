'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, Users, Shield, Settings, LogOut, Search, 
  ChevronRight, Check, X, Loader2, AlertTriangle,
  Activity, RefreshCw, Eye, Mail, Calendar, Clock,
  UserCog, Crown, HandCoins, ChevronLeft
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  globalRole: 'USER' | 'SUPER_ADMIN'
  createdAt: string
  lastLoginAt: string | null
  activeSessions: number
  memberships: {
    id: string
    tenantId: string
    tenantName: string
    tenantSlug: string
    tenantStatus: string
    role: string
    createdAt: string
  }[]
  partnerMembership: {
    partnerId: string
    partnerName: string
    partnerSlug: string
    role: string
    isActive: boolean
  } | null
}

interface Stats {
  totalUsers: number
  superAdmins: number
  usersWithTenants: number
  usersWithPartners: number
}

interface CurrentUser {
  id: string
  email: string
  name: string | null
  globalRole: string
}

export default function AllUsersPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 25
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      
      setCurrentUser(data.user)
    } catch (err) {
      router.push('/login')
    }
  }, [router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (roleFilter) params.set('role', roleFilter)
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())
      
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.users)
        setTotal(data.total)
        setStats(data.stats)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: 'USER' | 'SUPER_ADMIN') {
    if (userId === currentUser?.id && newRole === 'USER') {
      alert('Cannot demote yourself')
      return
    }
    
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalRole: newRole })
      })
      
      const data = await res.json()
      if (data.success) {
        fetchUsers()
        setSelectedUser(null)
      } else {
        alert(data.error || 'Failed to update user')
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40">
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
        
        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { icon: Building2, label: 'Tenants', href: '/admin' },
              { icon: Users, label: 'All Users', href: '/admin/users', active: true },
              { icon: Activity, label: 'Audit Logs', href: '/admin/audit-logs' },
              { icon: Settings, label: 'Settings', disabled: true },
            ].map((item, i) => (
              <li key={i}>
                <button
                  onClick={() => item.href && router.push(item.href)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    item.active 
                      ? 'bg-green-600/20 text-green-400' 
                      : item.disabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name || currentUser.email}</p>
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
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <a href="/admin" className="hover:text-white transition">Admin</a>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">All Users</span>
            </div>
            <h1 className="text-3xl font-bold">All Users</h1>
            <p className="text-slate-400 mt-1">Manage platform users across all tenants</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500/20 text-green-400' },
              { label: 'Super Admins', value: stats.superAdmins, icon: Crown, color: 'bg-amber-500/20 text-amber-400' },
              { label: 'In Tenants', value: stats.usersWithTenants, icon: Building2, color: 'bg-emerald-500/20 text-emerald-400' },
              { label: 'Partners', value: stats.usersWithPartners, icon: HandCoins, color: 'bg-green-500/20 text-green-400' },
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
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setOffset(0) }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="USER">User</option>
          </select>
          <button
            onClick={() => { setOffset(0); fetchUsers() }}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
            <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Tenants</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Partner</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Last Login</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.email.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || 'Unnamed'}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.globalRole === 'SUPER_ADMIN' 
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {user.globalRole === 'SUPER_ADMIN' && <Crown className="w-3 h-3" />}
                          {user.globalRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.memberships.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.memberships.slice(0, 2).map((m, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                {m.tenantSlug}
                              </span>
                            ))}
                            {user.memberships.length > 2 && (
                              <span className="text-xs px-2 py-0.5 bg-slate-500/20 text-slate-400 rounded-full">
                                +{user.memberships.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.partnerMembership ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.partnerMembership.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {user.partnerMembership.partnerSlug}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(user.lastLoginAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.globalRole === 'USER' ? (
                            <button
                              onClick={() => handleRoleChange(user.id, 'SUPER_ADMIN')}
                              disabled={actionLoading === user.id}
                              className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition"
                              title="Promote to Super Admin"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Crown className="w-4 h-4" />
                              )}
                            </button>
                          ) : user.id !== currentUser?.id ? (
                            <button
                              onClick={() => handleRoleChange(user.id, 'USER')}
                              disabled={actionLoading === user.id}
                              className="p-2 hover:bg-slate-500/20 text-slate-400 rounded-lg transition"
                              title="Demote to User"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserCog className="w-4 h-4" />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-400">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-xl font-bold">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedUser.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedUser.name || 'Unnamed User'}</h2>
                    <p className="text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-700 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Global Role</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.globalRole === 'SUPER_ADMIN' 
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {selectedUser.globalRole === 'SUPER_ADMIN' && <Crown className="w-3 h-3" />}
                      {selectedUser.globalRole}
                    </span>
                    {selectedUser.id !== currentUser?.id && (
                      <button
                        onClick={() => handleRoleChange(
                          selectedUser.id, 
                          selectedUser.globalRole === 'SUPER_ADMIN' ? 'USER' : 'SUPER_ADMIN'
                        )}
                        disabled={actionLoading === selectedUser.id}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        {actionLoading === selectedUser.id ? 'Updating...' : 'Change'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Active Sessions</p>
                  <p className="font-semibold">{selectedUser.activeSessions}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Registered</p>
                  <p className="font-semibold">{formatDateTime(selectedUser.createdAt)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-1">Last Login</p>
                  <p className="font-semibold">{formatDateTime(selectedUser.lastLoginAt)}</p>
                </div>
              </div>

              {/* Tenant Memberships */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-400" />
                  Tenant Memberships ({selectedUser.memberships.length})
                </h3>
                {selectedUser.memberships.length === 0 ? (
                  <p className="text-slate-500 text-sm">No tenant memberships</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.memberships.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3">
                        <div>
                          <p className="font-medium">{m.tenantName}</p>
                          <p className="text-sm text-slate-400">{m.tenantSlug}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            m.role === 'TENANT_ADMIN' 
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {m.role}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            Since {formatDate(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Partner Membership */}
              {selectedUser.partnerMembership && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <HandCoins className="w-5 h-5 text-green-400" />
                    Partner Membership
                  </h3>
                  <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3">
                    <div>
                      <p className="font-medium">{selectedUser.partnerMembership.partnerName}</p>
                      <p className="text-sm text-slate-400">{selectedUser.partnerMembership.partnerSlug}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedUser.partnerMembership.isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedUser.partnerMembership.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedUser.partnerMembership.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full px-4 py-3 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
