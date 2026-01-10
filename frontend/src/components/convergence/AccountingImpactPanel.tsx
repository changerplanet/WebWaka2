'use client'

/**
 * Accounting Impact Panel Component
 * 
 * Shows the derived accounting impact for a billing transaction.
 * "This invoice automatically creates these journal entries."
 * 
 * @module components/convergence/AccountingImpactPanel
 * @phase Phase 3 Track C
 */

import { useState } from 'react'
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  RotateCcw
} from 'lucide-react'
import {
  DerivedJournal,
  FullInvoiceDerivation,
  deriveInvoiceJournal,
  deriveFullInvoiceJournals,
  InvoiceForDerivation,
  PaymentForDerivation,
  CreditNoteForDerivation
} from '@/lib/convergence'
import { JournalEntryTable } from './JournalEntryTable'
import { DerivationNotice } from './DerivationNotice'

// ============================================================================
// TYPES
// ============================================================================

interface AccountingImpactPanelProps {
  invoice: InvoiceForDerivation
  payments?: PaymentForDerivation[]
  creditNotes?: CreditNoteForDerivation[]
  variant?: 'full' | 'invoice-only' | 'compact'
  defaultExpanded?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AccountingImpactPanel({
  invoice,
  payments = [],
  creditNotes = [],
  variant = 'full',
  defaultExpanded = false
}: AccountingImpactPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Derive journals
  const fullDerivation = deriveFullInvoiceJournals(invoice, payments, creditNotes)

  // For compact variant, show only summary
  if (variant === 'compact') {
    return (
      <div 
        className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4"
        data-testid="accounting-impact-compact"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Calculator className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-900">Accounting Impact</p>
              <p className="text-xs text-violet-600">
                {fullDerivation.summary.totalJournalEntries} journal entries • {formatNGN(fullDerivation.summary.totalDebits)} total
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-violet-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-violet-600" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-violet-200">
            <DerivationNotice variant="compact" />
            <div className="mt-3">
              <JournalEntryTable
                entries={fullDerivation.invoice.entries}
                totalDebit={fullDerivation.invoice.totalDebit}
                totalCredit={fullDerivation.invoice.totalCredit}
                isBalanced={fullDerivation.invoice.isBalanced}
                compact
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Invoice-only variant
  if (variant === 'invoice-only') {
    const invoiceJournal = deriveInvoiceJournal(invoice)

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid="accounting-impact-invoice">
        <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Calculator className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-900">Accounting Impact</h3>
              <p className="text-sm text-violet-600">This invoice creates the following journal entry</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <DerivationNotice />
          <JournalEntryTable
            entries={invoiceJournal.entries}
            totalDebit={invoiceJournal.totalDebit}
            totalCredit={invoiceJournal.totalCredit}
            isBalanced={invoiceJournal.isBalanced}
          />
        </div>
      </div>
    )
  }

  // Full variant with all transactions
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid="accounting-impact-full">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Calculator className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-violet-900">Full Accounting Impact</h3>
              <p className="text-sm text-violet-600">
                {fullDerivation.summary.totalJournalEntries} journal entries derived from this invoice
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Net Receivable</p>
            <p className={`text-lg font-bold ${fullDerivation.summary.netReceivable > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {formatNGN(fullDerivation.summary.netReceivable)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <DerivationNotice />

        {/* Invoice Journal */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-violet-600" />
            <h4 className="font-medium text-gray-900">Invoice Issued</h4>
            <span className="text-xs text-gray-500">({invoice.invoiceNumber})</span>
          </div>
          <JournalEntryTable
            entries={fullDerivation.invoice.entries}
            totalDebit={fullDerivation.invoice.totalDebit}
            totalCredit={fullDerivation.invoice.totalCredit}
            isBalanced={fullDerivation.invoice.isBalanced}
          />
        </div>

        {/* Payment Journals */}
        {fullDerivation.payments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h4 className="font-medium text-gray-900">Payments Recorded</h4>
              <span className="text-xs text-gray-500">({fullDerivation.payments.length})</span>
            </div>
            <div className="space-y-3">
              {fullDerivation.payments.map((pj, idx) => (
                <div key={idx} className="pl-4 border-l-2 border-emerald-200">
                  <p className="text-xs text-gray-500 mb-2">{pj.type}</p>
                  <JournalEntryTable
                    entries={pj.entries}
                    totalDebit={pj.totalDebit}
                    totalCredit={pj.totalCredit}
                    isBalanced={pj.isBalanced}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Note Journals */}
        {fullDerivation.creditNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h4 className="font-medium text-gray-900">Credit Notes Applied</h4>
              <span className="text-xs text-gray-500">({fullDerivation.creditNotes.length})</span>
            </div>
            <div className="space-y-3">
              {fullDerivation.creditNotes.map((cj, idx) => (
                <div key={idx} className="pl-4 border-l-2 border-amber-200">
                  <p className="text-xs text-gray-500 mb-2">{cj.description}</p>
                  <JournalEntryTable
                    entries={cj.entries}
                    totalDebit={cj.totalDebit}
                    totalCredit={cj.totalCredit}
                    isBalanced={cj.isBalanced}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Journal Entries</p>
              <p className="font-semibold text-gray-900">{fullDerivation.summary.totalJournalEntries}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Debits</p>
              <p className="font-semibold text-emerald-700">{formatNGN(fullDerivation.summary.totalDebits)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Credits</p>
              <p className="font-semibold text-blue-700">{formatNGN(fullDerivation.summary.totalCredits)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
