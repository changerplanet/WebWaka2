/**
 * SVM Checkout Orchestration Service
 * 
 * Composes tax, shipping, payment, and order creation into a unified
 * checkout flow. Ensures consistent calculation and validation.
 * 
 * @module lib/svm/checkout-service
 */

import { prisma } from '../prisma'
import { formatNGN, DEFAULT_CURRENCY } from '../currency'
import { calculateTax, NIGERIA_VAT_RATE, getTaxConfig } from '../tax'
import { 
  calculateShipping, 
  findZoneForState,
  isLocalPickupAvailable,
  type ShippingCalculation 
} from './shipping-service'
import { 
  getAvailablePaymentMethods,
  calculatePaymentTotal,
  type PaymentMethodCode,
  type PaymentMethodAvailability
} from './payment-service'
import {
  checkCancellationEligibility
} from './order-lifecycle-service'

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  sku?: string
  imageUrl?: string
  unitPrice: number
  quantity: number
  categoryId?: string
}

export interface ShippingAddress {
  name: string
  phone: string
  email?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode?: string
  country: string
}

export interface CheckoutSummary {
  // Items
  items: CartItem[]
  itemCount: number
  
  // Amounts (all in NGN)
  subtotal: number
  subtotalFormatted: string
  
  // Discount
  discountCode?: string
  discountTotal: number
  discountFormatted: string
  
  // Tax
  taxRate: number
  taxName: string
  taxTotal: number
  taxFormatted: string
  
  // Shipping
  shippingOption?: ShippingCalculation
  shippingTotal: number
  shippingFormatted: string
  
  // Payment
  paymentMethod?: PaymentMethodCode
  paymentFee: number
  paymentFeeFormatted: string
  
  // Grand Total
  grandTotal: number
  grandTotalFormatted: string
  
  // Currency
  currency: string
}

export interface CheckoutValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface CheckoutSession {
  tenantId: string
  cartId?: string
  sessionId: string
  customerId?: string
  items: CartItem[]
  shippingAddress?: ShippingAddress
  shippingOption?: ShippingCalculation
  paymentMethod?: PaymentMethodCode
  promotionCode?: string
  summary: CheckoutSummary
  validation: CheckoutValidation
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// CHECKOUT CALCULATION
// ============================================================================

/**
 * Calculate complete checkout summary
 */
export async function calculateCheckoutSummary(
  tenantId: string,
  items: CartItem[],
  options: {
    shippingAddress?: ShippingAddress
    shippingOption?: ShippingCalculation
    paymentMethod?: PaymentMethodCode
    promotionCode?: string
    discountTotal?: number
  } = {}
): Promise<CheckoutSummary> {
  const { 
    shippingAddress, 
    shippingOption, 
    paymentMethod,
    promotionCode,
    discountTotal = 0 
  } = options
  
  // Calculate item totals
  const itemCount = items.reduce((sum: any, item: any) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum: any, item: any) => sum + (item.unitPrice * item.quantity), 0)
  
  // Get tax configuration
  const taxConfig = await getTaxConfig(tenantId)
  const taxableAmount = subtotal - discountTotal
  const taxTotal = Math.round(taxableAmount * taxConfig.taxRate * 100) / 100
  
  // Shipping
  const shippingTotal = shippingOption?.fee ?? 0
  
  // Payment fee
  let paymentFee = 0
  if (paymentMethod) {
    const paymentTotals = await calculatePaymentTotal(
      tenantId,
      subtotal,
      shippingTotal,
      taxTotal,
      discountTotal,
      paymentMethod
    )
    paymentFee = paymentTotals.paymentFee
  }
  
  // Grand total
  const grandTotal = subtotal - discountTotal + taxTotal + shippingTotal + paymentFee
  
  return {
    items,
    itemCount,
    subtotal,
    subtotalFormatted: formatNGN(subtotal),
    discountCode: promotionCode,
    discountTotal,
    discountFormatted: discountTotal > 0 ? `-${formatNGN(discountTotal)}` : formatNGN(0),
    taxRate: taxConfig.taxRate,
    taxName: taxConfig.taxName,
    taxTotal,
    taxFormatted: formatNGN(taxTotal),
    shippingOption,
    shippingTotal,
    shippingFormatted: shippingTotal === 0 ? 'FREE' : formatNGN(shippingTotal),
    paymentMethod,
    paymentFee,
    paymentFeeFormatted: paymentFee > 0 ? formatNGN(paymentFee) : formatNGN(0),
    grandTotal,
    grandTotalFormatted: formatNGN(grandTotal),
    currency: DEFAULT_CURRENCY
  }
}

// ============================================================================
// CHECKOUT VALIDATION
// ============================================================================

/**
 * Validate checkout data
 */
export async function validateCheckout(
  tenantId: string,
  items: CartItem[],
  shippingAddress?: ShippingAddress,
  shippingOption?: ShippingCalculation,
  paymentMethod?: PaymentMethodCode
): Promise<CheckoutValidation> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate items
  if (!items || items.length === 0) {
    errors.push('Cart is empty')
  }
  
  for (const item of items) {
    if (item.quantity <= 0) {
      errors.push(`Invalid quantity for ${item.productName}`)
    }
    if (item.unitPrice < 0) {
      errors.push(`Invalid price for ${item.productName}`)
    }
  }
  
  // Validate shipping address
  if (!shippingAddress) {
    errors.push('Shipping address is required')
  } else {
    if (!shippingAddress.name?.trim()) {
      errors.push('Recipient name is required')
    }
    if (!shippingAddress.phone?.trim()) {
      errors.push('Phone number is required')
    }
    if (!shippingAddress.address1?.trim()) {
      errors.push('Street address is required')
    }
    if (!shippingAddress.city?.trim()) {
      errors.push('City is required')
    }
    if (!shippingAddress.state?.trim()) {
      errors.push('State is required')
    }
    
    // Validate Nigerian phone format
    if (shippingAddress.phone) {
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/
      if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ''))) {
        warnings.push('Phone number may not be in valid Nigerian format')
      }
    }
  }
  
  // Validate shipping option
  if (!shippingOption && shippingAddress) {
    errors.push('Please select a shipping method')
  }
  
  // Validate payment method
  if (!paymentMethod) {
    errors.push('Please select a payment method')
  } else if (shippingAddress) {
    const subtotal = items.reduce((sum: any, item: any) => sum + (item.unitPrice * item.quantity), 0)
    const availability = await getAvailablePaymentMethods(
      tenantId, 
      subtotal, 
      shippingAddress.state
    )
    const selectedMethod = availability.find((a: any) => a.method.code === paymentMethod)
    
    if (selectedMethod && !selectedMethod.isAvailable) {
      errors.push(selectedMethod.unavailableReason || 'Selected payment method is not available')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// CHECKOUT SESSION MANAGEMENT
// ============================================================================

/**
 * Create or update checkout session
 */
export async function createCheckoutSession(
  tenantId: string,
  sessionId: string,
  items: CartItem[],
  options: {
    cartId?: string
    customerId?: string
    shippingAddress?: ShippingAddress
  } = {}
): Promise<CheckoutSession> {
  const { cartId, customerId, shippingAddress } = options
  
  // Get shipping options if address provided
  let shippingOptions: ShippingCalculation[] = []
  if (shippingAddress?.state) {
    shippingOptions = await calculateShipping(
      tenantId,
      shippingAddress.state,
      items.reduce((sum: any, item: any) => sum + (item.unitPrice * item.quantity), 0)
    )
  }
  
  // Calculate initial summary
  const summary = await calculateCheckoutSummary(tenantId, items, { shippingAddress })
  
  // Validate
  const validation = await validateCheckout(tenantId, items, shippingAddress)
  
  return {
    tenantId,
    cartId,
    sessionId,
    customerId,
    items,
    shippingAddress,
    shippingOption: shippingOptions[0], // Default to first option
    summary,
    validation,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Update checkout session with shipping selection
 */
export async function updateCheckoutShipping(
  session: CheckoutSession,
  shippingOption: ShippingCalculation
): Promise<CheckoutSession> {
  const summary = await calculateCheckoutSummary(
    session.tenantId,
    session.items,
    {
      shippingAddress: session.shippingAddress,
      shippingOption,
      paymentMethod: session.paymentMethod,
      promotionCode: session.summary.discountCode,
      discountTotal: session.summary.discountTotal
    }
  )
  
  const validation = await validateCheckout(
    session.tenantId,
    session.items,
    session.shippingAddress,
    shippingOption,
    session.paymentMethod
  )
  
  return {
    ...session,
    shippingOption,
    summary,
    validation,
    updatedAt: new Date()
  }
}

/**
 * Update checkout session with payment method selection
 */
export async function updateCheckoutPayment(
  session: CheckoutSession,
  paymentMethod: PaymentMethodCode
): Promise<CheckoutSession> {
  const summary = await calculateCheckoutSummary(
    session.tenantId,
    session.items,
    {
      shippingAddress: session.shippingAddress,
      shippingOption: session.shippingOption,
      paymentMethod,
      promotionCode: session.summary.discountCode,
      discountTotal: session.summary.discountTotal
    }
  )
  
  const validation = await validateCheckout(
    session.tenantId,
    session.items,
    session.shippingAddress,
    session.shippingOption,
    paymentMethod
  )
  
  return {
    ...session,
    paymentMethod,
    summary,
    validation,
    updatedAt: new Date()
  }
}

// ============================================================================
// ORDER CREATION
// ============================================================================

/**
 * Finalize checkout and create order
 */
export async function finalizeCheckout(
  session: CheckoutSession,
  customerEmail: string,
  customerNotes?: string
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  // Final validation
  const validation = await validateCheckout(
    session.tenantId,
    session.items,
    session.shippingAddress,
    session.shippingOption,
    session.paymentMethod
  )
  
  if (!validation.isValid) {
    return { 
      success: false, 
      error: validation.errors.join('; ') 
    }
  }
  
  if (!session.shippingAddress || !session.shippingOption || !session.paymentMethod) {
    return { success: false, error: 'Missing required checkout information' }
  }
  
  try {
    // Generate order number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    const orderNumber = `ORD-${year}${month}${day}-${seq}`
    
    // Determine initial payment status based on payment method
    // SvmPaymentStatus enum: PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED, PARTIALLY_REFUNDED
    const paymentStatus = 'PENDING' as const
    
    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const orderId = `order_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
      const newOrder = await tx.svm_orders.create({
        data: {
          id: orderId,
          tenantId: session.tenantId,
          orderNumber,
          customerId: session.customerId || null,
          customerEmail,
          customerPhone: session.shippingAddress!.phone,
          customerName: session.shippingAddress!.name,
          status: 'PENDING',
          paymentStatus,
          fulfillmentStatus: 'UNFULFILLED',
          sourceCartId: session.cartId || null,
          channel: 'WEB',
          currency: DEFAULT_CURRENCY,
          subtotal: session.summary.subtotal,
          discountTotal: session.summary.discountTotal,
          taxTotal: session.summary.taxTotal,
          shippingTotal: session.summary.shippingTotal,
          grandTotal: session.summary.grandTotal + session.summary.paymentFee,
          promotionCode: session.summary.discountCode || null,
          paymentMethod: session.paymentMethod,
          shippingAddress: JSON.parse(JSON.stringify(session.shippingAddress)),
          shippingMethod: session.shippingOption!.rateName,
          customerNotes: customerNotes || null,
          updatedAt: new Date(),
          svm_order_items: {
            create: session.items.map((item: any) => ({
              id: `item_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`,
              productId: item.productId,
              variantId: item.variantId || null,
              productName: item.productName,
              variantName: item.variantName || null,
              sku: item.sku || null,
              imageUrl: item.imageUrl || null,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.unitPrice * item.quantity,
              discountAmount: 0,
              taxAmount: 0,
              updatedAt: new Date()
            }))
          }
        }
      })
      
      // Mark cart as converted if applicable
      if (session.cartId) {
        await tx.svm_carts.update({
          where: { id: session.cartId },
          data: {
            status: 'CONVERTED',
            convertedToOrderId: newOrder.id,
            convertedAt: new Date()
          }
        })
      }
      
      return newOrder
    })
    
    console.log(`[SVM Checkout] Order created: ${order.orderNumber}`)
    
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber
    }
  } catch (error) {
    console.error('[SVM Checkout] Error creating order:', error)
    return { success: false, error: 'Failed to create order' }
  }
}

// ============================================================================
// CHECKOUT HELPERS
// ============================================================================

/**
 * Get available shipping options for checkout
 */
export async function getCheckoutShippingOptions(
  tenantId: string,
  state: string,
  subtotal: number
): Promise<ShippingCalculation[]> {
  return calculateShipping(tenantId, state, subtotal, true)
}

/**
 * Get available payment methods for checkout
 */
export async function getCheckoutPaymentMethods(
  tenantId: string,
  amount: number,
  state?: string
): Promise<PaymentMethodAvailability[]> {
  return getAvailablePaymentMethods(tenantId, amount, state)
}

/**
 * Check if local pickup is available
 */
export async function checkLocalPickupAvailable(tenantId: string): Promise<boolean> {
  return isLocalPickupAvailable(tenantId)
}

/**
 * Format checkout totals for display
 */
export function formatCheckoutLine(label: string, amount: number, isNegative: boolean = false): string {
  const formatted = formatNGN(Math.abs(amount))
  return isNegative ? `-${formatted}` : formatted
}
