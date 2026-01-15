import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveFunnelStep } from '@/lib/sites-funnels/public-resolver'
import { FunnelStepClient } from './FunnelStepClient'

interface Props {
  params: Promise<{ tenantSlug: string; funnelSlug: string; stepSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, funnelSlug, stepSlug } = await params
  const result = await resolveFunnelStep(tenantSlug, funnelSlug, stepSlug)
  
  if (!result.success) {
    return { title: 'Step Not Found' }
  }

  const { step, funnel, tenant } = result
  
  return {
    title: step.metaTitle || `${step.name} - ${funnel.name}`,
    description: step.metaDescription || funnel.description || `${step.name} on ${tenant.name}`,
    openGraph: {
      title: step.metaTitle || step.name,
      description: step.metaDescription || funnel.description || undefined,
      images: step.ogImageUrl ? [{ url: step.ogImageUrl }] : undefined,
    },
  }
}

export default async function FunnelStepPage({ params }: Props) {
  const { tenantSlug, funnelSlug, stepSlug } = await params
  const result = await resolveFunnelStep(tenantSlug, funnelSlug, stepSlug)
  
  if (!result.success) {
    notFound()
  }

  const { step, funnel, tenant } = result
  const stepIndex = funnel.steps.findIndex(s => s.slug === stepSlug)

  return (
    <FunnelStepClient
      tenant={tenant}
      funnel={funnel}
      currentStep={step}
      stepIndex={stepIndex}
    />
  )
}
