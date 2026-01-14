import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner Program — Build a SaaS Business Without Building Software | WebWaka',
  description: 'Become a WebWaka Partner. Resell 20+ industry suites to Nigerian businesses. Set your own prices, keep your margins. No coding required. Platform infrastructure for digital transformation partners.',
  keywords: [
    'SaaS reseller Nigeria',
    'partner program Africa',
    'digital transformation partner',
    'resell business software',
    'WebWaka partner',
    'ICT vendor Nigeria',
    'business consultant software',
    'digital agency partnership',
    'white-label SaaS Nigeria',
  ],
  openGraph: {
    title: 'Become a WebWaka Partner — Build a SaaS Business',
    description: 'Resell 20+ industry suites to Nigerian businesses. Set your own prices, keep your margins. No coding required.',
    type: 'website',
    url: '/partners',
    siteName: 'WebWaka',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become a WebWaka Partner — Build a SaaS Business',
    description: 'Resell 20+ industry suites to Nigerian businesses. Set your own prices. No coding required.',
  },
  alternates: {
    canonical: '/partners',
  },
}

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
