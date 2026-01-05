'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, AlertCircle, Building2, ShoppingCart } from 'lucide-react'

function POSContent({ children }: { children: ReactNode }) {
  const { user, activeTenantId, activeTenant, isLoading, isAuthenticated, switchTenant } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      // Wait for auth to load
      if (isLoading) return

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // If no tenant selected and user has memberships
      if (!activeTenantId && user && user.memberships.length > 0) {
        // If only one membership, auto-select
        if (user.memberships.length === 1) {
          await switchTenant(user.memberships[0].tenantId)
        } else {
          // Multiple memberships - redirect to select
          router.push('/select-tenant?redirect=/pos')
          return
        }
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, activeTenantId, user, router, switchTenant])

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading POS...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

  // No tenant selected but user has memberships
  if (!activeTenantId && user && user.memberships.length > 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-4">Select a Business</h2>
          <p className="text-gray-600 text-center mb-6">
            Choose which business to open in POS
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Business Access</h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have access to any businesses yet. Contact your administrator to get POS access.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default function POSLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <POSContent>
        {children}
      </POSContent>
    </AuthProvider>
  )
}
