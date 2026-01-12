'use client'

/**
 * SUPER ADMIN - AUDIT INSPECTION
 * 
 * Read-only audit inspection utility for governance compliance.
 * No delete, no edit, no export from UI.
 * 
 * @phase Stop Point 4 - Audit & Governance Hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Activity, Search, Filter, ChevronDown, ChevronUp,
  AlertTriangle, Shield, Building2, Users, DollarSign, Clock,
  Eye, EyeOff, Info, Globe, Layers
} from 'lucide-react'
import {
  queryAuditEvents,
  getAuditStatistics,
  getMissingAuditWarnings,
  CanonicalAuditEvent,
  AuditStatistics,
  AuditActorType,
  AuditSurface,
  AuditSubjectType,
  AUDIT_ACTION_REGISTRY,
} from '@/lib/partner-governance'

export default function AuditInspectionPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CanonicalAuditEvent[]>([])
  const [stats, setStats] = useState<AuditStatistics | null>(null)
  const [warnings, setWarnings] = useState<{ action: string; timestamp: string; details: string }[]>([])
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  
  const [filters, setFilters] = useState({
    actorType: '' as AuditActorType | '',
    surface: '' as AuditSurface | '',
    subjectType: '' as AuditSubjectType | '',
    action: '',
    partnerId: '',
    fromDate: '',
    toDate: '',
    demoOnly: undefined as boolean | undefined,
  })

  // Phase 14B: Wrapped in useCallback - triggers on filters change
  const loadAuditData = useCallback(() => {
    const { events: auditEvents, total: totalCount } = queryAuditEvents({
      actorType: filters.actorType || undefined,
      surface: filters.surface || undefined,
      subjectType: filters.subjectType || undefined,
      action: filters.action || undefined,
      partnerId: filters.partnerId || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      demoOnly: filters.demoOnly,
      limit: 100,
    })
    setEvents(auditEvents)
    setTotal(totalCount)
    setStats(getAuditStatistics())
    setWarnings(getMissingAuditWarnings())
  }, [filters])

  useEffect(() => {
    loadAuditData()
  }, [loadAuditData])

  const getActorIcon = (actorType: AuditActorType) => {
    switch (actorType) {
      case 'super-admin': return Shield
      case 'partner-admin': return Building2
      case 'system': return Layers
      case 'demo-user': return Eye
      default: return Users
    }
  }

  const getSurfaceColor = (surface: AuditSurface) => {
    switch (surface) {
      case 'super-admin-control-plane': return 'bg-green-500/20 text-green-400'
      case 'partner-admin-portal': return 'bg-blue-500/20 text-blue-400'
      case 'domain-middleware': return 'bg-purple-500/20 text-purple-400'
      case 'pricing-engine': return 'bg-emerald-500/20 text-emerald-400'
      case 'trial-management': return 'bg-amber-500/20 text-amber-400'
      case 'demo-mode': return 'bg-cyan-500/20 text-cyan-400'
      case 'system': return 'bg-slate-500/20 text-slate-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const formatAction = (action: string): string => {
    return action
      .replace(/\./g, ' → ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const clearFilters = () => {
    setFilters({
      actorType: '',
      surface: '',
      subjectType: '',
      action: '',
      partnerId: '',
      fromDate: '',
      toDate: '',
      demoOnly: undefined,
    })
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/admin/partners/governance')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-governance"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Governance Control Plane
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Audit Inspection</h1>
              <p className="text-slate-400">Read-only governance event viewer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Disclaimer */}
        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-400">Inspection, Not Monitoring</h3>
              <p className="text-sm text-orange-200/80 mt-1">
                This is a <strong>read-only inspection tool</strong> for governance compliance review.
                Events cannot be modified, deleted, or exported from this interface.
                For official audit exports, use the <strong>/audit/export</strong> static bundle system.
              </p>
            </div>
          </div>
        </div>

        {/* Integrity Warnings */}
        {warnings.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400">
                  {warnings.length} Audit Integrity Warning{warnings.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-200/80 mt-1">
                  Some governed actions may be missing audit coverage.
                </p>
                <div className="mt-2 space-y-1">
                  {warnings.slice(0, 5).map((w, i) => (
                    <p key={i} className="text-xs text-red-300">
                      • {w.action}: {w.details}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Total Events</p>
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Last 24 Hours</p>
              <p className="text-2xl font-bold text-green-400">{stats.last24Hours}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Last 7 Days</p>
              <p className="text-2xl font-bold text-blue-400">{stats.last7Days}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Demo Events</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.demoEvents}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Capability-Gated</p>
              <p className="text-2xl font-bold text-amber-400">{stats.capabilityGatedEvents}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <select
              value={filters.actorType}
              onChange={(e) => setFilters(prev => ({ ...prev, actorType: e.target.value as any }))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">All Actor Types</option>
              <option value="super-admin">Super Admin</option>
              <option value="partner-admin">Partner Admin</option>
              <option value="system">System</option>
              <option value="demo-user">Demo User</option>
            </select>

            <select
              value={filters.surface}
              onChange={(e) => setFilters(prev => ({ ...prev, surface: e.target.value as any }))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">All Surfaces</option>
              <option value="super-admin-control-plane">Super Admin</option>
              <option value="partner-admin-portal">Partner Admin</option>
              <option value="domain-middleware">Domain Middleware</option>
              <option value="pricing-engine">Pricing Engine</option>
              <option value="trial-management">Trial Management</option>
              <option value="demo-mode">Demo Mode</option>
              <option value="system">System</option>
            </select>

            <select
              value={filters.subjectType}
              onChange={(e) => setFilters(prev => ({ ...prev, subjectType: e.target.value as any }))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">All Subject Types</option>
              <option value="partner">Partner</option>
              <option value="client">Client</option>
              <option value="pricing-model">Pricing Model</option>
              <option value="pricing-assignment">Pricing Assignment</option>
              <option value="trial">Trial</option>
              <option value="domain">Domain</option>
              <option value="capability">Capability</option>
            </select>

            <input
              type="text"
              value={filters.partnerId}
              onChange={(e) => setFilters(prev => ({ ...prev, partnerId: e.target.value }))}
              placeholder="Partner ID..."
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            />

            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            />

            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            />

            <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg">
              <input
                type="checkbox"
                checked={filters.demoOnly === true}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  demoOnly: e.target.checked ? true : undefined 
                }))}
                className="rounded"
              />
              <span className="text-sm text-slate-300">Demo Only</span>
            </label>

            <button
              onClick={loadAuditData}
              className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Showing {events.length} of {total} events
          </p>
        </div>

        {/* Event List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit events found</p>
              <p className="text-sm mt-1">Governed actions will appear here once recorded</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {events.map((event) => {
                const ActorIcon = getActorIcon(event.actorType)
                const isExpanded = expandedEvent === event.id

                return (
                  <div key={event.id}>
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                          <ActorIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{formatAction(event.action)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getSurfaceColor(event.metadata.surface)}`}>
                              {event.metadata.surface}
                            </span>
                            {event.governanceFlags.demoOnly && (
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                                DEMO
                              </span>
                            )}
                            {event.governanceFlags.capabilityGated && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                                GATED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {event.actorType}: {event.actorDisplay || event.actorId}
                            {event.partnerId && ` • Partner: ${event.partnerId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-slate-300">{new Date(event.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="bg-slate-900/50 rounded-lg p-4 space-y-4 text-sm">
                          {/* Core Info */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Subject</p>
                              <p className="text-slate-300">{event.subjectType}: {event.subjectId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Change Type</p>
                              <p className="text-slate-300 capitalize">{event.metadata.changeType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Domain</p>
                              <p className="text-slate-300">{event.domain || '—'}</p>
                            </div>
                          </div>

                          {/* Governance Flags */}
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Governance Flags</p>
                            <div className="flex gap-2">
                              {(Object.entries(event.governanceFlags) as [string, boolean][]).map(([flag, value]) => (
                                <span
                                  key={flag}
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    value ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
                                  }`}
                                >
                                  {flag}: {value ? '✓' : '✗'}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Metadata */}
                          {(event.metadata.previousValue !== undefined || event.metadata.newValue !== undefined) && (
                            <div className="grid grid-cols-2 gap-4">
                              {event.metadata.previousValue !== undefined && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Previous Value</p>
                                  <pre className="bg-slate-800 rounded p-2 text-xs text-slate-300 overflow-x-auto">
                                    {JSON.stringify(event.metadata.previousValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {event.metadata.newValue !== undefined && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">New Value</p>
                                  <pre className="bg-slate-800 rounded p-2 text-xs text-slate-300 overflow-x-auto">
                                    {JSON.stringify(event.metadata.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reason */}
                          {event.metadata.reason && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Reason</p>
                              <p className="text-slate-300">{event.metadata.reason}</p>
                            </div>
                          )}

                          {/* Event ID */}
                          <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-500">
                            Event ID: <code className="text-slate-400">{event.id}</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Surface Distribution */}
        {stats && Object.keys(stats.bySurface).length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4">Events by Surface</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(stats.bySurface).map(([surface, count]) => (
                <div key={surface} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <span className="text-sm text-slate-300 capitalize">{surface.replace(/-/g, ' ')}</span>
                  <span className="text-sm font-medium text-green-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
