'use client'

/**
 * SUPER ADMIN - PARTNER GOVERNANCE DASHBOARD
 * 
 * Main control plane for Partner Governance, Rights & Pricing Control System.
 * 
 * Features:
 * - Partner Types & Categories Management
 * - Pricing Model Configuration
 * - Capability Matrix View
 * - Governance Audit Trail
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, DollarSign, Settings, Activity, ArrowLeft,
  Building2, Loader2, ChevronRight, FileText, BarChart3,
  Lock, AlertTriangle, CheckCircle, XCircle, Eye
} from 'lucide-react'

// Import governance types
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  PRICING_MODELS,
  getGovernanceAuditStats,
} from '@/lib/partner-governance'
import { QuickPreviewModal } from '@/components/governance/QuickPreviewModal'

interface GovernanceStats {
  partnerTypes: number
  partnerCategories: number
  pricingModels: number
  activePricingModels: number
  auditEvents: {
    totalEvents: number
    last24Hours: number
    last7Days: number
  }
}

export default function PartnerGovernanceDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<GovernanceStats | null>(null)
  const [user, setUser] = useState<{ email: string; globalRole: string } | null>(null)
  const [showQuickPreview, setShowQuickPreview] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      // Check auth
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (!data.authenticated || data.user.globalRole !== 'SUPER_ADMIN') {
        router.push('/admin')
        return
      }
      
      setUser(data.user)
      
      // Load governance stats
      const auditStats = getGovernanceAuditStats()
      setStats({
        partnerTypes: PARTNER_TYPES.length,
        partnerCategories: PARTNER_CATEGORIES.length,
        pricingModels: PRICING_MODELS.length,
        activePricingModels: PRICING_MODELS.filter((m: any) => m.isActive).length,
        auditEvents: {
          totalEvents: auditStats.totalEvents,
          last24Hours: auditStats.last24Hours,
          last7Days: auditStats.last7Days,
        },
      })
    } catch (err) {
      console.error('Failed to load governance data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  const navigationCards = [
    {
      id: 'types',
      title: 'Partner Types',
      description: 'Define and manage partner type classifications',
      icon: Users,
      href: '/admin/partners/governance/types',
      color: 'bg-blue-500/20 text-blue-400',
      stats: `${stats?.partnerTypes || 0} types defined`,
    },
    {
      id: 'categories',
      title: 'Partner Categories',
      description: 'Manage partner tiers and category overrides',
      icon: Building2,
      href: '/admin/partners/governance/categories',
      color: 'bg-purple-500/20 text-purple-400',
      stats: `${stats?.partnerCategories || 0} categories`,
    },
    {
      id: 'pricing',
      title: 'Pricing Models',
      description: 'Configure pricing model templates',
      icon: DollarSign,
      href: '/admin/partners/governance/pricing',
      color: 'bg-emerald-500/20 text-emerald-400',
      stats: `${stats?.activePricingModels || 0} active models`,
    },
    {
      id: 'capabilities',
      title: 'Capability Matrix',
      description: 'View and manage partner capability configurations',
      icon: Settings,
      href: '/admin/partners/governance/capabilities',
      color: 'bg-amber-500/20 text-amber-400',
      stats: 'View matrix',
    },
    {
      id: 'assignments',
      title: 'Pricing Assignments',
      description: 'Manage pricing assignments to partners',
      icon: FileText,
      href: '/admin/partners/governance/assignments',
      color: 'bg-cyan-500/20 text-cyan-400',
      stats: 'View assignments',
    },
    {
      id: 'audit',
      title: 'Governance Audit',
      description: 'View audit trail for all governance actions',
      icon: Activity,
      href: '/admin/partners/governance/audit',
      color: 'bg-red-500/20 text-red-400',
      stats: `${stats?.auditEvents?.last24Hours || 0} events (24h)`,
    },
    {
      id: 'inspection',
      title: 'Audit Inspection',
      description: 'Read-only inspection of canonical audit events',
      icon: Eye,
      href: '/admin/partners/governance/inspection',
      color: 'bg-orange-500/20 text-orange-400',
      stats: 'Inspection only',
    },
    {
      id: 'dashboard',
      title: 'Health Dashboard',
      description: 'At-a-glance governance health metrics',
      icon: BarChart3,
      href: '/admin/partners/governance/dashboard',
      color: 'bg-emerald-500/20 text-emerald-400',
      stats: 'Observability',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/admin/partners')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-partners"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Partner Management
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Partner Governance Control Plane</h1>
                <p className="text-slate-400">Rights, Pricing & Capability Management</p>
              </div>
            </div>
            
            {/* Quick Preview Button */}
            <button
              onClick={() => setShowQuickPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-xl transition border border-cyan-500/30"
              data-testid="quick-preview-btn"
            >
              <Eye className="w-5 h-5" />
              Quick Preview
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Governance Notice */}
        <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-400">Governance Mode Active</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                This system manages pricing <strong>facts</strong>, not billing execution. 
                All actions are logged and auditable. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Partner Types</span>
            </div>
            <p className="text-2xl font-bold">{stats?.partnerTypes || 0}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-slate-400 text-sm">Categories</span>
            </div>
            <p className="text-2xl font-bold">{stats?.partnerCategories || 0}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Pricing Models</span>
            </div>
            <p className="text-2xl font-bold">{stats?.activePricingModels || 0} <span className="text-sm text-slate-500">/ {stats?.pricingModels}</span></p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-slate-400 text-sm">Audit Events (7d)</span>
            </div>
            <p className="text-2xl font-bold">{stats?.auditEvents?.last7Days || 0}</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <h2 className="text-lg font-semibold mb-4">Governance Modules</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {navigationCards.map((card) => (
            <button
              key={card.id}
              onClick={() => router.push(card.href)}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-green-500/50 transition text-left group"
              data-testid={`nav-${card.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-green-400 transition">{card.title}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{card.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 transition" />
              </div>
              <div className="mt-4 text-xs text-slate-500">{card.stats}</div>
            </button>
          ))}
        </div>

        {/* What Admin CANNOT Do Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              What This System Does NOT Do
            </h3>
            <p className="text-sm text-slate-400 mt-1">Commerce boundary enforcement - these capabilities are explicitly excluded</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Payment Processing', reason: 'Commerce Boundary' },
                { label: 'Invoice Generation', reason: 'Commerce Boundary' },
                { label: 'Wallet Management', reason: 'Commerce Boundary' },
                { label: 'Balance Tracking', reason: 'Commerce Boundary' },
                { label: 'Auto-billing', reason: 'Commerce Boundary' },
                { label: 'Collection/Dunning', reason: 'Commerce Boundary' },
                { label: 'Tax Calculation', reason: 'Commerce Boundary (facts only)' },
                { label: 'Currency Conversion', reason: 'Commerce Boundary' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-xs text-slate-500">— {item.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What Admin CAN Do Section */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mt-4">
          <div className="p-5 border-b border-slate-700">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              What This System DOES
            </h3>
            <p className="text-sm text-slate-400 mt-1">Governance-safe capabilities within this control plane</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                'Define pricing models (configuration)',
                'Assign pricing to partners/clients (governance)',
                'Grant and manage trials (time-bound entitlements)',
                'Emit pricing facts (what WOULD be charged)',
                'Control partner rights and privileges (permissions)',
                'Audit all actions (governance trail)',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Preview Modal */}
      <QuickPreviewModal
        isOpen={showQuickPreview}
        onClose={() => setShowQuickPreview(false)}
      />
    </div>
  )
}
