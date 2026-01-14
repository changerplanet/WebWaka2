'use client'

/**
 * Partner Portal Layout Guard
 * 
 * This layout enforces authorization for the Partner Portal:
 * 1. Requires authentication (redirects to login if not authenticated)
 * 2. Requires Partner role (shows 403 if user is not a Partner member)
 * 
 * The authorization check calls /api/partner/me to verify the user
 * has an active PartnerUser record with a valid Partner role.
 */

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2 } from 'lucide-react'
import { Forbidden } from '@/components/Forbidden'

function PartnerPortalContent({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [isPartnerUser, setIsPartnerUser] = useState<boolean | null>(null)
  const [partnerCheckComplete, setPartnerCheckComplete] = useState(false)

  useEffect(() => {
    async function init() {
      if (isLoading) return

      if (!isAuthenticated) {
        router.push('/login?redirect=/partner-portal')
        return
      }

      // AUTHORIZATION CHECK: Verify user has Partner role
      // This calls an API endpoint that checks the PartnerUser table
      // to confirm the user is an active member of a Partner organization
      try {
        const res = await fetch('/api/partner/me')
        if (res.ok) {
          const data = await res.json()
          // User is a Partner member if the API returns success and partner data
          setIsPartnerUser(data.success && data.partnerUser)
        } else if (res.status === 401) {
          // Session expired - redirect to login
          router.push('/login?redirect=/partner-portal')
          return
        } else {
          // Not a Partner user (403 or other error)
          setIsPartnerUser(false)
        }
      } catch (error) {
        console.error('Failed to verify Partner access:', error)
        setIsPartnerUser(false)
      }

      setPartnerCheckComplete(true)
      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, router])

  // Loading state - waiting for auth and partner check
  if (isLoading || isInitializing || !partnerCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Partner Portal...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect is in progress
  if (!isAuthenticated) {
    return null
  }

  // AUTHORIZATION DENIED: User is authenticated but not a Partner member
  // Show 403 Forbidden component with appropriate messaging
  if (!isPartnerUser) {
    return (
      <Forbidden
        title="Partner Access Required"
        message="You need to be a Partner member to access the Partner Portal. If you believe this is an error, please contact support."
        homeUrl="/dashboard"
      />
    )
  }

  // AUTHORIZED: User is a Partner member
  return children
}

export default function PartnerPortalLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <PartnerPortalContent>
        {children}
      </PartnerPortalContent>
    </AuthProvider>
  )
}
