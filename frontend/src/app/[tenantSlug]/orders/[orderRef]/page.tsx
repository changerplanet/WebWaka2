import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveOrderByRef } from '@/lib/orders/public-order-resolver'
import OrderDetailClient from './OrderDetailClient'

interface OrderDetailPageProps {
  params: Promise<{ tenantSlug: string; orderRef: string }>
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { tenantSlug, orderRef } = await params
  const result = await resolveOrderByRef(tenantSlug, orderRef)
  
  if (!result.success) {
    return {
      title: 'Order Not Found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Order #${result.order.orderNumber} | ${result.tenant.appName}`,
    description: `View details for order #${result.order.orderNumber}`,
    robots: { index: false, follow: false },
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { tenantSlug, orderRef } = await params
  const result = await resolveOrderByRef(tenantSlug, orderRef)

  if (!result.success) {
    notFound()
  }

  return (
    <OrderDetailClient
      tenant={result.tenant}
      order={result.order}
      tenantSlug={tenantSlug}
    />
  )
}
