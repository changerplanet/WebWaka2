/**
 * MVM Checkout Page (Wave K.2)
 * 
 * Multi-vendor marketplace checkout with vendor-grouped summary,
 * payment selection, and unified checkout flow.
 * 
 * @route /[tenantSlug]/marketplace/checkout
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TenantContextResolver } from '@/lib/tenant-context'
import { CheckoutClient } from './CheckoutClient'

interface Props {
  params: { tenantSlug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await TenantContextResolver.resolveForMVM(params.tenantSlug)
  
  if (!result.success) {
    return { title: 'Checkout' }
  }

  return {
    title: `Checkout - ${result.context.tenantName}`,
    robots: { index: false, follow: false }
  }
}

export default async function MvmCheckoutPage({ params }: Props) {
  const result = await TenantContextResolver.resolveForMVM(params.tenantSlug)

  if (!result.success) {
    notFound()
  }

  const ctx = result.context

  return (
    <CheckoutClient
      tenantId={ctx.tenantId}
      tenantSlug={ctx.tenantSlug}
      tenantName={ctx.tenantName}
      isDemo={ctx.isDemo}
      primaryColor={ctx.primaryColor}
    />
  )
}
