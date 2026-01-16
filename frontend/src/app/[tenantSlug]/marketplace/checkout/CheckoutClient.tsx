'use client'

/**
 * MVM Checkout Client Component (Wave K.2)
 * 
 * Vendor-grouped order summary, payment method selection,
 * and checkout flow for multi-vendor marketplace.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VendorTrustBadge } from '@/components/mvm/VendorTrustBadge'

interface VendorGroup {
  vendorId: string
  vendorName: string
  vendorSlug: string
  vendorLogo: string | null
  trustBadge: string | null
  averageRating: number | null
  items: CartItem[]
  subtotal: number
}

interface CartItem {
  id: string
  vendorId: string
  vendorName: string
  productId: string
  productName: string
  productImage: string | null
  variantId: string | null
  variantName: string | null
  quantity: number
  priceSnapshot: number
  currency: string
}

interface Cart {
  id: string
  items: CartItem[]
  vendorGroups: VendorGroup[]
  totalItems: number
  totalAmount: number
  currency: string
}

interface Props {
  tenantId: string
  tenantSlug: string
  tenantName: string
  isDemo: boolean
  primaryColor: string
}

type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'COD'

interface ShippingAddress {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  landmark: string
}

export function CheckoutClient({ tenantSlug, tenantName, isDemo, primaryColor }: Props) {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD')
  const [notes, setNotes] = useState('')
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'NG',
    landmark: ''
  })

  useEffect(() => {
    fetchCart()
  }, [])

  async function fetchCart() {
    try {
      setLoading(true)
      const res = await fetch(`/api/mvm/cart?tenantSlug=${tenantSlug}`)
      const data = await res.json()
      
      if (data.cart) {
        setCart(data.cart)
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err)
      setError('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout() {
    if (!cart || cart.items.length === 0) return
    
    if (!customerEmail) {
      setError('Email is required')
      return
    }
    
    if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state) {
      setError('Complete shipping address is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const res = await fetch('/api/mvm/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          customerEmail,
          customerPhone,
          customerName,
          shippingAddress,
          paymentMethod,
          notes
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed. Please try again.')
      }

      if (data.payment?.authorizationUrl) {
        window.location.href = data.payment.authorizationUrl
      } else {
        router.push(`/${tenantSlug}/orders?ref=${data.orderNumber}`)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-4">Add some products before checking out</p>
        <button
          onClick={() => router.push(`/${tenantSlug}/marketplace`)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Checkout</h1>
          </div>
          {isDemo && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
              Demo Mode
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <section className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+234 ..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Shipping Address</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                    placeholder="Apartment, suite, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={shippingAddress.landmark}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                    placeholder="Near the yellow building..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="Lagos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">State *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="Lagos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Card Payment</div>
                    <div className="text-sm text-gray-500">Pay with debit/credit card via Paystack</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Bank Transfer</div>
                    <div className="text-sm text-gray-500">Pay via direct bank transfer</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Order Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </section>
          </div>

          <div className="space-y-4">
            <section className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {cart.vendorGroups.map((group) => (
                  <div key={group.vendorId} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-medium text-gray-900">{group.vendorName}</span>
                      {group.trustBadge && (
                        <VendorTrustBadge badge={group.trustBadge} size="sm" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <span className="text-gray-700">{item.productName}</span>
                            {item.variantName && (
                              <span className="text-gray-500"> - {item.variantName}</span>
                            )}
                            <span className="text-gray-500"> x{item.quantity}</span>
                          </div>
                          <span className="text-gray-900 font-medium">
                            {formatPrice(item.priceSnapshot * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm">
                      <span className="text-gray-600">Vendor subtotal</span>
                      <span className="font-medium">{formatPrice(group.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({cart.totalItems} items)</span>
                  <span>{formatPrice(cart.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-500">Calculated at delivery</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(cart.totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting || cart.items.length === 0}
                className="w-full mt-4 py-3 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? 'Processing...' : paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Payment'}
              </button>

              {isDemo && (
                <p className="mt-2 text-xs text-center text-gray-500">
                  Demo mode: No real charges will be made
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
