'use client'

import Link from 'next/link'
import { BlockRenderer } from '@/components/sites-funnels/builder/BlockRenderer'
import { PublicTenant, PublicSite, PublicPage } from '@/lib/sites-funnels/public-resolver'

interface Props {
  tenant: PublicTenant
  site: PublicSite
  page: PublicPage
}

export function SitePageClient({ tenant, site, page }: Props) {
  const blocks = page.blocks || []

  return (
    <div className="min-h-screen bg-white">
      <header 
        className="sticky top-0 z-50 border-b border-gray-200"
        style={{ 
          backgroundColor: site.primaryColor || tenant.primaryColor || '#059669',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${tenant.slug}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            {(site.logoUrl || tenant.logoUrl) && (
              <img 
                src={site.logoUrl || tenant.logoUrl!} 
                alt={site.name} 
                className="h-8 w-auto"
              />
            )}
            <span className="text-white font-semibold text-lg">
              {site.name}
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm">{page.name}</span>
            {tenant.isDemo && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
                DEMO
              </span>
            )}
          </div>
        </div>
      </header>

      <main>
        {blocks.length > 0 ? (
          blocks.map((block: any, index: number) => (
            <BlockRenderer 
              key={block.id || index} 
              block={block} 
              isEditing={false} 
            />
          ))
        ) : (
          <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{page.name}</h2>
              <p className="text-gray-600">This page is being set up. Check back soon!</p>
            </div>
          </div>
        )}
      </main>

      <footer 
        className="py-8 px-4 text-center text-sm"
        style={{ 
          backgroundColor: site.primaryColor || tenant.primaryColor || '#059669',
          color: 'white'
        }}
      >
        <p>&copy; {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p className="text-white/70 text-xs mt-1">Powered by WebWaka</p>
      </footer>

      {(site.customCss || page.customCss) && (
        <style dangerouslySetInnerHTML={{ __html: `${site.customCss || ''}\n${page.customCss || ''}` }} />
      )}
    </div>
  )
}
