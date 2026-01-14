import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Education Suite | WebWaka',
  description: 'School and education management dashboard'
}

export default function EducationAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
