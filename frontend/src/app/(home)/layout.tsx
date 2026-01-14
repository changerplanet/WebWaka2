import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WebWaka — Africa\'s Most Complete SaaS Platform for Partners',
  description: 'Build a SaaS business without building software. 20+ industry suites, Sites & Funnels builder, and partner-first infrastructure for digital transformation in Nigeria and Africa.',
  keywords: [
    'SaaS platform Nigeria',
    'partner program Africa',
    'white-label SaaS',
    'digital transformation Nigeria',
    'reseller software Africa',
    'business software Nigeria',
    'WebWaka',
    'POS Nigeria',
    'school management',
    'clinic software',
    'multi-tenant SaaS',
  ],
  openGraph: {
    title: 'WebWaka — Build a SaaS Business Without Building Software',
    description: '20+ industry suites. Sites & Funnels builder. Partner-first infrastructure for digital transformation in Nigeria and Africa.',
    type: 'website',
    url: '/',
    siteName: 'WebWaka',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebWaka — Build a SaaS Business Without Building Software',
    description: '20+ industry suites. Partner-first infrastructure for digital transformation in Nigeria and Africa.',
  },
  alternates: {
    canonical: '/',
  },
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
