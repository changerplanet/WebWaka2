import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sites & Funnels | WebWaka',
  description: 'Build and manage websites and sales funnels for your clients'
}

export default function SitesFunnelsAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
