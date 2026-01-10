/**
 * POS Receipt Service
 * 
 * Generates receipts for completed sales.
 * Nigeria-first: NGN formatting, Nigerian business format.
 */

import { 
  formatNGN,
  formatNGNShort,
  POS_CONFIG,
  type POSSale,
  type POSSaleItem
} from './config'

// =============================================================================
// TYPES
// =============================================================================

export interface ReceiptData {
  // Header
  businessName: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  rcNumber?: string // Nigerian RC Number
  tinNumber?: string // Tax Identification Number

  // Receipt info
  receiptNumber: string
  saleNumber: string
  date: string
  time: string
  
  // Location/Staff
  locationName: string
  staffName: string
  registerId?: string

  // Customer
  customerName?: string
  customerPhone?: string

  // Items
  items: ReceiptItem[]

  // Totals
  subtotal: string
  discount: string
  tax: string
  taxRate: string
  total: string
  
  // Payment
  paymentMethod: string
  amountTendered?: string
  changeDue?: string
  transferReference?: string

  // Footer
  footerMessage?: string
  returnPolicy?: string
}

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: string
  discount?: string
  lineTotal: string
}

export interface PrintableReceipt {
  text: string // Plain text for thermal printers
  html: string // HTML for display/email
}

// =============================================================================
// RECEIPT SERVICE
// =============================================================================

/**
 * Generate receipt data from a sale
 */
export function generateReceiptData(
  sale: POSSale,
  businessInfo: {
    name: string
    address?: string
    phone?: string
    email?: string
    rcNumber?: string
    tinNumber?: string
    locationName: string
    footerMessage?: string
    returnPolicy?: string
  }
): ReceiptData {
  const saleDate = new Date(sale.saleDate)
  
  return {
    businessName: businessInfo.name,
    businessAddress: businessInfo.address,
    businessPhone: businessInfo.phone,
    businessEmail: businessInfo.email,
    rcNumber: businessInfo.rcNumber,
    tinNumber: businessInfo.tinNumber,

    receiptNumber: sale.receiptNumber || sale.saleNumber,
    saleNumber: sale.saleNumber,
    date: saleDate.toLocaleDateString('en-NG', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    time: saleDate.toLocaleTimeString('en-NG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),

    locationName: businessInfo.locationName,
    staffName: sale.staffName,
    registerId: undefined,

    customerName: sale.customerName,
    customerPhone: sale.customerPhone,

    items: sale.items.map((item: any) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: formatNGNShort(item.unitPrice),
      discount: item.discount > 0 ? formatNGNShort(item.discount) : undefined,
      lineTotal: formatNGNShort(item.lineTotal),
    })),

    subtotal: formatNGNShort(sale.subtotal),
    discount: formatNGNShort(sale.discountTotal),
    tax: formatNGNShort(sale.taxTotal),
    taxRate: `${((sale.taxRate || POS_CONFIG.defaultTaxRate) * 100).toFixed(1)}%`,
    total: formatNGNShort(sale.grandTotal),

    paymentMethod: getPaymentMethodLabel(sale.paymentMethod),
    amountTendered: sale.amountTendered ? formatNGNShort(sale.amountTendered) : undefined,
    changeDue: sale.changeGiven ? formatNGNShort(sale.changeGiven) : undefined,
    transferReference: sale.transferReference,

    footerMessage: businessInfo.footerMessage || 'Thank you for your patronage!',
    returnPolicy: businessInfo.returnPolicy,
  }
}

/**
 * Generate printable receipt (plain text for thermal printers)
 */
export function generatePrintableReceipt(data: ReceiptData): PrintableReceipt {
  const LINE_WIDTH = 40
  const SEPARATOR = '='.repeat(LINE_WIDTH)
  const DASH_LINE = '-'.repeat(LINE_WIDTH)

  const lines: string[] = []

  // Header
  lines.push(centerText(data.businessName.toUpperCase(), LINE_WIDTH))
  if (data.businessAddress) {
    lines.push(centerText(data.businessAddress, LINE_WIDTH))
  }
  if (data.businessPhone) {
    lines.push(centerText(`Tel: ${data.businessPhone}`, LINE_WIDTH))
  }
  if (data.rcNumber) {
    lines.push(centerText(`RC: ${data.rcNumber}`, LINE_WIDTH))
  }
  if (data.tinNumber) {
    lines.push(centerText(`TIN: ${data.tinNumber}`, LINE_WIDTH))
  }
  lines.push(SEPARATOR)

  // Receipt info
  lines.push(`Receipt: ${data.receiptNumber}`)
  lines.push(`Date: ${data.date}  Time: ${data.time}`)
  lines.push(`Cashier: ${data.staffName}`)
  if (data.customerName) {
    lines.push(`Customer: ${data.customerName}`)
  }
  lines.push(DASH_LINE)

  // Items
  for (const item of data.items) {
    const qtyPrice = `${item.quantity} x ${item.unitPrice}`
    lines.push(item.name)
    lines.push(rightAlign(`${qtyPrice}  ${item.lineTotal}`, LINE_WIDTH))
    if (item.discount) {
      lines.push(rightAlign(`Discount: -${item.discount}`, LINE_WIDTH))
    }
  }
  lines.push(DASH_LINE)

  // Totals
  lines.push(formatLine('Subtotal:', data.subtotal, LINE_WIDTH))
  if (parseAmount(data.discount) > 0) {
    lines.push(formatLine('Discount:', `-${data.discount}`, LINE_WIDTH))
  }
  lines.push(formatLine(`VAT (${data.taxRate}):`, data.tax, LINE_WIDTH))
  lines.push(SEPARATOR)
  lines.push(formatLine('TOTAL:', data.total, LINE_WIDTH))
  lines.push(SEPARATOR)

  // Payment
  lines.push(formatLine('Payment:', data.paymentMethod, LINE_WIDTH))
  if (data.amountTendered) {
    lines.push(formatLine('Tendered:', data.amountTendered, LINE_WIDTH))
    lines.push(formatLine('Change:', data.changeDue || '₦0.00', LINE_WIDTH))
  }
  if (data.transferReference) {
    lines.push(`Transfer Ref: ${data.transferReference}`)
  }
  lines.push(DASH_LINE)

  // Footer
  lines.push('')
  lines.push(centerText(data.footerMessage || 'Thank you!', LINE_WIDTH))
  if (data.returnPolicy) {
    lines.push('')
    lines.push(centerText(data.returnPolicy, LINE_WIDTH))
  }
  lines.push('')

  const text = lines.join('\n')
  const html = generateReceiptHTML(data)

  return { text, html }
}

/**
 * Generate receipt HTML for display/email
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const itemsHtml = data.items.map((item: any) => `
    <tr>
      <td style="padding: 4px 0;">${item.name}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${item.unitPrice}</td>
      <td style="text-align: right;">${item.lineTotal}</td>
    </tr>
    ${item.discount ? `
    <tr>
      <td colspan="3" style="padding: 0 0 4px 20px; font-size: 12px; color: #059669;">Discount</td>
      <td style="text-align: right; font-size: 12px; color: #059669;">-${item.discount}</td>
    </tr>
    ` : ''}
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Courier New', monospace;
      max-width: 320px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
    }
    .business-name {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .business-info {
      font-size: 12px;
      color: #666;
    }
    .receipt-info {
      font-size: 12px;
      margin: 12px 0;
      padding: 8px 0;
      border-top: 1px dashed #ccc;
      border-bottom: 1px dashed #ccc;
    }
    table {
      width: 100%;
      font-size: 13px;
      border-collapse: collapse;
    }
    .totals {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #ccc;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .grand-total {
      font-size: 16px;
      font-weight: bold;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      margin: 8px 0;
      padding: 8px 0;
    }
    .payment-info {
      font-size: 12px;
      margin: 12px 0;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">${escapeHtml(data.businessName)}</div>
    ${data.businessAddress ? `<div class="business-info">${escapeHtml(data.businessAddress)}</div>` : ''}
    ${data.businessPhone ? `<div class="business-info">Tel: ${escapeHtml(data.businessPhone)}</div>` : ''}
    ${data.rcNumber ? `<div class="business-info">RC: ${escapeHtml(data.rcNumber)}</div>` : ''}
    ${data.tinNumber ? `<div class="business-info">TIN: ${escapeHtml(data.tinNumber)}</div>` : ''}
  </div>

  <div class="receipt-info">
    <div><strong>Receipt:</strong> ${escapeHtml(data.receiptNumber)}</div>
    <div><strong>Date:</strong> ${escapeHtml(data.date)} ${escapeHtml(data.time)}</div>
    <div><strong>Cashier:</strong> ${escapeHtml(data.staffName)}</div>
    ${data.customerName ? `<div><strong>Customer:</strong> ${escapeHtml(data.customerName)}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr style="border-bottom: 1px solid #ccc;">
        <th style="text-align: left; padding-bottom: 8px;">Item</th>
        <th style="text-align: center; padding-bottom: 8px;">Qty</th>
        <th style="text-align: right; padding-bottom: 8px;">Price</th>
        <th style="text-align: right; padding-bottom: 8px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${escapeHtml(data.subtotal)}</span>
    </div>
    ${parseAmount(data.discount) > 0 ? `
    <div class="total-row" style="color: #059669;">
      <span>Discount</span>
      <span>-${escapeHtml(data.discount)}</span>
    </div>
    ` : ''}
    <div class="total-row">
      <span>VAT (${escapeHtml(data.taxRate)})</span>
      <span>${escapeHtml(data.tax)}</span>
    </div>
    <div class="total-row grand-total">
      <span>TOTAL</span>
      <span>${escapeHtml(data.total)}</span>
    </div>
  </div>

  <div class="payment-info">
    <div><strong>Payment:</strong> ${escapeHtml(data.paymentMethod)}</div>
    ${data.amountTendered ? `
    <div>Tendered: ${escapeHtml(data.amountTendered)}</div>
    <div>Change: ${escapeHtml(data.changeDue || '₦0.00')}</div>
    ` : ''}
    ${data.transferReference ? `<div>Ref: ${escapeHtml(data.transferReference)}</div>` : ''}
  </div>

  <div class="footer">
    <p>${escapeHtml(data.footerMessage || 'Thank you!')}</p>
    ${data.returnPolicy ? `<p style="font-size: 10px;">${escapeHtml(data.returnPolicy)}</p>` : ''}
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate SMS-friendly receipt (short format)
 */
export function generateSMSReceipt(data: ReceiptData): string {
  const lines = [
    `${data.businessName}`,
    `Receipt: ${data.receiptNumber}`,
    `Date: ${data.date}`,
    `Total: ${data.total}`,
    `Payment: ${data.paymentMethod}`,
  ]

  if (data.items.length <= 3) {
    lines.splice(2, 0, ...data.items.map((i: any) => `${i.quantity}x ${i.name}: ${i.lineTotal}`))
  } else {
    lines.splice(2, 0, `${data.items.length} items`)
  }

  lines.push(data.footerMessage || 'Thank you!')

  return lines.join('\n')
}

// =============================================================================
// HELPERS
// =============================================================================

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    BANK_TRANSFER: 'Bank Transfer',
    MOBILE_MONEY: 'Mobile Money',
    POS_TERMINAL: 'POS Terminal',
    WALLET: 'Store Credit',
    SPLIT: 'Split Payment',
  }
  return labels[method] || method
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2))
  return ' '.repeat(padding) + text
}

function rightAlign(text: string, width: number): string {
  const padding = Math.max(0, width - text.length)
  return ' '.repeat(padding) + text
}

function formatLine(label: string, value: string, width: number): string {
  const spacer = width - label.length - value.length
  return label + ' '.repeat(Math.max(1, spacer)) + value
}

function parseAmount(formatted: string): number {
  return parseFloat(formatted.replace(/[₦,]/g, '')) || 0
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
