/**
 * PARKHUB PUBLIC LANDING PAGE
 * Wave I.3: ParkHub Public Operator Marketplace (Exposure Only)
 * 
 * Route: /[tenantSlug]/parkhub
 * Purpose: Entry point for ParkHub commerce under a tenant
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveParkHubLanding } from '@/lib/parkhub/parkhub-resolver'
import ParkHubLandingClient from './ParkHubLandingClient'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params
  const result = await resolveParkHubLanding(tenantSlug)

  if (!result.success) {
    return { title: 'Not Found' }
  }

  const tenantName = result.tenant.name || 'ParkHub'

  return {
    title: `${tenantName} - Transport Marketplace | ParkHub`,
    description: `Book bus tickets, compare transport operators, and find the best routes with ${tenantName} on ParkHub.`,
    openGraph: {
      title: `${tenantName} Transport Marketplace`,
      description: `Book bus tickets and compare transport operators with ${tenantName}`,
      type: 'website',
    },
  }
}

export default async function ParkHubLandingPage({ params }: PageProps) {
  const { tenantSlug } = await params
  const result = await resolveParkHubLanding(tenantSlug)

  if (!result.success) {
    notFound()
  }

  return (
    <ParkHubLandingClient
      tenant={result.tenant}
      operatorCount={result.operatorCount}
      activeRoutesCount={result.activeRoutesCount}
      activeTripsCount={result.activeTripsCount}
      isDemo={result.isDemo}
    />
  )
}
