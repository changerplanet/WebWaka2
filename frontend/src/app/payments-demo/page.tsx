'use client'

/**
 * Payments & Collections Suite — Demo Page
 * 
 * Comprehensive demo showcasing:
 * - Payment Methods (Nigeria-first)
 * - Bank Transfer Flow
 * - Proof-of-Payment Workflow
 * - Partial Payments
 * - Payment Status
 * 
 * Nigeria-first: NGN currency, Nigerian banks, POD restrictions
 * 
 * @module app/payments-demo
 * @canonical PC-SCP Phase S5
 * @phase Phase 2 Track A (S3) - DemoModeProvider integrated
 */

import { useState, Suspense } from 'react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay, DemoGate } from '@/components/demo'
import {
  CreditCard,
  Building2,
  Truck,
  Smartphone,
  Hash,
  Wallet,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Eye,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Receipt,
  ChevronRight,
  Info,
  Shield,
  MapPin
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethod {
  code: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  isAvailable: boolean
  unavailableReason?: string
  additionalFee: number
  priority: 'P0' | 'P1' | 'P2'
}

interface BankTransferDetails {
  bankName: string
  accountNumber: string
  accountName: string
  reference: string
  amount: number
  expiresAt: string
}

interface PaymentProof {
  id: string
  transactionNumber: string
  amount: number
  proofUrl: string
  uploadedAt: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  customerName?: string
  orderNumber?: string
}

interface PartialPaymentSummary {
  orderId: string
  orderNumber: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentCount: number
  isFullyPaid: boolean
  payments: Array<{
    id: string
    amount: number
    method: string
    paidAt: string
  }>
}

// ============================================================================
// NIGERIA-FIRST DEMO DATA
// ============================================================================

const DEMO_PAYMENT_METHODS: PaymentMethod[] = [
  {
    code: 'BANK_TRANSFER',
    name: 'Bank Transfer',
    description: 'Pay via direct bank transfer',
    icon: Building2,
    isAvailable: true,
    additionalFee: 0,
    priority: 'P0'
  },
  {
    code: 'CARD',
    name: 'Debit/Credit Card',
    description: 'Pay with Visa, Mastercard, Verve',
    icon: CreditCard,
    isAvailable: true,
    additionalFee: 0,
    priority: 'P0'
  },
  {
    code: 'PAY_ON_DELIVERY',
    name: 'Pay on Delivery',
    description: 'Pay cash when order arrives',
    icon: Truck,
    isAvailable: true,
    additionalFee: 500,
    priority: 'P0'
  },
  {
    code: 'USSD',
    name: 'USSD Payment',
    description: 'Pay using *737#, *919#, etc.',
    icon: Hash,
    isAvailable: true,
    additionalFee: 0,
    priority: 'P1'
  },
  {
    code: 'MOBILE_MONEY',
    name: 'Mobile Money',
    description: 'OPay, PalmPay, Moniepoint',
    icon: Smartphone,
    isAvailable: true,
    additionalFee: 0,
    priority: 'P1'
  },
  {
    code: 'CASH',
    name: 'Cash',
    description: 'Pay at point of sale',
    icon: Banknote,
    isAvailable: true,
    additionalFee: 0,
    priority: 'P1'
  },
  {
    code: 'WALLET',
    name: 'Store Wallet',
    description: 'Pay from wallet balance',
    icon: Wallet,
    isAvailable: false,
    unavailableReason: 'Insufficient balance (₦0.00)',
    additionalFee: 0,
    priority: 'P2'
  }
]

const DEMO_NIGERIAN_BANKS = [
  { code: '058', name: 'GTBank', popular: true },
  { code: '044', name: 'Access Bank', popular: true },
  { code: '057', name: 'Zenith Bank', popular: true },
  { code: '011', name: 'First Bank', popular: true },
  { code: '033', name: 'UBA', popular: true },
  { code: '070', name: 'Fidelity Bank', popular: false },
  { code: '221', name: 'Stanbic IBTC', popular: false },
  { code: '232', name: 'Sterling Bank', popular: false },
  { code: '035', name: 'Wema Bank', popular: false },
  { code: '076', name: 'Polaris Bank', popular: false },
  { code: '999991', name: 'OPay', popular: true },
  { code: '999992', name: 'PalmPay', popular: true },
  { code: '999993', name: 'Moniepoint', popular: true },
  { code: '999994', name: 'Kuda Bank', popular: true },
]

const DEMO_TRANSFER_DETAILS: BankTransferDetails = {
  bankName: 'GTBank',
  accountNumber: '0123456789',
  accountName: 'WebWaka Payments Ltd',
  reference: 'WW-M5K2X-7NP9',
  amount: 75000,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

const DEMO_PENDING_PROOFS: PaymentProof[] = [
  {
    id: 'proof-1',
    transactionNumber: 'PAY-2601-000145',
    amount: 125000,
    proofUrl: '/uploads/proof-gtbank-125k.png',
    uploadedAt: '2026-01-06T10:30:00Z',
    status: 'PENDING',
    customerName: 'Adebayo Ogunlesi',
    orderNumber: 'ORD-2026-0089'
  },
  {
    id: 'proof-2',
    transactionNumber: 'PAY-2601-000142',
    amount: 45000,
    proofUrl: '/uploads/proof-access-45k.png',
    uploadedAt: '2026-01-06T09:15:00Z',
    status: 'PENDING',
    customerName: 'Chioma Nwachukwu',
    orderNumber: 'ORD-2026-0087'
  },
  {
    id: 'proof-3',
    transactionNumber: 'PAY-2601-000138',
    amount: 320000,
    proofUrl: '/uploads/proof-zenith-320k.png',
    uploadedAt: '2026-01-05T16:45:00Z',
    status: 'PENDING',
    customerName: 'Emeka Okafor',
    orderNumber: 'ORD-2026-0082'
  }
]

const DEMO_PARTIAL_PAYMENT: PartialPaymentSummary = {
  orderId: 'order-001',
  orderNumber: 'ORD-2026-0075',
  totalAmount: 450000,
  paidAmount: 280000,
  remainingAmount: 170000,
  paymentCount: 2,
  isFullyPaid: false,
  payments: [
    { id: 'pay-1', amount: 150000, method: 'BANK_TRANSFER', paidAt: '2026-01-04T11:20:00Z' },
    { id: 'pay-2', amount: 130000, method: 'BANK_TRANSFER', paidAt: '2026-01-05T14:30:00Z' }
  ]
}

const POD_EXCLUDED_STATES = ['Borno', 'Yobe', 'Adamawa']
const POD_MAX_AMOUNT = 500000
const POD_FEE = 500

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`
}

// ============================================================================
// STATUS BADGES
// ============================================================================

function ProofStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
    VERIFIED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  }
  const { bg, text, icon } = config[status] || config.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon}
      {status}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    PENDING: { bg: 'bg-slate-100', text: 'text-slate-700' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-700' },
  }
  const { bg, text } = config[status] || config.PENDING
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    P0: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Primary' },
    P1: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Standard' },
    P2: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Internal' },
  }
  const { bg, text, label } = config[priority] || config.P1
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

// ============================================================================
// DEMO PAGE COMPONENT
// ============================================================================

function PaymentsDemoContent() {
  const [activeTab, setActiveTab] = useState<'methods' | 'transfer' | 'proof' | 'partial'>('methods')
  const [selectedState, setSelectedState] = useState('Lagos')
  const [orderAmount, setOrderAmount] = useState(75000)
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null)

  // Calculate POD availability
  const isPODAvailable = !POD_EXCLUDED_STATES.includes(selectedState) && orderAmount <= POD_MAX_AMOUNT
  const podUnavailableReason = POD_EXCLUDED_STATES.includes(selectedState)
    ? `POD not available in ${selectedState} (security restriction)`
    : orderAmount > POD_MAX_AMOUNT
    ? `POD limited to orders under ${formatNGN(POD_MAX_AMOUNT)}`
    : undefined

  // Update demo methods based on selections
  const demoMethods = DEMO_PAYMENT_METHODS.map((m: any) => {
    if (m.code === 'PAY_ON_DELIVERY') {
      return {
        ...m,
        isAvailable: isPODAvailable,
        unavailableReason: podUnavailableReason
      }
    }
    return m
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo Overlay */}
      <DemoOverlay />
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
            <span>Commerce Suite</span>
            <ChevronRight className="w-4 h-4" />
            <span>Payments & Collections</span>
          </div>
          <h1 className="text-3xl font-bold">Payments Demo</h1>
          <p className="mt-2 text-emerald-100">
            Nigeria-first payment processing: Bank Transfer, Card, POD, USSD, Mobile Money
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm">
            <Shield className="w-4 h-4" />
            <span>Demo Mode — No real transactions</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {[
              { id: 'methods', label: 'Payment Methods', icon: CreditCard },
              { id: 'transfer', label: 'Bank Transfer', icon: Building2 },
              { id: 'proof', label: 'Proof Verification', icon: FileCheck },
              { id: 'partial', label: 'Partial Payments', icon: Receipt },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Methods Tab */}
        {activeTab === 'methods' && (
          <div className="space-y-8">
            {/* Context Selectors */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Context</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Order Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      data-testid="order-amount-input"
                    />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Formatted: {formatNGN(orderAmount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Delivery State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    data-testid="delivery-state-select"
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">FCT Abuja</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Kano">Kano</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Borno">Borno (Security Area)</option>
                    <option value="Yobe">Yobe (Security Area)</option>
                    <option value="Adamawa">Adamawa (Security Area)</option>
                  </select>
                  {POD_EXCLUDED_STATES.includes(selectedState) && (
                    <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      POD restricted in this state
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Methods Grid */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Payment Methods</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoMethods.map(method => (
                  <div
                    key={method.code}
                    className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${
                      method.isAvailable 
                        ? 'hover:shadow-md hover:border-emerald-200' 
                        : 'opacity-60'
                    }`}
                    data-testid={`method-${method.code.toLowerCase()}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-lg ${
                        method.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <method.icon className="w-5 h-5" />
                      </div>
                      <PriorityBadge priority={method.priority} />
                    </div>
                    <h4 className="font-semibold text-slate-900">{method.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{method.description}</p>
                    
                    {method.additionalFee > 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        +{formatNGN(method.additionalFee)} fee
                      </p>
                    )}
                    
                    {!method.isAvailable && method.unavailableReason && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {method.unavailableReason}
                        </p>
                      </div>
                    )}
                    
                    {method.isAvailable && (
                      <button className="mt-4 w-full py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                        Select <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* POD Rules Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
                <Info className="w-5 h-5" />
                Pay on Delivery Rules (Nigeria-First)
              </h4>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                  Maximum order amount: {formatNGN(POD_MAX_AMOUNT)}
                </li>
                <li className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  Processing fee: {formatNGN(POD_FEE)}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Excluded states: {POD_EXCLUDED_STATES.join(', ')} (security)
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Bank Transfer Tab */}
        {activeTab === 'transfer' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Transfer Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Transfer Details</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Bank Name</p>
                  <p className="font-semibold text-slate-900">{DEMO_TRANSFER_DETAILS.bankName}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Account Number</p>
                  <p className="font-mono text-xl font-bold text-slate-900">{DEMO_TRANSFER_DETAILS.accountNumber}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Account Name</p>
                  <p className="font-semibold text-slate-900">{DEMO_TRANSFER_DETAILS.accountName}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-1">Transfer Reference</p>
                  <p className="font-mono text-lg font-bold text-emerald-700">{DEMO_TRANSFER_DETAILS.reference}</p>
                  <p className="text-xs text-emerald-600 mt-1">Include this reference in your transfer narration</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Amount to Transfer</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNGN(DEMO_TRANSFER_DETAILS.amount)}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600 mb-1">Expires</p>
                  <p className="font-semibold text-amber-700">{formatDateTime(DEMO_TRANSFER_DETAILS.expiresAt)}</p>
                </div>
              </div>
            </div>

            {/* Nigerian Banks */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Supported Nigerian Banks</h3>
                <div className="grid grid-cols-2 gap-3">
                  {DEMO_NIGERIAN_BANKS.filter((b: any) => b.popular).map(bank => (
                    <div key={bank.code} className="p-3 bg-slate-50 rounded-lg flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{bank.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  + {DEMO_NIGERIAN_BANKS.filter((b: any) => !b.popular).length} more banks supported
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Proof of Payment</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">Drop your transfer receipt here</p>
                  <p className="text-sm text-slate-400">PNG, JPG up to 5MB</p>
                  <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                    Select File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proof Verification Tab (Admin View) */}
        {activeTab === 'proof' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Pending Proof Verifications</h3>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  {DEMO_PENDING_PROOFS.length} pending
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Transaction</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Uploaded</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_PENDING_PROOFS.map(proof => (
                      <tr key={proof.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <p className="font-mono text-sm font-medium text-slate-900">{proof.transactionNumber}</p>
                          <p className="text-xs text-slate-500">{proof.orderNumber}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-900">{proof.customerName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-900">{formatNGN(proof.amount)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-600">{formatDateTime(proof.uploadedAt)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <ProofStatusBadge status={proof.status} />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedProof(proof)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                              title="View Proof"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                              Verify
                            </button>
                            <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Proof Preview Modal */}
            {selectedProof && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedProof(null)}>
                <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Proof of Payment</h3>
                  <div className="bg-slate-100 rounded-lg p-8 text-center mb-4">
                    <FileCheck className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Image preview would appear here</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedProof.proofUrl}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-500">Amount</p>
                      <p className="font-bold text-slate-900">{formatNGN(selectedProof.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Customer</p>
                      <p className="font-medium text-slate-900">{selectedProof.customerName}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                      Approve
                    </button>
                    <button className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100">
                      Reject
                    </button>
                    <button 
                      onClick={() => setSelectedProof(null)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Partial Payments Tab */}
        {activeTab === 'partial' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Payment Summary</h3>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Order Number</p>
                  <p className="font-mono font-semibold text-slate-900">{DEMO_PARTIAL_PAYMENT.orderNumber}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500 mb-1">Total</p>
                    <p className="font-bold text-slate-900">{formatNGN(DEMO_PARTIAL_PAYMENT.totalAmount)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600 mb-1">Paid</p>
                    <p className="font-bold text-emerald-700">{formatNGN(DEMO_PARTIAL_PAYMENT.paidAmount)}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <p className="text-xs text-amber-600 mb-1">Remaining</p>
                    <p className="font-bold text-amber-700">{formatNGN(DEMO_PARTIAL_PAYMENT.remainingAmount)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Payment Progress</span>
                    <span className="font-medium text-slate-700">
                      {Math.round((DEMO_PARTIAL_PAYMENT.paidAmount / DEMO_PARTIAL_PAYMENT.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(DEMO_PARTIAL_PAYMENT.paidAmount / DEMO_PARTIAL_PAYMENT.totalAmount) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Minimum Next Payment</p>
                  <p className="font-semibold text-blue-700">
                    {formatNGN(Math.max(DEMO_PARTIAL_PAYMENT.remainingAmount * 0.1, 1000))}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">10% of remaining or ₦1,000 minimum</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h3>
                <div className="space-y-3">
                  {DEMO_PARTIAL_PAYMENT.payments.map((payment, idx) => (
                    <div key={payment.id} className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{formatNGN(payment.amount)}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(payment.paidAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <PaymentStatusBadge status="CONFIRMED" />
                        <p className="text-xs text-slate-500 mt-1">{payment.method.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Make Another Payment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₦</span>
                      <input
                        type="number"
                        defaultValue={DEMO_PARTIAL_PAYMENT.remainingAmount}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                      <option>Bank Transfer</option>
                      <option>Card Payment</option>
                      <option>Mobile Money</option>
                    </select>
                  </div>
                  <button className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Submit Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function PaymentsDemoPage() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
        <DemoModeProvider>
          <PaymentsDemoContent />
        </DemoModeProvider>
      </Suspense>
    </DemoGate>
  )
}
