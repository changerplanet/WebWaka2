'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, AlertCircle, Handshake } from 'lucide-react'

function PartnerPortalContent({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      // Wait for auth to load
      if (isLoading) return

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login?redirect=/partner-portal')
        return
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, router])

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Partner Portal...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

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
