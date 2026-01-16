import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveTicketByRef } from '@/lib/orders/public-order-resolver'
import TicketDetailClient from './TicketDetailClient'
import TicketVerificationClient from './TicketVerificationClient'

interface TicketDetailPageProps {
  params: Promise<{ tenantSlug: string; ticketRef: string }>
  searchParams: Promise<{ phone?: string }>
}

export async function generateMetadata({ params, searchParams }: TicketDetailPageProps): Promise<Metadata> {
  const { tenantSlug, ticketRef } = await params
  const { phone } = await searchParams
  const result = await resolveTicketByRef(tenantSlug, ticketRef, { phone })
  
  if (!result.success) {
    return {
      title: 'View Ticket',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Ticket #${result.ticket.ticketNumber} | ${result.tenant.appName}`,
    description: `View your transport ticket #${result.ticket.ticketNumber}`,
    robots: { index: false, follow: false },
  }
}

export default async function TicketDetailPage({ params, searchParams }: TicketDetailPageProps) {
  const { tenantSlug, ticketRef } = await params
  const { phone } = await searchParams
  const result = await resolveTicketByRef(tenantSlug, ticketRef, { phone })

  if (!result.success && result.reason === 'verification_required' && result.tenant) {
    return (
      <TicketVerificationClient 
        tenant={result.tenant}
        ticketRef={ticketRef}
        tenantSlug={tenantSlug}
      />
    )
  }

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
