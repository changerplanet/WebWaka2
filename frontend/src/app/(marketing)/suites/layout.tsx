import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '20+ Industry Suites — WebWaka Platform',
  description: 'All 20+ industry suites in one platform. Commerce, Service, Community, and Operations suites with full APIs, databases, and Nigerian context. Pick your market. Configure. Deploy.',
  keywords: ['industry suites', 'business software', 'Nigeria', 'POS', 'education', 'health', 'church', 'logistics', 'hospitality'],
  openGraph: {
    title: '20+ Industry Suites. One Platform. — WebWaka',
    description: 'Every suite is fully implemented with APIs, databases, interfaces, and Nigerian context. Pick your market. Configure. Deploy.',
  },
}

export default function SuitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
