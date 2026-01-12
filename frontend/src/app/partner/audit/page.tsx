'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, LogOut, ChevronRight, Loader2, AlertTriangle, 
  Activity, Wallet, Clock, Calendar, Filter,
  BarChart3, HandCoins, ChevronLeft, FileText,
  DollarSign, Building2, FileCheck, Shield
} from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  actorId: string
  actorEmail: string
  tenantId: string | null
  targetType: string | null
  targetId: string | null
  metadata: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface ActivityReport {
  partner: { id: string; name: string } | null
  period: { start: string; end: string }
  summary: {
    totalActions: number
    earningsCreated: number
    earningsPaid: number
    payoutBatches: number
    referralsAdded: number
  }
  timeline: AuditEntry[]
}

interface User {
  id: string
  email: string
  name: string | null
}

export default function AuditPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [report, setReport] = useState<ActivityReport | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list')
  const [offset, setOffset] = useState(0)
  const limit = 25

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())
      
      const res = await fetch(`/api/partners/${partnerId}/audit?${params}`)
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setEntries(data.entries || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [partnerId, offset])

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchActivityReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/partners/${partnerId}/audit?report=activity`)
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setReport(data)
      }
    } catch (err) {
      setError('Failed to load activity report')
    } finally {
      setLoading(false)
    }
  }, [partnerId])

  // Phase 12B: Wrapped in useCallback for hook hygiene
  const checkAuthAndFetchData = useCallback(async () => {
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
  }, [router])

  useEffect(() => {
    checkAuthAndFetchData()
  }, [checkAuthAndFetchData])

  useEffect(() => {
    if (partnerId) {
      if (viewMode === 'list') {
        fetchAuditLogs()
      } else {
        fetchActivityReport()
      }
    }
  }, [partnerId, viewMode, offset, fetchAuditLogs, fetchActivityReport])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionIcon = (action: string) => {
    if (action.includes('EARNING')) return <DollarSign className="w-4 h-4" />
    if (action.includes('REFERRAL') || action.includes('ATTRIBUTION')) return <Users className="w-4 h-4" />
    if (action.includes('PAYOUT')) return <Wallet className="w-4 h-4" />
    if (action.includes('AGREEMENT')) return <FileCheck className="w-4 h-4" />
    if (action.includes('PARTNER')) return <Building2 className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('ADDED')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (action.includes('PAID') || action.includes('APPROVED')) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (action.includes('LOCKED')) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (action.includes('REVERSED') || action.includes('CANCELLED') || action.includes('BLOCKED')) return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
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
              <p className="text-xs text-slate-400">Audit Log</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {[
              { icon: BarChart3, label: 'Dashboard', href: '/partner' },
              { icon: Users, label: 'Referrals', href: '/partner/referrals' },
              { icon: Wallet, label: 'Earnings', href: '/partner/earnings' },
              { icon: Activity, label: 'Audit Log', href: '/partner/audit', active: true },
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
              <span className="text-white">Audit Log</span>
            </div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-slate-400 mt-1">
              Track all partner-related activities and changes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => { setViewMode('list'); setOffset(0) }}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  viewMode === 'list' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('report')}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  viewMode === 'report' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Report
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        ) : viewMode === 'report' && report ? (
          /* Activity Report View */
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold">{report.summary.totalActions}</p>
                <p className="text-sm text-slate-400">Total Actions</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-emerald-400">{report.summary.earningsCreated}</p>
                <p className="text-sm text-slate-400">Earnings Created</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-green-400">{report.summary.earningsPaid}</p>
                <p className="text-sm text-slate-400">Earnings Paid</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-green-400">{report.summary.payoutBatches}</p>
                <p className="text-sm text-slate-400">Payout Batches</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-amber-400">{report.summary.referralsAdded}</p>
                <p className="text-sm text-slate-400">New Referrals</p>
              </div>
            </div>

            {/* Period Info */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                Report Period: {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h2 className="font-semibold">Activity Timeline</h2>
              </div>
              {report.timeline.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity in this period</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {report.timeline.map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-slate-700/30 transition">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getActionColor(entry.action)}`}>
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{formatActionName(entry.action)}</p>
                          <p className="text-sm text-slate-400">{entry.actorEmail}</p>
                          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-slate-500 bg-slate-700/30 p-2 rounded-lg">
                              {Object.entries(entry.metadata).slice(0, 3).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: <span className="text-slate-400">{String(value)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(entry.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* List View */
          <>
            {entries.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                <Shield className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No audit logs found</h3>
                <p className="text-slate-400">Activity will appear here as you use the platform</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Action</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Actor</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Target</th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Details</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getActionColor(entry.action)}`}>
                                {getActionIcon(entry.action)}
                              </div>
                              <span className="text-sm font-medium">{formatActionName(entry.action)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm">{entry.actorEmail}</p>
                          </td>
                          <td className="px-6 py-4">
                            {entry.targetType ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                                {entry.targetType}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                              <div className="text-xs text-slate-500">
                                {Object.entries(entry.metadata).slice(0, 2).map(([key, value]) => (
                                  <div key={key}>
                                    {key}: <span className="text-slate-400">{String(value).slice(0, 30)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-slate-400">{formatDate(entry.createdAt)}</p>
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
                      Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} entries
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
          </>
        )}

        {/* Compliance Notice */}
        <div className="mt-8 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-500 mt-0.5" />
            <div className="text-sm text-slate-500">
              <p className="font-medium text-slate-400">Audit Log Retention</p>
              <p>Partner audit logs are retained for 7 years for compliance purposes. All entries are immutable and cannot be modified or deleted.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
