'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, Stethoscope } from 'lucide-react'

function HealthContent({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      // Wait for auth to load
      if (isLoading) return

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login?redirect=/health/admin')
        return
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, router])

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-4 rounded-full shadow-lg mb-4 inline-block">
            <Stethoscope className="h-8 w-8 text-cyan-600" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-cyan-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading Health Suite...</p>
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

export default function HealthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <HealthContent>
        {children}
      </HealthContent>
    </AuthProvider>
  )
}
