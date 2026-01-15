import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveProductBySlug, resolveStorefrontBySlug } from '@/lib/storefront/tenant-storefront-resolver'
import ProductPageClient from './ProductPageClient'

interface Props {
  params: Promise<{ tenantSlug: string; productSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, productSlug } = await params
  const result = await resolveProductBySlug(tenantSlug, productSlug)
  
  if (!result.success) {
    return {
      title: 'Product Not Found',
      description: 'This product is not available.',
    }
  }

  const { product, tenant } = result
  const imageUrl = product.images[0]?.url

  return {
    title: `${product.name} - ${tenant.appName || tenant.name}`,
    description: product.shortDescription || product.description || `Shop ${product.name} at ${tenant.name}`,
    openGraph: {
      title: `${product.name} - ${tenant.appName || tenant.name}`,
      description: product.shortDescription || product.description || `Shop ${product.name} at ${tenant.name}`,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    alternates: {
      canonical: `/${tenant.slug}/product/${product.slug}`,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { tenantSlug, productSlug } = await params
  
  const tenantResult = await resolveStorefrontBySlug(tenantSlug)
  
  if (!tenantResult.success) {
    if (tenantResult.reason === 'not_found') {
      notFound()
    }
    
    return <StoreNotAvailable reason={tenantResult.reason} />
  }

  const productResult = await resolveProductBySlug(tenantSlug, productSlug)
  
  if (!productResult.success) {
    if (productResult.reason === 'product_not_found') {
      notFound()
    }
    
    return <StoreNotAvailable reason={productResult.reason} />
  }

  const { product, tenant } = productResult

  return (
    <ProductPageClient 
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      appName={tenant.appName}
      logoUrl={tenant.logoUrl}
      primaryColor={tenant.primaryColor}
      productId={product.id}
      productName={product.name}
    />
  )
}

function StoreNotAvailable({ reason }: { reason: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    store_disabled: {
      title: 'Store Not Enabled',
      description: 'This business has not enabled their online store yet.',
    },
    suspended: {
      title: 'Store Temporarily Unavailable',
      description: 'This store is temporarily unavailable. Please check back later.',
    },
    tenant_not_found: {
      title: 'Store Not Found',
      description: 'This store does not exist.',
    },
  }

  const { title, description } = messages[reason] || {
    title: 'Product Not Available',
    description: 'This product is not currently available.',
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-8 h-8 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600 mb-6">{description}</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    </div>
  )
}
