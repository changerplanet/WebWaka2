import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sites & Funnels — Build Client Websites in Hours | WebWaka',
  description: 'Launch professional websites and conversion funnels for your clients same-day. Industry templates, AI content generation, and suite integration. Nigeria-first, Naira-native platform for digital partners.',
  keywords: [
    'website builder Nigeria',
    'sales funnel Nigeria',
    'digital agency tools',
    'client websites',
    'landing page builder',
    'WebWaka Sites',
    'partner growth',
    'SaaS reseller Africa',
  ],
  openGraph: {
    title: 'Sites & Funnels — Build Client Websites in Hours',
    description: 'Launch professional websites and conversion funnels for your clients same-day. Industry templates, AI content generation, Naira-native.',
    type: 'website',
    url: '/sites-and-funnels',
    siteName: 'WebWaka',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sites & Funnels — Build Client Websites in Hours',
    description: 'Launch professional websites and conversion funnels for your clients same-day. Nigeria-first platform for digital partners.',
  },
  alternates: {
    canonical: '/sites-and-funnels',
  },
}

export default function SitesAndFunnelsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
