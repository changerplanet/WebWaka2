/**
 * PARKHUB PUBLIC ROUTES BROWSER
 * Wave I.3: ParkHub Public Operator Marketplace (Exposure Only)
 * 
 * Route: /[tenantSlug]/parkhub/routes
 * Purpose: Allow users to browse routes/schedules outside the booking funnel
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveParkHubRoutes } from '@/lib/parkhub/parkhub-resolver'
import RoutesBrowserClient from './RoutesBrowserClient'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params
  const result = await resolveParkHubRoutes(tenantSlug)

  if (!result.success) {
    return { title: 'Not Found' }
  }

  const tenantName = result.tenant.name || 'ParkHub'

  return {
    title: `Bus Routes | ${tenantName} - ParkHub`,
    description: `Browse all bus routes at ${tenantName}. Compare prices, operators, and book your tickets.`,
    openGraph: {
      title: `Bus Routes - ${tenantName}`,
      description: `Browse all bus routes at ${tenantName}`,
      type: 'website',
    },
  }
}

export default async function RoutesPage({ params }: PageProps) {
  const { tenantSlug } = await params
  const result = await resolveParkHubRoutes(tenantSlug)

  if (!result.success) {
    notFound()
  }

  return (
    <RoutesBrowserClient
      tenant={result.tenant}
      routes={result.routes}
      isDemo={result.isDemo}
    />
  )
}
