'use client'

/**
 * Platform Instances Admin Page (Phase 2.1)
 * 
 * Dashboard page for managing platform instances.
 * Admin-only access.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Shield, Layers } from 'lucide-react'
import { InstanceAdminPage } from '@/components/platform-instance'

interface SessionUser {
  id: string
  email: string
  name: string | null
  globalRole: string
  memberships: { tenantId: string; tenantSlug: string; role: string }[]
}

interface TenantSettings {
  id: string
  name: string
  slug: string
  branding: {
    appName: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
}

export default function PlatformInstancesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantSlug = searchParams.get('tenant')
  
  const [user, setUser] = useState<SessionUser | null>(null)
  const [tenant, setTenant] = useState<TenantSettings | null>(null)
  const [activeCapabilities, setActiveCapabilities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Phase 12B: Wrapped in useCallback for hook hygiene
  const fetchData = useCallback(async () => {
    try {
      // Fetch session
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (!sessionData.authenticated) {
        router.push(`/login?redirect=/dashboard/platform-instances?tenant=${tenantSlug}`)
        return
      }
      
      setUser(sessionData.user)
      
      // Check user role
      const membership = sessionData.user.memberships.find(
        (m: any) => m.tenantSlug === tenantSlug
      )
      
      const isSuperAdmin = sessionData.user.globalRole === 'SUPER_ADMIN'
      const isAdmin = membership?.role === 'TENANT_ADMIN' || isSuperAdmin
      
      if (!isAdmin) {
        setError('Access denied. Only Tenant Admins can manage platform instances.')
        setLoading(false)
        return
      }
      
      // Fetch tenant settings
      const settingsRes = await fetch(`/api/tenants/${tenantSlug}/settings`)
      const settingsData = await settingsRes.json()
      
      if (!settingsData.success) {
        setError(settingsData.error || 'Failed to load tenant settings')
        setLoading(false)
        return
      }
      
      setTenant(settingsData.tenant)
      
      // Fetch active capabilities
      const capRes = await fetch('/api/capabilities/tenant')
      if (capRes.ok) {
        const capData = await capRes.json()
        const active = capData.capabilities
          ?.filter((c: { status: string }) => c.status === 'ACTIVE')
          ?.map((c: { key: string }) => c.key) || []
        setActiveCapabilities(active)
      }
      
      setLoading(false)
    } catch (err) {
      setError('Failed to load data')
      setLoading(false)
    }
  }, [tenantSlug, router])

  useEffect(() => {
    if (tenantSlug) {
      fetchData()
    } else {
      setError('No tenant specified')
      setLoading(false)
    }
  }, [tenantSlug, fetchData])
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Platform Instances</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <a href={`/dashboard?tenant=${tenantSlug}`} className="text-green-600 hover:text-green-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    )
  }
  
  if (!tenant) return null
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href={`/dashboard/settings?tenant=${tenantSlug}`}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Platform Instances
                </h1>
                <p className="text-sm text-slate-500">{tenant.branding.appName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="w-4 h-4" />
              <span>Tenant Admin</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InstanceAdminPage
          tenantSlug={tenantSlug!}
          tenantBranding={tenant.branding}
          activeCapabilities={activeCapabilities}
        />
      </div>
    </div>
  )
}
