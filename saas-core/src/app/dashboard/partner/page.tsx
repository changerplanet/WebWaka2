'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Handshake,
  Link2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Eye,
  Award,
  Target,
  UserPlus,
  FileCheck,
  Percent,
  Banknote,
} from 'lucide-react'

interface PartnerStats {
  totalPartners: number
  activePartners: number
  pendingPartners: number
  totalAttributions: number
  pendingCommissions: number
}

interface PartnerConfig {
  programEnabled: boolean
  autoApproval: boolean
  minPayoutThreshold: string
  defaultCommission: string
  verificationRequired: boolean
}

interface Partner {
  id: string
  name: string
  email: string
  status: string
  slug: string
  createdAt: string
}

interface CommissionRecord {
  id: string
  partnerId: string
  eventType: string
  grossAmount: string
  commissionAmount: string
  status: string
  currency: string
  createdAt: string
}

interface ReferralLink {
  id: string
  partnerId: string
  code: string
  name: string | null
  clicks: number
  signups: number
  conversions: number
  isActive: boolean
  createdAt: string
}

interface PendingVerification {
  id: string
  partnerId: string
  documentType: string | null
  status: string
  createdAt: string
  partner?: Partner
}

export default function PartnerDashboard() {
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [config, setConfig] = useState<PartnerConfig | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPartnerData()
  }, [])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch module status
      const statusRes = await fetch('/api/partner?action=status')
      const statusData = await statusRes.json()
      
      if (statusData.statistics) {
        setStats(statusData.statistics)
      }
      if (statusData.config) {
        setConfig(statusData.config)
      }

      // Fetch partners
      const partnersRes = await fetch('/api/partner?action=partners&limit=10')
      const partnersData = await partnersRes.json()
      if (partnersData.partners) {
        setPartners(partnersData.partners)
      }

      // Fetch commissions
      const commissionsRes = await fetch('/api/partner?action=commissions&limit=10')
      const commissionsData = await commissionsRes.json()
      if (commissionsData.records) {
        setCommissions(commissionsData.records)
      }

      // Fetch pending verifications
      const verificationsRes = await fetch('/api/partner?action=pending-verifications&limit=5')
      const verificationsData = await verificationsRes.json()
      if (verificationsData.verifications) {
        setPendingVerifications(verificationsData.verifications)
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load partner data')
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'VERIFIED':
      case 'PAID':
      case 'EARNED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
      case 'SUSPENDED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="partner-dashboard-loading">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          <p className="text-gray-600">Loading Partner Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="partner-dashboard-error">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPartnerData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="partner-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Handshake className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
                <p className="text-sm text-gray-500">Manage Digital Transformation Partners</p>
              </div>
            </div>
            <button
              onClick={fetchPartnerData}
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
                <p className="text-sm font-medium text-gray-500">Total Partners</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPartners || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Partners</p>
                <p className="text-2xl font-bold text-green-600">{stats?.activePartners || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendingPartners || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Attributions</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.totalAttributions || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Commissions</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.pendingCommissions || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Banknote className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Config Summary */}
        {config && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8" data-testid="config-summary">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Program Configuration
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Program Status</p>
                <p className={`text-sm font-medium ${config.programEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {config.programEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Auto Approval</p>
                <p className={`text-sm font-medium ${config.autoApproval ? 'text-green-600' : 'text-yellow-600'}`}>
                  {config.autoApproval ? 'Yes' : 'Manual Review'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Default Commission</p>
                <p className="text-sm font-medium text-gray-900">{config.defaultCommission}%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Min Payout</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(config.minPayoutThreshold)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Verification</p>
                <p className={`text-sm font-medium ${config.verificationRequired ? 'text-yellow-600' : 'text-green-600'}`}>
                  {config.verificationRequired ? 'Required' : 'Optional'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Partners */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="recent-partners">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-600" />
                  Recent Partners
                </h2>
                <a href="/dashboard/partner/list" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {partners.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No partners yet</p>
                </div>
              ) : (
                partners.slice(0, 5).map((partner) => (
                  <div key={partner.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{partner.name}</p>
                        <p className="text-sm text-gray-500">{partner.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(partner.status)}`}>
                        {partner.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="pending-verifications">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-yellow-600" />
                  Pending Verifications
                </h2>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                  {pendingVerifications.length} pending
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingVerifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                  <p>No pending verifications</p>
                </div>
              ) : (
                pendingVerifications.map((verification) => (
                  <div key={verification.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{verification.partner?.name || 'Unknown Partner'}</p>
                        <p className="text-sm text-gray-500">
                          {verification.documentType || 'Document pending'} • {new Date(verification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white rounded-xl shadow-sm lg:col-span-2" data-testid="recent-commissions">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-purple-600" />
                  Recent Commissions
                </h2>
                <a href="/dashboard/partner/commissions" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No commission records yet</p>
                      </td>
                    </tr>
                  ) : (
                    commissions.slice(0, 5).map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{commission.eventType.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(commission.grossAmount)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(commission.commissionAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)}`}>
                            {commission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(commission.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
