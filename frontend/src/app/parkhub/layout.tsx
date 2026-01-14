'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, Bus } from 'lucide-react'

function ParkHubContent({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      // Wait for auth to load
      if (isLoading) return

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login?redirect=/parkhub/park-admin')
        return
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, router])

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ParkHub...</p>
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

  return children
}

export default function ParkHubLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <ParkHubContent>
        {children}
      </ParkHubContent>
    </AuthProvider>
  )
}
