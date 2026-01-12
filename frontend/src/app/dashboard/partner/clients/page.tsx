'use client'

/**
 * PHASE 4A: Partner Clients Dashboard Page
 * 
 * Main page for Partners to manage their client platforms.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Shield, Building2 } from 'lucide-react'
import { ClientManagement } from '@/components/partner'

interface PartnerInfo {
  id: string
  name: string
  slug: string
  status: string
}

export default function PartnerClientsPage() {
  const router = useRouter()
  const [partner, setPartner] = useState<PartnerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchPartnerInfo()
  }, [])
  
  async function fetchPartnerInfo() {
    try {
      // Check session and partner access
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated) {
        router.push('/login?redirect=/dashboard/partner/clients')
        return
      }
      
      // Get partner info from user's partner membership
      const partnerRes = await fetch('/api/partner/me')
      const partnerData = await partnerRes.json()
      
      if (!partnerData.success || !partnerData.partner) {
        setError('You must be a partner to access this page')
        setLoading(false)
        return
      }
      
      setPartner(partnerData.partner)
      setLoading(false)
    } catch (err) {
      setError('Failed to load partner information')
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }
  
  if (error || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Partner Access Required</h1>
          <p className="text-slate-600 mb-4">{error || 'You need partner access to view this page'}</p>
          <a href="/dashboard" className="text-green-600 hover:text-green-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href="/dashboard/partner"
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Client Platforms
                </h1>
                <p className="text-sm text-slate-500">{partner.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="w-4 h-4" />
              <span>Partner Admin</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientManagement partnerId={partner.id} />
      </div>
    </div>
  )
}
