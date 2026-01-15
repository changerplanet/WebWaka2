import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveMarketplaceTenant, listMarketplaceVendors } from '@/lib/marketplace/marketplace-resolver'
import MarketplaceClient from './MarketplaceClient'

interface MarketplacePageProps {
  params: Promise<{ tenantSlug: string }>
}

export async function generateMetadata({ params }: MarketplacePageProps): Promise<Metadata> {
  const { tenantSlug } = await params
  const result = await resolveMarketplaceTenant(tenantSlug)
  
  if (!result.success) {
    return {
      title: 'Marketplace Not Found',
      description: 'This marketplace could not be found'
    }
  }

  const { tenant } = result

  return {
    title: `${tenant.appName || tenant.name} Marketplace`,
    description: `Browse trusted vendors and products on ${tenant.name} marketplace`,
    openGraph: {
      title: `${tenant.appName || tenant.name} Marketplace`,
      description: `Browse trusted vendors and products on ${tenant.name} marketplace`,
      type: 'website'
    },
    alternates: {
      canonical: `/${tenantSlug}/marketplace`
    }
  }
}

export default async function MarketplacePage({ params }: MarketplacePageProps) {
  const { tenantSlug } = await params
  const result = await resolveMarketplaceTenant(tenantSlug)

  if (!result.success) {
    notFound()
  }

  const { tenant } = result

  const vendorResult = await listMarketplaceVendors(tenant.id, { page: 1, pageSize: 50 })

  return (
    <MarketplaceClient
      tenantId={tenant.id}
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      appName={tenant.appName}
      logoUrl={tenant.logoUrl}
      primaryColor={tenant.primaryColor}
      initialVendors={vendorResult.vendors}
      totalVendors={vendorResult.total}
    />
  )
}
