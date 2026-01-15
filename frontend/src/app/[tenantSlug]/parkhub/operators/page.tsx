/**
 * PARKHUB OPERATORS LISTING PAGE
 * Wave I.3: ParkHub Public Operator Marketplace (Exposure Only)
 * 
 * Route: /[tenantSlug]/parkhub/operators
 * Purpose: Public marketplace listing of transport operators
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveParkHubOperators } from '@/lib/parkhub/parkhub-resolver'
import OperatorsListClient from './OperatorsListClient'

interface PageProps {
  params: Promise<{ tenantSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params
  const result = await resolveParkHubOperators(tenantSlug)

  if (!result.success) {
    return { title: 'Not Found' }
  }

  const tenantName = result.tenant.name || 'ParkHub'

  return {
    title: `Transport Operators | ${tenantName} - ParkHub`,
    description: `Browse verified transport operators and bus companies at ${tenantName}. Compare services, routes, and book your tickets.`,
    openGraph: {
      title: `Transport Operators - ${tenantName}`,
      description: `Browse verified transport operators at ${tenantName}`,
      type: 'website',
    },
  }
}

export default async function OperatorsPage({ params }: PageProps) {
  const { tenantSlug } = await params
  const result = await resolveParkHubOperators(tenantSlug)

  if (!result.success) {
    notFound()
  }

  return (
    <OperatorsListClient
      tenant={result.tenant}
      operators={result.operators}
      isDemo={result.isDemo}
    />
  )
}
