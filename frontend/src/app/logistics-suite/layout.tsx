import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logistics Suite | WebWaka',
  description: 'Fleet and delivery logistics management dashboard'
}

export default function LogisticsSuiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
