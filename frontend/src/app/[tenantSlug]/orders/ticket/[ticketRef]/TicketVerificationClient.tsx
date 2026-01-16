'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrderPortalTenant } from '@/lib/orders/public-order-resolver'

interface TicketVerificationClientProps {
  tenant: OrderPortalTenant
  ticketRef: string
  tenantSlug: string
}

export default function TicketVerificationClient({ 
  tenant, 
  ticketRef, 
  tenantSlug 
}: TicketVerificationClientProps) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!phone.trim()) {
      setError('Please enter your phone number')
      setIsSubmitting(false)
      return
    }

    const params = new URLSearchParams()
    params.set('phone', phone.trim())

    router.push(`/${tenantSlug}/orders/ticket/${ticketRef}?${params.toString()}`)
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ '--tenant-primary': tenant.primaryColor } as React.CSSProperties}
    >
      <header 
        className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3"
        style={{ backgroundColor: tenant.primaryColor }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-white text-center">
            Verify Your Identity
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verify to View Ticket
            </h2>
            <p className="text-gray-600 text-sm">
              To protect your privacy, please enter the phone number used when purchasing this ticket.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                autoComplete="tel"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {isSubmitting ? 'Verifying...' : 'View Ticket'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your information is used only to verify ticket ownership and is not stored.
          </p>
        </div>
      </main>
    </div>
  )
}
