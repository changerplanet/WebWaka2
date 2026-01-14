import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hospitality Suite | WebWaka',
  description: 'Hotel and hospitality management dashboard'
}

export default function HospitalityAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
