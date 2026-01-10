'use client'

/**
 * Journal Entry Table Component
 * 
 * Displays derived journal entries in a professional double-entry format.
 * 
 * @module components/convergence/JournalEntryTable
 * @phase Phase 3 Track C
 */

import { DerivedJournalEntry } from '@/lib/convergence'
import { CheckCircle, XCircle } from 'lucide-react'

interface JournalEntryTableProps {
  entries: DerivedJournalEntry[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  compact?: boolean
}

function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function JournalEntryTable({
  entries,
  totalDebit,
  totalCredit,
  isBalanced,
  compact = false
}: JournalEntryTableProps) {
  if (compact) {
    return (
      <div className="space-y-1.5" data-testid="journal-entry-table-compact">
        {entries.map((entry) => (
          <div 
            key={entry.lineNumber}
            className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs"
          >
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-medium ${
                entry.debit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {entry.debit > 0 ? 'DR' : 'CR'}
              </span>
              <span className="font-mono text-gray-500">{entry.accountCode}</span>
              <span className="text-gray-700">{entry.accountName}</span>
            </div>
            <span className="font-medium tabular-nums">
              {formatNGN(entry.debit > 0 ? entry.debit : entry.credit)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden" data-testid="journal-entry-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">#</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Account</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600">Debit</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600">Credit</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.lineNumber} className="border-b border-gray-100 last:border-0">
              <td className="py-3 px-4 text-gray-400">{entry.lineNumber}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {entry.accountCode}
                  </span>
                  <span className="text-gray-900">{entry.accountName}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600 text-xs">{entry.description}</td>
              <td className="py-3 px-4 text-right tabular-nums">
                {entry.debit > 0 ? (
                  <span className="text-emerald-700 font-medium">{formatNGN(entry.debit)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-right tabular-nums">
                {entry.credit > 0 ? (
                  <span className="text-blue-700 font-medium">{formatNGN(entry.credit)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-200">
            <td colSpan={3} className="py-3 px-4 font-medium text-gray-700">
              <div className="flex items-center gap-2">
                Total
                {isBalanced ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Balanced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="w-3.5 h-3.5" />
                    Unbalanced
                  </span>
                )}
              </div>
            </td>
            <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular-nums">
              {formatNGN(totalDebit)}
            </td>
            <td className="py-3 px-4 text-right font-bold text-blue-700 tabular-nums">
              {formatNGN(totalCredit)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
