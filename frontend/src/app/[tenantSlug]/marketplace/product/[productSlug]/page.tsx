import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveMarketplaceProduct } from '@/lib/marketplace/marketplace-resolver'
import ProductPageClient from './ProductPageClient'

interface ProductPageProps {
  params: Promise<{ tenantSlug: string; productSlug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { tenantSlug, productSlug } = await params
  const result = await resolveMarketplaceProduct(tenantSlug, productSlug)
  
  if (!result.success) {
    return {
      title: 'Product Not Found',
      description: 'This product could not be found'
    }
  }

  const { product, vendor, tenant } = result

  return {
    title: `${product.name} by ${vendor.name} | ${tenant.appName || tenant.name}`,
    description: product.description || `Buy ${product.name} from ${vendor.name} on ${tenant.name} marketplace`,
    openGraph: {
      title: `${product.name} by ${vendor.name}`,
      description: product.description || `Buy ${product.name} from ${vendor.name}`,
      type: 'website',
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined
    },
    alternates: {
      canonical: `/${tenantSlug}/marketplace/product/${productSlug}`
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { tenantSlug, productSlug } = await params
  const result = await resolveMarketplaceProduct(tenantSlug, productSlug)

  if (!result.success) {
    notFound()
  }

  const { product, vendor, tenant } = result

  return (
    <ProductPageClient
      tenantId={tenant.id}
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      appName={tenant.appName}
      logoUrl={tenant.logoUrl}
      primaryColor={tenant.primaryColor}
      product={product}
      vendor={vendor}
    />
  )
}
