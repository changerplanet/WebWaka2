'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Check,
  X,
  ChevronRight,
  Store,
  Globe,
  ShoppingBag,
  Package,
  Calculator,
  Users,
  Truck,
  BarChart3,
  Heart,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react'

interface CapabilitySuggestion {
  key: string
  name: string
  description: string
  icon: string
  isPrimary: boolean
}

interface IntentSuggestionsPanelProps {
  intentKey?: string
  tenantId?: string
  onDismiss?: () => void
  onActivate?: (capabilityKey: string) => void
}

const CAPABILITY_ICONS: Record<string, any> = {
  pos: Store,
  svm: Globe,
  mvm: ShoppingBag,
  inventory: Package,
  accounting: Calculator,
  crm: Users,
  logistics: Truck,
  analytics: BarChart3,
  hr_payroll: Users,
  procurement: Package,
  marketing: Zap,
  payments_wallets: Shield,
  compliance_tax: Shield,
  ai_automation: Sparkles,
  integrations_hub: Zap,
  hotel_management: Heart,
  partner_reseller: Users,
}

const CAPABILITY_INFO: Record<string, { name: string; description: string }> = {
  pos: { name: 'Point of Sale', description: 'Sell in your shop with one-tap checkout' },
  svm: { name: 'Online Store', description: 'Sell on WhatsApp and online' },
  mvm: { name: 'Marketplace', description: 'Run your own multi-vendor marketplace' },
  inventory: { name: 'Inventory', description: 'Track stock levels and movements' },
  accounting: { name: 'Accounting', description: 'Manage your finances and reports' },
  crm: { name: 'Customers', description: 'Track and engage with customers' },
  logistics: { name: 'Logistics', description: 'Manage deliveries and shipping' },
  analytics: { name: 'Analytics', description: 'Insights and business intelligence' },
  hr_payroll: { name: 'HR & Payroll', description: 'Manage employees and salaries' },
  procurement: { name: 'Procurement', description: 'Purchase orders and vendors' },
  marketing: { name: 'Marketing', description: 'Campaigns and promotions' },
  payments_wallets: { name: 'Payments', description: 'Accept payments and manage wallets' },
  compliance_tax: { name: 'Compliance', description: 'VAT tracking and reports' },
  ai_automation: { name: 'AI Assistant', description: 'Smart suggestions and automation' },
  integrations_hub: { name: 'Integrations', description: 'Connect to Paystack, GIG, etc.' },
  hotel_management: { name: 'Hotel Management', description: 'Rooms, reservations, guests' },
  partner_reseller: { name: 'Partner Portal', description: 'Resell and earn commissions' },
}

export default function IntentSuggestionsPanel({
  intentKey,
  tenantId,
  onDismiss,
  onActivate,
}: IntentSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [intentLabel, setIntentLabel] = useState<string>('')
  const [isDismissed, setIsDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (intentKey) {
      fetchSuggestions()
    } else {
      setLoading(false)
    }
  }, [intentKey])

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/intent?action=suggestions&key=${intentKey}`)
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setIntentLabel(data.intentLabel || '')
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleActivate = (capabilityKey: string) => {
    onActivate?.(capabilityKey)
  }

  if (isDismissed || !intentKey || loading || suggestions.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 mb-6" data-testid="intent-suggestions-panel">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Sparkles className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Suggested for You</h3>
            <p className="text-sm text-slate-400">
              Based on your goal: <span className="text-green-400">{intentLabel}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1"
          title="Dismiss suggestions"
          data-testid="dismiss-suggestions-btn"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((capKey, index) => {
          const IconComponent = CAPABILITY_ICONS[capKey] || Package
          const info = CAPABILITY_INFO[capKey] || { name: capKey, description: '' }
          const isPrimary = index === 0

          return (
            <div
              key={capKey}
              className={`rounded-xl p-4 border transition-all ${
                isPrimary
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
              }`}
              data-testid={`suggestion-${capKey}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isPrimary ? 'bg-green-500/30' : 'bg-slate-700/50'}`}>
                  <IconComponent className={`h-5 w-5 ${isPrimary ? 'text-green-400' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${isPrimary ? 'text-green-400' : 'text-white'}`}>
                      {info.name}
                    </p>
                    {isPrimary && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-green-500/30 text-green-400 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{info.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleActivate(capKey)}
                className={`w-full mt-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                  isPrimary
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                }`}
                data-testid={`activate-${capKey}-btn`}
              >
                Activate
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Note */}
      <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
        <Shield className="h-3 w-3" />
        You can always change or add capabilities later from the Capabilities dashboard.
      </p>
    </div>
  )
}
