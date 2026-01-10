'use client'

/**
 * PARTNER ADMIN - MY ENTITLEMENTS
 * 
 * Read-only view of partner's own capabilities and limits.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import { useRouter } from 'next/navigation'
import {
  Shield, ArrowLeft, Check, X, Lock, AlertTriangle,
  Users, DollarSign, Clock, Building2, FileText, BarChart3
} from 'lucide-react'
import { usePartner } from '@/lib/partner-governance/partner-context'
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  CAPABILITY_GROUPS,
  AVAILABLE_SUITES,
} from '@/lib/partner-governance'

export default function MyEntitlementsPage() {
  const router = useRouter()
  const {
    loading,
    partner,
    capabilities,
    entitlement,
    availablePricingModels,
    clientCount,
    activeTrialCount,
    can,
  } = usePartner()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const partnerType = PARTNER_TYPES.find((t: any) => t.id === partner?.typeId)
  const partnerCategory = PARTNER_CATEGORIES.find((c: any) => c.id === partner?.categoryId)

  const formatCapabilityValue = (
    value: unknown,
    type: 'boolean' | 'number' | 'string[]',
    unit?: string
  ): React.ReactNode => {
    if (type === 'boolean') {
      return value ? (
        <span className="flex items-center gap-1 text-green-400">
          <Check className="w-4 h-4" /> Enabled
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-400">
          <Lock className="w-4 h-4" /> Disabled
        </span>
      )
    }
    
    if (type === 'number') {
      if (value === null) return <span className="text-green-400 font-medium">∞ (unlimited)</span>
      return <span className="text-green-400 font-medium">{value as number}{unit ? ` ${unit}` : ''}</span>
    }
    
    if (type === 'string[]') {
      const arr = value as string[] | undefined
      if (!arr || arr.length === 0) return <span className="text-slate-500">None</span>
      return <span className="text-green-400">{arr.length} items</span>
    }
    
    return <span className="text-slate-500">—</span>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/partner/governance')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-governance"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Governance Portal
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Entitlements</h1>
              <p className="text-slate-400">View your capabilities and limits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Partner Identity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Partner Identity
          </h3>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Partner Name</p>
              <p className="font-medium text-lg">{partner?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Partner Type</p>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                {partnerType?.name}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Category</p>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                {partnerCategory?.name} (Tier {partnerCategory?.tier})
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Partner ID</p>
              <code className="text-sm text-slate-400">{partner?.id}</code>
            </div>
          </div>
        </div>

        {/* Usage Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Clients</span>
            </div>
            <p className="text-2xl font-bold">
              {clientCount}
              <span className="text-sm text-slate-500 ml-1">
                / {capabilities.maxClients === null ? '∞' : capabilities.maxClients}
              </span>
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-slate-400 text-sm">Active Trials</span>
            </div>
            <p className="text-2xl font-bold">
              {activeTrialCount}
              <span className="text-sm text-slate-500 ml-1">
                / {capabilities.maxConcurrentTrials === null ? '∞' : capabilities.maxConcurrentTrials}
              </span>
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Max Discount</span>
            </div>
            <p className="text-2xl font-bold">
              {can('canApplyDiscounts') ? `${capabilities.maxDiscountPercent}%` : '—'}
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-slate-400 text-sm">Pricing Models</span>
            </div>
            <p className="text-2xl font-bold">{availablePricingModels.length}</p>
          </div>
        </div>

        {/* Full Capability Matrix */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-700 bg-slate-900/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Full Capability Matrix
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Your resolved capabilities based on Partner Type + Category
            </p>
          </div>

          <div className="divide-y divide-slate-700">
            {CAPABILITY_GROUPS.map((group) => (
              <div key={group.id} className="p-5">
                <h4 className="font-medium text-sm text-slate-400 mb-4">{group.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  {group.capabilities.map((cap) => {
                    const value = capabilities[cap.key]
                    return (
                      <div 
                        key={cap.key}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <div>
                          <span className="text-sm text-slate-300">{cap.label}</span>
                          <p className="text-xs text-slate-500">{cap.description}</p>
                        </div>
                        {formatCapabilityValue(value, cap.type, cap.unit)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allowed Suites */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
          <h3 className="font-semibold mb-4">Allowed Suites</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SUITES.map(suite => {
              const isAllowed = capabilities.allowedSuites.includes(suite.id)
              const isRestricted = capabilities.restrictedSuites.includes(suite.id)
              
              return (
                <div
                  key={suite.id}
                  className={`px-4 py-2 rounded-xl text-sm ${
                    isRestricted
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : isAllowed
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-slate-700 text-slate-500 border border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isRestricted ? (
                      <X className="w-4 h-4" />
                    ) : isAllowed ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>{suite.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Available Pricing Models */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
          <h3 className="font-semibold mb-4">Available Pricing Models</h3>
          <div className="grid grid-cols-3 gap-4">
            {availablePricingModels.map((model) => (
              <div key={model.id} className="bg-slate-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">{model.name}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{model.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-700 rounded text-xs capitalize">{model.type}</span>
                  <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">{model.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What You Cannot Do */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700 bg-red-500/5">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              Governance Boundaries
            </h3>
            <p className="text-sm text-slate-400 mt-1">Actions that are never available in this portal</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Process Payments', reason: 'Commerce Boundary' },
                { label: 'Generate Invoices', reason: 'Commerce Boundary' },
                { label: 'Manage Wallets or Balances', reason: 'Commerce Boundary' },
                { label: 'View Other Partners', reason: 'Data Isolation' },
                { label: 'Modify Your Own Capabilities', reason: 'Governance Enforcement' },
                { label: 'Access Super Admin Functions', reason: 'Role Boundary' },
                { label: 'Create Partner Types/Categories', reason: 'Super Admin Only' },
                { label: 'Modify Global Pricing Models', reason: 'Super Admin Only' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <X className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-xs text-slate-500">— {item.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Computed At */}
        <div className="mt-4 text-center text-xs text-slate-500">
          Entitlements computed at: {entitlement?.computedAt ? new Date(entitlement.computedAt).toLocaleString() : '—'}
        </div>
      </div>
    </div>
  )
}
