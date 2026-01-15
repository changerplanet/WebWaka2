import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { resolvePublishedFunnel } from '@/lib/sites-funnels/public-resolver'
import { FunnelEntryClient } from './FunnelEntryClient'

interface Props {
  params: Promise<{ tenantSlug: string; funnelSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, funnelSlug } = await params
  const result = await resolvePublishedFunnel(tenantSlug, funnelSlug)
  
  if (!result.success) {
    return { title: 'Funnel Not Found' }
  }

  const { funnel, tenant } = result
  const firstStep = funnel.steps[0]
  
  return {
    title: firstStep?.metaTitle || funnel.name,
    description: firstStep?.metaDescription || funnel.description || `${funnel.name} on ${tenant.name}`,
    openGraph: {
      title: firstStep?.metaTitle || funnel.name,
      description: firstStep?.metaDescription || funnel.description || undefined,
      images: firstStep?.ogImageUrl ? [{ url: firstStep.ogImageUrl }] : undefined,
    },
  }
}

export default async function FunnelEntryPage({ params }: Props) {
  const { tenantSlug, funnelSlug } = await params
  const result = await resolvePublishedFunnel(tenantSlug, funnelSlug)
  
  if (!result.success) {
    notFound()
  }

  const { funnel, tenant } = result

  if (funnel.steps.length === 0) {
    notFound()
  }

  const firstStep = funnel.steps[0]

  return (
    <FunnelEntryClient
      tenant={tenant}
      funnel={funnel}
      currentStep={firstStep}
      stepIndex={0}
    />
  )
}
