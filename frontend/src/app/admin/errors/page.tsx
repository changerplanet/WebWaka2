'use client'

/**
 * ERROR LOG VIEWER
 * 
 * Super Admin diagnostic tool for viewing aggregated platform errors.
 * Read-only with PII masking and no raw stack traces.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  AlertTriangle, XCircle, AlertCircle, Info, ArrowLeft, Loader2,
  RefreshCw, Filter, Clock, Server, Shield, CreditCard, Users,
  ChevronDown, Search
} from 'lucide-react'

interface ErrorLog {
  id: string
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  service: string
  message: string
  count: number
  tenantId?: string
  tenantName?: string
  instanceId?: string
  instanceName?: string
  lastOccurrence: string
  resolved: boolean
}

interface ErrorData {
  logs: ErrorLog[]
  summary: {
    total: number
    bySeverity: Record<string, number>
    byService: Record<string, number>
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timeRange: string
  services: string[]
}

export default function ErrorLogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ErrorData | null>(null)
  
  // Filters
  const [timeRange, setTimeRange] = useState('24h')
  const [severityFilter, setSeverityFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')

  const loadErrors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('timeRange', timeRange)
      if (severityFilter) params.set('severity', severityFilter)
      if (serviceFilter) params.set('service', serviceFilter)

      const res = await fetch(`/api/admin/errors?${params}`)
      const result = await res.json()

      if (result.success) {
        setData(result)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load error logs')
    } finally {
      setLoading(false)
    }
  }, [timeRange, severityFilter, serviceFilter])

  useEffect(() => {
    loadErrors()
  }, [loadErrors])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="w-5 h-5 text-red-400" />
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-400" />
      case 'MEDIUM': return <AlertCircle className="w-5 h-5 text-amber-400" />
      case 'LOW': return <Info className="w-5 h-5 text-blue-400" />
      default: return <Info className="w-5 h-5 text-slate-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'Authentication': return <Shield className="w-4 h-4" />
      case 'Billing': return <CreditCard className="w-4 h-4" />
      case 'Tenant Management': return <Users className="w-4 h-4" />
      case 'Partner Management': return <Users className="w-4 h-4" />
      case 'API': return <Server className="w-4 h-4" />
      default: return <Server className="w-4 h-4" />
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Error Logs</h1>
                <p className="text-slate-400">Platform diagnostics and issue tracking</p>
              </div>
            </div>
            <button
              onClick={loadErrors}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition disabled:opacity-50"
              data-testid="refresh-errors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-200">
            {error}
          </div>
        </div>
      )}

      {data && (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <p className="text-3xl font-bold">{data.summary.total}</p>
              <p className="text-sm text-slate-400">Total Issues</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${getSeverityColor('CRITICAL')}`}>
              <p className="text-3xl font-bold">{data.summary.bySeverity.CRITICAL || 0}</p>
              <p className="text-sm opacity-75">Critical</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${getSeverityColor('HIGH')}`}>
              <p className="text-3xl font-bold">{data.summary.bySeverity.HIGH || 0}</p>
              <p className="text-sm opacity-75">High</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${getSeverityColor('MEDIUM')}`}>
              <p className="text-3xl font-bold">{data.summary.bySeverity.MEDIUM || 0}</p>
              <p className="text-sm opacity-75">Medium</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${getSeverityColor('LOW')}`}>
              <p className="text-3xl font-bold">{data.summary.bySeverity.LOW || 0}</p>
              <p className="text-sm opacity-75">Low</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                data-testid="time-range-filter"
              >
                <option value="1h">Last 1 hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                data-testid="severity-filter"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                data-testid="service-filter"
              >
                <option value="">All Services</option>
                {data.services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {data.logs.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <p className="text-lg font-medium text-green-400">No Issues Found</p>
                <p className="text-slate-400">The platform is running smoothly</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {data.logs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-700/30 transition">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getSeverityColor(log.severity)}`}>
                        {getSeverityIcon(log.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 flex items-center gap-1">
                            {getServiceIcon(log.service)}
                            {log.service}
                          </span>
                          {log.count > 1 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                              ×{log.count} occurrences
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-white mb-1">{log.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last: {new Date(log.lastOccurrence).toLocaleString()}
                          </span>
                          {log.tenantName && (
                            <span>Tenant: {log.tenantName}</span>
                          )}
                          {log.instanceName && (
                            <span>Instance: {log.instanceName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Distribution */}
          {Object.keys(data.summary.byService).length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4">Issues by Service</h3>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(data.summary.byService).map(([service, count]) => (
                  <div key={service} className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-2 text-slate-400">
                      {getServiceIcon(service)}
                    </div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-slate-400">{service}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
