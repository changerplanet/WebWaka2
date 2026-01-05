'use client'

import { useState, useEffect } from 'react'
import { useSVM, ShippingAddress } from './SVMProvider'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  CreditCard, 
  Truck, 
  MapPin, 
  Package,
  Loader2,
  Shield,
  Clock
} from 'lucide-react'

// ============================================================================
// CHECKOUT PAGE
// ============================================================================

interface CheckoutPageProps {
  onBack: () => void
  onComplete: () => void
}

type CheckoutStep = 'shipping' | 'delivery' | 'payment' | 'review'

export function CheckoutPage({ onBack, onComplete }: CheckoutPageProps) {
  const { 
    cart, 
    shippingAddress, 
    setShippingAddress, 
    shippingOptions,
    selectedShipping,
    calculateShipping,
    selectShipping,
    isLoadingShipping,
    placeOrder
  } = useSVM()
  
  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ShippingAddress>({
    name: shippingAddress?.name || '',
    email: shippingAddress?.email || '',
    phone: shippingAddress?.phone || '',
    address1: shippingAddress?.address1 || '',
    address2: shippingAddress?.address2 || '',
    city: shippingAddress?.city || '',
    state: shippingAddress?.state || '',
    postalCode: shippingAddress?.postalCode || '',
    country: shippingAddress?.country || 'US'
  })

  const steps: { key: CheckoutStep; label: string; icon: any }[] = [
    { key: 'shipping', label: 'Shipping', icon: MapPin },
    { key: 'delivery', label: 'Delivery', icon: Truck },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'review', label: 'Review', icon: Check }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    if (!formData.name || !formData.email || !formData.address1 || !formData.city || !formData.postalCode) {
      setError('Please fill in all required fields')
      return
    }

    setShippingAddress(formData)
    await calculateShipping(formData)
    setStep('delivery')
    setError(null)
  }

  const handleDeliverySubmit = () => {
    if (!selectedShipping) {
      setError('Please select a shipping method')
      return
    }
    setStep('payment')
    setError(null)
  }

  const handlePaymentSubmit = () => {
    // For demo, skip actual payment
    setStep('review')
    setError(null)
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    setError(null)
    
    const result = await placeOrder()
    
    if (result.success) {
      onComplete()
    } else {
      setError(result.error || 'Failed to place order')
    }
    
    setIsProcessing(false)
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-6">Add some products before checking out</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto" data-testid="checkout-page">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-green-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to cart
      </button>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isActive = idx === currentStepIndex
            const isCompleted = idx < currentStepIndex

            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-green-600 text-white' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    isActive ? 'text-green-600' : 'text-slate-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-4 rounded ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Shipping Form */}
          {step === 'shipping' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" data-testid="shipping-form">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Shipping Address</h2>
              
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                  <input
                    type="text"
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    placeholder="Street address"
                    data-testid="input-address1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apt, Suite, etc.</label>
                  <input
                    type="text"
                    name="address2"
                    value={formData.address2 || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="input-address2"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      data-testid="input-postalCode"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="input-country"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  data-testid="continue-to-delivery"
                >
                  Continue to Delivery
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}

          {/* Delivery Options */}
          {step === 'delivery' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" data-testid="delivery-options">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Delivery Method</h2>
              
              {isLoadingShipping ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.rateId}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedShipping?.rateId === option.rateId
                          ? 'border-green-600 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      data-testid={`shipping-option-${option.rateId}`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.rateId === option.rateId}
                        onChange={() => selectShipping(option)}
                        className="w-5 h-5 text-green-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{option.rateName}</span>
                          {option.carrier && (
                            <span className="text-xs text-slate-500">via {option.carrier}</span>
                          )}
                        </div>
                        {option.estimatedDays && option.estimatedDays.min !== undefined && option.estimatedDays.max !== undefined && (
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4" />
                            {option.estimatedDays.min === option.estimatedDays.max
                              ? `${option.estimatedDays.min} day${option.estimatedDays.min > 1 ? 's' : ''}`
                              : `${option.estimatedDays.min}-${option.estimatedDays.max} days`
                            }
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {option.isFree ? (
                          <span className="font-bold text-emerald-600">FREE</span>
                        ) : (
                          <span className="font-bold text-slate-900">${option.fee.toFixed(2)}</span>
                        )}
                        {option.amountToFreeShipping && option.amountToFreeShipping > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            ${option.amountToFreeShipping.toFixed(2)} to free shipping
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('shipping')}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDeliverySubmit}
                  disabled={!selectedShipping}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  data-testid="continue-to-payment"
                >
                  Continue to Payment
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Payment (Demo) */}
          {step === 'payment' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" data-testid="payment-form">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Payment</h2>
              
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                <p className="text-amber-800 font-medium">Demo Mode</p>
                <p className="text-amber-700 text-sm mt-1">
                  Payment processing is simulated. Click "Continue to Review" to proceed.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    data-testid="card-number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                <Shield className="w-4 h-4" />
                <span>Your payment information is secure</span>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('delivery')}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  data-testid="continue-to-review"
                >
                  Continue to Review
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Review Order */}
          {step === 'review' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" data-testid="order-review">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Review Your Order</h2>
              
              {/* Shipping Address */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <h3 className="font-medium text-slate-900 mb-2">Shipping Address</h3>
                {shippingAddress && (
                  <div className="text-slate-600">
                    <p>{shippingAddress.name}</p>
                    <p>{shippingAddress.address1}</p>
                    {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p>{shippingAddress.country}</p>
                  </div>
                )}
              </div>

              {/* Delivery Method */}
              <div className="mb-6 pb-6 border-b border-slate-200">
                <h3 className="font-medium text-slate-900 mb-2">Delivery Method</h3>
                {selectedShipping && (
                  <p className="text-slate-600">
                    {selectedShipping.rateName} 
                    {selectedShipping.estimatedDays && ` (${selectedShipping.estimatedDays.min}-${selectedShipping.estimatedDays.max} days)`}
                    {' - '}
                    {selectedShipping.isFree ? 'FREE' : `$${selectedShipping.fee.toFixed(2)}`}
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 mb-3">Items ({cart.itemCount})</h3>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        {item.variantName && <p className="text-sm text-slate-500">{item.variantName}</p>}
                        <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-slate-900">${item.lineTotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('payment')}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                  data-testid="place-order-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order - ${cart.total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden relative">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-700 text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-slate-500">{item.variantName}</p>}
                  </div>
                  <p className="text-sm font-medium text-slate-900">${item.lineTotal.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-slate-200 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-${cart.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>
                  {selectedShipping 
                    ? (selectedShipping.isFree ? 'FREE' : `$${selectedShipping.fee.toFixed(2)}`)
                    : 'Calculated next'
                  }
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>${cart.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Note: CheckoutPage exported inline with 'export function'
