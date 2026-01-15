/**
 * PARKHUB OPERATOR PROFILE PAGE
 * Wave I.3: ParkHub Public Operator Marketplace (Exposure Only)
 * 
 * Route: /[tenantSlug]/parkhub/operator/[operatorSlug]
 * Purpose: Public-facing operator storefront
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveParkHubOperator } from '@/lib/parkhub/parkhub-resolver'
import OperatorProfileClient from './OperatorProfileClient'

interface PageProps {
  params: Promise<{ tenantSlug: string; operatorSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug, operatorSlug } = await params
  const result = await resolveParkHubOperator(tenantSlug, operatorSlug)

  if (!result.success) {
    return { title: 'Not Found' }
  }

  const operatorName = result.operator.name
  const tenantName = result.tenant.name || 'ParkHub'

  return {
    title: `${operatorName} | ${tenantName} - ParkHub`,
    description: `Book tickets with ${operatorName}. View routes, schedules, and prices at ${tenantName}.`,
    openGraph: {
      title: `${operatorName} - Transport Services`,
      description: `Book tickets with ${operatorName} at ${tenantName}`,
      type: 'website',
    },
  }
}

export default async function OperatorProfilePage({ params }: PageProps) {
  const { tenantSlug, operatorSlug } = await params
  const result = await resolveParkHubOperator(tenantSlug, operatorSlug)

  if (!result.success) {
    notFound()
  }

  return (
    <OperatorProfileClient
      tenant={result.tenant}
      operator={result.operator}
      routes={result.routes}
      upcomingTrips={result.upcomingTrips}
      isDemo={result.isDemo}
    />
  )
}
