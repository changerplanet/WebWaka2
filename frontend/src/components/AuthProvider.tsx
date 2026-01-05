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

// Phase 2: Platform Instance info
interface PlatformInstanceInfo {
  id: string
  name: string
  slug: string
  suiteKeys: string[]
  isDefault: boolean
  displayName: string | null
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
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
  // Phase 2: Platform Instance context
  activeInstanceId: string | null
  activeInstance: PlatformInstanceInfo | null
  availableInstances: PlatformInstanceInfo[]
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  sessionExpired: boolean
  switchTenant: (tenantId: string) => Promise<boolean>
  // Phase 2: Switch instance within tenant
  switchInstance: (instanceId: string) => Promise<boolean>
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
  // Phase 2: Instance state
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [availableInstances, setAvailableInstances] = useState<PlatformInstanceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Get active tenant from user memberships
  const activeTenant = user?.memberships.find(m => m.tenantId === activeTenantId) || null
  
  // Phase 2: Get active instance from available instances
  const activeInstance = availableInstances.find(i => i.id === activeInstanceId) || null

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    setSessionExpired(true)
    setUser(null)
    setActiveTenantId(null)
    setActiveInstanceId(null)
    setAvailableInstances([])
    
    // Store current path for redirect after login
    const currentPath = window.location.pathname + window.location.search
    if (currentPath !== '/login' && currentPath !== '/') {
      try {
        sessionStorage.setItem('webwaka_redirect_after_login', currentPath)
      } catch (e) {
        // sessionStorage might not be available
      }
    }
    
    // Redirect to login with session expired message
    router.push('/login?expired=true')
  }, [router])

  // Phase 2: Fetch instances for a tenant
  const fetchInstances = useCallback(async (tenantId: string) => {
    try {
      const res = await fetch(`/api/platform-instances?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableInstances(data.instances || [])
        
        // Check for saved instance preference in localStorage
        let savedInstanceId: string | null = null
        try {
          savedInstanceId = localStorage.getItem(`webwaka_instance_${tenantId}`)
        } catch (e) {
          // localStorage might not be available
        }
        
        // Auto-select instance priority: saved preference > default > first
        if (!activeInstanceId && data.instances?.length > 0) {
          const savedInstance = savedInstanceId 
            ? data.instances.find((i: PlatformInstanceInfo) => i.id === savedInstanceId)
            : null
          const defaultInstance = data.instances.find((i: PlatformInstanceInfo) => i.isDefault)
          
          if (savedInstance) {
            setActiveInstanceId(savedInstance.id)
          } else if (defaultInstance) {
            setActiveInstanceId(defaultInstance.id)
          } else {
            setActiveInstanceId(data.instances[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch instances:', err)
      setAvailableInstances([])
    }
  }, [activeInstanceId])

  // Fetch session from API
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSessionExpired(false)
      
      const res = await fetch('/api/auth/session')
      
      // Handle 401 as session expired
      if (res.status === 401) {
        handleSessionExpired()
        return
      }
      
      const data = await res.json()
      
      if (data.authenticated && data.user) {
        setUser(data.user)
        
        // If session has activeTenantId, use it
        if (data.activeTenantId) {
          setActiveTenantId(data.activeTenantId)
          // Phase 2: Fetch instances for the active tenant
          await fetchInstances(data.activeTenantId)
          // Phase 2: Use instance from session if available
          if (data.activeInstanceId) {
            setActiveInstanceId(data.activeInstanceId)
          }
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
        // Not authenticated - check if this is unexpected (session expired)
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/pos')) {
          handleSessionExpired()
          return
        }
        setUser(null)
        setActiveTenantId(null)
        setActiveInstanceId(null)
        setAvailableInstances([])
      }
    } catch (err) {
      console.error('Failed to fetch session:', err)
      setError('Failed to load session')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, pathname, handleSessionExpired])

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
        // Phase 2: Fetch instances for new tenant
        await fetchInstances(tenantId)
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
  }, [pathname, router, user, fetchInstances])

  // Phase 2: Switch platform instance within tenant
  // NOTE: Instance switching is CLIENT-SIDE only per Phase 2 design
  // - Same login session maintained
  // - No re-auth required
  // - Instance context is VISIBILITY scoping, not permission scoping
  const switchInstance = useCallback(async (instanceId: string): Promise<boolean> => {
    // Verify instance belongs to active tenant
    const instance = availableInstances.find(i => i.id === instanceId)
    if (!instance) {
      console.error('Instance not found or not available')
      return false
    }
    
    // Phase 2: Client-side only switching
    // Instance is a UX boundary, not a session boundary
    setActiveInstanceId(instanceId)
    
    // Store preference in localStorage for persistence
    if (activeTenantId) {
      try {
        localStorage.setItem(`webwaka_instance_${activeTenantId}`, instanceId)
      } catch (e) {
        // localStorage might not be available
      }
    }
    
    return true
  }, [availableInstances, activeTenantId])

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setActiveTenantId(null)
      setActiveInstanceId(null)
      setAvailableInstances([])
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
    // Phase 2: Platform Instance context
    activeInstanceId,
    activeInstance,
    availableInstances,
    isLoading,
    isAuthenticated: !!user,
    error,
    sessionExpired,
    switchTenant,
    switchInstance,
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
