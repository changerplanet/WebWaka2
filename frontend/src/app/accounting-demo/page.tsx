'use client'

/**
 * Accounting (Light) Suite — Demo Page
 * 
 * Comprehensive demo showcasing:
 * - Chart of Accounts (Nigeria SME Template)
 * - Journal Entries (Double-entry bookkeeping)
 * - Ledger Balances (Cash, Bank, Mobile Money)
 * - VAT Summary
 * - Trial Balance
 * 
 * Nigeria-first: NGN currency, 7.5% VAT, Cash-heavy business model
 * 
 * @module app/accounting-demo
 * @canonical PC-SCP Phase S5
 * @phase Phase 2 Track A (S3) - DemoModeProvider integrated
 */

import { useState, Suspense } from 'react'
import { DemoModeProvider } from '@/lib/demo'
import { DemoOverlay, DemoGate } from '@/components/demo'
import {
  BookOpen,
  FileText,
  Wallet,
  Calculator,
  Building2,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  Smartphone,
  DollarSign,
  ArrowRightLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Clock,
  Info,
  Plus,
  Eye,
  Printer,
  FileCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Account {
  code: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  balance: number
  normalSide: 'DEBIT' | 'CREDIT'
  children?: Account[]
}

interface JournalEntry {
  id: string
  journalNumber: string
  date: string
  description: string
  sourceType: string
  status: 'DRAFT' | 'POSTED' | 'VOIDED'
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
}

interface JournalLine {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description: string
}

interface LedgerBalance {
  accountCode: string
  accountName: string
  icon: React.ComponentType<{ className?: string }>
  balance: number
  lastActivity: string
}

// ============================================================================
// NIGERIA SME CHART OF ACCOUNTS (DEMO DATA)
// ============================================================================

const DEMO_COA: Account[] = [
  {
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    balance: 8750000,
    normalSide: 'DEBIT',
    children: [
      {
        code: '1100',
        name: 'Cash & Bank',
        type: 'ASSET',
        balance: 5250000,
        normalSide: 'DEBIT',
        children: [
          { code: '1110', name: 'Cash on Hand', type: 'ASSET', balance: 450000, normalSide: 'DEBIT' },
          { code: '1120', name: 'Cash in Bank (GTBank)', type: 'ASSET', balance: 3200000, normalSide: 'DEBIT' },
          { code: '1130', name: 'Mobile Money (OPay)', type: 'ASSET', balance: 850000, normalSide: 'DEBIT' },
          { code: '1140', name: 'POS Terminal Float', type: 'ASSET', balance: 750000, normalSide: 'DEBIT' }
        ]
      },
      {
        code: '1200',
        name: 'Receivables',
        type: 'ASSET',
        balance: 1500000,
        normalSide: 'DEBIT',
        children: [
          { code: '1210', name: 'Accounts Receivable', type: 'ASSET', balance: 1500000, normalSide: 'DEBIT' }
        ]
      },
      {
        code: '1300',
        name: 'Inventory',
        type: 'ASSET',
        balance: 2000000,
        normalSide: 'DEBIT',
        children: [
          { code: '1310', name: 'Merchandise Inventory', type: 'ASSET', balance: 2000000, normalSide: 'DEBIT' }
        ]
      }
    ]
  },
  {
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    balance: 1875000,
    normalSide: 'CREDIT',
    children: [
      {
        code: '2100',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        balance: 1875000,
        normalSide: 'CREDIT',
        children: [
          { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', balance: 1200000, normalSide: 'CREDIT' },
          { code: '2120', name: 'VAT Payable (7.5%)', type: 'LIABILITY', balance: 525000, normalSide: 'CREDIT' },
          { code: '2150', name: 'Customer Deposits', type: 'LIABILITY', balance: 150000, normalSide: 'CREDIT' }
        ]
      }
    ]
  },
  {
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    balance: 4500000,
    normalSide: 'CREDIT',
    children: [
      { code: '3100', name: "Owner's Capital", type: 'EQUITY', balance: 3000000, normalSide: 'CREDIT' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', balance: 1500000, normalSide: 'CREDIT' }
    ]
  },
  {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    balance: 7500000,
    normalSide: 'CREDIT',
    children: [
      { code: '4110', name: 'POS Sales', type: 'REVENUE', balance: 4500000, normalSide: 'CREDIT' },
      { code: '4120', name: 'Online Sales', type: 'REVENUE', balance: 2000000, normalSide: 'CREDIT' },
      { code: '4130', name: 'Marketplace Sales', type: 'REVENUE', balance: 1000000, normalSide: 'CREDIT' }
    ]
  },
  {
    code: '5000',
    name: 'Cost of Goods Sold',
    type: 'EXPENSE',
    balance: 4125000,
    normalSide: 'DEBIT',
    children: [
      { code: '5100', name: 'Inventory Purchases', type: 'EXPENSE', balance: 4000000, normalSide: 'DEBIT' },
      { code: '5300', name: 'Inventory Adjustments', type: 'EXPENSE', balance: 125000, normalSide: 'DEBIT' }
    ]
  },
  {
    code: '6000',
    name: 'Operating Expenses',
    type: 'EXPENSE',
    balance: 1000000,
    normalSide: 'DEBIT',
    children: [
      { code: '6100', name: 'Rent Expense', type: 'EXPENSE', balance: 350000, normalSide: 'DEBIT' },
      { code: '6210', name: 'Electricity (EKEDC)', type: 'EXPENSE', balance: 75000, normalSide: 'DEBIT' },
      { code: '6220', name: 'Internet & Data', type: 'EXPENSE', balance: 25000, normalSide: 'DEBIT' },
      { code: '6300', name: 'Staff Salaries', type: 'EXPENSE', balance: 400000, normalSide: 'DEBIT' },
      { code: '6510', name: 'POS Transaction Fees', type: 'EXPENSE', balance: 85000, normalSide: 'DEBIT' },
      { code: '6700', name: 'Transport & Logistics', type: 'EXPENSE', balance: 65000, normalSide: 'DEBIT' }
    ]
  }
]

const DEMO_JOURNALS: JournalEntry[] = [
  {
    id: 'j-001',
    journalNumber: 'JE-2501-00001',
    date: '2025-01-07',
    description: 'POS Sale - Customer walkup purchase',
    sourceType: 'POS_SALE',
    status: 'POSTED',
    lines: [
      { accountCode: '1140', accountName: 'POS Terminal Float', debit: 53750, credit: 0, description: 'Cash received' },
      { accountCode: '4110', accountName: 'POS Sales', debit: 0, credit: 50000, description: 'Sale revenue' },
      { accountCode: '2120', accountName: 'VAT Payable (7.5%)', debit: 0, credit: 3750, description: 'Output VAT' }
    ],
    totalDebit: 53750,
    totalCredit: 53750
  },
  {
    id: 'j-002',
    journalNumber: 'JE-2501-00002',
    date: '2025-01-07',
    description: 'Online Order Payment - GTBank Transfer',
    sourceType: 'SVM_ORDER',
    status: 'POSTED',
    lines: [
      { accountCode: '1120', accountName: 'Cash in Bank (GTBank)', debit: 215000, credit: 0, description: 'Bank credit' },
      { accountCode: '4120', accountName: 'Online Sales', debit: 0, credit: 200000, description: 'Sale revenue' },
      { accountCode: '2120', accountName: 'VAT Payable (7.5%)', debit: 0, credit: 15000, description: 'Output VAT' }
    ],
    totalDebit: 215000,
    totalCredit: 215000
  },
  {
    id: 'j-003',
    journalNumber: 'JE-2501-00003',
    date: '2025-01-06',
    description: 'Inventory Purchase - Supplier payment',
    sourceType: 'EXPENSE',
    status: 'POSTED',
    lines: [
      { accountCode: '1310', accountName: 'Merchandise Inventory', debit: 500000, credit: 0, description: 'Stock received' },
      { accountCode: '1120', accountName: 'Cash in Bank (GTBank)', debit: 0, credit: 500000, description: 'Bank payment' }
    ],
    totalDebit: 500000,
    totalCredit: 500000
  },
  {
    id: 'j-004',
    journalNumber: 'JE-2501-00004',
    date: '2025-01-05',
    description: 'Monthly rent payment',
    sourceType: 'EXPENSE',
    status: 'POSTED',
    lines: [
      { accountCode: '6100', accountName: 'Rent Expense', debit: 350000, credit: 0, description: 'January rent' },
      { accountCode: '1120', accountName: 'Cash in Bank (GTBank)', debit: 0, credit: 350000, description: 'Bank transfer' }
    ],
    totalDebit: 350000,
    totalCredit: 350000
  },
  {
    id: 'j-005',
    journalNumber: 'JE-2501-00005',
    date: '2025-01-07',
    description: 'Mobile Money Sale - OPay',
    sourceType: 'POS_SALE',
    status: 'DRAFT',
    lines: [
      { accountCode: '1130', accountName: 'Mobile Money (OPay)', debit: 32250, credit: 0, description: 'OPay received' },
      { accountCode: '4110', accountName: 'POS Sales', debit: 0, credit: 30000, description: 'Sale revenue' },
      { accountCode: '2120', accountName: 'VAT Payable (7.5%)', debit: 0, credit: 2250, description: 'Output VAT' }
    ],
    totalDebit: 32250,
    totalCredit: 32250
  }
]

const DEMO_LEDGER_BALANCES: LedgerBalance[] = [
  { accountCode: '1110', accountName: 'Cash on Hand', icon: Wallet, balance: 450000, lastActivity: '2025-01-07' },
  { accountCode: '1120', accountName: 'Cash in Bank (GTBank)', icon: Building2, balance: 3200000, lastActivity: '2025-01-07' },
  { accountCode: '1130', accountName: 'Mobile Money (OPay)', icon: Smartphone, balance: 850000, lastActivity: '2025-01-07' },
  { accountCode: '1140', accountName: 'POS Terminal Float', icon: CreditCard, balance: 750000, lastActivity: '2025-01-07' }
]

const DEMO_VAT_SUMMARY = {
  period: 'January 2025',
  outputVAT: 525000,
  inputVAT: 75000,
  netVAT: 450000,
  status: 'PENDING',
  dueDate: '2025-02-21'
}

const DEMO_TRIAL_BALANCE = {
  totalDebits: 13375000,
  totalCredits: 13375000,
  balanced: true,
  asOfDate: '2025-01-07'
}

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
    case 'POSTED': return 'bg-green-100 text-green-700'
    case 'DRAFT': return 'bg-yellow-100 text-yellow-700'
    case 'VOIDED': return 'bg-red-100 text-red-700'
    case 'PENDING': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getAccountTypeColor(type: string): string {
  switch (type) {
    case 'ASSET': return 'text-blue-600'
    case 'LIABILITY': return 'text-red-600'
    case 'EQUITY': return 'text-purple-600'
    case 'REVENUE': return 'text-green-600'
    case 'EXPENSE': return 'text-orange-600'
    default: return 'text-gray-600'
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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
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

function AccountNode({ account, level = 0 }: { account: Account; level?: number }) {
  const [expanded, setExpanded] = useState(level < 1)
  const hasChildren = account.children && account.children.length > 0

  return (
    <div>
      <div 
        className={`flex items-center justify-between py-2 px-3 hover:bg-gray-50 cursor-pointer ${
          level === 0 ? 'font-semibold bg-gray-50' : ''
        }`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <div className="w-4" />
          )}
          <span className="font-mono text-sm text-gray-500">{account.code}</span>
          <span className={`${level === 0 ? 'font-semibold' : ''} ${getAccountTypeColor(account.type)}`}>
            {account.name}
          </span>
        </div>
        <span className="font-mono font-medium">
          {formatNGN(account.balance)}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {account.children!.map(child => (
            <AccountNode key={child.code} account={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function JournalCard({ journal }: { journal: JournalEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500">{journal.journalNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(journal.status)}`}>
              {journal.status}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {journal.sourceType.replace('_', ' ')}
            </span>
          </div>
          <span className="text-sm text-gray-500">{formatDate(journal.date)}</span>
        </div>
        <p className="text-sm text-gray-900 mb-2">{journal.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {journal.lines.length} line(s)
          </span>
          <div className="flex items-center gap-4">
            <span className="text-green-600">Dr: {formatNGN(journal.totalDebit)}</span>
            <span className="text-red-600">Cr: {formatNGN(journal.totalCredit)}</span>
            {journal.totalDebit === journal.totalCredit && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="pb-2">Account</th>
                <th className="pb-2 text-right">Debit</th>
                <th className="pb-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {journal.lines.map((line, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="py-2">
                    <span className="font-mono text-gray-500 mr-2">{line.accountCode}</span>
                    {line.accountName}
                    <span className="text-gray-400 text-xs block">{line.description}</span>
                  </td>
                  <td className="py-2 text-right font-mono">
                    {line.debit > 0 ? formatNGN(line.debit) : '-'}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {line.credit > 0 ? formatNGN(line.credit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right font-mono">{formatNGN(journal.totalDebit)}</td>
                <td className="py-2 text-right font-mono">{formatNGN(journal.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

function LedgerBalanceCard({ balance }: { balance: LedgerBalance }) {
  const Icon = balance.icon

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{balance.accountName}</p>
          <p className="text-xs text-gray-500 font-mono">{balance.accountCode}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">{formatNGN(balance.balance)}</span>
        <span className="text-xs text-gray-400">Updated {formatDate(balance.lastActivity)}</span>
      </div>
    </div>
  )
}

function TrialBalance() {
  const assets = DEMO_COA.find((a: any) => a.code === '1000')!
  const liabilities = DEMO_COA.find((a: any) => a.code === '2000')!
  const equity = DEMO_COA.find((a: any) => a.code === '3000')!
  const revenue = DEMO_COA.find((a: any) => a.code === '4000')!
  const cogs = DEMO_COA.find((a: any) => a.code === '5000')!
  const expenses = DEMO_COA.find((a: any) => a.code === '6000')!

  const rows = [
    { name: 'Assets', debit: assets.balance, credit: 0 },
    { name: 'Liabilities', debit: 0, credit: liabilities.balance },
    { name: 'Equity', debit: 0, credit: equity.balance },
    { name: 'Revenue', debit: 0, credit: revenue.balance },
    { name: 'Cost of Goods Sold', debit: cogs.balance, credit: 0 },
    { name: 'Operating Expenses', debit: expenses.balance, credit: 0 }
  ]

  const totalDebits = rows.reduce((sum: any, r: any) => sum + r.debit, 0)
  const totalCredits = rows.reduce((sum: any, r: any) => sum + r.credit, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Trial Balance</h3>
        <span className="text-sm text-gray-500">As of {formatDate(DEMO_TRIAL_BALANCE.asOfDate)}</span>
      </div>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-200">
            <th className="text-left pb-2">Account Category</th>
            <th className="text-right pb-2">Debit</th>
            <th className="text-right pb-2">Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="py-2">{row.name}</td>
              <td className="py-2 text-right font-mono">{row.debit > 0 ? formatNGN(row.debit) : '-'}</td>
              <td className="py-2 text-right font-mono">{row.credit > 0 ? formatNGN(row.credit) : '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold border-t-2 border-gray-300">
            <td className="py-2">Totals</td>
            <td className="py-2 text-right font-mono">{formatNGN(totalDebits)}</td>
            <td className="py-2 text-right font-mono">{formatNGN(totalCredits)}</td>
          </tr>
        </tfoot>
      </table>

      <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
        totalDebits === totalCredits ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {totalDebits === totalCredits ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Books are balanced</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-medium">Imbalance detected: {formatNGN(Math.abs(totalDebits - totalCredits))}</span>
          </>
        )}
      </div>
    </div>
  )
}

function VATSummaryCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">VAT Summary (7.5%)</h3>
        <span className="text-sm text-gray-500">{DEMO_VAT_SUMMARY.period}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Output VAT (Sales)</span>
          <span className="font-mono text-red-600">{formatNGN(DEMO_VAT_SUMMARY.outputVAT)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Input VAT (Purchases)</span>
          <span className="font-mono text-green-600">({formatNGN(DEMO_VAT_SUMMARY.inputVAT)})</span>
        </div>
        <div className="flex items-center justify-between py-2 font-semibold">
          <span className="text-gray-900">Net VAT Payable</span>
          <span className="font-mono text-lg">{formatNGN(DEMO_VAT_SUMMARY.netVAT)}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-yellow-700">
            <Clock className="w-4 h-4 inline mr-1" />
            Due by {formatDate(DEMO_VAT_SUMMARY.dueDate)}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(DEMO_VAT_SUMMARY.status)}`}>
            {DEMO_VAT_SUMMARY.status}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN CONTENT
// ============================================================================

function AccountingDemoContent() {
  const [activeTab, setActiveTab] = useState<'coa' | 'journals' | 'ledger' | 'reports'>('coa')

  // Calculate summary stats
  const totalAssets = DEMO_COA.find((a: any) => a.code === '1000')?.balance || 0
  const cashBalances = DEMO_LEDGER_BALANCES.reduce((sum: any, b: any) => sum + b.balance, 0)
  const postedJournals = DEMO_JOURNALS.filter((j: any) => j.status === 'POSTED').length
  const draftJournals = DEMO_JOURNALS.filter((j: any) => j.status === 'DRAFT').length

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
                <span>Accounting (Light)</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Accounting Demo</h1>
              <p className="text-sm text-gray-500 mt-1">
                Double-entry bookkeeping • Nigeria SME Chart of Accounts • 7.5% VAT
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Assets"
            value={formatNGN(totalAssets)}
            subtext="All asset accounts"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Cash & Bank"
            value={formatNGN(cashBalances)}
            subtext="Liquid assets"
            icon={Wallet}
            color="green"
          />
          <StatCard
            title="Posted Journals"
            value={postedJournals.toString()}
            subtext={`${draftJournals} draft`}
            icon={FileCheck}
            color="purple"
          />
          <StatCard
            title="VAT Payable"
            value={formatNGN(DEMO_VAT_SUMMARY.netVAT)}
            subtext={`Due ${formatDate(DEMO_VAT_SUMMARY.dueDate)}`}
            icon={Calculator}
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { id: 'coa', label: 'Chart of Accounts', icon: BookOpen },
            { id: 'journals', label: 'Journal Entries', icon: FileText },
            { id: 'ledger', label: 'Ledger Balances', icon: Wallet },
            { id: 'reports', label: 'Reports', icon: Receipt }
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
        {activeTab === 'coa' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Nigeria SME Chart of Accounts</h3>
              <p className="text-sm text-gray-500">Standard template with 56 accounts</p>
            </div>
            <div className="divide-y divide-gray-100">
              {DEMO_COA.map(account => (
                <AccountNode key={account.code} account={account} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'journals' && (
          <div className="space-y-4">
            {DEMO_JOURNALS.map(journal => (
              <JournalCard key={journal.id} journal={journal} />
            ))}
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_LEDGER_BALANCES.map(balance => (
              <LedgerBalanceCard key={balance.accountCode} balance={balance} />
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrialBalance />
            <VATSummaryCard />
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Nigeria-First Accounting</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Double-Entry:</strong> Debits always equal Credits (append-only ledger)</li>
                <li>• <strong>Chart of Accounts:</strong> Nigeria SME template (1xxx Assets → 7xxx Other)</li>
                <li>• <strong>VAT:</strong> 7.5% Nigerian standard, with input/output tracking</li>
                <li>• <strong>Cash-Heavy:</strong> Separate tracking for Cash, Bank, Mobile Money, POS</li>
                <li>• <strong>Event-Sourced:</strong> Journals auto-generated from POS/SVM/MVM sales</li>
                <li>• <strong>Audit-Friendly:</strong> Immutable ledger entries, full traceability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// MAIN PAGE (With Provider and Suspense)
// ============================================================================

export default function AccountingDemoPage() {
  return (
    <DemoGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
        <DemoModeProvider>
          <AccountingDemoContent />
        </DemoModeProvider>
      </Suspense>
    </DemoGate>
  )
}
