'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { Loader2, GraduationCap } from 'lucide-react'

function EducationContent({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    async function init() {
      // Wait for auth to load
      if (isLoading) return

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/login?redirect=/education/admin')
        return
      }

      setIsInitializing(false)
    }

    init()
  }, [isLoading, isAuthenticated, router])

  // Loading state
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-4 rounded-full shadow-lg mb-4 inline-block">
            <GraduationCap className="h-8 w-8 text-emerald-600" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading Education Suite...</p>
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

export default function EducationLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <EducationContent>
        {children}
      </EducationContent>
    </AuthProvider>
  )
}
