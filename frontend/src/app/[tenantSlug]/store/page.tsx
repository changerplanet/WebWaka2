import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveStorefrontBySlug } from '@/lib/storefront/tenant-storefront-resolver'
import StorefrontClient from './StorefrontClient'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  const result = await resolveStorefrontBySlug(tenantSlug)
  
  if (!result.success) {
    return {
      title: 'Store Not Available',
      description: 'This store is not available.',
    }
  }

  const { tenant } = result
  
  return {
    title: `${tenant.appName || tenant.name} - Online Store`,
    description: `Shop at ${tenant.name}. Quality products for Nigerian businesses.`,
    openGraph: {
      title: `${tenant.appName || tenant.name} - Online Store`,
      description: `Shop at ${tenant.name}. Quality products for Nigerian businesses.`,
      type: 'website',
    },
    alternates: {
      canonical: `/${tenant.slug}/store`,
    },
  }
}

export default async function StorefrontPage({ params }: Props) {
  const { tenantSlug } = await params
  const result = await resolveStorefrontBySlug(tenantSlug)
  
  if (!result.success) {
    if (result.reason === 'not_found') {
      notFound()
    }
    
    return <StoreNotAvailable reason={result.reason} tenantSlug={tenantSlug} />
  }

  const { tenant } = result

  return (
    <StorefrontClient 
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      appName={tenant.appName}
      logoUrl={tenant.logoUrl}
      primaryColor={tenant.primaryColor}
    />
  )
}

function StoreNotAvailable({ reason, tenantSlug }: { reason: string; tenantSlug: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    store_disabled: {
      title: 'Store Not Enabled',
      description: 'This business has not enabled their online store yet.',
    },
    suspended: {
      title: 'Store Temporarily Unavailable',
      description: 'This store is temporarily unavailable. Please check back later.',
    },
  }

  const { title, description } = messages[reason] || {
    title: 'Store Not Available',
    description: 'This store is not currently available.',
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
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
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
