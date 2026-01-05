'use client'

import { useState, useEffect } from 'react'
import {
  Package,
  Plus,
  CreditCard,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Clock,
  Gift,
  Percent,
  Shield,
  BarChart3,
  FileText,
  Zap,
  Layers,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface BillingStats {
  totalBundles: number
  totalAddOns: number
  totalUsageMetrics: number
  totalDiscountRules: number
  totalGracePolicies: number
}

interface Bundle {
  id: string
  name: string
  slug: string
  description: string | null
  price: string
  currency: string
  billingInterval: string
  savingsPercent: string | null
  isActive: boolean
  isPromoted: boolean
  items: Array<{ moduleKey: string; moduleName: string | null }>
  createdAt: string
}

interface AddOn {
  id: string
  name: string
  slug: string
  description: string | null
  addOnType: string
  price: string
  currency: string
  billingInterval: string
  isQuantityBased: boolean
  unitName: string | null
  isActive: boolean
  createdAt: string
}

interface DiscountRule {
  id: string
  name: string
  code: string | null
  discountType: string
  value: string
  currentUses: number
  maxUses: number | null
  isActive: boolean
  validFrom: string | null
  validTo: string | null
  createdAt: string
}

interface GracePolicy {
  id: string
  name: string
  graceDays: number
  limitFeatures: boolean
  sendReminders: boolean
  suspendAfterGrace: boolean
  isDefault: boolean
  isActive: boolean
}

interface Adjustment {
  id: string
  tenantId: string
  type: string
  reason: string
  amount: string
  currency: string
  status: string
  createdAt: string
}

export default function BillingDashboard() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([])
  const [gracePolicies, setGracePolicies] = useState<GracePolicy[]>([])
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch module status
      const statusRes = await fetch('/api/billing?action=status')
      const statusData = await statusRes.json()
      
      if (statusData.globalStats) {
        setStats(statusData.globalStats)
      }

      // Fetch bundles
      const bundlesRes = await fetch('/api/billing?action=bundles')
      const bundlesData = await bundlesRes.json()
      if (bundlesData.bundles) {
        setBundles(bundlesData.bundles)
      }

      // Fetch add-ons
      const addOnsRes = await fetch('/api/billing?action=addons')
      const addOnsData = await addOnsRes.json()
      if (addOnsData.addOns) {
        setAddOns(addOnsData.addOns)
      }

      // Fetch discount rules
      const discountsRes = await fetch('/api/billing?action=discount-rules')
      const discountsData = await discountsRes.json()
      if (discountsData.rules) {
        setDiscountRules(discountsData.rules)
      }

      // Fetch grace policies
      const gracePoliciesRes = await fetch('/api/billing?action=grace-policies')
      const gracePoliciesData = await gracePoliciesRes.json()
      if (gracePoliciesData.policies) {
        setGracePolicies(gracePoliciesData.policies)
      }

      // Fetch adjustments
      const adjustmentsRes = await fetch('/api/billing?action=adjustments&limit=10')
      const adjustmentsData = await adjustmentsRes.json()
      if (adjustmentsData.adjustments) {
        setAdjustments(adjustmentsData.adjustments)
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
    }
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'APPLIED':
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="billing-dashboard-loading">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          <p className="text-gray-600">Loading Billing Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="billing-dashboard-error">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBillingData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="billing-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Billing Extensions</h1>
                <p className="text-sm text-gray-500">Bundles, Add-ons, Discounts & Grace Policies</p>
              </div>
            </div>
            <button
              onClick={fetchBillingData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              data-testid="refresh-button"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8" data-testid="stats-grid">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Bundles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalBundles || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Add-ons</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalAddOns || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Usage Metrics</p>
                <p className="text-2xl font-bold text-green-600">{stats?.totalUsageMetrics || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Discount Rules</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.totalDiscountRules || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Percent className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Grace Policies</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.totalGracePolicies || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bundles Section */}
        <div className="bg-white rounded-xl shadow-sm mb-8" data-testid="bundles-section">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Subscription Bundles
              </h2>
              <button className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                <Plus className="w-4 h-4" />
                Create Bundle
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bundle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bundles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No bundles created yet</p>
                    </td>
                  </tr>
                ) : (
                  bundles.map((bundle) => (
                    <tr key={bundle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{bundle.name}</p>
                          <p className="text-sm text-gray-500">{bundle.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {bundle.items.map(i => i.moduleName || i.moduleKey).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(bundle.price)}/{bundle.billingInterval.toLowerCase()}
                      </td>
                      <td className="px-6 py-4">
                        {bundle.savingsPercent && parseFloat(bundle.savingsPercent) > 0 ? (
                          <span className="text-sm font-medium text-green-600">
                            {bundle.savingsPercent}% off
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bundle.isActive)}`}>
                          {bundle.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {bundle.isPromoted && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Promoted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add-ons */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="addons-section">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Add-ons
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Create <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {addOns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No add-ons yet</p>
                </div>
              ) : (
                addOns.slice(0, 5).map((addOn) => (
                  <div key={addOn.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{addOn.name}</p>
                        <p className="text-sm text-gray-500">
                          {addOn.addOnType} • {formatCurrency(addOn.price)}/{addOn.billingInterval.toLowerCase()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(addOn.isActive)}`}>
                        {addOn.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discount Rules */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="discounts-section">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-600" />
                  Discount Rules
                </h2>
                <button className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
                  Create <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {discountRules.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Percent className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No discount rules yet</p>
                </div>
              ) : (
                discountRules.slice(0, 5).map((rule) => (
                  <div key={rule.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{rule.name}</p>
                        <p className="text-sm text-gray-500">
                          {rule.code && <span className="font-mono bg-gray-100 px-1 rounded mr-2">{rule.code}</span>}
                          {rule.discountType === 'PERCENTAGE' ? `${rule.value}% off` : formatCurrency(rule.value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.isActive)}`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {rule.currentUses}/{rule.maxUses || '∞'} uses
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grace Policies */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="grace-policies-section">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  Grace Policies
                </h2>
                <button className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                  Create <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {gracePolicies.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No grace policies yet</p>
                </div>
              ) : (
                gracePolicies.map((policy) => (
                  <div key={policy.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {policy.name}
                          {policy.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Default</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {policy.graceDays} days • 
                          {policy.limitFeatures ? ' Limited features' : ' Full access'} •
                          {policy.suspendAfterGrace ? ' Auto-suspend' : ' No suspend'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(policy.isActive)}`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Adjustments */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="adjustments-section">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Recent Adjustments
                </h2>
                <a href="/dashboard/billing/adjustments" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {adjustments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                  <p>No adjustments yet</p>
                </div>
              ) : (
                adjustments.slice(0, 5).map((adj) => (
                  <div key={adj.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{adj.type}</p>
                        <p className="text-sm text-gray-500">{adj.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(adj.amount)}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adj.status)}`}>
                          {adj.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
