import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Civic Suite | WebWaka',
  description: 'Civic organization and community management dashboard'
}

export default function CivicAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
