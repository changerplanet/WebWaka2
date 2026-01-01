/**
 * POS Transaction Engine - Sales Lifecycle
 * 
 * STATE MACHINE:
 * DRAFT → SUSPENDED → PENDING_PAYMENT → PARTIALLY_PAID → COMPLETED
 *                                                      → VOIDED
 *                                                      → REFUNDED
 * 
 * CONSTRAINTS:
 * - Inventory is NOT mutated directly
 * - Events are emitted for Core to handle
 * - All monetary calculations use Decimal.js for precision
 */

import Decimal from 'decimal.js'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SaleStatus = 
  | 'DRAFT'
  | 'SUSPENDED'
  | 'PENDING_PAYMENT'
  | 'PARTIALLY_PAID'
  | 'COMPLETED'
  | 'VOIDED'
  | 'REFUNDED'

export type PaymentMethod = 
  | 'CASH'
  | 'CARD'
  | 'MOBILE_PAYMENT'
  | 'STORE_CREDIT'
  | 'GIFT_CARD'
  | 'LAYAWAY_PAYMENT'
  | 'SPLIT'
  | 'OTHER'

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y' | 'BUNDLE'
export type DiscountScope = 'SALE' | 'LINE_ITEM' | 'CATEGORY'

// Input types
export interface CreateSaleInput {
  tenantId: string
  staffId: string
  registerId?: string
  sessionId?: string
  shiftId?: string
  customerId?: string
  offlineId?: string
}

export interface AddItemInput {
  productId: string
  variantId?: string
  productName: string
  productSku?: string
  variantName?: string
  unitPrice: number
  quantity: number
  taxRate?: number
  taxExempt?: boolean
  serialNumber?: string
  batchNumber?: string
  notes?: string
}

export interface ApplyDiscountInput {
  name: string
  code?: string
  type: DiscountType
  scope: DiscountScope
  value: number
  lineItemId?: string
  discountRuleId?: string
  reason?: string
  requiresApproval?: boolean
  approvedByStaffId?: string
}

export interface AddPaymentInput {
  method: PaymentMethod
  amount: number
  tipAmount?: number
  cashReceived?: number
  cardLastFour?: string
  cardBrand?: string
  authCode?: string
  giftCardNumber?: string
  storeCreditId?: string
  corePaymentId?: string
  offlineId?: string
}

export interface SuspendSaleInput {
  reason?: string
}

export interface VoidSaleInput {
  reason: string
  staffId: string
}

// Sale state representation
export interface SaleState {
  id: string
  tenantId: string
  saleNumber: string
  status: SaleStatus
  customerId?: string
  staffId: string
  registerId?: string
  sessionId?: string
  shiftId?: string
  lineItems: LineItemState[]
  discounts: DiscountState[]
  payments: PaymentState[]
  subtotal: Decimal
  discountTotal: Decimal
  taxTotal: Decimal
  grandTotal: Decimal
  amountPaid: Decimal
  amountDue: Decimal
  changeGiven: Decimal
  suspendedAt?: Date
  suspendReason?: string
  completedAt?: Date
  voidedAt?: Date
  voidReason?: string
  offlineId?: string
  createdAt: Date
  updatedAt: Date
}

export interface LineItemState {
  id: string
  productId: string
  variantId?: string
  productName: string
  productSku?: string
  variantName?: string
  unitPrice: Decimal
  quantity: Decimal
  lineSubtotal: Decimal
  discountAmount: Decimal
  taxAmount: Decimal
  lineTotal: Decimal
  taxRate?: Decimal
  taxExempt: boolean
  sortOrder: number
}

export interface DiscountState {
  id: string
  lineItemId?: string
  name: string
  code?: string
  type: DiscountType
  scope: DiscountScope
  value: Decimal
  calculatedAmount: Decimal
  requiresApproval: boolean
  approvedByStaffId?: string
  approvedAt?: Date
}

export interface PaymentState {
  id: string
  method: PaymentMethod
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  amount: Decimal
  tipAmount: Decimal
  totalAmount: Decimal
  cashReceived?: Decimal
  changeGiven?: Decimal
  corePaymentId?: string
  processedAt?: Date
}

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================

export type POSEvent = 
  | SaleCreatedEvent
  | SaleItemAddedEvent
  | SaleItemRemovedEvent
  | SaleItemUpdatedEvent
  | SaleDiscountAppliedEvent
  | SaleDiscountRemovedEvent
  | SalePaymentAddedEvent
  | SalePaymentFailedEvent
  | SaleSuspendedEvent
  | SaleResumedEvent
  | SaleCompletedEvent
  | SaleVoidedEvent
  | InventoryReservationRequestedEvent
  | InventoryDeductionRequestedEvent
  | InventoryReleaseRequestedEvent

interface BaseEvent {
  eventId: string
  eventType: string
  timestamp: Date
  tenantId: string
  saleId: string
  staffId: string
  metadata?: Record<string, unknown>
}

export interface SaleCreatedEvent extends BaseEvent {
  eventType: 'pos.sale.created'
  payload: {
    saleNumber: string
    registerId?: string
    sessionId?: string
    customerId?: string
    offlineId?: string
  }
}

export interface SaleItemAddedEvent extends BaseEvent {
  eventType: 'pos.sale.item_added'
  payload: {
    lineItemId: string
    productId: string
    variantId?: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }
}

export interface SaleItemRemovedEvent extends BaseEvent {
  eventType: 'pos.sale.item_removed'
  payload: {
    lineItemId: string
    productId: string
    quantity: number
  }
}

export interface SaleItemUpdatedEvent extends BaseEvent {
  eventType: 'pos.sale.item_updated'
  payload: {
    lineItemId: string
    productId: string
    previousQuantity: number
    newQuantity: number
    quantityDelta: number
  }
}

export interface SaleDiscountAppliedEvent extends BaseEvent {
  eventType: 'pos.sale.discount_applied'
  payload: {
    discountId: string
    name: string
    type: DiscountType
    scope: DiscountScope
    value: number
    calculatedAmount: number
    lineItemId?: string
  }
}

export interface SaleDiscountRemovedEvent extends BaseEvent {
  eventType: 'pos.sale.discount_removed'
  payload: {
    discountId: string
    name: string
    calculatedAmount: number
  }
}

export interface SalePaymentAddedEvent extends BaseEvent {
  eventType: 'pos.sale.payment_added'
  payload: {
    paymentId: string
    method: PaymentMethod
    amount: number
    tipAmount: number
    totalAmount: number
    amountPaid: number
    amountDue: number
    isFullyPaid: boolean
  }
}

export interface SalePaymentFailedEvent extends BaseEvent {
  eventType: 'pos.sale.payment_failed'
  payload: {
    paymentId: string
    method: PaymentMethod
    amount: number
    reason: string
  }
}

export interface SaleSuspendedEvent extends BaseEvent {
  eventType: 'pos.sale.suspended'
  payload: {
    reason?: string
    itemCount: number
    grandTotal: number
  }
}

export interface SaleResumedEvent extends BaseEvent {
  eventType: 'pos.sale.resumed'
  payload: {
    suspendedDuration: number // milliseconds
  }
}

export interface SaleCompletedEvent extends BaseEvent {
  eventType: 'pos.sale.completed'
  payload: {
    saleNumber: string
    customerId?: string
    subtotal: number
    discountTotal: number
    taxTotal: number
    grandTotal: number
    amountPaid: number
    changeGiven: number
    itemCount: number
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }>
    payments: Array<{
      method: PaymentMethod
      amount: number
    }>
  }
}

export interface SaleVoidedEvent extends BaseEvent {
  eventType: 'pos.sale.voided'
  payload: {
    reason: string
    voidedByStaffId: string
    grandTotal: number
    itemCount: number
    items: Array<{
      productId: string
      quantity: number
    }>
  }
}

// Inventory-related events (for Core to handle)
export interface InventoryReservationRequestedEvent extends BaseEvent {
  eventType: 'pos.inventory.reservation_requested'
  payload: {
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
    }>
    reason: 'SALE_DRAFT' | 'LAYAWAY'
  }
}

export interface InventoryDeductionRequestedEvent extends BaseEvent {
  eventType: 'pos.inventory.deduction_requested'
  payload: {
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
      serialNumber?: string
      batchNumber?: string
    }>
    reason: 'SALE_COMPLETED'
  }
}

export interface InventoryReleaseRequestedEvent extends BaseEvent {
  eventType: 'pos.inventory.release_requested'
  payload: {
    items: Array<{
      productId: string
      variantId?: string
      quantity: number
    }>
    reason: 'SALE_VOIDED' | 'ITEM_REMOVED' | 'LAYAWAY_CANCELLED'
  }
}

// ============================================================================
// STATE MACHINE - VALID TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS: Record<SaleStatus, SaleStatus[]> = {
  DRAFT: ['SUSPENDED', 'PENDING_PAYMENT', 'VOIDED'],
  SUSPENDED: ['DRAFT', 'VOIDED'],
  PENDING_PAYMENT: ['PARTIALLY_PAID', 'COMPLETED', 'SUSPENDED', 'VOIDED'],
  PARTIALLY_PAID: ['COMPLETED', 'SUSPENDED', 'VOIDED'],
  COMPLETED: ['REFUNDED'],
  VOIDED: [],
  REFUNDED: []
}

export function canTransition(from: SaleStatus, to: SaleStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidTransitions(status: SaleStatus): SaleStatus[] {
  return VALID_TRANSITIONS[status] ?? []
}

// ============================================================================
// SALE ENGINE CLASS
// ============================================================================

export class SaleEngine {
  private state: SaleState
  private events: POSEvent[] = []
  private eventEmitter: (event: POSEvent) => Promise<void>

  constructor(
    initialState: SaleState,
    eventEmitter: (event: POSEvent) => Promise<void>
  ) {
    this.state = initialState
    this.eventEmitter = eventEmitter
  }

  // -------------------------------------------------------------------------
  // GETTERS
  // -------------------------------------------------------------------------

  getState(): Readonly<SaleState> {
    return { ...this.state }
  }

  getEvents(): readonly POSEvent[] {
    return [...this.events]
  }

  // -------------------------------------------------------------------------
  // SALE CREATION
  // -------------------------------------------------------------------------

  static create(
    input: CreateSaleInput,
    saleNumber: string,
    eventEmitter: (event: POSEvent) => Promise<void>
  ): SaleEngine {
    const now = new Date()
    const saleId = generateId()

    const initialState: SaleState = {
      id: saleId,
      tenantId: input.tenantId,
      saleNumber,
      status: 'DRAFT',
      customerId: input.customerId,
      staffId: input.staffId,
      registerId: input.registerId,
      sessionId: input.sessionId,
      shiftId: input.shiftId,
      lineItems: [],
      discounts: [],
      payments: [],
      subtotal: new Decimal(0),
      discountTotal: new Decimal(0),
      taxTotal: new Decimal(0),
      grandTotal: new Decimal(0),
      amountPaid: new Decimal(0),
      amountDue: new Decimal(0),
      changeGiven: new Decimal(0),
      offlineId: input.offlineId,
      createdAt: now,
      updatedAt: now
    }

    const engine = new SaleEngine(initialState, eventEmitter)
    
    // Emit creation event
    engine.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.created',
      timestamp: now,
      tenantId: input.tenantId,
      saleId,
      staffId: input.staffId,
      payload: {
        saleNumber,
        registerId: input.registerId,
        sessionId: input.sessionId,
        customerId: input.customerId,
        offlineId: input.offlineId
      }
    })

    return engine
  }

  // -------------------------------------------------------------------------
  // ADD ITEM
  // -------------------------------------------------------------------------

  async addItem(input: AddItemInput): Promise<LineItemState> {
    this.assertStatus(['DRAFT', 'SUSPENDED'])
    
    // Resume if suspended
    if (this.state.status === 'SUSPENDED') {
      await this.resume()
    }

    const lineItemId = generateId()
    const unitPrice = new Decimal(input.unitPrice)
    const quantity = new Decimal(input.quantity)
    const lineSubtotal = unitPrice.times(quantity)
    
    // Calculate tax
    const taxRate = input.taxRate ? new Decimal(input.taxRate) : new Decimal(0)
    const taxAmount = input.taxExempt ? new Decimal(0) : lineSubtotal.times(taxRate)
    const lineTotal = lineSubtotal // Tax added at sale level

    const lineItem: LineItemState = {
      id: lineItemId,
      productId: input.productId,
      variantId: input.variantId,
      productName: input.productName,
      productSku: input.productSku,
      variantName: input.variantName,
      unitPrice,
      quantity,
      lineSubtotal,
      discountAmount: new Decimal(0),
      taxAmount,
      lineTotal,
      taxRate: input.taxRate ? new Decimal(input.taxRate) : undefined,
      taxExempt: input.taxExempt ?? false,
      sortOrder: this.state.lineItems.length
    }

    this.state.lineItems.push(lineItem)
    this.recalculateTotals()
    this.state.updatedAt = new Date()

    // Emit item added event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.item_added',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        lineItemId,
        productId: input.productId,
        variantId: input.variantId,
        productName: input.productName,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        lineTotal: lineTotal.toNumber()
      }
    })

    return lineItem
  }

  // -------------------------------------------------------------------------
  // UPDATE ITEM QUANTITY
  // -------------------------------------------------------------------------

  async updateItemQuantity(lineItemId: string, newQuantity: number): Promise<LineItemState> {
    this.assertStatus(['DRAFT', 'SUSPENDED'])
    
    if (this.state.status === 'SUSPENDED') {
      await this.resume()
    }

    const itemIndex = this.state.lineItems.findIndex(i => i.id === lineItemId)
    if (itemIndex === -1) {
      throw new Error(`Line item ${lineItemId} not found`)
    }

    const item = this.state.lineItems[itemIndex]
    const previousQuantity = item.quantity.toNumber()
    const quantity = new Decimal(newQuantity)

    if (quantity.lte(0)) {
      return this.removeItem(lineItemId)
    }

    // Update calculations
    item.quantity = quantity
    item.lineSubtotal = item.unitPrice.times(quantity)
    item.taxAmount = item.taxExempt 
      ? new Decimal(0) 
      : item.lineSubtotal.times(item.taxRate ?? 0)
    item.lineTotal = item.lineSubtotal.minus(item.discountAmount)

    this.recalculateTotals()
    this.state.updatedAt = new Date()

    // Emit update event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.item_updated',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        lineItemId,
        productId: item.productId,
        previousQuantity,
        newQuantity,
        quantityDelta: newQuantity - previousQuantity
      }
    })

    return item
  }

  // -------------------------------------------------------------------------
  // REMOVE ITEM
  // -------------------------------------------------------------------------

  async removeItem(lineItemId: string): Promise<LineItemState> {
    this.assertStatus(['DRAFT', 'SUSPENDED'])
    
    if (this.state.status === 'SUSPENDED') {
      await this.resume()
    }

    const itemIndex = this.state.lineItems.findIndex(i => i.id === lineItemId)
    if (itemIndex === -1) {
      throw new Error(`Line item ${lineItemId} not found`)
    }

    const [removedItem] = this.state.lineItems.splice(itemIndex, 1)
    
    // Remove any discounts applied to this item
    this.state.discounts = this.state.discounts.filter(d => d.lineItemId !== lineItemId)
    
    this.recalculateTotals()
    this.state.updatedAt = new Date()

    // Emit removal event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.item_removed',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        lineItemId,
        productId: removedItem.productId,
        quantity: removedItem.quantity.toNumber()
      }
    })

    // Request inventory release (Core will handle)
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.inventory.release_requested',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        items: [{
          productId: removedItem.productId,
          variantId: removedItem.variantId,
          quantity: removedItem.quantity.toNumber()
        }],
        reason: 'ITEM_REMOVED'
      }
    })

    return removedItem
  }

  // -------------------------------------------------------------------------
  // APPLY DISCOUNT
  // -------------------------------------------------------------------------

  async applyDiscount(input: ApplyDiscountInput): Promise<DiscountState> {
    this.assertStatus(['DRAFT', 'SUSPENDED', 'PENDING_PAYMENT'])
    
    if (this.state.status === 'SUSPENDED') {
      await this.resume()
    }

    // Validate line item exists if item-level discount
    if (input.lineItemId) {
      const item = this.state.lineItems.find(i => i.id === input.lineItemId)
      if (!item) {
        throw new Error(`Line item ${input.lineItemId} not found`)
      }
    }

    const discountId = generateId()
    const value = new Decimal(input.value)
    
    // Calculate discount amount
    let calculatedAmount: Decimal
    
    if (input.scope === 'LINE_ITEM' && input.lineItemId) {
      const item = this.state.lineItems.find(i => i.id === input.lineItemId)!
      calculatedAmount = input.type === 'PERCENTAGE'
        ? item.lineSubtotal.times(value).dividedBy(100)
        : Decimal.min(value, item.lineSubtotal)
    } else {
      // Sale-level discount
      calculatedAmount = input.type === 'PERCENTAGE'
        ? this.state.subtotal.times(value).dividedBy(100)
        : Decimal.min(value, this.state.subtotal)
    }

    const discount: DiscountState = {
      id: discountId,
      lineItemId: input.lineItemId,
      name: input.name,
      code: input.code,
      type: input.type,
      scope: input.scope,
      value,
      calculatedAmount,
      requiresApproval: input.requiresApproval ?? false,
      approvedByStaffId: input.approvedByStaffId,
      approvedAt: input.approvedByStaffId ? new Date() : undefined
    }

    this.state.discounts.push(discount)
    this.recalculateTotals()
    this.state.updatedAt = new Date()

    // Emit discount applied event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.discount_applied',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        discountId,
        name: input.name,
        type: input.type,
        scope: input.scope,
        value: input.value,
        calculatedAmount: calculatedAmount.toNumber(),
        lineItemId: input.lineItemId
      }
    })

    return discount
  }

  // -------------------------------------------------------------------------
  // REMOVE DISCOUNT
  // -------------------------------------------------------------------------

  async removeDiscount(discountId: string): Promise<DiscountState> {
    this.assertStatus(['DRAFT', 'SUSPENDED', 'PENDING_PAYMENT'])

    const discountIndex = this.state.discounts.findIndex(d => d.id === discountId)
    if (discountIndex === -1) {
      throw new Error(`Discount ${discountId} not found`)
    }

    const [removedDiscount] = this.state.discounts.splice(discountIndex, 1)
    this.recalculateTotals()
    this.state.updatedAt = new Date()

    // Emit discount removed event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.discount_removed',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        discountId,
        name: removedDiscount.name,
        calculatedAmount: removedDiscount.calculatedAmount.toNumber()
      }
    })

    return removedDiscount
  }

  // -------------------------------------------------------------------------
  // ADD PAYMENT
  // -------------------------------------------------------------------------

  async addPayment(input: AddPaymentInput): Promise<PaymentState> {
    this.assertStatus(['DRAFT', 'SUSPENDED', 'PENDING_PAYMENT', 'PARTIALLY_PAID'])

    // Transition to pending payment if in draft
    if (this.state.status === 'DRAFT' || this.state.status === 'SUSPENDED') {
      this.transitionTo('PENDING_PAYMENT')
    }

    const paymentId = generateId()
    const amount = new Decimal(input.amount)
    const tipAmount = new Decimal(input.tipAmount ?? 0)
    const totalAmount = amount.plus(tipAmount)

    // Calculate change for cash payments
    let changeGiven = new Decimal(0)
    let cashReceived: Decimal | undefined
    
    if (input.method === 'CASH' && input.cashReceived) {
      cashReceived = new Decimal(input.cashReceived)
      const totalDue = this.state.amountDue
      if (cashReceived.gt(totalDue)) {
        changeGiven = cashReceived.minus(totalDue)
      }
    }

    const payment: PaymentState = {
      id: paymentId,
      method: input.method,
      status: 'COMPLETED',
      amount,
      tipAmount,
      totalAmount,
      cashReceived,
      changeGiven,
      corePaymentId: input.corePaymentId,
      processedAt: new Date()
    }

    this.state.payments.push(payment)
    this.state.amountPaid = this.state.amountPaid.plus(amount)
    this.state.amountDue = this.state.grandTotal.minus(this.state.amountPaid)
    this.state.changeGiven = this.state.changeGiven.plus(changeGiven)
    this.state.updatedAt = new Date()

    const isFullyPaid = this.state.amountDue.lte(0)

    // Emit payment added event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.payment_added',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        paymentId,
        method: input.method,
        amount: amount.toNumber(),
        tipAmount: tipAmount.toNumber(),
        totalAmount: totalAmount.toNumber(),
        amountPaid: this.state.amountPaid.toNumber(),
        amountDue: this.state.amountDue.toNumber(),
        isFullyPaid
      }
    })

    // Update status based on payment
    if (isFullyPaid) {
      this.transitionTo('PARTIALLY_PAID') // Will complete on finalize
    } else if (this.state.amountPaid.gt(0)) {
      this.transitionTo('PARTIALLY_PAID')
    }

    return payment
  }

  // -------------------------------------------------------------------------
  // SUSPEND SALE
  // -------------------------------------------------------------------------

  async suspend(input: SuspendSaleInput): Promise<void> {
    this.assertStatus(['DRAFT', 'PENDING_PAYMENT', 'PARTIALLY_PAID'])
    
    this.transitionTo('SUSPENDED')
    this.state.suspendedAt = new Date()
    this.state.suspendReason = input.reason
    this.state.updatedAt = new Date()

    // Emit suspended event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.suspended',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        reason: input.reason,
        itemCount: this.state.lineItems.length,
        grandTotal: this.state.grandTotal.toNumber()
      }
    })
  }

  // -------------------------------------------------------------------------
  // RESUME SALE
  // -------------------------------------------------------------------------

  async resume(): Promise<void> {
    this.assertStatus(['SUSPENDED'])
    
    const suspendedAt = this.state.suspendedAt
    const suspendedDuration = suspendedAt 
      ? Date.now() - suspendedAt.getTime()
      : 0

    this.transitionTo('DRAFT')
    this.state.suspendedAt = undefined
    this.state.suspendReason = undefined
    this.state.updatedAt = new Date()

    // Emit resumed event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.resumed',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        suspendedDuration
      }
    })
  }

  // -------------------------------------------------------------------------
  // FINALIZE SALE
  // -------------------------------------------------------------------------

  async finalize(): Promise<void> {
    this.assertStatus(['PENDING_PAYMENT', 'PARTIALLY_PAID'])
    
    // Must be fully paid
    if (this.state.amountDue.gt(0)) {
      throw new Error(`Cannot finalize sale with outstanding balance: ${this.state.amountDue.toFixed(2)}`)
    }

    this.transitionTo('COMPLETED')
    this.state.completedAt = new Date()
    this.state.updatedAt = new Date()

    // Emit completed event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.completed',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        saleNumber: this.state.saleNumber,
        customerId: this.state.customerId,
        subtotal: this.state.subtotal.toNumber(),
        discountTotal: this.state.discountTotal.toNumber(),
        taxTotal: this.state.taxTotal.toNumber(),
        grandTotal: this.state.grandTotal.toNumber(),
        amountPaid: this.state.amountPaid.toNumber(),
        changeGiven: this.state.changeGiven.toNumber(),
        itemCount: this.state.lineItems.length,
        items: this.state.lineItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity.toNumber(),
          unitPrice: item.unitPrice.toNumber(),
          lineTotal: item.lineTotal.toNumber()
        })),
        payments: this.state.payments.map(p => ({
          method: p.method,
          amount: p.amount.toNumber()
        }))
      }
    })

    // Request inventory deduction (Core will handle - POS does NOT mutate inventory)
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.inventory.deduction_requested',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        items: this.state.lineItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity.toNumber()
        })),
        reason: 'SALE_COMPLETED'
      }
    })
  }

  // -------------------------------------------------------------------------
  // VOID SALE
  // -------------------------------------------------------------------------

  async void(input: VoidSaleInput): Promise<void> {
    this.assertStatus(['DRAFT', 'SUSPENDED', 'PENDING_PAYMENT', 'PARTIALLY_PAID'])
    
    this.transitionTo('VOIDED')
    this.state.voidedAt = new Date()
    this.state.voidReason = input.reason
    this.state.updatedAt = new Date()

    // Emit voided event
    this.emitEvent({
      eventId: generateId(),
      eventType: 'pos.sale.voided',
      timestamp: new Date(),
      tenantId: this.state.tenantId,
      saleId: this.state.id,
      staffId: this.state.staffId,
      payload: {
        reason: input.reason,
        voidedByStaffId: input.staffId,
        grandTotal: this.state.grandTotal.toNumber(),
        itemCount: this.state.lineItems.length,
        items: this.state.lineItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity.toNumber()
        }))
      }
    })

    // Request inventory release if any items were added (Core handles)
    if (this.state.lineItems.length > 0) {
      this.emitEvent({
        eventId: generateId(),
        eventType: 'pos.inventory.release_requested',
        timestamp: new Date(),
        tenantId: this.state.tenantId,
        saleId: this.state.id,
        staffId: this.state.staffId,
        payload: {
          items: this.state.lineItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity.toNumber()
          })),
          reason: 'SALE_VOIDED'
        }
      })
    }
  }

  // -------------------------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------------------------

  private assertStatus(allowedStatuses: SaleStatus[]): void {
    if (!allowedStatuses.includes(this.state.status)) {
      throw new Error(
        `Operation not allowed in status ${this.state.status}. ` +
        `Allowed: ${allowedStatuses.join(', ')}`
      )
    }
  }

  private transitionTo(newStatus: SaleStatus): void {
    if (!canTransition(this.state.status, newStatus)) {
      throw new Error(
        `Invalid transition from ${this.state.status} to ${newStatus}. ` +
        `Valid transitions: ${getValidTransitions(this.state.status).join(', ')}`
      )
    }
    this.state.status = newStatus
  }

  private recalculateTotals(): void {
    // Calculate subtotal from line items
    this.state.subtotal = this.state.lineItems.reduce(
      (sum, item) => sum.plus(item.lineSubtotal),
      new Decimal(0)
    )

    // Calculate total discounts
    this.state.discountTotal = this.state.discounts.reduce(
      (sum, discount) => sum.plus(discount.calculatedAmount),
      new Decimal(0)
    )

    // Apply item-level discounts to line items
    for (const item of this.state.lineItems) {
      const itemDiscounts = this.state.discounts.filter(d => d.lineItemId === item.id)
      item.discountAmount = itemDiscounts.reduce(
        (sum, d) => sum.plus(d.calculatedAmount),
        new Decimal(0)
      )
      item.lineTotal = item.lineSubtotal.minus(item.discountAmount)
    }

    // Calculate tax (after discounts)
    this.state.taxTotal = this.state.lineItems.reduce(
      (sum, item) => sum.plus(item.taxAmount),
      new Decimal(0)
    )

    // Calculate grand total
    this.state.grandTotal = this.state.subtotal
      .minus(this.state.discountTotal)
      .plus(this.state.taxTotal)

    // Update amount due
    this.state.amountDue = this.state.grandTotal.minus(this.state.amountPaid)
  }

  private emitEvent(event: POSEvent): void {
    this.events.push(event)
    // Fire and forget - actual emission is async
    this.eventEmitter(event).catch(err => {
      console.error('Failed to emit event:', err)
    })
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VALID_TRANSITIONS,
  generateId
}
