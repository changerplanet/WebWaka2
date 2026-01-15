import type { ThermalPrintData } from './types';

const PAPER_WIDTH = 32;

function centerText(text: string, width: number = PAPER_WIDTH): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function leftRight(left: string, right: string, width: number = PAPER_WIDTH): string {
  const space = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, space)) + right;
}

function divider(char: string = '-', width: number = PAPER_WIDTH): string {
  return char.repeat(width);
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateThermalReceiptText(data: ThermalPrintData): string {
  const lines: string[] = [];
  
  lines.push(centerText(data.businessName.toUpperCase()));
  if (data.businessAddress) {
    lines.push(centerText(data.businessAddress));
  }
  if (data.businessPhone) {
    lines.push(centerText(`Tel: ${data.businessPhone}`));
  }
  
  lines.push(divider('='));
  
  if (data.parkHubInfo?.routeName) {
    lines.push(centerText('*** TICKET ***'));
    lines.push('');
    lines.push(`Route: ${data.parkHubInfo.routeName}`);
    if (data.parkHubInfo.tripNumber) {
      lines.push(`Trip: ${data.parkHubInfo.tripNumber}`);
    }
    if (data.parkHubInfo.seatNumbers && data.parkHubInfo.seatNumbers.length > 0) {
      lines.push(`Seat(s): ${data.parkHubInfo.seatNumbers.join(', ')}`);
    }
    if (data.parkHubInfo.departureMode) {
      lines.push(`Departure: ${data.parkHubInfo.departureMode}`);
    }
    lines.push('');
    lines.push(divider('-'));
  }
  
  lines.push(`Receipt: ${data.receiptNumber}`);
  lines.push(`Date: ${data.transactionDate}`);
  lines.push(`Staff: ${data.staffName}`);
  if (data.customerName) {
    lines.push(`Customer: ${data.customerName}`);
  }
  
  lines.push(divider('-'));
  
  for (const item of data.items) {
    const qtyPrice = `${item.quantity} x ${formatAmount(item.unitPrice)}`;
    lines.push(item.description.substring(0, PAPER_WIDTH));
    lines.push(leftRight(`  ${qtyPrice}`, formatAmount(item.lineTotal)));
  }
  
  lines.push(divider('-'));
  
  lines.push(leftRight('Subtotal:', formatAmount(data.subtotal)));
  
  if (data.discountTotal && data.discountTotal > 0) {
    lines.push(leftRight('Discount:', `-${formatAmount(data.discountTotal)}`));
  }
  
  if (data.taxTotal && data.taxTotal > 0) {
    lines.push(leftRight('Tax:', formatAmount(data.taxTotal)));
  }
  
  if (data.roundingAmount && data.roundingAmount !== 0) {
    const roundingLabel = data.roundingAmount > 0 ? 'Rounding (+):' : 'Rounding (-):';
    lines.push(leftRight(roundingLabel, formatAmount(Math.abs(data.roundingAmount))));
  }
  
  lines.push(divider('='));
  lines.push(leftRight('TOTAL:', `NGN ${formatAmount(data.grandTotal)}`));
  lines.push(divider('='));
  
  lines.push('');
  lines.push(leftRight('Paid by:', data.paymentMethod));
  
  if (data.amountTendered && data.amountTendered > 0) {
    lines.push(leftRight('Tendered:', formatAmount(data.amountTendered)));
  }
  if (data.changeGiven && data.changeGiven > 0) {
    lines.push(leftRight('Change:', formatAmount(data.changeGiven)));
  }
  
  lines.push('');
  lines.push(divider('-'));
  
  if (data.syncStatus === 'PENDING_SYNC') {
    lines.push(centerText('*** OFFLINE - PENDING SYNC ***'));
  } else if (data.syncStatus === 'SYNCED') {
    lines.push(centerText('*** VERIFIED ***'));
  }
  
  if (data.isDemo) {
    lines.push(centerText('=== DEMO RECEIPT ==='));
  }
  
  lines.push('');
  
  if (data.qrCodeUrl) {
    lines.push(centerText('Scan to verify:'));
    lines.push(centerText(data.qrCodeUrl.substring(0, PAPER_WIDTH)));
  }
  
  lines.push('');
  lines.push(centerText('Thank you!'));
  lines.push('');
  lines.push('');
  lines.push('');
  
  return lines.join('\n');
}

export interface PrinterConnection {
  type: 'BLUETOOTH' | 'WEBUSB' | 'USB';
  name: string;
  device?: any;
  connected: boolean;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  printer?: string;
}

export async function printToBluetoothPrinter(
  receiptText: string,
  printerName?: string
): Promise<PrintResult> {
  if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
    return {
      success: false,
      error: 'Bluetooth not supported in this environment',
    };
  }
  
  try {
    const serviceUuid = '000018f0-0000-1000-8000-00805f9b34fb';
    const characteristicUuid = '00002af1-0000-1000-8000-00805f9b34fb';
    
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: printerName 
        ? [{ name: printerName }]
        : [{ services: [serviceUuid] }],
      optionalServices: [serviceUuid],
    });
    
    const server = await device.gatt?.connect();
    if (!server) {
      return { success: false, error: 'Failed to connect to printer' };
    }
    
    const service = await server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptText);
    
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }
    
    return {
      success: true,
      printer: device.name || 'Bluetooth Printer',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

export async function printToWebUSBPrinter(
  receiptText: string
): Promise<PrintResult> {
  if (typeof window === 'undefined' || !('usb' in navigator)) {
    return {
      success: false,
      error: 'WebUSB not supported in this environment',
    };
  }
  
  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: [
        { vendorId: 0x0483 },
        { vendorId: 0x0456 },
        { vendorId: 0x04b8 },
      ],
    });
    
    await device.open();
    
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    await device.claimInterface(0);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptText);
    
    await device.transferOut(1, data);
    
    await device.releaseInterface(0);
    await device.close();
    
    return {
      success: true,
      printer: device.productName || 'USB Printer',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

export function generatePrintableHtml(data: ThermalPrintData): string {
  const escapeHtml = (text: string) => 
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${escapeHtml(data.receiptNumber)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10px; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .business-name { font-size: 16px; font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .divider-thick { border-top: 2px solid #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
    .item-name { font-weight: 500; }
    .item-detail { padding-left: 10px; color: #666; }
    .total-row { font-weight: bold; font-size: 14px; }
    .status { text-align: center; padding: 5px; margin: 10px 0; }
    .status.synced { background: #d1fae5; color: #047857; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .demo-banner { 
      text-align: center; 
      background: #fecaca; 
      color: #991b1b; 
      padding: 5px;
      font-weight: bold;
    }
    .qr-section { text-align: center; margin-top: 10px; }
    .footer { text-align: center; margin-top: 15px; }
    .parkhub-info { background: #f3f4f6; padding: 8px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">${escapeHtml(data.businessName)}</div>
    ${data.businessAddress ? `<div>${escapeHtml(data.businessAddress)}</div>` : ''}
    ${data.businessPhone ? `<div>Tel: ${escapeHtml(data.businessPhone)}</div>` : ''}
  </div>
  
  <div class="divider-thick"></div>`;
  
  if (data.parkHubInfo?.routeName) {
    html += `
  <div class="parkhub-info">
    <div style="text-align: center; font-weight: bold;">TICKET</div>
    <div class="row"><span>Route:</span><span>${escapeHtml(data.parkHubInfo.routeName)}</span></div>
    ${data.parkHubInfo.tripNumber ? `<div class="row"><span>Trip:</span><span>${escapeHtml(data.parkHubInfo.tripNumber)}</span></div>` : ''}
    ${data.parkHubInfo.seatNumbers?.length ? `<div class="row"><span>Seat(s):</span><span>${escapeHtml(data.parkHubInfo.seatNumbers.join(', '))}</span></div>` : ''}
    ${data.parkHubInfo.departureMode ? `<div class="row"><span>Departure:</span><span>${escapeHtml(data.parkHubInfo.departureMode)}</span></div>` : ''}
  </div>`;
  }
  
  html += `
  <div class="row"><span>Receipt:</span><span>${escapeHtml(data.receiptNumber)}</span></div>
  <div class="row"><span>Date:</span><span>${escapeHtml(data.transactionDate)}</span></div>
  <div class="row"><span>Staff:</span><span>${escapeHtml(data.staffName)}</span></div>
  ${data.customerName ? `<div class="row"><span>Customer:</span><span>${escapeHtml(data.customerName)}</span></div>` : ''}
  
  <div class="divider"></div>`;
  
  for (const item of data.items) {
    html += `
  <div class="item-name">${escapeHtml(item.description)}</div>
  <div class="row item-detail">
    <span>${item.quantity} x ₦${formatAmount(item.unitPrice)}</span>
    <span>₦${formatAmount(item.lineTotal)}</span>
  </div>`;
  }
  
  html += `
  <div class="divider"></div>
  
  <div class="row"><span>Subtotal:</span><span>₦${formatAmount(data.subtotal)}</span></div>
  ${data.discountTotal ? `<div class="row"><span>Discount:</span><span>-₦${formatAmount(data.discountTotal)}</span></div>` : ''}
  ${data.taxTotal ? `<div class="row"><span>Tax:</span><span>₦${formatAmount(data.taxTotal)}</span></div>` : ''}
  ${data.roundingAmount ? `<div class="row"><span>Rounding:</span><span>${data.roundingAmount > 0 ? '+' : ''}₦${formatAmount(data.roundingAmount)}</span></div>` : ''}
  
  <div class="divider-thick"></div>
  
  <div class="row total-row"><span>TOTAL:</span><span>₦${formatAmount(data.grandTotal)}</span></div>
  
  <div class="divider-thick"></div>
  
  <div class="row"><span>Paid by:</span><span>${escapeHtml(data.paymentMethod)}</span></div>
  ${data.amountTendered ? `<div class="row"><span>Tendered:</span><span>₦${formatAmount(data.amountTendered)}</span></div>` : ''}
  ${data.changeGiven ? `<div class="row"><span>Change:</span><span>₦${formatAmount(data.changeGiven)}</span></div>` : ''}
  
  <div class="divider"></div>
  
  <div class="status ${data.syncStatus === 'SYNCED' ? 'synced' : 'pending'}">
    ${data.syncStatus === 'SYNCED' ? 'VERIFIED' : 'OFFLINE - PENDING SYNC'}
  </div>
  
  ${data.isDemo ? '<div class="demo-banner">DEMO RECEIPT</div>' : ''}
  
  ${data.qrCodeUrl ? `
  <div class="qr-section">
    <div>Scan to verify:</div>
    <div style="font-size: 10px; word-break: break-all;">${escapeHtml(data.qrCodeUrl)}</div>
  </div>` : ''}
  
  <div class="footer">
    <div>Thank you!</div>
  </div>
  
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      Print Receipt
    </button>
  </div>
</body>
</html>`;
  
  return html;
}
