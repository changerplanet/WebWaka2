'use client'

/**
 * POS & Retail Operations Demo Page
 * 
 * Demonstrates point-of-sale functionality with Nigeria-first design.
 * 
 * @module app/pos-demo
 * @canonical PC-SCP FROZEN
 * @phase Phase 2 Track A (S3)
 */

import { Suspense } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Users,
  Clock,
  Calculator,
  Package,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Printer,
  Trash2,
  Edit,
  Plus,
  DollarSign,
  BarChart3,
  FileText
} from 'lucide-react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay, DemoIndicator, DemoGate } from '@/components/demo'

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_SHIFT = {
  id: 'shift-001',
  cashier: 'Adaeze Okonkwo',
  terminal: 'POS-001',
  openedAt: '2026-01-07T08:00:00Z',
  status: 'OPEN',
  openingCash: 50000,
  currentCash: 127500,
  transactionCount: 12,
  totalSales: 385000
}

const MOCK_TRANSACTIONS = [
  {
    id: 'txn-001',
    time: '14:23',
    items: 3,
    total: 45000,
    method: 'CASH',
    status: 'COMPLETED'
  },
  {
    id: 'txn-002',
    time: '14:15',
    items: 1,
    total: 12500,
    method: 'CARD',
    status: 'COMPLETED'
  },
  {
    id: 'txn-003',
    time: '14:02',
    items: 5,
    total: 78000,
    method: 'TRANSFER',
    status: 'COMPLETED'
  },
  {
    id: 'txn-004',
    time: '13:45',
    items: 2,
    total: 23500,
    method: 'MOBILE',
    status: 'COMPLETED'
  }
]

const MOCK_CART = [
  { id: 1, name: 'Golden Penny Semovita 2kg', qty: 2, price: 4500, total: 9000 },
  { id: 2, name: 'Peak Milk 400g', qty: 3, price: 2800, total: 8400 },
  { id: 3, name: 'Indomie Chicken 70g (Carton)', qty: 1, price: 6500, total: 6500 }
]

// ============================================================================
// COMPONENTS
// ============================================================================

function PaymentMethodIcon({ method }: { method: string }) {
  switch (method) {
    case 'CASH':
      return <Banknote className="w-4 h-4 text-emerald-600" />
    case 'CARD':
      return <CreditCard className="w-4 h-4 text-blue-600" />
    case 'TRANSFER':
      return <RefreshCw className="w-4 h-4 text-violet-600" />
    case 'MOBILE':
      return <Smartphone className="w-4 h-4 text-orange-600" />
    default:
      return <CreditCard className="w-4 h-4 text-gray-400" />
  }
}

function ShiftCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="shift-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Current Shift</h3>
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
          {MOCK_SHIFT.status}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{MOCK_SHIFT.cashier}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Started 8:00 AM</span>
        </div>
        <div className="flex items-center gap-3">
          <Calculator className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{MOCK_SHIFT.transactionCount} transactions</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Opening Cash</span>
          <span className="font-medium">₦{MOCK_SHIFT.openingCash.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Current Cash</span>
          <span className="font-medium text-emerald-600">₦{MOCK_SHIFT.currentCash.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Total Sales</span>
          <span className="font-bold">₦{MOCK_SHIFT.totalSales.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function CartPanel() {
  const subtotal = MOCK_CART.reduce((sum, item) => sum + item.total, 0)
  const vat = Math.round(subtotal * 0.075)
  const total = subtotal + vat

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="cart-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Current Sale</h3>
        <span className="text-sm text-gray-500">{MOCK_CART.length} items</span>
      </div>

      <div className="space-y-3 mb-4">
        {MOCK_CART.map(item => (
          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} × {item.qty}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">₦{item.total.toLocaleString()}</span>
              <button className="p-1 text-gray-400 hover:text-gray-600" title="Edit quantity">
                <Edit className="w-3 h-3" />
              </button>
              <button className="p-1 text-gray-400 hover:text-red-500" title="Remove item">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">VAT (7.5%)</span>
          <span>₦{vat.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-emerald-600">₦{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button 
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full"
        >
          <Package className="w-4 h-4" />
          Hold Sale
        </button>
        <button 
          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full" 
          data-testid="checkout-btn"
        >
          <CreditCard className="w-4 h-4" />
          Checkout
        </button>
      </div>
    </div>
  )
}

function PaymentMethods() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="payment-methods">
      <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center gap-2 p-4 border-2 border-emerald-500 bg-emerald-50 rounded-xl">
          <Banknote className="w-6 h-6 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Cash</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Card</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors">
          <RefreshCw className="w-6 h-6 text-violet-600" />
          <span className="text-sm font-medium text-gray-700">Transfer</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors">
          <Smartphone className="w-6 h-6 text-orange-600" />
          <span className="text-sm font-medium text-gray-700">Mobile</span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          <strong>Nigeria-First:</strong> Bank Transfer is equally weighted with Cash. 
          OPay, PalmPay, and Moniepoint supported.
        </p>
      </div>
    </div>
  )
}

function RecentTransactions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" data-testid="recent-transactions">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
        <button className="text-sm text-emerald-600 hover:text-emerald-700">View All</button>
      </div>

      <div className="space-y-3">
        {MOCK_TRANSACTIONS.map(txn => (
          <div key={txn.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <PaymentMethodIcon method={txn.method} />
              <div>
                <p className="text-sm font-medium text-gray-900">₦{txn.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{txn.items} items • {txn.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <Printer className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActionsPanel() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span className="text-sm">Add Product</span>
        </button>
        
        <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span className="text-sm">Edit Prices</span>
        </button>
        
        <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full">
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <span className="text-sm">Sales Reports</span>
        </button>
        
        <button className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full">
          <FileText className="w-4 h-4 text-amber-600" />
          <span className="text-sm">Audit Log</span>
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function POSDemoContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Indicator Banner */}
      <DemoIndicator variant="banner" />

      {/* Demo Overlay */}
      <DemoOverlay />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
            <Link href="/commerce-demo" className="hover:text-white">Commerce Suite</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">POS & Retail Operations</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">POS Demo</h1>
              <p className="text-emerald-100">
                Point-of-sale transactions, cash management, and retail workflows
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-sm">
              <AlertCircle className="w-4 h-4" />
              Demo Mode — No real transactions
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <CartPanel />
            <RecentTransactions />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ShiftCard />
            <PaymentMethods />
            <QuickActionsPanel />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Shift Management</h4>
            <p className="text-sm text-gray-500">Track cashier shifts with opening/closing reconciliation</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Multi-Tender</h4>
            <p className="text-sm text-gray-500">Cash, Card, Transfer, Mobile Money in one transaction</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6 text-violet-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Receipt Printing</h4>
            <p className="text-sm text-gray-500">Thermal printer support with reprint capability</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">VAT Compliance</h4>
            <p className="text-sm text-gray-500">Automatic 7.5% VAT calculation and reporting</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            POS & Retail Operations v1.0 • 
            <span className="text-emerald-600 font-medium"> FROZEN</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function POSDemoPage() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
        <DemoModeProvider>
          <POSDemoContent />
        </DemoModeProvider>
      </Suspense>
    </DemoGate>
  )
}
