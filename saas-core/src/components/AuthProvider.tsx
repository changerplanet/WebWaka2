'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// Types
interface TenantMembership {
  tenantId: string
  tenantName: string
  tenantSlug: string
  role: string
}

interface SessionUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  globalRole: string
  memberships: TenantMembership[]
}

interface AuthContextType {
  user: SessionUser | null
  activeTenantId: string | null
  activeTenant: TenantMembership | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  switchTenant: (tenantId: string) => Promise<boolean>
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

// Context
const AuthContext = createContext<AuthContextType | null>(null)

// Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [user, setUser] = useState<SessionUser | null>(null)
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get active tenant from user memberships
  const activeTenant = user?.memberships.find(m => m.tenantId === activeTenantId) || null

  // Fetch session from API
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (data.authenticated && data.user) {
        setUser(data.user)
        
        // If session has activeTenantId, use it
        if (data.activeTenantId) {
          setActiveTenantId(data.activeTenantId)
        } 
        // If user has only one membership, auto-select it
        else if (data.user.memberships.length === 1) {
          const tenantId = data.user.memberships[0].tenantId
          await switchTenantInternal(tenantId)
        }
        // Check URL for tenant slug
        else {
          const tenantSlug = searchParams.get('tenant')
          if (tenantSlug) {
            const membership = data.user.memberships.find(
              (m: TenantMembership) => m.tenantSlug === tenantSlug
            )
            if (membership) {
              await switchTenantInternal(membership.tenantId)
            }
          }
        }
      } else {
        setUser(null)
        setActiveTenantId(null)
      }
    } catch (err) {
      console.error('Failed to fetch session:', err)
      setError('Failed to load session')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // Internal switch tenant (doesn't refresh session)
  const switchTenantInternal = async (tenantId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })
      
      if (res.ok) {
        setActiveTenantId(tenantId)
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to switch tenant:', err)
      return false
    }
  }

  // Public switch tenant (with refresh)
  const switchTenant = useCallback(async (tenantId: string): Promise<boolean> => {
    const success = await switchTenantInternal(tenantId)
    if (success) {
      // Update URL if on dashboard/app pages
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/pos')) {
        const tenant = user?.memberships.find(m => m.tenantId === tenantId)
        if (tenant) {
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.set('tenant', tenant.tenantSlug)
          router.replace(newUrl.pathname + newUrl.search)
        }
      }
    }
    return success
  }, [pathname, router, user])

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setActiveTenantId(null)
      router.push('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }, [router])

  // Initial load
  useEffect(() => {
    refreshSession()
  }, [])

  // Sync tenant from URL when it changes
  useEffect(() => {
    const tenantSlug = searchParams.get('tenant')
    if (tenantSlug && user) {
      const membership = user.memberships.find(m => m.tenantSlug === tenantSlug)
      if (membership && membership.tenantId !== activeTenantId) {
        switchTenantInternal(membership.tenantId)
      }
    }
  }, [searchParams, user, activeTenantId])

  const value: AuthContextType = {
    user,
    activeTenantId,
    activeTenant,
    isLoading,
    isAuthenticated: !!user,
    error,
    switchTenant,
    refreshSession,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireTenant?: boolean }
) {
  return function ProtectedRoute(props: P) {
    const { user, activeTenantId, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login')
      }
    }, [isLoading, user, router])

    useEffect(() => {
      if (!isLoading && user && options?.requireTenant && !activeTenantId) {
        router.push('/select-tenant')
      }
    }, [isLoading, user, activeTenantId, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      )
    }

    if (!user) {
      return null
    }

    if (options?.requireTenant && !activeTenantId) {
      return null
    }

    return <Component {...props} />
  }
}
