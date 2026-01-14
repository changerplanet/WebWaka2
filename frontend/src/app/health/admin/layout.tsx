import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Health Suite | WebWaka',
  description: 'Healthcare and clinic management dashboard'
}

export default function HealthAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
