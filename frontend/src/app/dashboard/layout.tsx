'use client'

import { ReactNode, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, AlertCircle, Building2, RefreshCw } from 'lucide-react'

// Loading timeout in ms
const LOADING_TIMEOUT = 10000

function DashboardContent({ children }: { children: ReactNode }) {
  const { user, activeTenantId, activeTenant, isLoading, isAuthenticated, switchTenant } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isInitializing, setIsInitializing] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const tenantSlug = searchParams.get('tenant')

  // Handle loading timeout with retry
  useEffect(() => {
    if (isLoading || isInitializing) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, LOADING_TIMEOUT)
      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
    }
  }, [isLoading, isInitializing])

  const handleRetry = useCallback(() => {
    setLoadingTimeout(false)
    setRetryCount(prev => prev + 1)
    window.location.reload()
  }, [])

  useEffect(() => {
    async function init() {
      // Wait for auth to load
      if (isLoading) return

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // If tenant slug in URL, try to switch to it
      if (tenantSlug && user) {
        const membership = user.memberships.find(m => m.tenantSlug === tenantSlug)
        if (membership && membership.tenantId !== activeTenantId) {
          await switchTenant(membership.tenantId)
        }
      }
      
      // If no tenant selected and user has memberships
      if (!activeTenantId && user && user.memberships.length > 0) {
        // If only one membership, auto-select
        if (user.memberships.length === 1) {
          await switchTenant(user.memberships[0].tenantId)
        } else if (!tenantSlug) {
          // Multiple memberships and no slug in URL - redirect to select
          router.push('/select-tenant')
          return
        }
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, activeTenantId, tenantSlug, user, router, switchTenant])

  // Loading state with timeout handling
  // Don't block if we have a tenant slug - let the page component handle its own loading
  if ((isLoading || isInitializing) && !tenantSlug) {
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading is taking longer than expected</h2>
            <p className="text-sm text-gray-600 mb-4">
              This might be due to a slow connection or temporary issue.
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  // No tenant selected but user has memberships
  if (!activeTenantId && user && user.memberships.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-4">Select a Business</h2>
          <p className="text-gray-600 text-center mb-6">
            Choose which business you want to access
          </p>
          <div className="space-y-2">
            {user.memberships.map(membership => (
              <button
                key={membership.tenantId}
                onClick={() => switchTenant(membership.tenantId)}
                className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{membership.tenantName}</p>
                <p className="text-sm text-gray-500">{membership.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // No memberships at all
  if (!activeTenantId && (!user || user.memberships.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Business Access</h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have access to any businesses yet. Contact your administrator to get access.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </AuthProvider>
  )
}
