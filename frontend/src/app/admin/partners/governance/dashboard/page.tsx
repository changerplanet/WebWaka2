'use client'

/**
 * SUPER ADMIN - GOVERNANCE HEALTH DASHBOARD
 * 
 * Post-Lock Observability Enhancement
 * Read-only visualization of governance health metrics.
 * 
 * @classification Post-Lock Enhancement (does not modify FROZEN system)
 * @scope Read-only, derived, non-mutating
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Activity, Shield, Building2, Users, DollarSign,
  Clock, AlertTriangle, TrendingUp, Eye, Calendar, FileText,
  ChevronRight, Info, BarChart3, PieChart, Layers
} from 'lucide-react'
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  PRICING_MODELS,
  getAuditStatistics,
  queryAuditEvents,
  CanonicalAuditEvent,
  AuditStatistics,
} from '@/lib/partner-governance'

// Demo partner data for metrics (derived, read-only)
const DEMO_PARTNERS = [
  { id: 'partner-001', name: 'Acme Solutions', typeId: 'reseller', categoryId: 'strategic', clientCount: 12, status: 'active' },
  { id: 'partner-002', name: 'TechBridge Ltd', typeId: 'system-integrator', categoryId: 'standard', clientCount: 8, status: 'active' },
  { id: 'partner-003', name: 'GovConnect', typeId: 'government-partner', categoryId: 'strategic', clientCount: 5, status: 'active' },
  { id: 'partner-004', name: 'FaithWorks', typeId: 'faith-partner', categoryId: 'pilot', clientCount: 3, status: 'active' },
  { id: 'partner-005', name: 'EduPro', typeId: 'education-partner', categoryId: 'standard', clientCount: 7, status: 'active' },
  { id: 'partner-006', name: 'Legacy Systems', typeId: 'reseller', categoryId: 'restricted', clientCount: 2, status: 'restricted' },
]

// Demo pricing assignments (derived, read-only)
const DEMO_PRICING_ASSIGNMENTS = [
  { id: 'assign-001', partnerId: 'partner-001', pricingModelId: 'professional-flat', customTerms: false },
  { id: 'assign-002', partnerId: 'partner-002', pricingModelId: 'enterprise-per-seat', customTerms: true },
  { id: 'assign-003', partnerId: 'partner-003', pricingModelId: 'basic-flat', customTerms: false },
  { id: 'assign-004', partnerId: 'partner-004', pricingModelId: 'per-suite-standard', customTerms: false },
  { id: 'assign-005', partnerId: 'partner-005', pricingModelId: 'basic-flat', customTerms: true },
]

// Demo trial data (derived, read-only)
const DEMO_TRIALS = [
  { partnerId: 'partner-001', clientId: 'client-001', daysRemaining: 5 },
  { partnerId: 'partner-001', clientId: 'client-002', daysRemaining: 25 },
  { partnerId: 'partner-002', clientId: 'client-003', daysRemaining: 45 },
  { partnerId: 'partner-004', clientId: 'client-004', daysRemaining: 12 },
]

interface HealthMetrics {
  // Partner Metrics
  totalPartners: number
  activePartners: number
  restrictedPartners: number
  partnersWithSuspendedClients: number
  
  // Pricing Metrics
  activePricingAssignments: number
  partnersWithCustomPricing: number
  partnersWithDiscountPrivileges: number
  activeTrialGrants: number
  
  // Audit Metrics
  auditStats: AuditStatistics | null
  recentEvents: CanonicalAuditEvent[]
  mostCommonAction: string
  lastEventTimestamp: string | null
  
  // Risk Signals
  partnersNearClientLimit: number
  partnersNearTrialLimit: number
  partnersHighAuditActivity: number
}

export default function GovernanceHealthDashboard() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  function loadMetrics() {
    setLoading(true)
    
    // Derive all metrics from existing registries and audit logs
    const auditStats = getAuditStatistics()
    const { events: recentEvents } = queryAuditEvents({ limit: 10 })
    
    // Partner metrics (derived from demo data)
    const activePartners = DEMO_PARTNERS.filter((p: any) => p.status === 'active').length
    const restrictedPartners = DEMO_PARTNERS.filter((p: any) => p.status === 'restricted').length
    
    // Find most common action from audit stats
    let mostCommonAction = 'No events recorded'
    if (auditStats.byAction && Object.keys(auditStats.byAction).length > 0) {
      const entries = Object.entries(auditStats.byAction)
      entries.sort((a, b) => b[1] - a[1])
      mostCommonAction = entries[0][0]
    }
    
    // Get last event timestamp
    const lastEventTimestamp = recentEvents.length > 0 ? recentEvents[0].timestamp : null
    
    // Calculate risk signals
    const maxClientsLimit = 50 // From strategic tier
    const partnersNearClientLimit = DEMO_PARTNERS.filter((p: any) => p.clientCount > maxClientsLimit * 0.8).length
    
    const partnersNearTrialLimit = DEMO_TRIALS.filter((t: any) => t.daysRemaining <= 7).length
    
    setMetrics({
      totalPartners: DEMO_PARTNERS.length,
      activePartners,
      restrictedPartners,
      partnersWithSuspendedClients: 0, // Demo: none suspended
      
      activePricingAssignments: DEMO_PRICING_ASSIGNMENTS.length,
      partnersWithCustomPricing: DEMO_PRICING_ASSIGNMENTS.filter((a: any) => a.customTerms).length,
      partnersWithDiscountPrivileges: DEMO_PARTNERS.filter((p: any) => {
        const cat = PARTNER_CATEGORIES.find((c: any) => c.id === p.categoryId)
        return cat && cat.pricingOverrides?.maxDiscountPercent && cat.pricingOverrides.maxDiscountPercent > 0
      }).length,
      activeTrialGrants: DEMO_TRIALS.length,
      
      auditStats,
      recentEvents,
      mostCommonAction,
      lastEventTimestamp,
      
      partnersNearClientLimit,
      partnersNearTrialLimit,
      partnersHighAuditActivity: auditStats.totalEvents > 100 ? 2 : 0,
    })
    
    setLoading(false)
  }

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return 'Never'
    const date = new Date(ts)
    return date.toLocaleString()
  }

  const formatAction = (action: string): string => {
    return action
      .replace(/\./g, ' → ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-400" />
          <p>Loading governance health metrics...</p>
        </div>
      </div>
    )
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
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="dashboard-title">Governance Health Dashboard</h1>
                <p className="text-slate-400">Read-only observability metrics</p>
              </div>
            </div>
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition text-sm"
              data-testid="refresh-metrics"
            >
              Refresh Metrics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Disclaimer Banner */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4" data-testid="disclaimer-banner">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400">Informational Only</h3>
              <p className="text-sm text-blue-200/80 mt-1">
                This dashboard provides <strong>read-only observability</strong> into governance health.
                No actions, alerts, or enforcement are triggered from this view.
                All metrics are derived from existing registries and audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Partner Governance Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Partner Governance Metrics
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-total-partners">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Total Partners</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold">{metrics.totalPartners}</p>
              <p className="text-xs text-slate-500 mt-1">Registered in system</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-active-partners">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Active Partners</span>
                <Shield className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-400">{metrics.activePartners}</p>
              <p className="text-xs text-slate-500 mt-1">Fully operational</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-restricted-partners">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Restricted Partners</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-400">{metrics.restrictedPartners}</p>
              <p className="text-xs text-slate-500 mt-1">Limited capabilities</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-suspended-clients">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Partners w/ Suspended Clients</span>
                <Users className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-400">{metrics.partnersWithSuspendedClients}</p>
              <p className="text-xs text-slate-500 mt-1">Require attention</p>
            </div>
          </div>
        </section>

        {/* Pricing & Capability Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Pricing & Capability Metrics
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-pricing-assignments">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Active Pricing Assignments</span>
                <FileText className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold">{metrics.activePricingAssignments}</p>
              <p className="text-xs text-slate-500 mt-1">Pricing facts assigned</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-custom-pricing">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Partners w/ Custom Pricing</span>
                <Layers className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-purple-400">{metrics.partnersWithCustomPricing}</p>
              <p className="text-xs text-slate-500 mt-1">Special terms applied</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-discount-privileges">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Discount Privileges Enabled</span>
                <TrendingUp className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-3xl font-bold text-cyan-400">{metrics.partnersWithDiscountPrivileges}</p>
              <p className="text-xs text-slate-500 mt-1">Can apply discounts</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-active-trials">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Active Trial Grants</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-400">{metrics.activeTrialGrants}</p>
              <p className="text-xs text-slate-500 mt-1">Time-bound entitlements</p>
            </div>
          </div>
        </section>

        {/* Audit Activity Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Audit Activity Metrics
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-audit-7d">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Events (Last 7 Days)</span>
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold">{metrics.auditStats?.last7Days || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Governance actions logged</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-audit-total">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Total Events</span>
                <BarChart3 className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-3xl font-bold">{metrics.auditStats?.totalEvents || 0}</p>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-common-action">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Most Common Action</span>
                <PieChart className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-lg font-semibold text-emerald-400 truncate">
                {formatAction(metrics.mostCommonAction)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Highest frequency</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="metric-last-event">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Last Governance Event</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                {formatTimestamp(metrics.lastEventTimestamp)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Most recent activity</p>
            </div>
          </div>
        </section>

        {/* Risk Signals */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Risk Signals
            <span className="text-xs font-normal text-slate-500 ml-2">(Informational Only)</span>
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="signal-client-limit">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Near Client Limit</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-400">{metrics.partnersNearClientLimit}</p>
              <p className="text-xs text-slate-500 mt-1">Partners at &gt;80% of max clients</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="signal-trial-limit">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Trials Expiring Soon</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-400">{metrics.partnersNearTrialLimit}</p>
              <p className="text-xs text-slate-500 mt-1">Trials ending within 7 days</p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700" data-testid="signal-high-activity">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">High Audit Activity</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-400">{metrics.partnersHighAuditActivity}</p>
              <p className="text-xs text-slate-500 mt-1">Unusual event volume</p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            Quick Links
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/admin/partners/governance/inspection')}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-emerald-500/50 transition text-left group"
              data-testid="link-audit-inspection"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-emerald-400 transition">Audit Inspection</h3>
                  <p className="text-sm text-slate-400 mt-1">View detailed audit event logs</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition" />
              </div>
            </button>
            
            <button
              onClick={() => router.push('/admin/partners/governance')}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-emerald-500/50 transition text-left group"
              data-testid="link-control-plane"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-emerald-400 transition">Control Plane</h3>
                  <p className="text-sm text-slate-400 mt-1">Manage types, categories, pricing</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition" />
              </div>
            </button>
          </div>
        </section>

        {/* Registry Summary */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Registry Summary
          </h2>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-700">
              <div className="p-5">
                <p className="text-sm text-slate-400 mb-2">Partner Types</p>
                <p className="text-2xl font-bold">{PARTNER_TYPES.length}</p>
                <div className="mt-3 space-y-1">
                  {PARTNER_TYPES.map(type => (
                    <p key={type.id} className="text-xs text-slate-500">• {type.name}</p>
                  ))}
                </div>
              </div>
              
              <div className="p-5">
                <p className="text-sm text-slate-400 mb-2">Partner Categories</p>
                <p className="text-2xl font-bold">{PARTNER_CATEGORIES.length}</p>
                <div className="mt-3 space-y-1">
                  {PARTNER_CATEGORIES.map(cat => (
                    <p key={cat.id} className="text-xs text-slate-500">• {cat.name} (Tier {cat.tier})</p>
                  ))}
                </div>
              </div>
              
              <div className="p-5">
                <p className="text-sm text-slate-400 mb-2">Pricing Models</p>
                <p className="text-2xl font-bold">{PRICING_MODELS.length}</p>
                <div className="mt-3 space-y-1">
                  {PRICING_MODELS.map(model => (
                    <p key={model.id} className="text-xs text-slate-500">• {model.name}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Disclaimer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>This dashboard is for observability purposes only. No actions are triggered from this view.</p>
          <p className="mt-1">Last refreshed: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
