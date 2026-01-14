'use client'

/**
 * Admin Layout Guard
 * 
 * This layout enforces authorization for the Admin portal:
 * 1. Requires authentication (redirects to login if not authenticated)
 * 2. Requires SUPER_ADMIN global role (shows 403 if not SUPER_ADMIN)
 * 
 * SUPER_ADMIN is checked directly from the user's globalRole property
 * which is available in the session data from AuthProvider.
 */

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2 } from 'lucide-react'
import { Forbidden } from '@/components/Forbidden'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

function AdminContent({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      if (isLoading) return

      if (!isAuthenticated) {
        router.push('/login?redirect=/admin')
        return
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, router])

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect is in progress
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  // AUTHORIZATION CHECK: Only SUPER_ADMIN can access admin routes
  // The globalRole is stored in the user object from the session
  const isSuperAdmin = user?.globalRole === 'SUPER_ADMIN'

  if (!isSuperAdmin) {
    // AUTHORIZATION DENIED: User is not SUPER_ADMIN
    // Show 403 Forbidden component
    return (
      <Forbidden
        title="Admin Access Required"
        message="This area is restricted to platform administrators only."
        homeUrl="/dashboard"
      />
    )
  }

  // AUTHORIZED: User is SUPER_ADMIN
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <Breadcrumb />
      </div>
      {children}
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <AdminContent>
        {children}
      </AdminContent>
    </AuthProvider>
  )
}
