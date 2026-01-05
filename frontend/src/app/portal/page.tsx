'use client'

/**
 * PHASE 4B: Client Portal
 * 
 * Partner-branded portal for clients:
 * - View active platforms
 * - Platform status
 * - Usage summaries
 * - Support contact (partner)
 * 
 * CLIENT CANNOT:
 * - Change pricing
 * - See WebWaka branding
 * - Activate capabilities
 * - Bypass partner
 */

import { useState, useEffect } from 'react'
import {
  Building2,
  Globe,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react'

interface Platform {
  id: string
  name: string
  domain: string | null
  status: 'active' | 'suspended'
  subscription: {
    status: string
    nextBillingDate: string | null
    trialEndsAt: string | null
  } | null
  operator: {
    name: string
    logo: string | null
    primaryColor: string | null
    supportEmail: string | null
    supportPhone: string | null
  } | null
}

interface PortalData {
  platforms: Platform[]
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

export default function ClientPortal() {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortalData()
  }, [])

  async function fetchPortalData() {
    try {
      setLoading(true)
      const res = await fetch('/api/client-portal')
      const result = await res.json()

      if (!result.success) {
        setError(result.error || 'Failed to load portal')
        return
      }

      setData(result)
    } catch (err) {
      setError('Failed to load portal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="portal-loading">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="portal-error">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Unable to Load Portal</h1>
          <p className="text-slate-600 mb-4">{error || 'Please try again later'}</p>
          <button
            onClick={fetchPortalData}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Get primary operator (first platform's partner)
  const primaryOperator = data.platforms[0]?.operator

  return (
    <div className="min-h-screen bg-slate-50" data-testid="client-portal">
      {/* Header - Partner Branded */}
      <header 
        className="bg-white border-b border-slate-200"
        style={primaryOperator?.primaryColor ? { borderBottomColor: primaryOperator.primaryColor } : {}}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {primaryOperator?.logo ? (
                <img 
                  src={primaryOperator.logo} 
                  alt={primaryOperator.name} 
                  className="h-10 w-auto"
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryOperator?.primaryColor || '#059669' }}
                >
                  {primaryOperator?.name?.[0] || 'P'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {primaryOperator?.name || 'Your Portal'}
                </h1>
                <p className="text-sm text-slate-500">Client Portal</p>
              </div>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p className="font-medium">{data.user.name || 'Welcome'}</p>
              <p>{data.user.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platforms */}
        <section className="mb-8" data-testid="platforms-section">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Your Platforms
          </h2>

          {data.platforms.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
              <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No platforms yet</h3>
              <p className="text-slate-600">
                Contact your service provider to set up your first platform.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {data.platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid={`platform-${platform.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{platform.name}</h3>
                        {platform.domain && (
                          <a
                            href={`https://${platform.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <Globe className="w-4 h-4" />
                            {platform.domain}
                          </a>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        platform.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {platform.status === 'active' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {platform.status === 'active' ? 'Active' : 'Suspended'}
                      </div>
                    </div>

                    {/* Subscription Info */}
                    {platform.subscription && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              platform.subscription.status === 'ACTIVE' 
                                ? 'bg-emerald-100 text-emerald-700'
                                : platform.subscription.status === 'TRIAL'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {platform.subscription.status}
                            </span>
                          </div>
                          
                          {platform.subscription.trialEndsAt && platform.subscription.status === 'TRIAL' && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              Trial ends: {new Date(platform.subscription.trialEndsAt).toLocaleDateString()}
                            </div>
                          )}
                          
                          {platform.subscription.nextBillingDate && platform.subscription.status === 'ACTIVE' && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              Next billing: {new Date(platform.subscription.nextBillingDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Support Contact */}
        {primaryOperator && (
          <section data-testid="support-section">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Need Help?</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-slate-600 mb-4">
                Contact <strong>{primaryOperator.name}</strong> for support with your platforms.
              </p>
              <div className="flex flex-wrap gap-4">
                {primaryOperator.supportEmail && (
                  <a
                    href={`mailto:${primaryOperator.supportEmail}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700"
                  >
                    <Mail className="w-4 h-4" />
                    {primaryOperator.supportEmail}
                  </a>
                )}
                {primaryOperator.supportPhone && (
                  <a
                    href={`tel:${primaryOperator.supportPhone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-700"
                  >
                    <Phone className="w-4 h-4" />
                    {primaryOperator.supportPhone}
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer - Partner Branded */}
      <footer className="mt-12 py-6 text-center text-sm text-slate-500">
        <p>
          Powered by {primaryOperator?.name || 'Your Service Provider'}
        </p>
      </footer>
    </div>
  )
}
