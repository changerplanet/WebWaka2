import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POS Suite | WebWaka',
  description: 'Point of Sale management dashboard for retail operations'
}

export default function POSSuiteAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
