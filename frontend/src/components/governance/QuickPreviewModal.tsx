'use client'

/**
 * QUICK PREVIEW - CAPABILITY RESOLUTION TOOL
 * 
 * Read-only diagnostic tool for Super Admins to preview
 * resolved capabilities for different partner configurations.
 * 
 * @phase Stop Point 2.1 - Quick Preview Enhancement
 */

import { useState, useMemo } from 'react'
import {
  X, Eye, Check, AlertTriangle, Settings, DollarSign,
  Users, Building2, Shield, ChevronDown, ChevronUp, Info,
  Lock, Unlock
} from 'lucide-react'
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  CAPABILITY_GROUPS,
  PRICING_MODELS,
  AVAILABLE_SUITES,
  resolvePartnerCapabilities,
  getActivePricingModels,
  PartnerCapabilities,
} from '@/lib/partner-governance'

interface QuickPreviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickPreviewModal({ isOpen, onClose }: QuickPreviewModalProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [overrides, setOverrides] = useState<Partial<PartnerCapabilities>>({})
  const [showOverrides, setShowOverrides] = useState(false)
  const [activeTab, setActiveTab] = useState<'capabilities' | 'pricing' | 'disabled'>('capabilities')

  // Get valid categories for selected type
  const validCategories = useMemo(() => {
    if (!selectedType) return PARTNER_CATEGORIES
    const type = PARTNER_TYPES.find((t: any) => t.id === selectedType)
    return PARTNER_CATEGORIES.filter((c: any) => type?.allowedCategories.includes(c.id))
  }, [selectedType])

  // Resolve capabilities
  const resolvedCapabilities = useMemo(() => {
    if (!selectedType || !selectedCategory) return null
    return resolvePartnerCapabilities(selectedType, selectedCategory, overrides)
  }, [selectedType, selectedCategory, overrides])

  // Get available pricing models based on capabilities
  const availablePricingModels = useMemo(() => {
    if (!resolvedCapabilities) return []
    return getActivePricingModels().filter((m: any) => {
      if (m.type === 'custom' && !resolvedCapabilities.canCreatePricingModels) {
        return false
      }
      return true
    })
  }, [resolvedCapabilities])

  // Get explicitly disabled actions
  const disabledActions = useMemo(() => {
    if (!resolvedCapabilities) return []
    
    const disabled: { action: string; reason: string }[] = []
    
    if (!resolvedCapabilities.canCreateClients) {
      disabled.push({ action: 'Create Clients', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canSuspendClients) {
      disabled.push({ action: 'Suspend Clients', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canAssignPricing) {
      disabled.push({ action: 'Assign Pricing to Clients', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canCreatePricingModels) {
      disabled.push({ action: 'Create Custom Pricing Models', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canApplyDiscounts) {
      disabled.push({ action: 'Apply Discounts', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canOfferTrials) {
      disabled.push({ action: 'Offer Trials', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canManageDomains) {
      disabled.push({ action: 'Manage Domains', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canViewPricingFacts) {
      disabled.push({ action: 'View Pricing Facts', reason: 'Capability not granted' })
    }
    if (!resolvedCapabilities.canExportReports) {
      disabled.push({ action: 'Export Reports', reason: 'Capability not granted' })
    }
    
    // Limit-based restrictions
    if (resolvedCapabilities.maxClients === 0) {
      disabled.push({ action: 'Create ANY Clients', reason: 'Max clients = 0' })
    }
    if (resolvedCapabilities.maxDiscountPercent === 0 && resolvedCapabilities.canApplyDiscounts) {
      disabled.push({ action: 'Apply ANY Discount', reason: 'Max discount = 0%' })
    }
    if (resolvedCapabilities.maxTrialDays === 0 && resolvedCapabilities.canOfferTrials) {
      disabled.push({ action: 'Grant ANY Trial', reason: 'Max trial days = 0' })
    }
    
    // Suite restrictions
    if (resolvedCapabilities.restrictedSuites.length > 0) {
      resolvedCapabilities.restrictedSuites.forEach(suite => {
        disabled.push({ action: `Access ${suite} Suite`, reason: 'Explicitly restricted' })
      })
    }
    
    return disabled
  }, [resolvedCapabilities])

  // Handle type change
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId)
    // Reset category if not valid for new type
    const type = PARTNER_TYPES.find((t: any) => t.id === typeId)
    if (selectedCategory && type && !type.allowedCategories.includes(selectedCategory)) {
      setSelectedCategory('')
    }
  }

  // Toggle override
  const toggleBooleanOverride = (key: keyof PartnerCapabilities) => {
    setOverrides(prev => {
      const newOverrides = { ...prev }
      if (key in newOverrides) {
        delete newOverrides[key]
      } else {
        newOverrides[key] = !(resolvedCapabilities?.[key] ?? false) as any
      }
      return newOverrides
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl w-full max-w-5xl border border-slate-700 my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Quick Preview — Capability Resolution</h2>
              <p className="text-sm text-slate-400">Read-only diagnostic tool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
            data-testid="close-preview-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Selection Panel */}
          <div className="p-5 border-b border-slate-700 bg-slate-900/50">
            <div className="grid grid-cols-2 gap-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Partner Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  data-testid="preview-type-select"
                >
                  <option value="">Select Partner Type...</option>
                  {PARTNER_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Partner Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!selectedType}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
                  data-testid="preview-category-select"
                >
                  <option value="">Select Category...</option>
                  {validCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name} (Tier {cat.tier})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Overrides Toggle */}
            {resolvedCapabilities && (
              <button
                onClick={() => setShowOverrides(!showOverrides)}
                className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
              >
                {showOverrides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showOverrides ? 'Hide' : 'Show'} Optional Partner Overrides
              </button>
            )}

            {/* Overrides Panel */}
            {showOverrides && resolvedCapabilities && (
              <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-slate-600">
                <p className="text-xs text-slate-500 mb-3">
                  Click to toggle partner-specific overrides (simulation only — not persisted)
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'canCreateClients', label: 'Create Clients' },
                    { key: 'canSuspendClients', label: 'Suspend Clients' },
                    { key: 'canAssignPricing', label: 'Assign Pricing' },
                    { key: 'canCreatePricingModels', label: 'Create Models' },
                    { key: 'canApplyDiscounts', label: 'Apply Discounts' },
                    { key: 'canOfferTrials', label: 'Offer Trials' },
                    { key: 'canManageDomains', label: 'Manage Domains' },
                  ].map(({ key, label }) => {
                    const isOverridden = key in overrides
                    const effectiveValue = isOverridden 
                      ? overrides[key as keyof PartnerCapabilities]
                      : resolvedCapabilities[key as keyof PartnerCapabilities]
                    
                    return (
                      <button
                        key={key}
                        onClick={() => toggleBooleanOverride(key as keyof PartnerCapabilities)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                          isOverridden
                            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                            : effectiveValue
                              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                              : 'bg-slate-700 border border-slate-600 text-slate-400'
                        }`}
                      >
                        {isOverridden && <span className="text-amber-500">*</span>}
                        {label}
                        {effectiveValue ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
                {Object.keys(overrides).length > 0 && (
                  <button
                    onClick={() => setOverrides({})}
                    className="mt-3 text-xs text-red-400 hover:text-red-300"
                  >
                    Clear all overrides
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Panel */}
          {resolvedCapabilities ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-700 px-5 shrink-0">
                {[
                  { id: 'capabilities', label: 'Resolved Capabilities', icon: Settings },
                  { id: 'pricing', label: 'Pricing Visibility', icon: DollarSign },
                  { id: 'disabled', label: 'Disabled Actions', icon: Lock },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-cyan-500 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'disabled' && disabledActions.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        {disabledActions.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {/* Capabilities Tab */}
                {activeTab === 'capabilities' && (
                  <div className="space-y-6">
                    {CAPABILITY_GROUPS.map(group => (
                      <div key={group.id}>
                        <h4 className="font-medium text-sm text-slate-400 mb-3">{group.name}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {group.capabilities.map(cap => {
                            const value = resolvedCapabilities[cap.key]
                            const isOverridden = cap.key in overrides
                            
                            return (
                              <div 
                                key={cap.key} 
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  isOverridden ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-900/50'
                                }`}
                              >
                                <div>
                                  <span className="text-sm text-slate-300">{cap.label}</span>
                                  {isOverridden && (
                                    <span className="ml-2 text-xs text-amber-400">(overridden)</span>
                                  )}
                                </div>
                                {cap.type === 'boolean' ? (
                                  value ? (
                                    <span className="flex items-center gap-1 text-green-400">
                                      <Unlock className="w-4 h-4" /> Enabled
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <Lock className="w-4 h-4" /> Disabled
                                    </span>
                                  )
                                ) : cap.type === 'number' ? (
                                  <span className="text-cyan-400 font-medium">
                                    {value === null ? '∞' : `${value}${cap.unit ? ` ${cap.unit}` : ''}`}
                                  </span>
                                ) : cap.type === 'string[]' ? (
                                  <span className="text-cyan-400">
                                    {Array.isArray(value) ? `${value.length} items` : '—'}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">—</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Allowed Suites */}
                    <div>
                      <h4 className="font-medium text-sm text-slate-400 mb-3">Allowed Suites</h4>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SUITES.map(suite => {
                          const isAllowed = resolvedCapabilities.allowedSuites.includes(suite.id)
                          const isRestricted = resolvedCapabilities.restrictedSuites.includes(suite.id)
                          
                          return (
                            <span
                              key={suite.id}
                              className={`px-3 py-1.5 rounded-lg text-sm ${
                                isRestricted
                                  ? 'bg-red-500/20 text-red-400 line-through'
                                  : isAllowed
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-slate-700 text-slate-500'
                              }`}
                            >
                              {suite.name}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400 mb-4">
                        Based on resolved capabilities, this partner configuration can access the following pricing models:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {PRICING_MODELS.map(model => {
                          const isAvailable = availablePricingModels.some((m: any) => m.id === model.id)
                          const reason = !isAvailable && model.type === 'custom' 
                            ? 'Requires canCreatePricingModels' 
                            : !model.isActive 
                              ? 'Model is inactive' 
                              : null
                          
                          return (
                            <div 
                              key={model.id}
                              className={`p-3 rounded-lg border ${
                                isAvailable
                                  ? 'bg-green-500/10 border-green-500/30'
                                  : 'bg-slate-800 border-slate-600 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{model.name}</span>
                                {isAvailable ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <X className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 capitalize">{model.type}</p>
                              {reason && (
                                <p className="text-xs text-red-400 mt-1">{reason}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-3">Pricing Limits</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Max Discount</p>
                          <p className="text-lg font-bold text-cyan-400">{resolvedCapabilities.maxDiscountPercent}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Can Apply Discounts</p>
                          <p className="text-lg font-bold">
                            {resolvedCapabilities.canApplyDiscounts ? (
                              <span className="text-green-400">Yes</span>
                            ) : (
                              <span className="text-red-400">No</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Can View Facts</p>
                          <p className="text-lg font-bold">
                            {resolvedCapabilities.canViewPricingFacts ? (
                              <span className="text-green-400">Yes</span>
                            ) : (
                              <span className="text-red-400">No</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disabled Actions Tab */}
                {activeTab === 'disabled' && (
                  <div className="space-y-4">
                    {disabledActions.length === 0 ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                        <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
                        <p className="text-green-400 font-medium">No Explicitly Disabled Actions</p>
                        <p className="text-sm text-slate-400 mt-1">
                          This configuration has full access within its capability scope.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-400">
                                {disabledActions.length} Action{disabledActions.length !== 1 ? 's' : ''} Disabled
                              </p>
                              <p className="text-sm text-red-200/70 mt-1">
                                The following actions are not available for this partner configuration:
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {disabledActions.map((item, i) => (
                            <div 
                              key={i}
                              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Lock className="w-4 h-4 text-red-400" />
                                <span className="text-slate-300">{item.action}</span>
                              </div>
                              <span className="text-xs text-slate-500">{item.reason}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Select Partner Type and Category</p>
              <p className="text-sm mt-1">Choose a configuration above to preview resolved capabilities.</p>
            </div>
          )}
        </div>

        {/* Footer - What This Tool Does NOT Do */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 shrink-0">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5" />
            <div className="text-xs text-slate-500">
              <strong className="text-slate-400">What this tool does NOT do:</strong>
              <span className="ml-2">
                Persist data • Modify registries • Simulate billing/pricing execution • Work outside Super Admin context
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
