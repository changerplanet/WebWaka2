/**
 * POS Main Screen
 * 
 * Touch-first, offline-capable Point of Sale interface
 */

'use client'

import { useState, useCallback } from 'react'
import {
  ConnectionStatus,
  ProductGrid,
  Cart,
  PaymentModal,
  ReceiptView,
  HeldSales,
  type Product,
  type PaymentMethod
} from '../components/pos'
import {
  useConnectionStatus,
  useCart,
  useOfflineQueue
} from '../hooks'
import type { CartItem, HeldSale } from '../lib/client/offline-store'

// Mock products for demo (in production, loaded from cache/API)
const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Espresso', sku: 'ESP-001', price: 3.50, category: 'Coffee', inStock: true },
  { id: 'p2', name: 'Cappuccino', sku: 'CAP-001', price: 4.50, category: 'Coffee', inStock: true },
  { id: 'p3', name: 'Latte', sku: 'LAT-001', price: 4.75, category: 'Coffee', inStock: true },
  { id: 'p4', name: 'Americano', sku: 'AME-001', price: 3.25, category: 'Coffee', inStock: true },
  { id: 'p5', name: 'Mocha', sku: 'MOC-001', price: 5.25, category: 'Coffee', inStock: true },
  { id: 'p6', name: 'Croissant', sku: 'CRO-001', price: 3.50, category: 'Pastry', inStock: true },
  { id: 'p7', name: 'Muffin', sku: 'MUF-001', price: 3.25, category: 'Pastry', inStock: true },
  { id: 'p8', name: 'Bagel', sku: 'BAG-001', price: 2.75, category: 'Pastry', inStock: true },
  { id: 'p9', name: 'Cookie', sku: 'COO-001', price: 2.50, category: 'Pastry', inStock: true },
  { id: 'p10', name: 'Sandwich', sku: 'SAN-001', price: 8.50, category: 'Food', inStock: true },
  { id: 'p11', name: 'Salad', sku: 'SAL-001', price: 9.50, category: 'Food', inStock: true },
  { id: 'p12', name: 'Water', sku: 'WAT-001', price: 2.00, category: 'Drinks', inStock: true },
  { id: 'p13', name: 'Juice', sku: 'JUI-001', price: 3.50, category: 'Drinks', inStock: true },
  { id: 'p14', name: 'Soda', sku: 'SOD-001', price: 2.50, category: 'Drinks', inStock: false },
]

type Screen = 'sale' | 'payment' | 'receipt'

interface CompletedSale {
  saleNumber: string
  items: CartItem[]
  subtotal: number
  taxAmount: number
  total: number
  paymentMethod: string
  cashReceived?: number
  changeGiven?: number
  completedAt: Date
}

export function POSScreen() {
  const { isOnline } = useConnectionStatus()
  const cart = useCart()
  const { addToQueue, pendingCount } = useOfflineQueue()

  const [screen, setScreen] = useState<Screen>('sale')
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])
  const [showHeldSales, setShowHeldSales] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)

  // Generate sale number
  const generateSaleNumber = () => {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `S-${dateStr}-${seq}`
  }

  // Handle product selection
  const handleProductSelect = useCallback((product: Product) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price
    })
  }, [cart])

  // Handle hold sale
  const handleHoldSale = useCallback(() => {
    if (cart.items.length === 0) return

    const note = prompt('Add a note (optional):')
    
    const heldSale: HeldSale = {
      id: `held_${Date.now()}`,
      items: [...cart.items],
      subtotal: cart.subtotal,
      note: note || undefined,
      heldAt: Date.now(),
      heldBy: 'Staff' // Would come from session
    }

    setHeldSales(prev => [...prev, heldSale])
    cart.clearCart()
  }, [cart])

  // Handle resume sale
  const handleResumeSale = useCallback((sale: HeldSale) => {
    // Clear current cart and load held sale items
    cart.clearCart()
    sale.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        cart.addItem({
          id: item.productId,
          name: item.productName,
          sku: item.productSku,
          price: item.unitPrice
        })
      }
    })

    // Remove from held sales
    setHeldSales(prev => prev.filter(s => s.id !== sale.id))
    setShowHeldSales(false)
  }, [cart])

  // Handle delete held sale
  const handleDeleteHeldSale = useCallback((saleId: string) => {
    if (confirm('Delete this held sale?')) {
      setHeldSales(prev => prev.filter(s => s.id !== saleId))
    }
  }, [])

  // Handle payment complete
  const handlePaymentComplete = useCallback(async (payment: {
    method: PaymentMethod
    amount: number
    cashReceived?: number
    changeGiven?: number
  }) => {
    const saleNumber = generateSaleNumber()

    // Create completed sale record
    const completed: CompletedSale = {
      saleNumber,
      items: [...cart.items],
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      total: cart.total,
      paymentMethod: payment.method,
      cashReceived: payment.cashReceived,
      changeGiven: payment.changeGiven,
      completedAt: new Date()
    }

    // Add to offline sync queue
    await addToQueue('SALE', {
      saleNumber,
      items: cart.items,
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      total: cart.total,
      payment: {
        method: payment.method,
        amount: payment.amount,
        cashReceived: payment.cashReceived,
        changeGiven: payment.changeGiven
      },
      completedAt: completed.completedAt.toISOString(),
      offlineId: `offline_${Date.now()}`
    })

    setCompletedSale(completed)
    setScreen('receipt')
  }, [cart, addToQueue])

  // Handle new sale
  const handleNewSale = useCallback(() => {
    cart.clearCart()
    setCompletedSale(null)
    setScreen('sale')
  }, [cart])

  return (
    <div className="h-screen flex flex-col bg-gray-100" data-testid="pos-screen">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">POS</h1>
          {heldSales.length > 0 && (
            <button
              onClick={() => setShowHeldSales(true)}
              className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
              data-testid="held-sales-btn"
            >
              {heldSales.length} Held
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {pendingCount} syncing
            </span>
          )}
          <ConnectionStatus />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Product Grid - Left Side */}
        <div className="flex-1 flex flex-col min-w-0">
          <ProductGrid
            products={DEMO_PRODUCTS}
            onSelect={handleProductSelect}
          />
        </div>

        {/* Cart - Right Side */}
        <div className="w-full max-w-sm flex-shrink-0">
          <Cart
            items={cart.items}
            subtotal={cart.subtotal}
            taxAmount={cart.taxAmount}
            total={cart.total}
            onUpdateQuantity={cart.updateQuantity}
            onRemoveItem={cart.removeItem}
            onPay={() => setScreen('payment')}
            onHold={handleHoldSale}
            onDiscount={() => setShowDiscountModal(true)}
          />
        </div>
      </main>

      {/* Payment Modal */}
      {screen === 'payment' && (
        <PaymentModal
          total={cart.total}
          isOnline={isOnline}
          onComplete={handlePaymentComplete}
          onCancel={() => setScreen('sale')}
        />
      )}

      {/* Receipt View */}
      {screen === 'receipt' && completedSale && (
        <ReceiptView
          saleNumber={completedSale.saleNumber}
          items={completedSale.items}
          subtotal={completedSale.subtotal}
          taxAmount={completedSale.taxAmount}
          total={completedSale.total}
          paymentMethod={completedSale.paymentMethod}
          cashReceived={completedSale.cashReceived}
          changeGiven={completedSale.changeGiven}
          staffName="Staff Member"
          completedAt={completedSale.completedAt}
          onNewSale={handleNewSale}
        />
      )}

      {/* Held Sales Modal */}
      {showHeldSales && (
        <HeldSales
          sales={heldSales}
          onResume={handleResumeSale}
          onDelete={handleDeleteHeldSale}
          onClose={() => setShowHeldSales(false)}
        />
      )}
    </div>
  )
}
