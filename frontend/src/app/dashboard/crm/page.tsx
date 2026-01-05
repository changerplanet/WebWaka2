'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Users, 
  Heart, 
  Megaphone,
  TrendingUp,
  UserPlus,
  UserMinus,
  Star,
  Gift,
  Target,
  Activity,
  RefreshCw,
  AlertTriangle,
  Crown,
  Zap
} from 'lucide-react'

interface DashboardMetrics {
  totalCustomers: number
  activeCustomers: number
  atRiskCustomers: number
  newCustomersThisMonth: number
  loyaltyProgram: LoyaltyProgramInfo | null
  topSegments: SegmentInfo[]
  activeCampaigns: CampaignInfo[]
  recentEngagements: EngagementInfo[]
}

interface LoyaltyProgramInfo {
  name: string
  pointsName: string
  totalPointsIssued: number
  totalPointsRedeemed: number
  membersByTier: { tier: string; count: number }[]
}

interface SegmentInfo {
  id: string
  name: string
  slug: string
  memberCount: number
  priority: number
}

interface CampaignInfo {
  id: string
  name: string
  status: string
  campaignType: string
  sentCount: number
  openedCount: number
}

interface EngagementInfo {
  id: string
  eventType: string
  channel: string | null
  description: string | null
  monetaryValue: string | null
  occurredAt: string
}

export default function CrmDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchDashboardData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchDashboardData() {
    try {
      setRefreshing(true)
      
      // Check if CRM is initialized
      const configRes = await fetch('/api/crm')
      if (configRes.ok) {
        const configData = await configRes.json()
        setInitialized(configData.initialized)
        
        if (!configData.initialized) {
          setError('CRM module not initialized. Please initialize it first.')
          setLoading(false)
          setRefreshing(false)
          return
        }
      }

      // Fetch data in parallel
      const [segmentsRes, loyaltyRes, campaignsRes, engagementRes] = await Promise.all([
        fetch('/api/crm/segments?limit=5'),
        fetch('/api/crm/loyalty'),
        fetch('/api/crm/campaigns?status=ACTIVE&limit=5'),
        fetch('/api/crm/engagement'),
      ])

      // Process segments
      let topSegments: SegmentInfo[] = []
      let totalCustomers = 0
      let activeCustomers = 0
      let atRiskCustomers = 0
      let newCustomersThisMonth = 0

      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json()
        topSegments = segmentsData.segments?.slice(0, 5) || []
        
        // Find specific segments for stats
        const activeSegment = segmentsData.segments?.find((s: SegmentInfo) => s.slug === 'active-customers')
        const atRiskSegment = segmentsData.segments?.find((s: SegmentInfo) => s.slug === 'at-risk-customers')
        const newSegment = segmentsData.segments?.find((s: SegmentInfo) => s.slug === 'new-customers')
        
        activeCustomers = activeSegment?.memberCount || 0
        atRiskCustomers = atRiskSegment?.memberCount || 0
        newCustomersThisMonth = newSegment?.memberCount || 0
        
        // Estimate total from all segments
        totalCustomers = segmentsData.segments?.reduce((sum: number, s: SegmentInfo) => 
          Math.max(sum, s.memberCount), 0) || 0
      }

      // Process loyalty
      let loyaltyProgram: LoyaltyProgramInfo | null = null
      if (loyaltyRes.ok) {
        const loyaltyData = await loyaltyRes.json()
        if (loyaltyData.name) {
          loyaltyProgram = {
            name: loyaltyData.name,
            pointsName: loyaltyData.pointsName || 'Points',
            totalPointsIssued: loyaltyData._count?.transactions || 0,
            totalPointsRedeemed: 0,
            membersByTier: [
              { tier: 'Bronze', count: 0 },
              { tier: 'Silver', count: 0 },
              { tier: 'Gold', count: 0 },
              { tier: 'Platinum', count: 0 },
            ],
          }
        }
      }

      // Process campaigns
      let activeCampaigns: CampaignInfo[] = []
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        activeCampaigns = campaignsData.campaigns?.slice(0, 5) || []
      }

      // Process engagement analytics
      let recentEngagements: EngagementInfo[] = []
      if (engagementRes.ok) {
        const engagementData = await engagementRes.json()
        recentEngagements = engagementData.recentEngagements || []
      }

      setMetrics({
        totalCustomers,
        activeCustomers,
        atRiskCustomers,
        newCustomersThisMonth,
        loyaltyProgram,
        topSegments,
        activeCampaigns,
        recentEngagements,
      })
      setError(null)
    } catch (err) {
      console.error('Failed to fetch CRM dashboard data:', err)
      setError('Failed to load CRM data. Make sure the CRM module is initialized.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function initializeCrm() {
    try {
      setLoading(true)
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'initialize',
          initializeLoyalty: true,
          loyaltyProgramName: 'Customer Rewards',
        }),
      })
      
      if (res.ok) {
        setInitialized(true)
        fetchDashboardData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to initialize CRM')
      }
    } catch (err) {
      setError('Failed to initialize CRM module')
    } finally {
      setLoading(false)
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700'
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      case 'COMPLETED': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getEventTypeIcon(eventType: string) {
    switch (eventType) {
      case 'PURCHASE': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'SIGNUP': return <UserPlus className="w-4 h-4 text-blue-500" />
      case 'LOYALTY_EARN': return <Star className="w-4 h-4 text-yellow-500" />
      case 'LOYALTY_REDEEM': return <Gift className="w-4 h-4 text-purple-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="crm-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading CRM dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="crm-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">CRM Not Initialized</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={initializeCrm}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Initialize CRM
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="crm-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid="back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">CRM Dashboard</h1>
                  <p className="text-sm text-slate-500">Customer Engagement</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              data-testid="refresh-dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Customers */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="active-customers-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Customers</p>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(metrics?.activeCustomers || 0)}</p>
          </div>

          {/* New This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="new-customers-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                This Month
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">New Customers</p>
            <p className="text-2xl font-bold text-slate-800">{formatNumber(metrics?.newCustomersThisMonth || 0)}</p>
          </div>

          {/* At Risk */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="at-risk-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                60-90 days
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">At-Risk Customers</p>
            <p className="text-2xl font-bold text-amber-600">{formatNumber(metrics?.atRiskCustomers || 0)}</p>
          </div>

          {/* Loyalty Program */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="loyalty-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              {metrics?.loyaltyProgram && (
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">Loyalty Program</p>
            <p className="text-2xl font-bold text-slate-800">
              {metrics?.loyaltyProgram?.name || 'Not Active'}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Segments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200" data-testid="segments-card">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Customer Segments</h2>
                <a 
                  href={`/dashboard/crm/segments?tenant=${tenantSlug}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {(metrics?.topSegments?.length || 0) > 0 ? (
                metrics?.topSegments?.map((segment) => (
                  <div key={segment.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{segment.name}</p>
                          <p className="text-xs text-slate-500">{segment.slug}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {formatNumber(segment.memberCount)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No segments created yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200" data-testid="campaigns-card">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Active Campaigns</h2>
                <a 
                  href={`/dashboard/crm/campaigns?tenant=${tenantSlug}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {(metrics?.activeCampaigns?.length || 0) > 0 ? (
                metrics?.activeCampaigns?.map((campaign) => (
                  <div key={campaign.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{campaign.name}</p>
                          <p className="text-xs text-slate-500">{campaign.campaignType}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No active campaigns</p>
                  <a 
                    href={`/dashboard/crm/campaigns/new?tenant=${tenantSlug}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                  >
                    Create campaign →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Loyalty */}
          <div className="space-y-6">
            {/* Loyalty Tiers */}
            {metrics?.loyaltyProgram && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="loyalty-tiers-card">
                <h2 className="font-semibold text-slate-800 mb-4">Loyalty Tiers</h2>
                <div className="space-y-3">
                  {[
                    { name: 'Platinum', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' },
                    { name: 'Gold', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                    { name: 'Silver', icon: Zap, color: 'text-slate-500', bg: 'bg-slate-100' },
                    { name: 'Bronze', icon: Heart, color: 'text-amber-600', bg: 'bg-amber-100' },
                  ].map((tier) => (
                    <div key={tier.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${tier.bg} flex items-center justify-center`}>
                          <tier.icon className={`w-3 h-3 ${tier.color}`} />
                        </div>
                        <span className="text-sm text-slate-700">{tier.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {metrics?.loyaltyProgram?.membersByTier?.find(t => t.tier === tier.name)?.count || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Target, label: 'Create Segment', href: `/dashboard/crm/segments/new?tenant=${tenantSlug}` },
                  { icon: Megaphone, label: 'New Campaign', href: `/dashboard/crm/campaigns/new?tenant=${tenantSlug}` },
                  { icon: Gift, label: 'Award Points', href: `/dashboard/crm/loyalty?tenant=${tenantSlug}` },
                  { icon: Users, label: 'View Customers', href: `/dashboard/customers?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
