import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '20+ Industry Suites — WebWaka Platform | Nigeria Business Software',
  description: 'All 20+ industry suites in one platform. Commerce, Service, Community, and Operations suites with full APIs, databases, and Nigerian context. POS, Education, Healthcare, Church, Logistics, Hospitality and more.',
  keywords: [
    'industry suites Nigeria',
    'business software Africa',
    'POS system Nigeria',
    'school management software',
    'clinic software Nigeria',
    'church management system',
    'logistics software',
    'hotel management Nigeria',
    'WebWaka suites',
  ],
  openGraph: {
    title: '20+ Industry Suites. One Platform. — WebWaka',
    description: 'Every suite is fully implemented with APIs, databases, interfaces, and Nigerian context. Pick your market. Configure. Deploy.',
    type: 'website',
    url: '/suites',
    siteName: 'WebWaka',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: '20+ Industry Suites. One Platform.',
    description: 'Every suite is fully implemented with APIs, databases, interfaces, and Nigerian context.',
  },
  alternates: {
    canonical: '/suites',
  },
}

export default function SuitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
