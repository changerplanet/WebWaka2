'use client'

/**
 * PARTNER ADMIN - GOVERNANCE DASHBOARD
 * 
 * Main dashboard for Partner Admin Portal showing capabilities,
 * quick stats, and navigation to governance modules.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, DollarSign, Clock, ArrowLeft, ChevronRight,
  Building2, Loader2, FileText, Check, X, Lock, AlertTriangle,
  Eye, Settings, Activity
} from 'lucide-react'
import { usePartner } from '@/lib/partner-governance/partner-context'
import { CapabilityBadge, LimitWarning } from '@/lib/partner-governance/capability-guard'
import { PARTNER_TYPES, PARTNER_CATEGORIES } from '@/lib/partner-governance'

export default function PartnerGovernanceDashboard() {
  const router = useRouter()
  const {
    loading,
    error,
    partner,
    capabilities,
    entitlement,
    clientCount,
    activeTrialCount,
    can,
  } = usePartner()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error || 'Failed to load partner data'}</p>
        </div>
      </div>
    )
  }

  const partnerType = PARTNER_TYPES.find((t: any) => t.id === partner.typeId)
  const partnerCategory = PARTNER_CATEGORIES.find((c: any) => c.id === partner.categoryId)

  // Navigation cards based on capabilities
  const navigationCards = [
    {
      id: 'clients',
      title: 'Client Management',
      description: 'Create and manage your clients',
      icon: Users,
      href: '/partner/governance/clients',
      color: 'bg-blue-500/20 text-blue-400',
      capability: 'canCreateClients' as const,
      stats: `${clientCount} clients`,
    },
    {
      id: 'pricing',
      title: 'Pricing Assignments',
      description: 'Assign pricing models to clients',
      icon: DollarSign,
      href: '/partner/governance/pricing',
      color: 'bg-emerald-500/20 text-emerald-400',
      capability: 'canAssignPricing' as const,
      stats: 'Manage pricing',
    },
    {
      id: 'trials',
      title: 'Trial Management',
      description: 'Grant and manage client trials',
      icon: Clock,
      href: '/partner/governance/trials',
      color: 'bg-purple-500/20 text-purple-400',
      capability: 'canOfferTrials' as const,
      stats: `${activeTrialCount} active trials`,
    },
    {
      id: 'entitlements',
      title: 'My Entitlements',
      description: 'View your capabilities and limits',
      icon: Shield,
      href: '/partner/governance/my-entitlements',
      color: 'bg-amber-500/20 text-amber-400',
      capability: null, // Always visible
      stats: 'View details',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push('/dashboard/partner')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Partner Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Partner Governance Portal</h1>
                <p className="text-slate-400">Manage clients, pricing, and trials</p>
              </div>
            </div>
            
            {/* Partner Badge */}
            <div className="text-right">
              <p className="text-lg font-semibold">{partner.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {partnerType?.name}
                </span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {partnerCategory?.name} (Tier {partnerCategory?.tier})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Limit Warnings */}
        <div className="space-y-2 mb-6">
          <LimitWarning capability="canCreateClients" currentCount={clientCount} />
          <LimitWarning capability="canOfferTrials" currentCount={activeTrialCount} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Clients</span>
            </div>
            <p className="text-2xl font-bold">
              {clientCount}
              {capabilities.maxClients !== null && (
                <span className="text-sm text-slate-500 ml-1">/ {capabilities.maxClients}</span>
              )}
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
              {capabilities.maxConcurrentTrials !== null && (
                <span className="text-sm text-slate-500 ml-1">/ {capabilities.maxConcurrentTrials}</span>
              )}
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
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Max Trial Days</span>
            </div>
            <p className="text-2xl font-bold">
              {can('canOfferTrials') ? `${capabilities.maxTrialDays}` : '—'}
            </p>
          </div>
        </div>

        {/* Navigation Cards */}
        <h2 className="text-lg font-semibold mb-4">Governance Modules</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {navigationCards.map((card) => {
            const isEnabled = card.capability === null || can(card.capability)
            
            return (
              <button
                key={card.id}
                onClick={() => isEnabled && router.push(card.href)}
                disabled={!isEnabled}
                className={`bg-slate-800 rounded-xl p-5 border transition text-left group ${
                  isEnabled
                    ? 'border-slate-700 hover:border-green-500/50 cursor-pointer'
                    : 'border-slate-700/50 opacity-60 cursor-not-allowed'
                }`}
                data-testid={`nav-${card.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                      {isEnabled ? (
                        <card.icon className="w-6 h-6" />
                      ) : (
                        <Lock className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isEnabled ? 'text-white group-hover:text-green-400' : 'text-slate-400'} transition`}>
                        {card.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">{card.description}</p>
                    </div>
                  </div>
                  {isEnabled ? (
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 transition" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="mt-4 text-xs text-slate-500">
                  {isEnabled ? card.stats : 'Not available'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Capability Summary */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Your Capabilities
          </h3>
          <div className="flex flex-wrap gap-2">
            <CapabilityBadge capability="canCreateClients" label="Create Clients" />
            <CapabilityBadge capability="canSuspendClients" label="Suspend Clients" />
            <CapabilityBadge capability="canAssignPricing" label="Assign Pricing" />
            <CapabilityBadge capability="canApplyDiscounts" label="Apply Discounts" />
            <CapabilityBadge capability="canOfferTrials" label="Offer Trials" />
            <CapabilityBadge capability="canCreatePricingModels" label="Create Models" />
            <CapabilityBadge capability="canManageDomains" label="Manage Domains" />
            <CapabilityBadge capability="canViewPricingFacts" label="View Facts" />
            <CapabilityBadge capability="canExportReports" label="Export Reports" />
          </div>
        </div>

        {/* What You CANNOT Do */}
        <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700 bg-slate-900/50">
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
                { label: 'Manage Wallets', reason: 'Commerce Boundary' },
                { label: 'View Other Partners', reason: 'Data Isolation' },
                { label: 'Modify Own Capabilities', reason: 'Governance Enforcement' },
                { label: 'Access Super Admin', reason: 'Role Boundary' },
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
      </div>
    </div>
  )
}
