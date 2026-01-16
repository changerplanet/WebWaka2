'use client'

/**
 * Billing & Subscriptions Suite — Demo Page
 * 
 * Comprehensive demo showcasing:
 * - Invoice Creation & Lifecycle
 * - Payment Recording (Full & Partial)
 * - Credit Notes & Application
 * - VAT Calculations (7.5% Nigerian VAT)
 * - Aging Report
 * 
 * Nigeria-first: NGN currency, 7.5% VAT, Net-30 terms, Optional TIN
 * 
 * @module app/billing-demo
 * @canonical PC-SCP Phase S5
 * @phase Phase 2 Track A (S3) - DemoModeProvider integrated
 */

import { useState, Suspense } from 'react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay, DemoGate } from '@/components/demo'
import { AccountingImpactPanel } from '@/components/convergence'
import {
  FileText,
  Receipt,
  CreditCard,
  Calculator,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  Minus,
  Send,
  Eye,
  Ban,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Percent,
  ChevronRight,
  Info,
  Shield,
  FileCheck,
  RotateCcw,
  Download,
  Printer,
  BadgeCheck,
  Banknote,
  CircleDollarSign
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxExempt: boolean
  lineTotal: number
  taxAmount: number
}

interface DemoInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerType: 'INDIVIDUAL' | 'BUSINESS' | 'NGO' | 'GOVERNMENT'
  customerEmail: string
  customerPhone: string
  customerTIN?: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  grandTotal: number
  amountPaid: number
  amountDue: number
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  vatRate: number
  vatInclusive: boolean
  vatExempt: boolean
  invoiceDate: string
  dueDate: string
  paymentTermDays: number
}

interface DemoPayment {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  paymentMethod: string
  paymentReference: string
  status: 'PENDING' | 'CONFIRMED' | 'REFUNDED'
  paidAt: string
  customerName: string
}

interface DemoCreditNote {
  id: string
  creditNoteNumber: string
  invoiceNumber: string
  customerName: string
  amount: number
  reason: 'RETURN' | 'PRICING_ERROR' | 'SERVICE_ISSUE' | 'DUPLICATE_CHARGE' | 'GOODWILL' | 'OTHER'
  status: 'DRAFT' | 'APPROVED' | 'APPLIED' | 'CANCELLED'
  description: string
  createdAt: string
}

interface AgingBucket {
  label: string
  count: number
  amount: number
  percentage: number
}

// ============================================================================
// NIGERIA-FIRST DEMO DATA
// ============================================================================

const NIGERIAN_VAT_RATE = 7.5

const DEMO_CUSTOMERS = [
  {
    name: 'Dangote Industries Ltd',
    type: 'BUSINESS' as const,
    email: 'accounts@dangote.com',
    phone: '+234 812 345 6789',
    tin: '12345678-0001',
    address: 'Falomo, Ikoyi, Lagos'
  },
  {
    name: 'Save the Children Nigeria',
    type: 'NGO' as const,
    email: 'finance@savechildren.ng',
    phone: '+234 809 111 2222',
    tin: undefined,
    address: 'Wuse II, Abuja'
  },
  {
    name: 'Adebayo Ogunlesi',
    type: 'INDIVIDUAL' as const,
    email: 'adebayo.ogunlesi@gmail.com',
    phone: '+234 803 456 7890',
    tin: undefined,
    address: 'Victoria Island, Lagos'
  },
  {
    name: 'Federal Ministry of Finance',
    type: 'GOVERNMENT' as const,
    email: 'procurement@finance.gov.ng',
    phone: '+234 9 234 5678',
    tin: 'FGN-MOF-001',
    address: 'Central Business District, Abuja'
  }
]

const DEMO_PRODUCTS = [
  { name: 'Consulting Services (Hourly)', unitPrice: 25000, taxExempt: false },
  { name: 'Software License (Annual)', unitPrice: 500000, taxExempt: false },
  { name: 'Training Workshop (Per Day)', unitPrice: 150000, taxExempt: true },
  { name: 'Technical Support (Monthly)', unitPrice: 75000, taxExempt: false },
  { name: 'Hardware Equipment', unitPrice: 350000, taxExempt: false },
  { name: 'Data Migration Services', unitPrice: 200000, taxExempt: false }
]

const DEMO_INVOICES: DemoInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2501-00001',
    customerName: 'Dangote Industries Ltd',
    customerType: 'BUSINESS',
    customerEmail: 'accounts@dangote.com',
    customerPhone: '+234 812 345 6789',
    customerTIN: '12345678-0001',
    items: [
      { id: '1', description: 'Consulting Services - Q1 2025', quantity: 80, unitPrice: 25000, taxExempt: false, lineTotal: 2000000, taxAmount: 150000 },
      { id: '2', description: 'Software License (Enterprise)', quantity: 1, unitPrice: 2500000, taxExempt: false, lineTotal: 2500000, taxAmount: 187500 }
    ],
    subtotal: 4500000,
    taxTotal: 337500,
    grandTotal: 4837500,
    amountPaid: 2500000,
    amountDue: 2337500,
    status: 'PARTIALLY_PAID',
    vatRate: 7.5,
    vatInclusive: false,
    vatExempt: false,
    invoiceDate: '2025-01-01',
    dueDate: '2025-01-31',
    paymentTermDays: 30
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2501-00002',
    customerName: 'Save the Children Nigeria',
    customerType: 'NGO',
    customerEmail: 'finance@savechildren.ng',
    customerPhone: '+234 809 111 2222',
    items: [
      { id: '1', description: 'Training Workshop - Child Protection', quantity: 3, unitPrice: 150000, taxExempt: true, lineTotal: 450000, taxAmount: 0 }
    ],
    subtotal: 450000,
    taxTotal: 0,
    grandTotal: 450000,
    amountPaid: 0,
    amountDue: 450000,
    status: 'SENT',
    vatRate: 0,
    vatInclusive: false,
    vatExempt: true,
    invoiceDate: '2025-01-05',
    dueDate: '2025-02-04',
    paymentTermDays: 30
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2412-00045',
    customerName: 'Adebayo Ogunlesi',
    customerType: 'INDIVIDUAL',
    customerEmail: 'adebayo.ogunlesi@gmail.com',
    customerPhone: '+234 803 456 7890',
    items: [
      { id: '1', description: 'Technical Support (6 Months)', quantity: 6, unitPrice: 75000, taxExempt: false, lineTotal: 450000, taxAmount: 33750 }
    ],
    subtotal: 450000,
    taxTotal: 33750,
    grandTotal: 483750,
    amountPaid: 0,
    amountDue: 483750,
    status: 'OVERDUE',
    vatRate: 7.5,
    vatInclusive: false,
    vatExempt: false,
    invoiceDate: '2024-12-01',
    dueDate: '2024-12-31',
    paymentTermDays: 30
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2501-00003',
    customerName: 'Federal Ministry of Finance',
    customerType: 'GOVERNMENT',
    customerEmail: 'procurement@finance.gov.ng',
    customerPhone: '+234 9 234 5678',
    customerTIN: 'FGN-MOF-001',
    items: [
      { id: '1', description: 'Data Migration Services', quantity: 1, unitPrice: 200000, taxExempt: false, lineTotal: 200000, taxAmount: 15000 },
      { id: '2', description: 'Hardware Equipment', quantity: 5, unitPrice: 350000, taxExempt: false, lineTotal: 1750000, taxAmount: 131250 }
    ],
    subtotal: 1950000,
    taxTotal: 146250,
    grandTotal: 2096250,
    amountPaid: 2096250,
    amountDue: 0,
    status: 'PAID',
    vatRate: 7.5,
    vatInclusive: false,
    vatExempt: false,
    invoiceDate: '2025-01-02',
    dueDate: '2025-02-01',
    paymentTermDays: 30
  }
]

const DEMO_PAYMENTS: DemoPayment[] = [
  {
    id: 'pay-001',
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2501-00001',
    amount: 2500000,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'GTB-20250107-789012',
    status: 'CONFIRMED',
    paidAt: '2025-01-07T10:30:00Z',
    customerName: 'Dangote Industries Ltd'
  },
  {
    id: 'pay-002',
    invoiceId: 'inv-004',
    invoiceNumber: 'INV-2501-00003',
    amount: 2096250,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'CBN-20250105-456789',
    status: 'CONFIRMED',
    paidAt: '2025-01-05T14:15:00Z',
    customerName: 'Federal Ministry of Finance'
  }
]

const DEMO_CREDIT_NOTES: DemoCreditNote[] = [
  {
    id: 'cn-001',
    creditNoteNumber: 'CN-2501-00001',
    invoiceNumber: 'INV-2501-00001',
    customerName: 'Dangote Industries Ltd',
    amount: 250000,
    reason: 'PRICING_ERROR',
    status: 'APPROVED',
    description: 'Adjustment for incorrect hourly rate calculation',
    createdAt: '2025-01-06T09:00:00Z'
  },
  {
    id: 'cn-002',
    creditNoteNumber: 'CN-2501-00002',
    invoiceNumber: 'INV-2412-00045',
    customerName: 'Adebayo Ogunlesi',
    amount: 75000,
    reason: 'GOODWILL',
    status: 'DRAFT',
    description: 'Customer retention discount - 1 month free',
    createdAt: '2025-01-07T11:30:00Z'
  }
]

const DEMO_AGING: AgingBucket[] = [
  { label: 'Current', count: 2, amount: 450000, percentage: 12 },
  { label: '1-30 Days', count: 1, amount: 2337500, percentage: 64 },
  { label: '31-60 Days', count: 0, amount: 0, percentage: 0 },
  { label: '61-90 Days', count: 0, amount: 0, percentage: 0 },
  { label: '90+ Days', count: 1, amount: 483750, percentage: 24 }
]

const PAYMENT_METHODS = [
  { code: 'BANK_TRANSFER', name: 'Bank Transfer', icon: Building2 },
  { code: 'CARD', name: 'Card Payment', icon: CreditCard },
  { code: 'CASH', name: 'Cash', icon: Banknote },
  { code: 'MOBILE_MONEY', name: 'Mobile Money', icon: Phone },
  { code: 'CREDIT_NOTE', name: 'Credit Note', icon: FileCheck }
]

const CREDIT_REASONS = [
  { code: 'RETURN', name: 'Product Return' },
  { code: 'PRICING_ERROR', name: 'Pricing Error' },
  { code: 'SERVICE_ISSUE', name: 'Service Issue' },
  { code: 'DUPLICATE_CHARGE', name: 'Duplicate Charge' },
  { code: 'GOODWILL', name: 'Goodwill/Retention' },
  { code: 'OTHER', name: 'Other' }
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-gray-100 text-gray-700'
    case 'SENT': return 'bg-blue-100 text-blue-700'
    case 'VIEWED': return 'bg-purple-100 text-purple-700'
    case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-700'
    case 'PAID': return 'bg-green-100 text-green-700'
    case 'OVERDUE': return 'bg-red-100 text-red-700'
    case 'CANCELLED': return 'bg-gray-100 text-gray-500'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    case 'CONFIRMED': return 'bg-green-100 text-green-700'
    case 'REFUNDED': return 'bg-red-100 text-red-700'
    case 'APPROVED': return 'bg-green-100 text-green-700'
    case 'APPLIED': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getCustomerTypeIcon(type: string) {
  switch (type) {
    case 'BUSINESS': return Building2
    case 'NGO': return Shield
    case 'GOVERNMENT': return BadgeCheck
    default: return User
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  trend,
  color = 'blue'
}: { 
  title: string
  value: string
  subtext?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down'
  color?: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && (
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
              <span className="text-sm text-gray-500">{subtext}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function InvoiceCard({ invoice, onAction }: { invoice: DemoInvoice; onAction: (action: string, invoice: DemoInvoice) => void }) {
  const CustomerIcon = getCustomerTypeIcon(invoice.customerType)
  const paidPercentage = Math.round((invoice.amountPaid / invoice.grandTotal) * 100)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-gray-500">{invoice.invoiceNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CustomerIcon className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{invoice.customerName}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">{formatNGN(invoice.grandTotal)}</p>
          {invoice.vatExempt ? (
            <span className="text-xs text-green-600">VAT Exempt</span>
          ) : (
            <span className="text-xs text-gray-500">incl. {formatNGN(invoice.taxTotal)} VAT</span>
          )}
        </div>
      </div>

      {/* Payment Progress */}
      {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Payment Progress</span>
            <span className="font-medium">{paidPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                paidPercentage === 100 ? 'bg-green-500' : 
                paidPercentage > 0 ? 'bg-yellow-500' : 'bg-gray-200'
              }`}
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500">Paid: {formatNGN(invoice.amountPaid)}</span>
            <span className="text-gray-500">Due: {formatNGN(invoice.amountDue)}</span>
          </div>
        </div>
      )}

      {/* Items Summary */}
      <div className="border-t border-gray-100 pt-3 mb-4">
        <p className="text-sm text-gray-500 mb-2">{invoice.items.length} line item(s)</p>
        {invoice.items.slice(0, 2).map(item => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 truncate max-w-[60%]">{item.description}</span>
            <span className="font-medium">{formatNGN(item.lineTotal)}</span>
          </div>
        ))}
        {invoice.items.length > 2 && (
          <p className="text-xs text-gray-400 mt-1">+{invoice.items.length - 2} more items</p>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Issued: {formatDate(invoice.invoiceDate)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Due: {formatDate(invoice.dueDate)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {invoice.status === 'DRAFT' && (
          <>
            <button 
              onClick={() => onAction('send', invoice)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
            <button 
              onClick={() => onAction('cancel', invoice)}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
            >
              <Ban className="w-3 h-3" />
              Cancel
            </button>
          </>
        )}
        {['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
          <>
            <button 
              onClick={() => onAction('payment', invoice)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              <Plus className="w-3 h-3" />
              Record Payment
            </button>
            {invoice.status !== 'PAID' && (
              <button 
                onClick={() => onAction('credit', invoice)}
                className="flex items-center gap-1 px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-lg"
              >
                <FileCheck className="w-3 h-3" />
                Credit Note
              </button>
            )}
          </>
        )}
        <button 
          onClick={() => onAction('view', invoice)}
          className="flex items-center gap-1 px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-lg ml-auto"
        >
          <Eye className="w-3 h-3" />
          View
        </button>
      </div>
    </div>
  )
}

function PaymentCard({ payment }: { payment: DemoPayment }) {
  const MethodIcon = PAYMENT_METHODS.find((m: any) => m.code === payment.paymentMethod)?.icon || Banknote

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 rounded-lg">
            <MethodIcon className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{formatNGN(payment.amount)}</p>
            <p className="text-xs text-gray-500">{payment.invoiceNumber}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {payment.status}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        <p>{payment.customerName}</p>
        <p>Ref: {payment.paymentReference}</p>
        <p>{formatDate(payment.paidAt)}</p>
      </div>
    </div>
  )
}

function CreditNoteCard({ creditNote, onAction }: { creditNote: DemoCreditNote; onAction: (action: string, cn: DemoCreditNote) => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-mono text-sm text-gray-500">{creditNote.creditNoteNumber}</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(creditNote.status)}`}>
            {creditNote.status}
          </span>
        </div>
        <p className="font-bold text-red-600">-{formatNGN(creditNote.amount)}</p>
      </div>
      <p className="text-sm text-gray-900 mb-1">{creditNote.customerName}</p>
      <p className="text-xs text-gray-500 mb-2">For: {creditNote.invoiceNumber}</p>
      <p className="text-xs text-gray-600 mb-3">{creditNote.description}</p>
      
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {creditNote.status === 'DRAFT' && (
          <button 
            onClick={() => onAction('approve', creditNote)}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            <CheckCircle className="w-3 h-3" />
            Approve
          </button>
        )}
        {creditNote.status === 'APPROVED' && (
          <button 
            onClick={() => onAction('apply', creditNote)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            <ArrowRight className="w-3 h-3" />
            Apply to Invoice
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{formatDate(creditNote.createdAt)}</span>
      </div>
    </div>
  )
}

function AgingChart({ buckets }: { buckets: AgingBucket[] }) {
  const maxAmount = Math.max(...buckets.map((b: any) => b.amount))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Accounts Receivable Aging</h3>
      <div className="space-y-3">
        {buckets.map((bucket, index) => (
          <div key={bucket.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{bucket.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{bucket.count} invoices</span>
                <span className="font-medium">{formatNGN(bucket.amount)}</span>
              </div>
            </div>
            <div className="h-6 bg-gray-100 rounded overflow-hidden">
              <div 
                className={`h-full rounded ${
                  index === 0 ? 'bg-green-500' :
                  index === 1 ? 'bg-blue-500' :
                  index === 2 ? 'bg-yellow-500' :
                  index === 3 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: maxAmount > 0 ? `${(bucket.amount / maxAmount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Outstanding</span>
          <span className="font-bold text-lg">{formatNGN(buckets.reduce((sum: any, b: any) => sum + b.amount, 0))}</span>
        </div>
      </div>
    </div>
  )
}

function VATCalculator() {
  const [amount, setAmount] = useState(100000)
  const [isInclusive, setIsInclusive] = useState(false)

  const vatAmount = isInclusive 
    ? amount - (amount / (1 + NIGERIAN_VAT_RATE / 100))
    : amount * (NIGERIAN_VAT_RATE / 100)
  
  const netAmount = isInclusive 
    ? amount - vatAmount 
    : amount
  
  const grossAmount = isInclusive 
    ? amount 
    : amount + vatAmount

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Nigerian VAT Calculator (7.5%)</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Amount (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInclusive(false)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isInclusive 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            VAT Exclusive
          </button>
          <button
            onClick={() => setIsInclusive(true)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isInclusive 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            VAT Inclusive
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Net Amount</span>
            <span className="font-medium">{formatNGN(Math.round(netAmount))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">VAT ({NIGERIAN_VAT_RATE}%)</span>
            <span className="font-medium text-blue-600">{formatNGN(Math.round(vatAmount))}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="font-medium text-gray-900">Gross Amount</span>
            <span className="font-bold text-lg">{formatNGN(Math.round(grossAmount))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateInvoiceDemo({ onClose }: { onClose: () => void }) {
  const [selectedCustomer, setSelectedCustomer] = useState(DEMO_CUSTOMERS[0])
  const [items, setItems] = useState([
    { description: DEMO_PRODUCTS[0].name, quantity: 1, unitPrice: DEMO_PRODUCTS[0].unitPrice, taxExempt: DEMO_PRODUCTS[0].taxExempt }
  ])
  const [vatExempt, setVatExempt] = useState(selectedCustomer.type === 'NGO')

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxTotal = vatExempt ? 0 : items.reduce((sum, item) => {
    if (item.taxExempt) return sum
    return sum + (item.quantity * item.unitPrice * NIGERIAN_VAT_RATE / 100)
  }, 0)
  const grandTotal = subtotal + taxTotal

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxExempt: false }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Invoice (Demo)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <select 
              value={selectedCustomer.name}
              onChange={(e) => {
                const customer = DEMO_CUSTOMERS.find((c: any) => c.name === e.target.value)!
                setSelectedCustomer(customer)
                setVatExempt(customer.type === 'NGO')
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              {DEMO_CUSTOMERS.map((c: any) => (
                <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
            <div className="mt-2 text-xs text-gray-500">
              {selectedCustomer.email} • {selectedCustomer.phone}
              {selectedCustomer.tin && <span> • TIN: {selectedCustomer.tin}</span>}
            </div>
          </div>

          {/* VAT Exempt Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="vatExempt"
              checked={vatExempt}
              onChange={(e) => setVatExempt(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="vatExempt" className="text-sm text-gray-700">
              VAT Exempt {selectedCustomer.type === 'NGO' && '(NGO - Auto-selected)'}
            </label>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button 
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={item.description}
                    onChange={(e) => {
                      const product = DEMO_PRODUCTS.find((p: any) => p.name === e.target.value)
                      if (product) {
                        const newItems = [...items]
                        newItems[index] = { 
                          ...newItems[index], 
                          description: product.name, 
                          unitPrice: product.unitPrice,
                          taxExempt: product.taxExempt
                        }
                        setItems(newItems)
                      }
                    }}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                  >
                    <option value="">Select product...</option>
                    {DEMO_PRODUCTS.map((p: any) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].quantity = Number(e.target.value) || 1
                      setItems(newItems)
                    }}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                    min="1"
                  />
                  <span className="text-sm text-gray-500">×</span>
                  <span className="text-sm font-medium w-24 text-right">
                    {formatNGN(item.unitPrice)}
                  </span>
                  <span className="text-sm font-medium w-28 text-right">
                    {formatNGN(item.quantity * item.unitPrice)}
                  </span>
                  {item.taxExempt && <span className="text-xs text-green-600">No VAT</span>}
                  <button 
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={items.length === 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium">{formatNGN(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                VAT ({vatExempt ? 'Exempt' : `${NIGERIAN_VAT_RATE}%`})
              </span>
              <span className="font-medium text-blue-600">
                {vatExempt ? '₦0' : formatNGN(Math.round(taxTotal))}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Grand Total</span>
              <span className="font-bold text-xl">{formatNGN(Math.round(grandTotal))}</span>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Payment Terms: Net 30</span>
            <span>•</span>
            <span>Due: {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}</span>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Demo: Invoice created for ${selectedCustomer.name}\nTotal: ${formatNGN(Math.round(grandTotal))}`)
              onClose()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function BillingDemoContent() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'credits' | 'tools'>('invoices')
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<DemoInvoice | null>(null)

  // Calculate stats
  const totalOutstanding = DEMO_INVOICES.reduce((sum, inv) => sum + inv.amountDue, 0)
  const totalOverdue = DEMO_INVOICES.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amountDue, 0)
  const paidThisMonth = DEMO_PAYMENTS.reduce((sum, pay) => sum + pay.amount, 0)
  const pendingCredits = DEMO_CREDIT_NOTES.filter(cn => ['DRAFT', 'APPROVED'].includes(cn.status)).reduce((sum, cn) => sum + cn.amount, 0)

  const handleInvoiceAction = (action: string, invoice: DemoInvoice) => {
    switch (action) {
      case 'send':
        alert(`Demo: Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`)
        break
      case 'cancel':
        alert(`Demo: Invoice ${invoice.invoiceNumber} cancelled`)
        break
      case 'payment':
        alert(`Demo: Opening payment form for ${invoice.invoiceNumber}\nAmount Due: ${formatNGN(invoice.amountDue)}`)
        break
      case 'credit':
        alert(`Demo: Opening credit note form for ${invoice.invoiceNumber}`)
        break
      case 'view':
        setSelectedInvoice(invoice)
        break
    }
  }

  const handleCreditNoteAction = (action: string, cn: DemoCreditNote) => {
    switch (action) {
      case 'approve':
        alert(`Demo: Credit note ${cn.creditNoteNumber} approved`)
        break
      case 'apply':
        alert(`Demo: Credit note ${cn.creditNoteNumber} applied to invoice ${cn.invoiceNumber}`)
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Overlay */}
      <DemoOverlay />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Commerce Suite</span>
                <ChevronRight className="w-4 h-4" />
                <span>Billing & Subscriptions</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Billing Demo</h1>
              <p className="text-sm text-gray-500 mt-1">
                Nigeria-first billing: NGN currency, 7.5% VAT, Net-30 terms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateInvoice(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Outstanding"
            value={formatNGN(totalOutstanding)}
            subtext={`${DEMO_INVOICES.filter((i: any) => i.amountDue > 0).length} invoices`}
            icon={CircleDollarSign}
            color="blue"
          />
          <StatCard
            title="Overdue"
            value={formatNGN(totalOverdue)}
            subtext={`${DEMO_INVOICES.filter((i: any) => i.status === 'OVERDUE').length} invoices`}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Collected This Month"
            value={formatNGN(paidThisMonth)}
            subtext={`${DEMO_PAYMENTS.length} payments`}
            icon={CheckCircle}
            color="green"
            trend="up"
          />
          <StatCard
            title="Pending Credits"
            value={formatNGN(pendingCredits)}
            subtext={`${DEMO_CREDIT_NOTES.filter(cn => ['DRAFT', 'APPROVED'].includes(cn.status)).length} credit notes`}
            icon={FileCheck}
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'payments', label: 'Payments', icon: Receipt },
            { id: 'credits', label: 'Credit Notes', icon: FileCheck },
            { id: 'tools', label: 'Tools', icon: Calculator }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {DEMO_INVOICES.map(invoice => (
              <InvoiceCard 
                key={invoice.id} 
                invoice={invoice} 
                onAction={handleInvoiceAction}
              />
            ))}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_PAYMENTS.map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
            {DEMO_PAYMENTS.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No payments recorded yet
              </div>
            )}
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_CREDIT_NOTES.map(cn => (
              <CreditNoteCard 
                key={cn.id} 
                creditNote={cn} 
                onAction={handleCreditNoteAction}
              />
            ))}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VATCalculator />
            <AgingChart buckets={DEMO_AGING} />
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Nigeria-First Billing</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Currency:</strong> Nigerian Naira (₦) as default</li>
                <li>• <strong>VAT Rate:</strong> 7.5% (Federal standard)</li>
                <li>• <strong>VAT Exemptions:</strong> NGOs, basic food, medical, educational materials</li>
                <li>• <strong>Payment Terms:</strong> Net 30 days (configurable)</li>
                <li>• <strong>TIN:</strong> Optional (not mandatory for adoption)</li>
                <li>• <strong>Partial Payments:</strong> Fully supported with tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceDemo onClose={() => setShowCreateInvoice(false)} />
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selectedInvoice.invoiceNumber}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatNGN(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VAT ({selectedInvoice.vatExempt ? 'Exempt' : `${selectedInvoice.vatRate}%`})</span>
                <span>{formatNGN(selectedInvoice.taxTotal)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Grand Total</span>
                <span>{formatNGN(selectedInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid</span>
                <span className="text-green-600">{formatNGN(selectedInvoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Amount Due</span>
                <span className="text-red-600">{formatNGN(selectedInvoice.amountDue)}</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 justify-end">
              <button className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>

            {/* Convergence: Accounting Impact Panel */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <AccountingImpactPanel
                invoice={{
                  invoiceNumber: selectedInvoice.invoiceNumber,
                  customerName: selectedInvoice.customerName,
                  subtotal: selectedInvoice.subtotal,
                  vatAmount: selectedInvoice.taxTotal,
                  grandTotal: selectedInvoice.grandTotal,
                  vatExempt: selectedInvoice.vatExempt,
                  vatInclusive: false
                }}
                variant="compact"
                defaultExpanded={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function BillingDemoPage() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
        <DemoModeProvider>
          <BillingDemoContent />
        </DemoModeProvider>
      </Suspense>
    </DemoGate>
  )
}
