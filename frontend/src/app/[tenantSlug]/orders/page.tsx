import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { resolveCustomerOrders, resolveOrderPortalTenant } from '@/lib/orders/public-order-resolver'
import OrdersIndexClient from './OrdersIndexClient'

interface OrdersIndexPageProps {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ email?: string; phone?: string }>
}

export async function generateMetadata({ params }: OrdersIndexPageProps): Promise<Metadata> {
  const { tenantSlug } = await params
  const tenantResult = await resolveOrderPortalTenant(tenantSlug)
  
  if (!tenantResult.success) {
    return {
      title: 'Orders Not Found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `My Orders | ${tenantResult.tenant.appName}`,
    description: `View your order history at ${tenantResult.tenant.name}`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `My Orders | ${tenantResult.tenant.appName}`,
      description: `View your order history at ${tenantResult.tenant.name}`,
      type: 'website',
    },
  }
}

export default async function OrdersIndexPage({ params, searchParams }: OrdersIndexPageProps) {
  const { tenantSlug } = await params
  const { email, phone } = await searchParams
  
  const customerIdentifier = email || phone ? { email, phone } : undefined
  const result = await resolveCustomerOrders(tenantSlug, customerIdentifier)

  if (!result.success) {
    notFound()
  }

  return (
    <OrdersIndexClient
      tenant={result.tenant}
      orders={result.orders}
      tenantSlug={tenantSlug}
      requiresIdentifier={!result.tenant.isDemo && !customerIdentifier}
    />
  )
}
