import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveTicketByRef } from '@/lib/orders/public-order-resolver'
import TicketDetailClient from './TicketDetailClient'

interface TicketDetailPageProps {
  params: Promise<{ tenantSlug: string; ticketRef: string }>
}

export async function generateMetadata({ params }: TicketDetailPageProps): Promise<Metadata> {
  const { tenantSlug, ticketRef } = await params
  const result = await resolveTicketByRef(tenantSlug, ticketRef)
  
  if (!result.success) {
    return {
      title: 'Ticket Not Found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Ticket #${result.ticket.ticketNumber} | ${result.tenant.appName}`,
    description: `View your transport ticket #${result.ticket.ticketNumber}`,
    robots: { index: false, follow: false },
  }
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { tenantSlug, ticketRef } = await params
  const result = await resolveTicketByRef(tenantSlug, ticketRef)

  if (!result.success) {
    notFound()
  }

  return (
    <TicketDetailClient
      tenant={result.tenant}
      ticket={result.ticket}
      tenantSlug={tenantSlug}
    />
  )
}
