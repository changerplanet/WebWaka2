'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Megaphone, 
  Mail,
  MessageSquare,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Send,
  Calendar,
  Zap,
  PieChart
} from 'lucide-react'

interface MarketingStats {
  activeCampaigns: number
  totalReach: number
  emailsSent: number
  openRate: string
  clickRate: string
  conversions: number
}

interface CampaignSummary {
  id: string
  name: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'SOCIAL'
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  reach: number
  engagement: string
  startDate: string
}

export default function MarketingDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<MarketingStats | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (tenantSlug) {
      fetchMarketingData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug])

  async function fetchMarketingData() {
    try {
      setRefreshing(true)
      
      // Simulate API call - replace with actual endpoints when available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStats({
        activeCampaigns: 0,
        totalReach: 0,
        emailsSent: 0,
        openRate: '0%',
        clickRate: '0%',
        conversions: 0
      })
      setCampaigns([])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch marketing data:', err)
      setError('Failed to load marketing data. Make sure the marketing module is activated.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
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

  function getTypeIcon(type: string) {
    switch (type) {
      case 'EMAIL': return <Mail className="w-4 h-4" />
      case 'SMS': return <MessageSquare className="w-4 h-4" />
      case 'PUSH': return <Zap className="w-4 h-4" />
      default: return <Megaphone className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="marketing-dashboard-loading">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading marketing dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="marketing-dashboard-error">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Marketing</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => router.push(`/dashboard?tenant=${tenantSlug}`)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              ← Go Back
            </button>
            <button 
              onClick={fetchMarketingData}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="marketing-dashboard">
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
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800">Marketing Automation</h1>
                  <p className="text-sm text-slate-500">Campaigns & Engagement</p>
                </div>
              </div>
            </div>
            <button 
              onClick={fetchMarketingData}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="active-campaigns-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Campaigns</p>
            <p className="text-2xl font-bold text-slate-800">{stats?.activeCampaigns || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="total-reach-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Reach</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.totalReach || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="open-rate-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Open Rate</p>
            <p className="text-2xl font-bold text-green-600">{stats?.openRate || '0%'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="conversions-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Conversions</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.conversions || 0}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200" data-testid="campaigns-list">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Recent Campaigns</h2>
                <a 
                  href={`/dashboard/marketing/campaigns?tenant=${tenantSlug}`}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  View All →
                </a>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                          {getTypeIcon(campaign.type)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{campaign.name}</p>
                          <p className="text-sm text-slate-500">{campaign.type} • {campaign.reach} reached</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{campaign.engagement} engagement</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p>No campaigns yet</p>
                  <a 
                    href={`/dashboard/marketing/campaigns/new?tenant=${tenantSlug}`}
                    className="text-sm text-pink-600 hover:text-pink-700 mt-2 inline-block"
                  >
                    Create your first campaign →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="email-stats-card">
              <h2 className="font-semibold text-slate-800 mb-4">Email Performance</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Emails Sent</span>
                  <span className="font-semibold text-slate-800">{stats?.emailsSent || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Click Rate</span>
                  <span className="font-semibold text-slate-800">{stats?.clickRate || '0%'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6" data-testid="quick-actions-card">
              <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { icon: Send, label: 'New Campaign', href: `/dashboard/marketing/campaigns/new?tenant=${tenantSlug}` },
                  { icon: Mail, label: 'Email Templates', href: `/dashboard/marketing/templates?tenant=${tenantSlug}` },
                  { icon: Target, label: 'Audiences', href: `/dashboard/marketing/audiences?tenant=${tenantSlug}` },
                  { icon: Calendar, label: 'Automations', href: `/dashboard/marketing/automations?tenant=${tenantSlug}` },
                  { icon: BarChart3, label: 'Analytics', href: `/dashboard/marketing/analytics?tenant=${tenantSlug}` },
                  { icon: PieChart, label: 'A/B Tests', href: `/dashboard/marketing/ab-tests?tenant=${tenantSlug}` },
                ].map((action, i) => (
                  <a
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                      <action.icon className="w-4 h-4 text-slate-500 group-hover:text-pink-600" />
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
