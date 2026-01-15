import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveHomePage } from '@/lib/sites-funnels/public-resolver'
import { SiteHomeClient } from './SiteHomeClient'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  const result = await resolveHomePage(tenantSlug)
  
  if (!result.success) {
    return { title: 'Page Not Found' }
  }

  const { page, site, tenant } = result
  
  return {
    title: page.metaTitle || site.metaTitle || `${tenant.name} - Home`,
    description: page.metaDescription || site.metaDescription || `Welcome to ${tenant.name}`,
    keywords: site.metaKeywords?.join(', '),
    openGraph: {
      title: page.metaTitle || site.metaTitle || tenant.name,
      description: page.metaDescription || site.metaDescription || undefined,
      images: page.ogImageUrl || site.ogImageUrl ? [{ url: page.ogImageUrl || site.ogImageUrl! }] : undefined,
    },
  }
}

export default async function TenantSiteHomePage({ params }: Props) {
  const { tenantSlug } = await params
  const result = await resolveHomePage(tenantSlug)
  
  if (!result.success) {
    notFound()
  }

  const { page, site, tenant } = result

  return (
    <SiteHomeClient
      tenant={tenant}
      site={site}
      page={page}
    />
  )
}
