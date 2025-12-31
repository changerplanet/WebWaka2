'use client'

import { useEffect, createContext, useContext, ReactNode } from 'react'
import { useServiceWorker, useOnlineStatus } from '@/lib/offline/hooks'

interface PWAContextType {
  isOnline: boolean
  updateAvailable: boolean
  update: () => void
  triggerSync: () => void
  clearTenantCache: (tenantSlug: string) => void
}

const PWAContext = createContext<PWAContextType | null>(null)

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    // Return defaults when not in provider
    return {
      isOnline: true,
      updateAvailable: false,
      update: () => {},
      triggerSync: () => {},
      clearTenantCache: () => {}
    }
  }
  return context
}

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const isOnline = useOnlineStatus()
  const { 
    registration, 
    updateAvailable, 
    update, 
    triggerSync, 
    clearTenantCache 
  } = useServiceWorker()
  
  // Log service worker status
  useEffect(() => {
    if (registration) {
      console.log('[PWA] Service Worker registered:', registration.scope)
    }
  }, [registration])
  
  // Log online status changes
  useEffect(() => {
    console.log('[PWA] Online status:', isOnline ? 'online' : 'offline')
  }, [isOnline])
  
  return (
    <PWAContext.Provider value={{
      isOnline,
      updateAvailable,
      update,
      triggerSync,
      clearTenantCache
    }}>
      {children}
    </PWAContext.Provider>
  )
}
