/**
 * Wave B2-Fix (B2-F1): Order Access Hardening
 * 
 * SECURITY MODEL:
 * - Demo tenants: Direct order access allowed (preserved behavior)
 * - Live tenants: Order reference alone is INSUFFICIENT
 *   - Must provide email or phone verification via query params
 *   - Redirects to verification page if not provided
 * 
 * GAP-5 CLOSURE: Order number is no longer a bearer token for live tenants.
 */
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { resolveOrderByRef, resolveOrderPortalTenant } from '@/lib/orders/public-order-resolver'
import OrderDetailClient from './OrderDetailClient'
import OrderVerificationClient from './OrderVerificationClient'

interface OrderDetailPageProps {
  params: Promise<{ tenantSlug: string; orderRef: string }>
  searchParams: Promise<{ email?: string; phone?: string }>
}

export async function generateMetadata({ params, searchParams }: OrderDetailPageProps): Promise<Metadata> {
  const { tenantSlug, orderRef } = await params
  const { email, phone } = await searchParams
  const result = await resolveOrderByRef(tenantSlug, orderRef, { email, phone })
  
  if (!result.success) {
    // B2-F1: Don't reveal order existence - generic title for all failures
    return {
      title: 'View Order',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Order #${result.order.orderNumber} | ${result.tenant.appName}`,
    description: `View details for order #${result.order.orderNumber}`,
    robots: { index: false, follow: false },
  }
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { tenantSlug, orderRef } = await params
  const { email, phone } = await searchParams
  const result = await resolveOrderByRef(tenantSlug, orderRef, { email, phone })

  // B2-F1: Live tenants require verification - show verification form
  if (!result.success && result.reason === 'verification_required') {
    return (
      <OrderVerificationClient 
        tenant={result.tenant}
        orderRef={orderRef}
        tenantSlug={tenantSlug}
      />
    )
  }

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
