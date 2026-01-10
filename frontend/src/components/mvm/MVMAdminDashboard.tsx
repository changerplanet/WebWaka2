'use client'

/**
 * MVM Admin Dashboard - Lagos Digital Market
 * 
 * Admin interface for managing the multi-vendor marketplace:
 * - Vendor approvals and management
 * - Commission overview
 * - Payout processing
 * - Marketplace configuration
 * 
 * @module components/mvm/admin
 * @canonical PC-SCP Phase S5
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Store,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Check,
  X,
  Ban,
  RefreshCw,
  Wallet,
  Settings,
  ChevronRight,
  Building2,
  BadgeCheck
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface MarketplaceStats {
  config: {
    marketplaceName: string
    commissionRate: number
    vatRate: number
    payoutCycleDays: number
  }
  vendors: {
    total: number
    pendingApproval: number
    active: number
    counts: Record<string, number>
  }
  orders: {
    last30Days: number
    revenue: number
  }
  commissions: {
    totalCommission: number
    totalPending: number
    totalCleared: number
    totalPaid: number
  }
  payouts: {
    eligibleVendors: number
    totalPayable: number
  }
}

interface Vendor {
  id: string
  name: string
  email: string
  phone?: string
  businessType?: string
  city?: string
  state?: string
  status: string
  isVerified: boolean
  totalSales: number
  totalOrders: number
  averageRating?: number
  tierName?: string
  createdAt: string
}

interface Commission {
  id: string
  vendorId: string
  vendorName?: string
  subOrderId: string
  saleAmount: number
  commissionAmount: number
  vendorPayout: number
  status: string
  createdAt: string
}

interface Payout {
  id: string
  vendorId: string
  vendorName?: string
  amount: number
  status: string
  payoutDate?: string
  createdAt: string
}

// ============================================================================
// API BASE
// ============================================================================

const API_BASE = '/api/commerce/mvm'
const TENANT_ID = 'demo-tenant-001'

// ============================================================================
// METRIC CARD
// ============================================================================

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBg, 
  iconColor,
  prefix = '',
  suffix = '',
  subValue
}: { 
  title: string
  value: string | number
  icon: any
  iconBg: string
  iconColor: string
  prefix?: string
  suffix?: string
  subValue?: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// VENDOR STATUS BADGE
// ============================================================================

function VendorStatusBadge({ status, isVerified }: { status: string; isVerified?: boolean }) {
  const config: Record<string, { bg: string; text: string }> = {
    PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700' },
    APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
    CHURNED: { bg: 'bg-slate-100', text: 'text-slate-700' }
  }
  
  const { bg, text } = config[status] || config.PENDING_APPROVAL
  
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {status.replace('_', ' ')}
      </span>
      {isVerified && (
        <BadgeCheck className="w-4 h-4 text-blue-500" />
      )}
    </div>
  )
}

// ============================================================================
// VENDOR ACTIONS MODAL
// ============================================================================

function VendorActionsModal({ 
  vendor, 
  onClose, 
  onAction 
}: { 
  vendor: Vendor
  onClose: () => void
  onAction: (action: string, reason?: string) => Promise<void>
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const handleAction = async (action: string, needsReason: boolean = false) => {
    if (needsReason && !reason) {
      setShowReasonInput(true)
      setPendingAction(action)
      return
    }
    
    setActionLoading(action)
    await onAction(action, reason)
    setActionLoading(null)
    setShowReasonInput(false)
    setReason('')
    setPendingAction(null)
  }

  const submitWithReason = async () => {
    if (pendingAction && reason) {
      await handleAction(pendingAction, false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" data-testid="vendor-actions-modal">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Manage Vendor</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Vendor Info */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{vendor.name}</p>
                  <p className="text-sm text-slate-500">{vendor.email}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Status</p>
                  <VendorStatusBadge status={vendor.status} isVerified={vendor.isVerified} />
                </div>
                <div>
                  <p className="text-slate-500">Total Sales</p>
                  <p className="font-semibold">₦{vendor.totalSales.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            {showReasonInput && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Reason for {pendingAction}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none resize-none"
                  rows={3}
                  data-testid="action-reason-input"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowReasonInput(false)
                      setPendingAction(null)
                      setReason('')
                    }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitWithReason}
                    disabled={!reason}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl font-medium"
                    data-testid="submit-reason-btn"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {!showReasonInput && (
              <div className="space-y-3">
                {vendor.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={!!actionLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid="approve-vendor-btn"
                    >
                      {actionLoading === 'approve' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      Approve Vendor
                    </button>
                    <button
                      onClick={() => handleAction('reject', true)}
                      disabled={!!actionLoading}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid="reject-vendor-btn"
                    >
                      {actionLoading === 'reject' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      Reject Vendor
                    </button>
                  </>
                )}

                {vendor.status === 'APPROVED' && (
                  <>
                    {!vendor.isVerified && (
                      <button
                        onClick={() => handleAction('verify')}
                        disabled={!!actionLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        data-testid="verify-vendor-btn"
                      >
                        {actionLoading === 'verify' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <BadgeCheck className="w-5 h-5" />
                        )}
                        Mark as Verified
                      </button>
                    )}
                    <button
                      onClick={() => handleAction('suspend', true)}
                      disabled={!!actionLoading}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      data-testid="suspend-vendor-btn"
                    >
                      {actionLoading === 'suspend' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Ban className="w-5 h-5" />
                      )}
                      Suspend Vendor
                    </button>
                  </>
                )}

                {vendor.status === 'SUSPENDED' && (
                  <button
                    onClick={() => handleAction('reinstate')}
                    disabled={!!actionLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="reinstate-vendor-btn"
                  >
                    {actionLoading === 'reinstate' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    Reinstate Vendor
                  </button>
                )}

                {vendor.status === 'REJECTED' && (
                  <button
                    onClick={() => handleAction('reapply')}
                    disabled={!!actionLoading}
                    className="w-full py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="reapply-vendor-btn"
                  >
                    {actionLoading === 'reapply' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    Allow Re-application
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// ADMIN MARKETPLACE DASHBOARD
// ============================================================================

export function MVMAdminDashboard() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'commissions' | 'payouts'>('overview')
  const [vendorFilter, setVendorFilter] = useState<string>('ALL')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch admin dashboard stats
      const dashRes = await fetch(`${API_BASE}/dashboard?tenantId=${TENANT_ID}`)
      const dashData = await dashRes.json()
      
      if (dashData.success) {
        setStats(dashData.data)
      }

      // Fetch vendors
      const vendorStatus = vendorFilter !== 'ALL' ? `&status=${vendorFilter}` : ''
      const vendorRes = await fetch(`${API_BASE}/vendors?tenantId=${TENANT_ID}${vendorStatus}`)
      const vendorData = await vendorRes.json()
      
      if (vendorData.success && vendorData.data?.vendors) {
        setVendors(vendorData.data.vendors.map((v: any) => ({
          ...v,
          totalSales: v.totalSales?.toNumber?.() ?? v.totalSales ?? 0
        })))
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e)
    } finally {
      setIsLoading(false)
    }
  }, [vendorFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle vendor action
  const handleVendorAction = async (action: string, reason?: string) => {
    if (!selectedVendor) return
    
    try {
      const body: any = {}
      if (reason) body.reason = reason
      
      const res = await fetch(
        `${API_BASE}/vendors/${selectedVendor.id}?tenantId=${TENANT_ID}&action=${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      )
      const data = await res.json()
      
      if (data.success) {
        setActionMessage({ type: 'success', text: `Vendor ${action} successful` })
        setSelectedVendor(null)
        fetchData()
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Action failed' })
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Network error' })
    }
    
    setTimeout(() => setActionMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="admin-loading">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="mvm-admin-dashboard">
      {/* Action Message */}
      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {actionMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {stats?.config.marketplaceName || 'Lagos Digital Market'}
            </h1>
            <p className="text-green-200">Admin Dashboard • Marketplace Management</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-white/20 rounded-lg text-sm">
              Commission: {stats?.config.commissionRate || 15}%
            </span>
            <span className="px-3 py-1.5 bg-white/20 rounded-lg text-sm">
              VAT: {stats?.config.vatRate || 7.5}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['overview', 'vendors', 'commissions', 'payouts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            data-testid={`tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Vendors"
              value={stats?.vendors.active || 0}
              icon={Store}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              subValue={`${stats?.vendors.pendingApproval || 0} pending approval`}
            />
            <MetricCard
              title="Orders (30 days)"
              value={stats?.orders.last30Days || 0}
              icon={ShoppingBag}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Revenue (30 days)"
              value={stats?.orders.revenue || 0}
              prefix="₦"
              icon={TrendingUp}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <MetricCard
              title="Commission Earned"
              value={stats?.commissions.totalCommission || 0}
              prefix="₦"
              icon={DollarSign}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Vendor Status Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Vendor Status</h3>
              <div className="space-y-3">
                {Object.entries(stats?.vendors.counts || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <VendorStatusBadge status={status} />
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Payout Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600">Eligible for Payout</p>
                      <p className="text-xl font-bold text-amber-700">
                        {stats?.payouts.eligibleVendors || 0} vendors
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Payable</span>
                  <span className="font-semibold text-slate-900">
                    ₦{(stats?.payouts.totalPayable || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pending Commission</span>
                  <span className="font-semibold text-slate-900">
                    ₦{(stats?.commissions.totalPending || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cleared (Ready)</span>
                  <span className="font-semibold text-emerald-600">
                    ₦{(stats?.commissions.totalCleared || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'SUSPENDED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setVendorFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  vendorFilter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                data-testid={`vendor-filter-${status}`}
              >
                {status === 'ALL' ? 'All Vendors' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {vendors.length === 0 ? (
              <div className="text-center py-16">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No vendors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">Vendor</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                      <th className="px-6 py-4 font-medium text-right">Sales</th>
                      <th className="px-6 py-4 font-medium text-right">Orders</th>
                      <th className="px-6 py-4 font-medium text-center">Rating</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr 
                        key={vendor.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                        data-testid={`vendor-row-${vendor.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Store className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{vendor.name}</p>
                              <p className="text-sm text-slate-500">{vendor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          ₦{vendor.totalSales.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-900">
                          {vendor.totalOrders}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {vendor.averageRating ? (
                            <span className="text-amber-600 font-medium">
                              {vendor.averageRating.toFixed(1)} ★
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <VendorStatusBadge status={vendor.status} isVerified={vendor.isVerified} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            data-testid={`manage-vendor-${vendor.id}`}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    ₦{(stats?.commissions.totalPending || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    ₦{(stats?.commissions.totalCleared || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">Cleared</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    ₦{(stats?.commissions.totalPaid || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">Paid Out</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Commission Processing</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Commissions automatically clear after the configured clearance period 
                  ({stats?.config.payoutCycleDays || 14} days). Cleared commissions are 
                  eligible for vendor payouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-8 h-8 text-emerald-200" />
              </div>
              <p className="text-3xl font-bold">
                ₦{(stats?.payouts.totalPayable || 0).toLocaleString()}
              </p>
              <p className="text-emerald-200 text-sm mt-1">Total Payable</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {stats?.payouts.eligibleVendors || 0}
              </p>
              <p className="text-slate-500 text-sm mt-1">Vendors Eligible</p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Payout Processing (Simulated)</h4>
                <p className="text-sm text-amber-700 mt-1">
                  In production, payouts would be processed through an integrated payment 
                  gateway. For this demo, payout actions are simulated to show the workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Actions Modal */}
      {selectedVendor && (
        <VendorActionsModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onAction={handleVendorAction}
        />
      )}
    </div>
  )
}
