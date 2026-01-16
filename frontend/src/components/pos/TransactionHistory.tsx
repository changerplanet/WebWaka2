'use client'

import { useState, useEffect } from 'react'
import { 
  Receipt, 
  Clock, 
  CreditCard, 
  Banknote, 
  Building2,
  Smartphone,
  Wallet,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Ban,
  RotateCcw
} from 'lucide-react'
import { formatNGNShort } from '@/lib/pos/config'
import { ReceiptView } from './ReceiptView'
import { VoidSaleModal } from './VoidSaleModal'
import { RefundModal } from './RefundModal'
import { POSRole, hasPOSPermission } from '@/app/pos/layout'

interface SaleItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  returnedQuantity: number
  refundedAmount: number
}

interface Sale {
  id: string
  saleNumber: string
  receiptNumber?: string
  saleDate: string
  status: string
  grandTotal: number
  paymentMethod: string
  customerName?: string
  staffName: string
  currency: string
  hasReceipt: boolean
  receiptId?: string
  items?: SaleItem[]
}

interface Shift {
  id: string
  status: string
}

interface TransactionHistoryProps {
  locationId?: string
  tenantId: string
  onClose: () => void
  currentShift?: Shift | null
  posRole?: POSRole
}

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  CARD: CreditCard,
  TRANSFER: Building2,
  BANK_TRANSFER: Building2,
  MOBILE: Smartphone,
  MOBILE_MONEY: Smartphone,
  WALLET: Wallet,
}

export function TransactionHistory({ locationId, tenantId, onClose, currentShift, posRole = 'POS_CASHIER' }: TransactionHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)
  const [voidingSale, setVoidingSale] = useState<Sale | null>(null)
  const [refundingSale, setRefundingSale] = useState<Sale | null>(null)
  const [isLoadingSaleDetails, setIsLoadingSaleDetails] = useState(false)
  
  const canVoid = hasPOSPermission(posRole, 'pos.sale.void') || posRole === 'POS_MANAGER'
  const canRefund = hasPOSPermission(posRole, 'pos.sale.refund') || posRole === 'POS_MANAGER'
  const isShiftOpen = currentShift?.status === 'OPEN'

  const fetchSales = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (locationId) params.set('locationId', locationId)
      
      const res = await fetch(`/api/pos/sales?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setSales(data.sales)
      } else {
        setError(data.error || 'Failed to load transactions')
      }
    } catch (err) {
      setError('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [locationId])

  const handleViewReceipt = async (sale: Sale) => {
    if (!sale.receiptId) return

    setIsLoadingReceipt(true)
    try {
      const res = await fetch(`/api/pos/receipts?id=${sale.receiptId}`)
      const data = await res.json()

      if (data.success) {
        setSelectedReceipt(data.receipt)
      }
    } catch (err) {
      console.error('Failed to load receipt:', err)
    } finally {
      setIsLoadingReceipt(false)
    }
  }

  const handleRefundClick = async (sale: Sale) => {
    setIsLoadingSaleDetails(true)
    try {
      const res = await fetch(`/api/pos/sales/${sale.id}`)
      const data = await res.json()
      if (data.success) {
        setRefundingSale({
          ...sale,
          items: data.sale.items.map((item: any) => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
            returnedQuantity: item.returnedQuantity || 0,
            refundedAmount: Number(item.refundedAmount || 0),
          }))
        })
      }
    } catch (err) {
      console.error('Failed to load sale details:', err)
    } finally {
      setIsLoadingSaleDetails(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700'
      case 'VOIDED':
        return 'bg-red-100 text-red-700'
      case 'REFUNDED':
        return 'bg-amber-100 text-amber-700'
      case 'PARTIALLY_REFUNDED':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PARTIALLY_REFUNDED':
        return 'PARTIAL REFUND'
      default:
        return status
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <div>
              <h2 className="font-bold text-lg">Today&apos;s Transactions</h2>
              <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSales}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchSales}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mb-4" />
              <p className="font-medium">No transactions today</p>
              <p className="text-sm">Sales will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sales.map((sale) => {
                const PaymentIcon = PAYMENT_ICONS[sale.paymentMethod] || CreditCard
                const isVoidable = sale.status === 'COMPLETED' && canVoid && isShiftOpen
                const isRefundable = (sale.status === 'COMPLETED' || sale.status === 'PARTIALLY_REFUNDED') && canRefund
                return (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(sale.status)}`}>
                        <PaymentIcon className="w-6 h-6" />
                      </div>
                      
                      <button
                        onClick={() => handleViewReceipt(sale)}
                        disabled={!sale.hasReceipt || isLoadingReceipt}
                        className="flex-1 min-w-0 text-left touch-manipulation disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">
                            {sale.customerName || 'Walk-in Customer'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(sale.status)}`}>
                            {getStatusLabel(sale.status)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <span>{formatTime(sale.saleDate)}</span>
                          <span>•</span>
                          <span>{sale.saleNumber}</span>
                        </div>
                      </button>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatNGNShort(sale.grandTotal)}</p>
                        <p className="text-xs text-slate-500">{sale.paymentMethod}</p>
                      </div>

                      {sale.hasReceipt && sale.status === 'VOIDED' && (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {(isVoidable || isRefundable) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        {isVoidable && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setVoidingSale(sale) }}
                            className="flex-1 py-2 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
                          >
                            <Ban className="w-4 h-4" />
                            Void
                          </button>
                        )}
                        {isRefundable && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRefundClick(sale) }}
                            disabled={isLoadingSaleDetails}
                            className="flex-1 py-2 px-4 text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
                          >
                            {isLoadingSaleDetails ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            Refund
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Sales Today</span>
            <span className="font-bold text-slate-900">
              {formatNGNShort(sales.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + s.grandTotal, 0))}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-500">Transactions</span>
            <span className="font-medium text-slate-700">
              {sales.filter(s => s.status === 'COMPLETED').length} completed
            </span>
          </div>
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          tenantId={tenantId}
        />
      )}

      {voidingSale && (
        <VoidSaleModal
          saleId={voidingSale.id}
          saleTotal={voidingSale.grandTotal}
          currentRole={posRole}
          onConfirm={async (supervisorPin, reason) => {
            try {
              const res = await fetch('/api/pos/sales/void', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  saleId: voidingSale.id,
                  reason,
                  supervisorPin: supervisorPin || undefined,
                })
              })
              const data = await res.json()
              if (data.success) {
                setVoidingSale(null)
                fetchSales()
                return true
              }
              return false
            } catch {
              return false
            }
          }}
          onCancel={() => setVoidingSale(null)}
        />
      )}

      {refundingSale && refundingSale.items && (
        <RefundModal
          saleId={refundingSale.id}
          saleNumber={refundingSale.saleNumber}
          saleTotal={refundingSale.grandTotal}
          items={refundingSale.items}
          currentRole={posRole}
          onConfirm={async (data) => {
            try {
              const res = await fetch('/api/pos/sales/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  saleId: refundingSale.id,
                  reason: data.reason,
                  refundType: data.refundType,
                  items: data.items,
                  supervisorPin: data.supervisorPin,
                })
              })
              const result = await res.json()
              if (result.success) {
                setRefundingSale(null)
                fetchSales()
                return true
              }
              return false
            } catch {
              return false
            }
          }}
          onCancel={() => setRefundingSale(null)}
        />
      )}
    </div>
  )
}
