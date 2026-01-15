/**
 * CANONICAL ORDER TYPES
 * Wave J.1: Unified Order Abstraction (Read-Only)
 * 
 * These interfaces provide a normalized view of orders across SVM, MVM, and ParkHub
 * without modifying the underlying schemas.
 * 
 * CONSTRAINTS:
 * - ❌ No schema changes - read-only abstraction
 * - ❌ No mutations - these are view models only
 * - ❌ No business logic - pure data transformation
 * - ✅ Maps existing data to canonical format
 * 
 * @module lib/commerce/canonical-order/types
 */

export type OrderType = 'SVM' | 'MVM' | 'PARKHUB'

export enum CanonicalOrderStatus {
  CREATED = 'CREATED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export interface CanonicalMoney {
  subtotal: number
  total: number
  currency: 'NGN'
}

export interface CanonicalOrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl?: string
  vendorId?: string
  vendorName?: string
  sku?: string
}

export interface CanonicalCustomer {
  email?: string
  phone?: string
  name?: string
  source: OrderType
}

export interface CanonicalOrder {
  id: string
  tenantId: string
  type: OrderType
  reference: string
  status: CanonicalOrderStatus
  paymentStatus: string
  amount: CanonicalMoney
  items: CanonicalOrderItem[]
  customer: CanonicalCustomer
  createdAt: Date
  sourceId: string
  metadata: Record<string, unknown>
}

export interface CanonicalOrderListResult {
  orders: CanonicalOrder[]
  total: number
}
