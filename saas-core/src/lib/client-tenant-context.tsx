/**
 * Client-side Tenant Context
 * 
 * Provides tenant resolution for client-side components.
 * NEVER uses hardcoded demo IDs - requires explicit tenant selection.
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const TENANT_STORAGE_KEY = 'webwaka_tenant_context'

interface TenantContextType {
  tenantId: string | null
  tenantSlug: string | null
  isLoading: boolean
  error: string | null
  setTenant: (id: string, slug?: string) => void
  clearTenant: () => void
  requireTenant: () => string
}

const TenantContext = createContext<TenantContextType | null>(null)

interface StoredTenant {
  id: string
  slug?: string
  timestamp: number
}

/**
 * Load tenant from localStorage
 */
function loadStoredTenant(): StoredTenant | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(TENANT_STORAGE_KEY)
    if (!stored) return null
    
    const parsed: StoredTenant = JSON.parse(stored)
    
    // Expire after 24 hours
    const EXPIRY_MS = 24 * 60 * 60 * 1000
    if (Date.now() - parsed.timestamp > EXPIRY_MS) {
      localStorage.removeItem(TENANT_STORAGE_KEY)
      return null
    }
    
    return parsed
  } catch {
    return null
  }
}

/**
 * Save tenant to localStorage
 */
function storeTenant(id: string, slug?: string): void {
  if (typeof window === 'undefined') return
  
  const data: StoredTenant = {
    id,
    slug,
    timestamp: Date.now()
  }
  
  localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(data))
}

/**
 * Clear tenant from localStorage
 */
function clearStoredTenant(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TENANT_STORAGE_KEY)
}

/**
 * Tenant Provider Component
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load stored tenant on mount
  useEffect(() => {
    const stored = loadStoredTenant()
    if (stored) {
      setTenantId(stored.id)
      setTenantSlug(stored.slug || null)
    }
    setIsLoading(false)
  }, [])

  const setTenant = (id: string, slug?: string) => {
    setTenantId(id)
    setTenantSlug(slug || null)
    setError(null)
    storeTenant(id, slug)
  }

  const clearTenant = () => {
    setTenantId(null)
    setTenantSlug(null)
    clearStoredTenant()
  }

  const requireTenant = (): string => {
    if (!tenantId) {
      throw new Error('No tenant selected. Please select a business to continue.')
    }
    return tenantId
  }

  return (
    <TenantContext.Provider value={{
      tenantId,
      tenantSlug,
      isLoading,
      error,
      setTenant,
      clearTenant,
      requireTenant
    }}>
      {children}
    </TenantContext.Provider>
  )
}

/**
 * Hook to access tenant context
 */
export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

/**
 * Hook that requires tenant to be set
 * Throws if no tenant is selected
 */
export function useRequiredTenant(): string {
  const { tenantId, isLoading } = useTenant()
  
  if (isLoading) {
    throw new Error('Tenant context is loading')
  }
  
  if (!tenantId) {
    throw new Error('No tenant selected')
  }
  
  return tenantId
}

/**
 * Get tenant ID from URL query parameter or localStorage
 * This is for pages that need tenant context but don't have TenantProvider
 */
export function getTenantFromContext(): string | null {
  if (typeof window === 'undefined') return null
  
  // Check URL first
  const params = new URLSearchParams(window.location.search)
  const urlTenant = params.get('tenant')
  if (urlTenant) return urlTenant
  
  // Check localStorage
  const stored = loadStoredTenant()
  return stored?.id || null
}
