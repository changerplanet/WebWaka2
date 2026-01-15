'use client'

import Link from 'next/link'
import { 
  OrderPortalTenant, 
  ParkHubTicket, 
  formatNGN, 
  getOrderStatusColor,
  getPaymentMethodLabel
} from '@/lib/orders/public-order-resolver'

interface TicketDetailClientProps {
  tenant: OrderPortalTenant
  ticket: ParkHubTicket
  tenantSlug: string
}

export default function TicketDetailClient({ tenant, ticket, tenantSlug }: TicketDetailClientProps) {
  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ '--tenant-primary': tenant.primaryColor } as React.CSSProperties}
    >
      <header 
        className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3"
        style={{ backgroundColor: tenant.primaryColor }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={`/${tenantSlug}/orders`}
              className="text-white hover:opacity-80"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-white">Transport Ticket</h1>
          </div>
          {tenant.isDemo && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
              DEMO
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <div 
          className="bg-white rounded-xl shadow-sm border-2 p-6 text-center"
          style={{ borderColor: tenant.primaryColor }}
        >
          <div className="text-5xl mb-4">🎫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Ticket #{ticket.ticketNumber}
          </h2>
          <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getOrderStatusColor(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Passenger Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-medium text-gray-900">{ticket.passengerName}</span>
            </div>
            {ticket.passengerPhone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium text-gray-900">{ticket.passengerPhone}</span>
              </div>
            )}
            {ticket.seatNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Seat Number</span>
                <span className="font-bold text-lg" style={{ color: tenant.primaryColor }}>
                  {ticket.seatNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method</span>
              <span className="font-medium text-gray-900">
                {getPaymentMethodLabel(ticket.paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getOrderStatusColor(ticket.paymentStatus)}`}>
                {ticket.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Price</span>
              <span className="font-medium text-gray-900">{formatNGN(ticket.price)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
              <span className="font-semibold text-gray-900">Amount Paid</span>
              <span className="text-xl font-bold" style={{ color: tenant.primaryColor }}>
                {formatNGN(ticket.totalPaid)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Purchase Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Purchased</span>
              <span className="font-medium text-gray-900">
                {new Date(ticket.soldAt).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })} at {new Date(ticket.soldAt).toLocaleTimeString('en-NG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl p-4 text-center text-sm text-gray-600">
          <p className="mb-2">Present this ticket at the park for boarding</p>
          <p className="font-mono text-lg font-bold text-gray-900">
            {ticket.ticketNumber}
          </p>
        </div>
      </main>
    </div>
  )
}
