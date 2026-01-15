import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveMarketplaceVendor, listVendorProducts } from '@/lib/marketplace/marketplace-resolver'
import VendorPageClient from './VendorPageClient'

interface VendorPageProps {
  params: Promise<{ tenantSlug: string; vendorSlug: string }>
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { tenantSlug, vendorSlug } = await params
  const result = await resolveMarketplaceVendor(tenantSlug, vendorSlug)
  
  if (!result.success) {
    return {
      title: 'Vendor Not Found',
      description: 'This vendor could not be found'
    }
  }

  const { vendor, tenant } = result

  return {
    title: `${vendor.name} | ${tenant.appName || tenant.name} Marketplace`,
    description: vendor.description || `Browse products from ${vendor.name} on ${tenant.name} marketplace`,
    openGraph: {
      title: `${vendor.name} | ${tenant.appName || tenant.name} Marketplace`,
      description: vendor.description || `Browse products from ${vendor.name} on ${tenant.name} marketplace`,
      type: 'website'
    },
    alternates: {
      canonical: `/${tenantSlug}/marketplace/vendor/${vendorSlug}`
    }
  }
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { tenantSlug, vendorSlug } = await params
  const result = await resolveMarketplaceVendor(tenantSlug, vendorSlug)

  if (!result.success) {
    notFound()
  }

  const { vendor, tenant } = result

  const productResult = await listVendorProducts(vendor.id, { page: 1, pageSize: 50 })

  return (
    <VendorPageClient
      tenantId={tenant.id}
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      appName={tenant.appName}
      logoUrl={tenant.logoUrl}
      primaryColor={tenant.primaryColor}
      vendor={vendor}
      initialProducts={productResult.products}
      totalProducts={productResult.total}
    />
  )
}
