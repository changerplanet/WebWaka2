'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Banknote, 
  CreditCard, 
  Building2, 
  Smartphone,
  Wallet,
  ReceiptText,
  TrendingUp,
  AlertCircle,
  Loader2,
  X,
  Percent
} from 'lucide-react'
import { formatNGNShort } from '@/lib/pos/config'

interface ReportProps {
  shiftId: string
  reportType: 'X' | 'Z'
  onClose: () => void
}

interface Report {
  reportType: string
  reportNumber: string
  generatedAt: string
  isImmutable: boolean
  shift: {
    id: string
    shiftNumber: string
    registerId: string
    locationId: string
    openedAt: string
    closedAt?: string
    status: string
    openedByName: string
    closedByName?: string
  }
  summary: {
    grossSales: number
    subtotal: number
    totalVAT: number
    vatRate: number
    totalDiscounts: number
    netSales: number
    transactionCount: number
    averageTransaction: number
  }
  paymentBreakdown: Array<{
    method: string
    total: number
    count: number
  }>
  cash: {
    openingFloat: number
    cashSales: number
    systemTotal: number
    declaredTotal: number | null
    variance: number | null
  }
  refunds: {
    total: number
    count: number
  }
  currency: string
}

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: Building2,
  BANK_TRANSFER: Building2,
  MOBILE_MONEY: Smartphone,
  WALLET: Wallet,
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  TRANSFER: 'Bank Transfer',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  WALLET: 'Wallet',
}

export function XZReport({ shiftId, reportType, onClose }: ReportProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [shiftId, reportType])

  const fetchReport = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/pos/reports?type=${reportType}&shiftId=${shiftId}`)
      const data = await res.json()

      if (data.success) {
        setReport(data.report)
      } else {
        setError(data.error || 'Failed to load report')
      }
    } catch (err) {
      setError('Failed to load report')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className={`p-4 border-b ${reportType === 'Z' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${reportType === 'Z' ? 'text-amber-600' : 'text-blue-600'}`} />
            <div>
              <h2 className="font-bold text-lg">{reportType} Report</h2>
              <p className="text-sm text-slate-500">
                {reportType === 'X' ? 'Mid-Shift Summary' : 'End-Shift Final (Immutable)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : report ? (
            <>
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h3 className="font-bold text-lg">{report.reportNumber}</h3>
                <p className="text-sm text-slate-500">
                  Generated: {formatDateTime(report.generatedAt)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Shift: {report.shift.shiftNumber} | Register: {report.shift.registerId}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Sales Summary
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gross Sales</span>
                    <span className="font-medium">{formatNGNShort(report.summary.grossSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Discounts</span>
                    <span className="text-red-600">-{formatNGNShort(report.summary.totalDiscounts)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Percent className="w-3 h-3" /> VAT (7.5%)
                    </span>
                    <span>{formatNGNShort(report.summary.totalVAT)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-2">
                    <span>Net Sales</span>
                    <span>{formatNGNShort(report.summary.netSales)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <ReceiptText className="w-4 h-4" />
                  Transactions
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Transactions</span>
                    <span className="font-medium">{report.summary.transactionCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Average Transaction</span>
                    <span>{formatNGNShort(report.summary.averageTransaction)}</span>
                  </div>
                  {report.refunds.count > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Refunds ({report.refunds.count})</span>
                      <span>-{formatNGNShort(report.refunds.total)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-700">Payment Breakdown</h4>
                <div className="space-y-2">
                  {report.paymentBreakdown.map((payment) => {
                    const Icon = PAYMENT_ICONS[payment.method] || CreditCard
                    return (
                      <div key={payment.method} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium">{PAYMENT_LABELS[payment.method] || payment.method}</p>
                            <p className="text-xs text-slate-500">{payment.count} transactions</p>
                          </div>
                        </div>
                        <span className="font-bold">{formatNGNShort(payment.total)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Cash Drawer
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Opening Float</span>
                    <span>{formatNGNShort(report.cash.openingFloat)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cash Sales</span>
                    <span>+{formatNGNShort(report.cash.cashSales)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-slate-200 pt-2 mt-2">
                    <span>System Total</span>
                    <span>{formatNGNShort(report.cash.systemTotal)}</span>
                  </div>
                  {report.cash.declaredTotal !== null && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Declared Total</span>
                        <span>{formatNGNShort(report.cash.declaredTotal)}</span>
                      </div>
                      <div className={`flex justify-between font-medium ${report.cash.variance !== 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        <span>Variance</span>
                        <span>{report.cash.variance! > 0 ? '+' : ''}{formatNGNShort(report.cash.variance!)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {reportType === 'Z' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-700 font-medium">This is a Z Report (Final)</p>
                  <p className="text-sm text-amber-600 mt-1">
                    This report is immutable and represents the official end-of-shift record.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
