import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolvePublishedPage } from '@/lib/sites-funnels/public-resolver'
import { SitePageClient } from './SitePageClient'

interface Props {
  params: Promise<{ tenantSlug: string; pageSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, pageSlug } = await params
  const result = await resolvePublishedPage(tenantSlug, pageSlug)
  
  if (!result.success) {
    return { title: 'Page Not Found' }
  }

  const { page, site, tenant } = result
  
  return {
    title: page.metaTitle || `${page.name} - ${site.name}`,
    description: page.metaDescription || site.metaDescription || `${page.name} on ${tenant.name}`,
    openGraph: {
      title: page.metaTitle || page.name,
      description: page.metaDescription || site.metaDescription || undefined,
      images: page.ogImageUrl || site.ogImageUrl ? [{ url: page.ogImageUrl || site.ogImageUrl! }] : undefined,
    },
  }
}

export default async function SitePagePage({ params }: Props) {
  const { tenantSlug, pageSlug } = await params
  const result = await resolvePublishedPage(tenantSlug, pageSlug)
  
  if (!result.success) {
    notFound()
  }

  const { page, site, tenant } = result

  return (
    <SitePageClient
      tenant={tenant}
      site={site}
      page={page}
    />
  )
}
