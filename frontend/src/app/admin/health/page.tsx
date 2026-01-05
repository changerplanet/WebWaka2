'use client'

/**
 * PLATFORM HEALTH DASHBOARD
 * 
 * Super Admin operational visibility into platform health.
 * Read-only dashboard showing system status, metrics, and health checks.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Activity, Server, Database, Shield, Users, Building2, Store, 
  ArrowLeft, Loader2, RefreshCw, CheckCircle, AlertTriangle, 
  XCircle, Clock, Zap, MessageSquare, Globe
} from 'lucide-react'

interface HealthData {
  health: {
    status: 'healthy' | 'degraded' | 'down'
    timestamp: string
    uptime: number
    checks: Record<string, 'healthy' | 'degraded' | 'down'>
  }
  stats: {
    users: number
    tenants: number
    partners: number
    instances: number
    activeSessions: number
    loginsLast24h: number
    auditLogsLastHour: number
  }
  distributions: {
    tenantStatus: Record<string, number>
    partnerStatus: Record<string, number>
  }
  otpMetrics: {
    totalLast24h: number
    verified: number
    expired: number
    failed: number
    successRate: string
  }
  backgroundJobs: {
    pendingJobs: number
    processingJobs: number
    failedJobsLast24h: number
    status: string
  }
}

export default function PlatformHealthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<HealthData | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    loadHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadHealth() {
    try {
      const res = await fetch('/api/admin/health')
      const result = await res.json()

      if (result.success) {
        setData(result)
        setLastRefresh(new Date())
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-amber-400" />
      case 'down': return <XCircle className="w-5 h-5 text-red-400" />
      default: return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'degraded': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'down': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
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
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Platform Health</h1>
                <p className="text-slate-400">System status and operational metrics</p>
              </div>
            </div>
            <button
              onClick={loadHealth}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              data-testid="refresh-health"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Overall Status Banner */}
          <div className={`rounded-xl border p-6 ${getStatusColor(data.health.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(data.health.status)}
                <div>
                  <h2 className="text-xl font-bold capitalize">
                    System {data.health.status}
                  </h2>
                  <p className="text-sm opacity-75">
                    Uptime: {formatUptime(data.health.uptime)}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm opacity-75">
                <p>Last checked: {new Date(data.health.timestamp).toLocaleTimeString()}</p>
                {lastRefresh && <p>Refreshed: {lastRefresh.toLocaleTimeString()}</p>}
              </div>
            </div>
          </div>

          {/* Health Checks Grid */}
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(data.health.checks).map(([name, status]) => (
              <div key={name} className={`rounded-xl border p-4 ${getStatusColor(status)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(status)}
                  <span className="font-medium capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <p className="text-sm opacity-75 capitalize">{status}</p>
              </div>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.users.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Total Users</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.tenants.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Total Tenants</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.partners.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Partners</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.stats.instances.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Instances</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Session & Activity */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Activity
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Sessions</span>
                  <span className="font-bold text-green-400">{data.stats.activeSessions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Logins (24h)</span>
                  <span className="font-bold">{data.stats.loginsLast24h.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Audit Logs (1h)</span>
                  <span className="font-bold">{data.stats.auditLogsLastHour.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* OTP Metrics */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                OTP Service (24h)
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Sent</span>
                  <span className="font-bold">{data.otpMetrics.totalLast24h.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verified</span>
                  <span className="font-bold text-green-400">{data.otpMetrics.verified.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Success Rate</span>
                  <span className={`font-bold ${
                    data.otpMetrics.successRate !== 'N/A' && parseFloat(data.otpMetrics.successRate) > 80 
                      ? 'text-green-400' 
                      : 'text-amber-400'
                  }`}>
                    {data.otpMetrics.successRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Background Jobs */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                Background Jobs
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pending</span>
                  <span className="font-bold">{data.backgroundJobs.pendingJobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Processing</span>
                  <span className="font-bold text-blue-400">{data.backgroundJobs.processingJobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Failed (24h)</span>
                  <span className={`font-bold ${data.backgroundJobs.failedJobsLast24h > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.backgroundJobs.failedJobsLast24h}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Distributions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4">Tenant Status Distribution</h3>
              <div className="space-y-2">
                {Object.entries(data.distributions.tenantStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'ACTIVE' ? 'bg-green-400' :
                      status === 'SUSPENDED' ? 'bg-amber-400' :
                      status === 'PENDING_ACTIVATION' ? 'bg-blue-400' : 'bg-slate-400'
                    }`} />
                    <span className="text-slate-300 flex-1">{status}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
              <h3 className="font-semibold mb-4">Partner Status Distribution</h3>
              <div className="space-y-2">
                {Object.entries(data.distributions.partnerStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'ACTIVE' ? 'bg-green-400' :
                      status === 'PENDING' ? 'bg-amber-400' :
                      status === 'SUSPENDED' ? 'bg-red-400' : 'bg-slate-400'
                    }`} />
                    <span className="text-slate-300 flex-1">{status}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
