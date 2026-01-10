'use client'

/**
 * Partner Governance Layout
 * 
 * Wraps all Partner Admin Portal pages with the PartnerProvider
 * and common navigation.
 * 
 * @phase Stop Point 3 - Partner Admin Portal
 */

import { ReactNode } from 'react'
import { PartnerProvider } from '@/lib/partner-governance/partner-context'

export default function PartnerGovernanceLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <PartnerProvider>
      {children}
    </PartnerProvider>
  )
}
