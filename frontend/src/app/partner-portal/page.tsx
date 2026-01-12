'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import {
  Handshake,
  Link2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Plus,
  Eye,
  ExternalLink,
  Target,
  Users,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  MousePointer,
  UserPlus,
  ShoppingCart,
  Calendar,
} from 'lucide-react'

interface PartnerProfile {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  slug: string
  createdAt: string
  profile?: {
    partnerType: string
    totalReferrals: number
    totalEarnings: string
    pendingEarnings: string
    industries: string[]
    regionsServed: string[]
  }
  verification?: {
    status: string
    documentType: string | null
    verifiedAt: string | null
  }
}

interface ReferralLink {
  id: string
  code: string
  name: string | null
  clicks: number
  signups: number
  conversions: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

interface Attribution {
  id: string
  tenantId: string
  tenantSlug: string | null
  status: string
  attributedAt: string
  firstSubscription: string | null
}

interface CommissionRecord {
  id: string
  eventType: string
  eventDate: string
  grossAmount: string
  commissionRate: string
  commissionAmount: string
  currency: string
  status: string
  createdAt: string
}

interface EarningsSummary {
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  readyForPayout: number
  byStatus: Record<string, { count: number; amount: number }>
  byEventType: Record<string, { count: number; amount: number }>
}

export default function PartnerPortal() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([])
  const [attributions, setAttributions] = useState<Attribution[]>([])
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [showCreateLink, setShowCreateLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Retry fetch with exponential backoff
  const fetchWithRetry = useCallback(async (
    fetchFn: () => Promise<Response>,
    retries: number = 3,
    baseDelay: number = 1000
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetchFn();
        if (response.ok) {
          return response;
        }
        // If response is not ok but not a server error, don't retry
        if (response.status < 500) {
          return response;
        }
        throw new Error(`Server error: ${response.status}`);
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }, []);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Phase 14B: Auth-state driven effect - fetchSession intentionally excluded to prevent duplicate fetches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Check if session already has partner info
      fetchSession()
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false)
      setError('Authentication required')
    }
  }, [authLoading, isAuthenticated, user])

  const fetchSession = async () => {
    try {
      const res = await fetchWithRetry(() => fetch('/api/auth/session'), 3, 500);
      const data = await res.json()
      
      if (data.success && data.user?.isPartner && data.user?.partner?.id) {
        setPartnerId(data.user.partner.id)
        setRetryCount(0) // Reset retry count on success
      } else {
        // Fallback to searching by email
        await fetchInitialPartner()
      }
    } catch (err) {
      console.error('Error fetching session:', err)
      // Retry the session fetch with backoff
      if (retryCount < maxRetries) {
        const delay = 1000 * Math.pow(2, retryCount);
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          fetchSession();
        }, delay);
      } else {
        await fetchInitialPartner()
      }
    }
  }

  const fetchInitialPartner = async () => {
    try {
      // First try to find partner by user email
      if (user?.email) {
        const userPartnerRes = await fetchWithRetry(
          () => fetch(`/api/partner?action=partners&search=${encodeURIComponent(user.email)}&limit=1`),
          2,
          500
        );
        const userPartnerData = await userPartnerRes.json()
        
        if (userPartnerData.partners && userPartnerData.partners.length > 0) {
          setPartnerId(userPartnerData.partners[0].id)
          return
        }
      }
      
      // Fallback: Get list of partners and use the first active one
      const res = await fetchWithRetry(
        () => fetch('/api/partner?action=partners&status=ACTIVE&limit=1'),
        2,
        500
      );
      const data = await res.json()
      
      if (data.partners && data.partners.length > 0) {
        setPartnerId(data.partners[0].id)
      } else {
        // No active partners, try any partner
        const allRes = await fetchWithRetry(
          () => fetch('/api/partner?action=partners&limit=1'),
          2,
          500
        );
        const allData = await allRes.json()
        if (allData.partners && allData.partners.length > 0) {
          setPartnerId(allData.partners[0].id)
        } else {
          setError('No partner account found. Please apply to become a partner.')
          setLoading(false)
        }
      }
    } catch (err: any) {
      console.error('Error fetching partner:', err)
      setError(err.message || 'Failed to load partner')
      setLoading(false)
    }
  }

  // Phase 14B: Wrapped in useCallback - triggers on partnerId change
  const fetchPartnerData = useCallback(async () => {
    if (!partnerId) return
    
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel with individual error handling
      const [partnerRes, linksRes, attributionsRes, commissionsRes, earningsRes] = await Promise.allSettled([
        fetchWithRetry(() => fetch(`/api/partner?action=partner&partnerId=${partnerId}`), 2, 500),
        fetchWithRetry(() => fetch(`/api/partner?action=referral-links&partnerId=${partnerId}`), 2, 500),
        fetchWithRetry(() => fetch(`/api/partner?action=attributions&partnerId=${partnerId}&limit=10`), 2, 500),
        fetchWithRetry(() => fetch(`/api/partner?action=commissions&partnerId=${partnerId}&limit=10`), 2, 500),
        fetchWithRetry(() => fetch(`/api/partner?action=earnings-summary&partnerId=${partnerId}`), 2, 500),
      ]);

      // Process partner data (required)
      if (partnerRes.status === 'fulfilled') {
        const partnerData = await partnerRes.value.json();
        if (partnerData.partner) {
          setPartner(partnerData.partner);
        }
      } else {
        console.error('Failed to fetch partner profile:', partnerRes.reason);
      }

      // Process referral links (optional)
      if (linksRes.status === 'fulfilled') {
        const linksData = await linksRes.value.json();
        if (linksData.referralLinks) {
          setReferralLinks(linksData.referralLinks);
        }
      }

      // Process attributions (optional)
      if (attributionsRes.status === 'fulfilled') {
        const attributionsData = await attributionsRes.value.json();
        if (attributionsData.attributions) {
          setAttributions(attributionsData.attributions);
        }
      }

      // Process commissions (optional)
      if (commissionsRes.status === 'fulfilled') {
        const commissionsData = await commissionsRes.value.json();
        if (commissionsData.records) {
          setCommissions(commissionsData.records);
        }
      }

      // Process earnings (optional)
      if (earningsRes.status === 'fulfilled') {
        const earningsData = await earningsRes.value.json();
        if (earningsData.summary) {
          setEarnings(earningsData.summary);
        }
      }

    } catch (err: any) {
      console.error('Partner data fetch error:', err);
      setError(err.message || 'Failed to load partner data')
    } finally {
      setLoading(false)
    }
  }, [partnerId, fetchWithRetry])

  useEffect(() => {
    if (partnerId) {
      fetchPartnerData()
    }
  }, [partnerId, fetchPartnerData])

  const createReferralLink = async () => {
    if (!partnerId || !newLinkName.trim()) return

    try {
      const res = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-referral-link',
          partnerId,
          name: newLinkName.trim(),
        }),
      })
      const data = await res.json()
      
      if (data.success) {
        setShowCreateLink(false)
        setNewLinkName('')
        fetchPartnerData()
      } else {
        alert(data.error || 'Failed to create link')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create link')
    }
  }

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/signup-v2?ref=${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
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
      case 'CONVERTED':
      case 'VERIFIED':
      case 'PAID':
      case 'EARNED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
      case 'ATTRIBUTED':
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
      case 'CHURNED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center" data-testid="partner-portal-loading">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          <p className="text-gray-600">Loading Partner Portal...</p>
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center" data-testid="partner-portal-error">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Portal</h2>
          <p className="text-gray-600 mb-4">{error || 'Partner not found'}</p>
          <button
            onClick={() => { setError(null); fetchInitialPartner(); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const totalStats = {
    clicks: referralLinks.reduce((sum, l) => sum + l.clicks, 0),
    signups: referralLinks.reduce((sum, l) => sum + l.signups, 0),
    conversions: referralLinks.reduce((sum, l) => sum + l.conversions, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100" data-testid="partner-portal">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Handshake className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Portal</h1>
                <p className="text-sm text-gray-500">Welcome back, {partner.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(partner.status)}`}>
                {partner.status}
              </span>
              <button
                onClick={fetchPartnerData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                data-testid="refresh-button"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-testid="earnings-overview">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings?.totalEarnings || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(earnings?.pendingEarnings || 0)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ready for Payout</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(earnings?.readyForPayout || 0)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Out</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings?.paidEarnings || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-testid="referral-stats">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Total Clicks</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalStats.clicks.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-500">Total Signups</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalStats.signups.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-500">Conversions</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalStats.conversions.toLocaleString()}</p>
          </div>
        </div>

        {/* Referral Links */}
        <div className="bg-white rounded-xl shadow-sm mb-8" data-testid="referral-links-section">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-green-600" />
                My Referral Links
              </h2>
              <button
                onClick={() => setShowCreateLink(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                data-testid="create-link-button"
              >
                <Plus className="w-4 h-4" />
                Create New Link
              </button>
            </div>
          </div>

          {/* Create Link Modal */}
          {showCreateLink && (
            <div className="p-6 bg-green-50 border-b border-green-100">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Link name (e.g., Facebook Campaign)"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  data-testid="new-link-name-input"
                />
                <button
                  onClick={createReferralLink}
                  disabled={!newLinkName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowCreateLink(false); setNewLinkName(''); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {referralLinks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Link2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No referral links yet. Create one to start earning!</p>
              </div>
            ) : (
              referralLinks.map((link) => (
                <div key={link.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{link.name || 'Unnamed Link'}</p>
                        {!link.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">{link.code}</code>
                        <button
                          onClick={() => copyToClipboard(link.code)}
                          className="text-green-600 hover:text-green-700"
                          title="Copy link"
                        >
                          {copiedCode === link.code ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{link.clicks}</p>
                        <p className="text-xs text-gray-500">Clicks</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{link.signups}</p>
                        <p className="text-xs text-gray-500">Signups</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-600">{link.conversions}</p>
                        <p className="text-xs text-gray-500">Conversions</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attributed Customers */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="attributions-section">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Attributed Customers
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {attributions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No customers attributed yet</p>
                </div>
              ) : (
                attributions.map((attr) => (
                  <div key={attr.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{attr.tenantSlug || attr.tenantId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          Attributed {new Date(attr.attributedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(attr.status)}`}>
                        {attr.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Commission History */}
          <div className="bg-white rounded-xl shadow-sm" data-testid="commissions-section">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Commission History
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {commissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No commissions yet</p>
                </div>
              ) : (
                commissions.map((commission) => (
                  <div key={commission.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{commission.eventType.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(commission.eventDate).toLocaleDateString()} • {commission.commissionRate}% rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(commission.commissionAmount)}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)}`}>
                          {commission.status}
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
