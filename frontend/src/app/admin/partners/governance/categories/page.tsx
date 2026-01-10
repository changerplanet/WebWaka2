'use client'

/**
 * SUPER ADMIN - PARTNER CATEGORIES MANAGEMENT
 * 
 * Manage partner category tiers and capability overrides.
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, ChevronDown, ChevronUp, Check, X,
  Star, Shield, Loader2, Info, AlertTriangle
} from 'lucide-react'
import {
  PARTNER_CATEGORIES,
  PARTNER_TYPES,
  CAPABILITY_GROUPS,
  PartnerCategory,
} from '@/lib/partner-governance'

export default function PartnerCategoriesPage() {
  const router = useRouter()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-amber-500/20 text-amber-400 border-amber-500/50'
      case 2: return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 3: return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
      case 4: return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    }
  }

  const getTierIcon = (tier: number) => {
    switch (tier) {
      case 1: return Star
      case 2: return Shield
      case 3: return Building2
      case 4: return AlertTriangle
      default: return Building2
    }
  }

  // Get which types allow each category
  const getTypesForCategory = (categoryId: string) => {
    return PARTNER_TYPES.filter((t: any) => t.allowedCategories.includes(categoryId))
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
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Partner Categories</h1>
              <p className="text-slate-400">Manage partner tiers and capability overrides</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Notice */}
        <div className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-400">Partner Categories</h3>
              <p className="text-sm text-purple-200/80 mt-1">
                Categories are tiers within a Partner Type. They provide capability overrides 
                that take precedence over the type defaults. Lower tier numbers indicate higher priority.
              </p>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="space-y-4">
          {PARTNER_CATEGORIES.sort((a, b) => a.tier - b.tier).map((category) => {
            const TierIcon = getTierIcon(category.tier)
            const isExpanded = expandedCategory === category.id
            const typesForCategory = getTypesForCategory(category.id)
            
            return (
              <div key={category.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition"
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTierColor(category.tier)}`}>
                      <TierIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getTierColor(category.tier)}`}>
                          Tier {category.tier}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-slate-400">Available In</p>
                      <p className="text-white">{typesForCategory.length} types</p>
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
                    {/* Available In Types */}
                    <div className="p-5 border-b border-slate-700">
                      <h4 className="font-medium mb-3 text-slate-300">Available In Partner Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {typesForCategory.map((type) => (
                          <span
                            key={type.id}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                          >
                            {type.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Capability Overrides */}
                    {category.capabilityOverrides && Object.keys(category.capabilityOverrides).length > 0 && (
                      <div className="p-5 border-b border-slate-700">
                        <h4 className="font-medium mb-4 text-slate-300">Capability Overrides</h4>
                        <p className="text-sm text-slate-400 mb-4">
                          These capabilities override the partner type defaults when this category is assigned.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(category.capabilityOverrides).map(([key, value]) => {
                            // Find the capability definition
                            const capDef = CAPABILITY_GROUPS
                              .flatMap(g => g.capabilities)
                              .find((c: any) => c.key === key)
                            
                            return (
                              <div key={key} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                                <span className="text-slate-300">{capDef?.label || key}</span>
                                {typeof value === 'boolean' ? (
                                  value ? (
                                    <Check className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <X className="w-5 h-5 text-red-400" />
                                  )
                                ) : (
                                  <span className="text-green-400 font-medium">
                                    {value === null ? '∞ (unlimited)' : value}
                                    {capDef?.unit && value !== null ? ` ${capDef.unit}` : ''}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pricing Overrides */}
                    {category.pricingOverrides && (
                      <div className="p-5 border-b border-slate-700">
                        <h4 className="font-medium mb-4 text-slate-300">Pricing Overrides</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                            <span className="text-slate-300">Max Discount %</span>
                            <span className="text-green-400 font-medium">
                              {category.pricingOverrides.maxDiscountPercent}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                            <span className="text-slate-300">Can Negotiate Custom</span>
                            {category.pricingOverrides.canNegotiateCustom ? (
                              <Check className="w-5 h-5 text-green-400" />
                            ) : (
                              <X className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="p-5 bg-slate-900/30">
                      <div className="flex items-center gap-6 text-xs text-slate-500">
                        <span>ID: <code className="text-slate-400">{category.id}</code></span>
                        <span>Created: {new Date(category.createdAt).toLocaleDateString()}</span>
                        <span>Created By: {category.createdBy}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Category Comparison Matrix */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-semibold mb-4">Category Comparison Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">Category</th>
                  <th className="text-center py-3 px-4 text-slate-400">Tier</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Discount</th>
                  <th className="text-center py-3 px-4 text-slate-400">Custom Pricing</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Clients</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Trial Days</th>
                  <th className="text-center py-3 px-4 text-slate-400">Can Create Models</th>
                </tr>
              </thead>
              <tbody>
                {PARTNER_CATEGORIES.sort((a, b) => a.tier - b.tier).map((category) => (
                  <tr key={category.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          category.tier === 1 ? 'bg-amber-400' :
                          category.tier === 2 ? 'bg-blue-400' :
                          category.tier === 3 ? 'bg-slate-400' :
                          'bg-red-400'
                        }`} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{category.tier}</td>
                    <td className="py-3 px-4 text-center">
                      {category.pricingOverrides?.maxDiscountPercent ?? '—'}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {category.pricingOverrides?.canNegotiateCustom ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-500 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {category.capabilityOverrides?.maxClients === null ? '∞' :
                       category.capabilityOverrides?.maxClients ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {category.capabilityOverrides?.maxTrialDays ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {category.capabilityOverrides?.canCreatePricingModels === true ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : category.capabilityOverrides?.canCreatePricingModels === false ? (
                        <X className="w-4 h-4 text-red-400 mx-auto" />
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
