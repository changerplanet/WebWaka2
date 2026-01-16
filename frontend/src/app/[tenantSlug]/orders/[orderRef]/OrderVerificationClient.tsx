'use client'

/**
 * Wave B2-Fix (B2-F1): Order Verification Client
 * 
 * SECURITY MODEL:
 * For live tenants, customers must verify their identity (email or phone)
 * before viewing order details. Order reference alone is insufficient.
 * 
 * This component:
 * 1. Shows a verification form
 * 2. Does NOT reveal whether the order exists
 * 3. Redirects to order detail with verification params on success
 * 
 * GAP-5 CLOSURE: Order number is no longer a bearer token for live tenants.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrderPortalTenant } from '@/lib/orders/public-order-resolver'

interface OrderVerificationClientProps {
  tenant: OrderPortalTenant
  orderRef: string
  tenantSlug: string
}

export default function OrderVerificationClient({ 
  tenant, 
  orderRef, 
  tenantSlug 
}: OrderVerificationClientProps) {
  const router = useRouter()
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const value = verificationMethod === 'email' ? email : phone
    if (!value.trim()) {
      setError(`Please enter your ${verificationMethod}`)
      setIsSubmitting(false)
      return
    }

    const params = new URLSearchParams()
    if (verificationMethod === 'email') {
      params.set('email', email.trim())
    } else {
      params.set('phone', phone.trim())
    }

    router.push(`/${tenantSlug}/orders/${orderRef}?${params.toString()}`)
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verify to View Order
            </h2>
            <p className="text-gray-600 text-sm">
              To protect your privacy, please verify your identity using the email or phone 
              you used when placing this order.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setVerificationMethod('email')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  verificationMethod === 'email'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setVerificationMethod('phone')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  verificationMethod === 'phone'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Phone
              </button>
            </div>

            {verificationMethod === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                  autoComplete="email"
                />
              </div>
            ) : (
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
            )}

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {isSubmitting ? 'Verifying...' : 'View Order'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Your information is used only to verify order ownership and is not stored.
          </p>
        </div>
      </main>
    </div>
  )
}
