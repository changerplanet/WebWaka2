'use client'

import { useState, useRef } from 'react'
import { 
  Receipt, 
  Download, 
  Share2, 
  MessageCircle, 
  Printer, 
  QrCode,
  X,
  Check,
  Loader2,
  Phone
} from 'lucide-react'
import { formatNGNShort } from '@/lib/pos/config'

interface ReceiptItem {
  description: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
}

interface ReceiptData {
  id: string
  receiptNumber: string
  businessName: string
  transactionDate: string
  items: ReceiptItem[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  roundingAmount?: number
  grandTotal: number
  paymentMethod: string
  amountTendered?: number
  changeGiven?: number
  paymentReference?: string
  customerName?: string
  customerPhone?: string
  staffName: string
  verificationQrCode?: string
}

interface ReceiptViewProps {
  receipt: ReceiptData
  onClose: () => void
  tenantId: string
}

export function ReceiptView({ receipt, onClose, tenantId }: ReceiptViewProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  const [whatsAppPhone, setWhatsAppPhone] = useState(receipt.customerPhone || '')
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [whatsAppResult, setWhatsAppResult] = useState<{ success: boolean; message: string } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.receiptNumber}</title>
          <style>
            body { font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .business-name { font-size: 16px; font-weight: bold; }
            .receipt-number { font-size: 10px; color: #666; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .totals { padding: 10px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
            .qr-placeholder { text-align: center; margin: 15px 0; padding: 20px; border: 1px dashed #ccc; }
            @media print { body { margin: 0; padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="business-name">${receipt.businessName}</div>
            <div class="receipt-number">${receipt.receiptNumber}</div>
            <div>${formatDate(receipt.transactionDate)}</div>
            <div>Staff: ${receipt.staffName}</div>
          </div>
          <div class="items">
            ${receipt.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.description}</span>
                <span>${formatNGNShort(item.lineTotal)}</span>
              </div>
            `).join('')}
          </div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatNGNShort(receipt.subtotal)}</span>
            </div>
            ${receipt.discountTotal > 0 ? `
              <div class="total-row">
                <span>Discount</span>
                <span>-${formatNGNShort(receipt.discountTotal)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>VAT (7.5%)</span>
              <span>${formatNGNShort(receipt.taxTotal)}</span>
            </div>
            ${receipt.roundingAmount ? `
              <div class="total-row">
                <span>Rounding</span>
                <span>${receipt.roundingAmount > 0 ? '+' : ''}${formatNGNShort(receipt.roundingAmount)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL</span>
              <span>${formatNGNShort(receipt.grandTotal)}</span>
            </div>
          </div>
          <div class="payment">
            <div class="total-row">
              <span>Payment</span>
              <span>${receipt.paymentMethod}</span>
            </div>
            ${receipt.amountTendered ? `
              <div class="total-row">
                <span>Tendered</span>
                <span>${formatNGNShort(receipt.amountTendered)}</span>
              </div>
              <div class="total-row">
                <span>Change</span>
                <span>${formatNGNShort(receipt.changeGiven || 0)}</span>
              </div>
            ` : ''}
            ${receipt.paymentReference ? `
              <div class="total-row">
                <span>Ref</span>
                <span>${receipt.paymentReference}</span>
              </div>
            ` : ''}
          </div>
          ${receipt.verificationQrCode ? `
            <div class="qr-placeholder">
              Verify: ${receipt.verificationQrCode}
            </div>
          ` : ''}
          <div class="footer">
            <p>Thank you for your purchase!</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleWhatsAppSend = async () => {
    if (!whatsAppPhone) {
      setShowPhoneInput(true)
      return
    }

    setIsSendingWhatsApp(true)
    setWhatsAppResult(null)

    try {
      const res = await fetch('/api/pos/receipts/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: receipt.id,
          customerPhone: whatsAppPhone,
        }),
      })

      const data = await res.json()
      setWhatsAppResult({
        success: data.success,
        message: data.success ? 'Receipt sent via WhatsApp!' : data.error || 'Failed to send',
      })
      setShowPhoneInput(false)
    } catch (error) {
      setWhatsAppResult({
        success: false,
        message: 'Failed to send receipt',
      })
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  const handleDownloadPDF = () => {
    handlePrint()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg">Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={printRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-bold text-xl">{receipt.businessName}</h3>
            <p className="text-sm text-slate-500">{receipt.receiptNumber}</p>
            <p className="text-sm text-slate-500">{formatDate(receipt.transactionDate)}</p>
            <p className="text-sm text-slate-500">Staff: {receipt.staffName}</p>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-4 space-y-2">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.description}</span>
                <span className="font-medium">{formatNGNShort(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatNGNShort(receipt.subtotal)}</span>
            </div>
            {receipt.discountTotal > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>-{formatNGNShort(receipt.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">VAT (7.5%)</span>
              <span>{formatNGNShort(receipt.taxTotal)}</span>
            </div>
            {receipt.roundingAmount !== undefined && receipt.roundingAmount !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Rounding</span>
                <span>{receipt.roundingAmount > 0 ? '+' : ''}{formatNGNShort(receipt.roundingAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2 mt-2">
              <span>TOTAL</span>
              <span>{formatNGNShort(receipt.grandTotal)}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-medium">{receipt.paymentMethod}</span>
            </div>
            {receipt.amountTendered && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tendered</span>
                  <span>{formatNGNShort(receipt.amountTendered)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Change</span>
                  <span>{formatNGNShort(receipt.changeGiven || 0)}</span>
                </div>
              </>
            )}
            {receipt.paymentReference && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono text-xs">{receipt.paymentReference}</span>
              </div>
            )}
          </div>

          {receipt.verificationQrCode && (
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <QrCode className="w-16 h-16 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 font-mono">{receipt.verificationQrCode}</p>
            </div>
          )}
        </div>

        {showPhoneInput && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Customer Phone Number
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value)}
                placeholder="08012345678"
                className="flex-1 p-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
              <button
                onClick={handleWhatsAppSend}
                disabled={!whatsAppPhone || isSendingWhatsApp}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-colors"
              >
                {isSendingWhatsApp ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send'}
              </button>
            </div>
          </div>
        )}

        {whatsAppResult && (
          <div className={`p-3 mx-4 mb-2 rounded-xl text-sm ${whatsAppResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {whatsAppResult.success ? <Check className="w-4 h-4 inline mr-1" /> : null}
            {whatsAppResult.message}
          </div>
        )}

        <div className="p-4 border-t border-slate-200 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          <button
            onClick={() => setShowPhoneInput(true)}
            disabled={isSendingWhatsApp}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
