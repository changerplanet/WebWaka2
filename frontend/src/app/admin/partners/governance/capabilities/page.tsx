'use client'

/**
 * SUPER ADMIN - CAPABILITY MATRIX
 * 
 * View the complete capability matrix showing how capabilities
 * are resolved for different partner type + category combinations.
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Settings, Check, X, Info, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  CAPABILITY_GROUPS,
  resolvePartnerCapabilities,
  PartnerCapabilities,
} from '@/lib/partner-governance'

export default function CapabilityMatrixPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(CAPABILITY_GROUPS.map((g: any) => g.id))

  // Get valid categories for selected type
  const validCategories = selectedType 
    ? PARTNER_CATEGORIES.filter((c: any) => {
        const type = PARTNER_TYPES.find((t: any) => t.id === selectedType)
        return type?.allowedCategories.includes(c.id)
      })
    : PARTNER_CATEGORIES

  // Compute resolved capabilities if both selected
  const resolvedCapabilities = selectedType && selectedCategory
    ? resolvePartnerCapabilities(selectedType, selectedCategory)
    : null

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const formatCapabilityValue = (
    value: unknown,
    type: 'boolean' | 'number' | 'string[]',
    unit?: string
  ): React.ReactNode => {
    if (type === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-400" />
      ) : (
        <X className="w-5 h-5 text-red-400" />
      )
    }
    
    if (type === 'number') {
      if (value === null || value === undefined) return <span className="text-slate-500">—</span>
      if (value === null) return <span className="text-green-400">∞ (unlimited)</span>
      return <span className="text-green-400">{value as number}{unit ? ` ${unit}` : ''}</span>
    }
    
    if (type === 'string[]') {
      const arr = value as string[] | undefined
      if (!arr || arr.length === 0) return <span className="text-slate-500">None</span>
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((item, i) => (
            <span key={i} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs capitalize">
              {item}
            </span>
          ))}
        </div>
      )
    }
    
    return <span className="text-slate-500">—</span>
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
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Capability Matrix</h1>
              <p className="text-slate-400">View resolved capabilities for type + category combinations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Notice */}
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-400">Capability Resolution</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                Capabilities are resolved in order: <strong>Default → Type → Category → Partner Override</strong>.
                Each level can override values from the previous. Select a type and category below to see the resolved capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Type Selection */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4">Partner Type</h3>
            <div className="space-y-2">
              {PARTNER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    // Reset category if not valid for new type
                    if (selectedCategory && !type.allowedCategories.includes(selectedCategory)) {
                      setSelectedCategory(null)
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedType === type.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      : 'bg-slate-900/50 border border-transparent hover:bg-slate-700/50'
                  }`}
                  data-testid={`select-type-${type.id}`}
                >
                  <p className="font-medium">{type.name}</p>
                  <p className="text-xs text-slate-400">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold mb-4">Partner Category</h3>
            <div className="space-y-2">
              {PARTNER_CATEGORIES.map((category) => {
                const isValidForType = selectedType 
                  ? PARTNER_TYPES.find((t: any) => t.id === selectedType)?.allowedCategories.includes(category.id)
                  : true
                
                return (
                  <button
                    key={category.id}
                    onClick={() => isValidForType && setSelectedCategory(category.id)}
                    disabled={!isValidForType}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedCategory === category.id
                        ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                        : isValidForType
                          ? 'bg-slate-900/50 border border-transparent hover:bg-slate-700/50'
                          : 'bg-slate-900/30 border border-transparent opacity-40 cursor-not-allowed'
                    }`}
                    data-testid={`select-category-${category.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{category.name}</p>
                      <span className="text-xs text-slate-500">Tier {category.tier}</span>
                    </div>
                    <p className="text-xs text-slate-400">{category.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resolved Capabilities */}
        {resolvedCapabilities ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-700 bg-slate-900/50">
              <h3 className="font-semibold">
                Resolved Capabilities: {PARTNER_TYPES.find((t: any) => t.id === selectedType)?.name} + {PARTNER_CATEGORIES.find((c: any) => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                These are the effective capabilities after resolution. Partner-specific overrides would be applied on top of these.
              </p>
            </div>

            <div className="divide-y divide-slate-700">
              {CAPABILITY_GROUPS.map((group) => {
                const isExpanded = expandedGroups.includes(group.id)
                
                return (
                  <div key={group.id}>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition"
                    >
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-xs text-slate-400">{group.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="bg-slate-900/50 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-700/50">
                                <th className="text-left py-2 px-4 text-xs text-slate-500">Capability</th>
                                <th className="text-left py-2 px-4 text-xs text-slate-500">Description</th>
                                <th className="text-right py-2 px-4 text-xs text-slate-500">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.capabilities.map((cap) => {
                                const value = resolvedCapabilities[cap.key]
                                return (
                                  <tr key={cap.key} className="border-b border-slate-700/30 last:border-0">
                                    <td className="py-3 px-4 font-medium text-sm">{cap.label}</td>
                                    <td className="py-3 px-4 text-sm text-slate-400">{cap.description}</td>
                                    <td className="py-3 px-4 text-right">
                                      {formatCapabilityValue(value, cap.type, cap.unit)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Effective Dates */}
            <div className="p-4 bg-slate-900/30 border-t border-slate-700">
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span>Effective From: <span className="text-slate-300">{new Date(resolvedCapabilities.effectiveFrom).toLocaleString()}</span></span>
                <span>Effective Until: <span className="text-slate-300">{resolvedCapabilities.effectiveUntil ? new Date(resolvedCapabilities.effectiveUntil).toLocaleString() : 'Indefinite'}</span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Select Type and Category</h3>
            <p className="text-slate-400">
              Choose a Partner Type and Category above to see the resolved capability matrix.
            </p>
          </div>
        )}

        {/* Full Matrix Table */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700">
            <h3 className="font-semibold">Full Capability Matrix</h3>
            <p className="text-sm text-slate-400 mt-1">
              Overview of key capabilities across all type + category combinations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left py-3 px-4 text-slate-400 sticky left-0 bg-slate-900/50">Type + Category</th>
                  <th className="text-center py-3 px-4 text-slate-400">Create Clients</th>
                  <th className="text-center py-3 px-4 text-slate-400">Assign Pricing</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Discount</th>
                  <th className="text-center py-3 px-4 text-slate-400">Offer Trials</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Trial Days</th>
                  <th className="text-center py-3 px-4 text-slate-400">Create Models</th>
                </tr>
              </thead>
              <tbody>
                {PARTNER_TYPES.map((type) => 
                  type.allowedCategories.map((catId) => {
                    const category = PARTNER_CATEGORIES.find((c: any) => c.id === catId)
                    if (!category) return null
                    
                    const caps = resolvePartnerCapabilities(type.id, category.id)
                    
                    return (
                      <tr key={`${type.id}-${category.id}`} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-3 px-4 sticky left-0 bg-slate-800">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-slate-500"> + </span>
                          <span className="text-purple-400">{category.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {caps.canCreateClients ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {caps.canAssignPricing ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-center text-green-400">{caps.maxDiscountPercent}%</td>
                        <td className="py-3 px-4 text-center">
                          {caps.canOfferTrials ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4 text-center text-green-400">{caps.maxTrialDays}</td>
                        <td className="py-3 px-4 text-center">
                          {caps.canCreatePricingModels ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
