'use client'

import { useEffect, createContext, useContext, ReactNode, useRef } from 'react'
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
  
  const registrationLoggedRef = useRef(false)
  const onlineStatusLoggedRef = useRef(false)
  
  // Log service worker status on first registration only
  useEffect(() => {
    if (registration && !registrationLoggedRef.current) {
      console.log('[PWA] Service Worker registered:', registration.scope)
      registrationLoggedRef.current = true
    }
  }, [registration])
  
  // Log online status once per session
  useEffect(() => {
    if (!onlineStatusLoggedRef.current) {
      console.log('[PWA] Online status:', isOnline ? 'online' : 'offline')
      onlineStatusLoggedRef.current = true
    }
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
