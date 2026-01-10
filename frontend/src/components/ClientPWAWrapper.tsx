'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Import PWAProvider with SSR disabled to prevent hydration issues
const PWAProvider = dynamic(
  () => import('./PWAProvider').then(mod => mod.PWAProvider),
  { ssr: false }
)

interface ClientPWAWrapperProps {
  children: ReactNode
}

export function ClientPWAWrapper({ children }: ClientPWAWrapperProps) {
  return <PWAProvider>{children}</PWAProvider>
}
