'use client'

/**
 * SUPER ADMIN - PRICING MODELS MANAGEMENT
 * 
 * Configure and manage pricing model templates.
 * Pricing is GOVERNANCE, not billing. Facts only.
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, DollarSign, ChevronDown, ChevronUp, Check, X,
  AlertTriangle, Info, Layers, Users, BarChart3, FileText,
  CheckCircle, XCircle
} from 'lucide-react'
import {
  PRICING_MODELS,
  PricingModel,
  PricingModelType,
  AVAILABLE_SUITES,
} from '@/lib/partner-governance'

export default function PricingModelsPage() {
  const router = useRouter()
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<PricingModelType | 'all'>('all')

  const getTypeIcon = (type: PricingModelType) => {
    switch (type) {
      case 'flat': return DollarSign
      case 'per-suite': return Layers
      case 'per-seat': return Users
      case 'tiered': return BarChart3
      case 'custom': return FileText
      default: return DollarSign
    }
  }

  const getTypeColor = (type: PricingModelType) => {
    switch (type) {
      case 'flat': return 'bg-emerald-500/20 text-emerald-400'
      case 'per-suite': return 'bg-blue-500/20 text-blue-400'
      case 'per-seat': return 'bg-purple-500/20 text-purple-400'
      case 'tiered': return 'bg-amber-500/20 text-amber-400'
      case 'custom': return 'bg-slate-500/20 text-slate-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  const filteredModels = filterType === 'all' 
    ? PRICING_MODELS 
    : PRICING_MODELS.filter((m: any) => m.type === filterType)

  const renderModelConfig = (model: PricingModel) => {
    const config = model.config

    switch (config.type) {
      case 'flat':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-4">
              <span className="text-slate-300">Base Price</span>
              <span className="text-2xl font-bold text-emerald-400">
                {formatCurrency(config.basePrice, model.currency)}
              </span>
            </div>
            <div>
              <h5 className="text-sm font-medium text-slate-400 mb-2">Included Suites</h5>
              <div className="flex flex-wrap gap-2">
                {config.includedSuites.map((suite) => (
                  <span key={suite} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm capitalize">
                    {suite}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )

      case 'per-suite':
        return (
          <div>
            <h5 className="text-sm font-medium text-slate-400 mb-3">Suite Prices</h5>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(config.suitePrices).map(([suite, price]) => (
                <div key={suite} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <span className="text-slate-300 capitalize">{suite}</span>
                  <span className="text-blue-400 font-medium">
                    {formatCurrency(price, model.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'per-seat':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Price Per Seat</p>
                <p className="text-xl font-bold text-purple-400">
                  {formatCurrency(config.pricePerSeat, model.currency)}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Min Seats</p>
                <p className="text-xl font-bold text-white">{config.minSeats}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Max Seats</p>
                <p className="text-xl font-bold text-white">{config.maxSeats ?? '∞'}</p>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-slate-400 mb-2">Included Suites</h5>
              <div className="flex flex-wrap gap-2">
                {config.includedSuites.map((suite) => (
                  <span key={suite} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm capitalize">
                    {suite}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )

      case 'tiered':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <span>Unit Type:</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded capitalize">{config.unitType}</span>
            </div>
            <div className="space-y-2">
              {config.tiers.map((tier, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                  <span className="text-slate-300">
                    {tier.minUnits} - {tier.maxUnits ?? '∞'} {config.unitType}
                  </span>
                  <span className="text-amber-400 font-medium">
                    {formatCurrency(tier.pricePerUnit, model.currency)} / {config.unitType.slice(0, -1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'custom':
        return (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-slate-400 mb-2">Custom Terms</h5>
              <p className="text-slate-300">{config.terms}</p>
            </div>
            {Object.keys(config.customFields).length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-400 mb-2">Custom Fields</h5>
                <pre className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 overflow-x-auto">
                  {JSON.stringify(config.customFields, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
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
            Back to Governance
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pricing Models</h1>
              <p className="text-slate-400">Configure pricing model templates (governance only)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Commerce Boundary Notice */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-400">Governance Facts Only</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                Pricing models define <strong>what would be charged</strong>, not what is actually billed.
                This system emits pricing facts for governance and audit purposes.
                No payment processing, invoicing, or billing execution occurs here.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: 'all', label: 'All Models' },
            { value: 'flat', label: 'Flat' },
            { value: 'per-suite', label: 'Per-Suite' },
            { value: 'per-seat', label: 'Per-Seat' },
            { value: 'tiered', label: 'Tiered' },
            { value: 'custom', label: 'Custom' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === tab.value
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pricing Models List */}
        <div className="space-y-4">
          {filteredModels.map((model) => {
            const TypeIcon = getTypeIcon(model.type)
            const isExpanded = expandedModel === model.id
            
            return (
              <div key={model.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Model Header */}
                <button
                  onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition"
                  data-testid={`model-${model.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(model.type)}`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{model.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${getTypeColor(model.type)}`}>
                          {model.type}
                        </span>
                        {model.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{model.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-slate-400">{model.billingPeriod}</p>
                      <p className="text-white">{model.currency}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-700">
                    {/* Model Configuration */}
                    <div className="p-5 border-b border-slate-700">
                      <h4 className="font-medium mb-4 text-slate-300">Pricing Configuration</h4>
                      {renderModelConfig(model)}
                    </div>

                    {/* Model Details */}
                    <div className="p-5 border-b border-slate-700">
                      <h4 className="font-medium mb-4 text-slate-300">Model Details</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-500">Currency</p>
                          <p className="font-medium">{model.currency}</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-500">Billing Period</p>
                          <p className="font-medium capitalize">{model.billingPeriod}</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-slate-500">Version</p>
                          <p className="font-medium">v{model.version}</p>
                        </div>
                      </div>
                    </div>

                    {/* Governance Info */}
                    <div className="p-5 bg-slate-900/30">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-6">
                          <span>ID: <code className="text-slate-400">{model.id}</code></span>
                          <span>Created: {new Date(model.createdAt).toLocaleDateString()}</span>
                          <span>Created By: {model.createdBy}</span>
                        </div>
                        {model.approvedAt && (
                          <span className="text-green-400">
                            Approved: {new Date(model.approvedAt).toLocaleDateString()} by {model.approvedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Model Types Legend */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-semibold mb-4">Pricing Model Types</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { type: 'flat', desc: 'Fixed price per period, includes specific suites' },
              { type: 'per-suite', desc: 'Price varies by which suites are enabled' },
              { type: 'per-seat', desc: 'Price based on number of users (fact only, not enforcement)' },
              { type: 'tiered', desc: 'Volume-based pricing with progressive tiers' },
              { type: 'custom', desc: 'Negotiated terms for special agreements' },
            ].map((item) => {
              const Icon = getTypeIcon(item.type as PricingModelType)
              return (
                <div key={item.type} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(item.type as PricingModelType)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{item.type}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
