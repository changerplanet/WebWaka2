import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo Portal — See WebWaka Working, No Signup Required',
  description: '16 demo businesses with real Nigerian data. Explore retail, education, healthcare, hospitality, and more. Complete workflows you can click through. No signup required.',
  keywords: [
    'WebWaka demo',
    'Nigerian business software demo',
    'POS demo Nigeria',
    'school management demo',
    'clinic management demo',
    'church management demo',
    'property management demo',
    'hotel management demo',
    'try before you buy',
    'no signup demo',
    'SaaS demo Africa',
  ],
  openGraph: {
    title: 'See WebWaka Working — No Signup Required',
    description: '16 demo businesses. 20+ industry suites. Real workflows with Nigerian data. Explore on your own or request a guided walkthrough.',
    type: 'website',
    url: '/demo',
    siteName: 'WebWaka',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'See WebWaka Working — No Signup Required',
    description: '16 demo businesses. 20+ industry suites. Real workflows with Nigerian data.',
  },
  alternates: {
    canonical: '/demo',
  },
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
