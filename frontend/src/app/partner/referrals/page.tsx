'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Users, Building2, LogOut, ChevronRight, Loader2, AlertTriangle, 
  Activity, Wallet, Search, Filter, ArrowUpDown, Calendar,
  ExternalLink, Clock, CheckCircle, XCircle, AlertCircle,
  BarChart3, HandCoins, ChevronLeft
} from 'lucide-react'

interface ReferredTenant {
  referralId: string
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantStatus: string
  referredAt: string
  attributionMethod: string
  isLifetime: boolean
  attributionExpiresAt: string | null
  totalRevenue: number
  lastPaymentDate: string | null
}

interface User {
  id: string
  email: string
  name: string | null
}

function ReferralsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<ReferredTenant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '')
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'referredAt')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  useEffect(() => {
    if (partnerId) {
      fetchReferrals()
    }
  }, [partnerId, statusFilter, sortBy, sortOrder, offset])

  async function checkAuthAndFetchData() {
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated) {
        router.push('/login')
        return
      }
      
      setUser(sessionData.user)
      
      const partnerRes = await fetch('/api/partners/me')
      const partnerData = await partnerRes.json()
      
      if (!partnerData.success || !partnerData.partnerId) {
        setError('You are not associated with a partner organization')
        setLoading(false)
        return
      }
      
      setPartnerId(partnerData.partnerId)
    } catch (err) {
      setError('Failed to load data')
      setLoading(false)
    }
  }

  async function fetchReferrals() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())
      
      const res = await fetch(`/api/partners/${partnerId}/dashboard/referrals?${params}`)
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setReferrals(data.tenants || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      setError('Failed to load referrals')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'PENDING': case 'PENDING_ACTIVATION': return <AlertCircle className="w-4 h-4 text-amber-400" />
      case 'SUSPENDED': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'PENDING': case 'PENDING_ACTIVATION': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'SUSPENDED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold">Partner Portal</h1>
              <p className="text-xs text-slate-400">Referrals</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/partner' },
              { icon: Users, label: 'Referrals', href: '/partner/referrals', active: true },
              { icon: Wallet, label: 'Earnings', href: '/partner/earnings' },
              { icon: Activity, label: 'Audit Log', href: '/partner/audit' },
            ].map((item, i) => (
              <li key={i}>
                <a
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    item.active 
                      ? 'bg-green-600/20 text-green-400' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
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
              <a href="/partner" className="hover:text-white transition">Dashboard</a>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Referrals</span>
            </div>
            <h1 className="text-3xl font-bold">Referrals</h1>
            <p className="text-slate-400 mt-1">
              View and track all your referred tenants
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-slate-400 text-sm">Total Referrals</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_ACTIVATION">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Churned</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="referredAt">Date Referred</option>
              <option value="revenue">Revenue</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Referrals Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
            <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No referrals found</h3>
            <p className="text-slate-400">
              {statusFilter ? 'Try adjusting your filters' : 'Start referring tenants to see them here'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Tenant</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Referred</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Attribution</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.referralId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
                            {referral.tenantName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{referral.tenantName}</p>
                            <p className="text-sm text-slate-500">{referral.tenantSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(referral.tenantStatus)}`}>
                          {getStatusIcon(referral.tenantStatus)}
                          {referral.tenantStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{formatDate(referral.referredAt)}</p>
                        <p className="text-xs text-slate-500">{referral.attributionMethod.replace('_', ' ')}</p>
                      </td>
                      <td className="px-6 py-4">
                        {referral.isLifetime ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                            Lifetime
                          </span>
                        ) : referral.attributionExpiresAt ? (
                          <span className="text-xs text-slate-400">
                            Expires {formatDate(referral.attributionExpiresAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-emerald-400">
                          {formatCurrency(referral.totalRevenue)}
                        </p>
                        {referral.lastPaymentDate && (
                          <p className="text-xs text-slate-500">
                            Last: {formatDate(referral.lastPaymentDate)}
                          </p>
                        )}
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
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} referrals
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
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    }>
      <ReferralsContent />
    </Suspense>
  )
}
