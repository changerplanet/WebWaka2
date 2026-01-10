'use client'

/**
 * SUPER ADMIN - PARTNER TYPES MANAGEMENT
 * 
 * Manage partner type definitions and their default capabilities.
 * 
 * @phase Stop Point 2 - Super Admin Control Plane
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, ChevronDown, ChevronUp, Check, X,
  Building2, Shield, Church, GraduationCap, Loader2, Info
} from 'lucide-react'
import {
  PARTNER_TYPES,
  PARTNER_CATEGORIES,
  CAPABILITY_GROUPS,
  PartnerType,
} from '@/lib/partner-governance'

export default function PartnerTypesPage() {
  const router = useRouter()
  const [expandedType, setExpandedType] = useState<string | null>(null)

  const getTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'reseller': return Building2
      case 'system-integrator': return Shield
      case 'government-partner': return Shield
      case 'faith-partner': return Church
      case 'education-partner': return GraduationCap
      default: return Users
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
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Partner Types</h1>
              <p className="text-slate-400">Define partner classifications and default capabilities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Notice */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400">Partner Types</h3>
              <p className="text-sm text-blue-200/80 mt-1">
                Partner Types define the classification of partners (e.g., Reseller, System Integrator). 
                Each type has default capabilities that are inherited by partners of that type.
                Categories can override these defaults.
              </p>
            </div>
          </div>
        </div>

        {/* Partner Types List */}
        <div className="space-y-4">
          {PARTNER_TYPES.map((type) => {
            const Icon = getTypeIcon(type.id)
            const isExpanded = expandedType === type.id
            const allowedCategories = PARTNER_CATEGORIES.filter((c: any) => type.allowedCategories.includes(c.id))
            
            return (
              <div key={type.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Type Header */}
                <button
                  onClick={() => setExpandedType(isExpanded ? null : type.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition"
                  data-testid={`type-${type.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{type.name}</h3>
                      <p className="text-sm text-slate-400">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-slate-400">Allowed Categories</p>
                      <p className="text-white">{allowedCategories.length}</p>
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
                    {/* Allowed Categories */}
                    <div className="p-5 border-b border-slate-700">
                      <h4 className="font-medium mb-3 text-slate-300">Allowed Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {allowedCategories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
                          >
                            {cat.name} (Tier {cat.tier})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Default Capabilities */}
                    <div className="p-5">
                      <h4 className="font-medium mb-4 text-slate-300">Default Capabilities</h4>
                      <div className="grid grid-cols-2 gap-6">
                        {CAPABILITY_GROUPS.map((group) => (
                          <div key={group.id} className="space-y-2">
                            <h5 className="text-sm font-medium text-slate-400">{group.name}</h5>
                            <div className="space-y-1">
                              {group.capabilities.map((cap) => {
                                const value = type.defaultCapabilities[cap.key]
                                const hasValue = value !== undefined
                                
                                return (
                                  <div key={cap.key} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300">{cap.label}</span>
                                    {cap.type === 'boolean' ? (
                                      hasValue && value ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                      ) : hasValue ? (
                                        <X className="w-4 h-4 text-slate-500" />
                                      ) : (
                                        <span className="text-slate-500">—</span>
                                      )
                                    ) : cap.type === 'number' ? (
                                      <span className="text-green-400">
                                        {hasValue ? (value === null ? '∞' : `${value}${cap.unit ? ` ${cap.unit}` : ''}`) : '—'}
                                      </span>
                                    ) : cap.type === 'string[]' ? (
                                      <span className="text-green-400">
                                        {hasValue && Array.isArray(value) ? value.length : '—'}
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
                      </div>
                    </div>

                    {/* Allowed Suites */}
                    {type.defaultCapabilities.allowedSuites && (
                      <div className="p-5 border-t border-slate-700">
                        <h4 className="font-medium mb-3 text-slate-300">Allowed Suites</h4>
                        <div className="flex flex-wrap gap-2">
                          {(type.defaultCapabilities.allowedSuites as string[]).map((suite) => (
                            <span
                              key={suite}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm capitalize"
                            >
                              {suite}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="p-5 border-t border-slate-700 bg-slate-900/30">
                      <div className="flex items-center gap-6 text-xs text-slate-500">
                        <span>ID: <code className="text-slate-400">{type.id}</code></span>
                        <span>Created: {new Date(type.createdAt).toLocaleDateString()}</span>
                        <span>Created By: {type.createdBy}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="font-semibold mb-4">Partner Type Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">Type</th>
                  <th className="text-center py-3 px-4 text-slate-400">Categories</th>
                  <th className="text-center py-3 px-4 text-slate-400">Can Create Clients</th>
                  <th className="text-center py-3 px-4 text-slate-400">Can Assign Pricing</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Discount</th>
                  <th className="text-center py-3 px-4 text-slate-400">Max Trial Days</th>
                </tr>
              </thead>
              <tbody>
                {PARTNER_TYPES.map((type) => (
                  <tr key={type.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 font-medium">{type.name}</td>
                    <td className="py-3 px-4 text-center">{type.allowedCategories.length}</td>
                    <td className="py-3 px-4 text-center">
                      {type.defaultCapabilities.canCreateClients ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-500 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {type.defaultCapabilities.canAssignPricing ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-500 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {type.defaultCapabilities.maxDiscountPercent !== undefined 
                        ? `${type.defaultCapabilities.maxDiscountPercent}%`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {type.defaultCapabilities.maxTrialDays !== undefined 
                        ? `${type.defaultCapabilities.maxTrialDays} days`
                        : '—'}
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
