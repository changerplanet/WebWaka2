'use client'

/**
 * SUPER ADMIN - GOVERNANCE AUDIT LOG
 * 
 * View audit trail for all partner governance actions.
 * Append-only, immutable records.
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Activity, Filter, Search, RefreshCw,
  ChevronDown, ChevronUp, User, Building2, DollarSign,
  Settings, Clock, Info
} from 'lucide-react'
import {
  getGovernanceAuditEvents,
  getGovernanceAuditStats,
  PartnerGovernanceAuditEvent,
  PartnerGovernanceAction,
} from '@/lib/partner-governance'

export default function GovernanceAuditPage() {
  const router = useRouter()
  const [events, setEvents] = useState<PartnerGovernanceAuditEvent[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getGovernanceAuditStats> | null>(null)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    action: '' as PartnerGovernanceAction | '',
    fromDate: '',
    toDate: '',
  })

  useEffect(() => {
    loadAuditData()
  }, [filters])

  function loadAuditData() {
    const { events: auditEvents } = getGovernanceAuditEvents({
      action: filters.action || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      limit: 100,
    })
    setEvents(auditEvents)
    setStats(getGovernanceAuditStats())
  }

  const getActionIcon = (action: PartnerGovernanceAction) => {
    if (action.startsWith('partner.')) return Building2
    if (action.startsWith('pricing-model.') || action.startsWith('pricing.')) return DollarSign
    return Settings
  }

  const getActionColor = (action: PartnerGovernanceAction) => {
    if (action.includes('created')) return 'bg-green-500/20 text-green-400'
    if (action.includes('updated') || action.includes('assigned')) return 'bg-blue-500/20 text-blue-400'
    if (action.includes('activated')) return 'bg-emerald-500/20 text-emerald-400'
    if (action.includes('deactivated') || action.includes('revoked')) return 'bg-red-500/20 text-red-400'
    if (action.includes('emitted')) return 'bg-purple-500/20 text-purple-400'
    return 'bg-slate-500/20 text-slate-400'
  }

  const formatAction = (action: PartnerGovernanceAction): string => {
    return action
      .replace(/\./g, ' → ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const allActions: PartnerGovernanceAction[] = [
    'partner.type.assigned',
    'partner.category.assigned',
    'partner.capabilities.updated',
    'pricing-model.created',
    'pricing-model.updated',
    'pricing-model.activated',
    'pricing-model.deactivated',
    'pricing.assigned',
    'pricing.discount.applied',
    'pricing.assignment.revoked',
    'pricing.fact.emitted',
  ]

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
            Back to Governance
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Governance Audit Log</h1>
              <p className="text-slate-400">Immutable record of all governance actions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Notice */}
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Append-Only Audit Log</h3>
              <p className="text-sm text-red-200/80 mt-1">
                All governance actions are recorded immutably. Records cannot be modified or deleted.
                This ensures full compliance and traceability for regulatory purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
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
              <p className="text-sm text-slate-400">Action Types</p>
              <p className="text-2xl font-bold">{Object.keys(stats.byAction).length}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filters.action}
            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value as any }))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="">All Actions</option>
            {allActions.map(action => (
              <option key={action} value={action}>{formatAction(action)}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="From Date"
          />
          
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="To Date"
          />
          
          <button
            onClick={loadAuditData}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Audit Events List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit events found</p>
              <p className="text-sm mt-1">Governance actions will appear here once recorded</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {events.map((event) => {
                const ActionIcon = getActionIcon(event.action)
                const isExpanded = expandedEvent === event.id
                
                return (
                  <div key={event.id}>
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(event.action)}`}>
                          <ActionIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${getActionColor(event.action)}`}>
                              {formatAction(event.action)}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">{event.changeType}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            by <span className="text-white">{event.actorEmail}</span>
                            <span className="text-slate-500"> ({event.actorType})</span>
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
                        <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
                          {/* Scope */}
                          {Object.entries(event.scope).filter(([, v]) => v).length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-slate-500 mb-2">Scope</h5>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(event.scope)
                                  .filter(([, v]) => v)
                                  .map(([key, value]) => (
                                    <span key={key} className="px-2 py-1 bg-slate-800 rounded text-xs">
                                      <span className="text-slate-500">{key}:</span>{' '}
                                      <code className="text-slate-300">{value}</code>
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Previous Value */}
                          {event.previousValue !== undefined && (
                            <div>
                              <h5 className="text-xs font-medium text-slate-500 mb-2">Previous Value</h5>
                              <pre className="bg-slate-800 rounded p-2 text-xs text-slate-300 overflow-x-auto">
                                {JSON.stringify(event.previousValue, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* New Value */}
                          {event.newValue !== undefined && (
                            <div>
                              <h5 className="text-xs font-medium text-slate-500 mb-2">New Value</h5>
                              <pre className="bg-slate-800 rounded p-2 text-xs text-slate-300 overflow-x-auto">
                                {JSON.stringify(event.newValue, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Reason */}
                          {event.reason && (
                            <div>
                              <h5 className="text-xs font-medium text-slate-500 mb-2">Reason</h5>
                              <p className="text-sm text-slate-300">{event.reason}</p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="pt-2 border-t border-slate-700/50 flex items-center gap-4 text-xs text-slate-500">
                            <span>ID: <code className="text-slate-400">{event.id}</code></span>
                            {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                            {event.sessionId && <span>Session: {event.sessionId.slice(0, 8)}...</span>}
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

        {/* Action Distribution */}
        {stats && Object.keys(stats.byAction).length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4">Action Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats.byAction).map(([action, count]) => (
                <div key={action} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <span className="text-sm text-slate-300">{formatAction(action as PartnerGovernanceAction)}</span>
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
