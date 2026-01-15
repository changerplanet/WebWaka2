export type ReceiptType = 'POS_SALE' | 'PARKHUB_TICKET' | 'REFUND' | 'VOID';

export type ReceiptSyncStatus = 'SYNCED' | 'PENDING_SYNC' | 'SYNC_FAILED';

export type ReceiptDeliveryChannel = 'ON_SCREEN' | 'THERMAL_PRINT' | 'WHATSAPP' | 'EMAIL' | 'QR_DOWNLOAD';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'COD' | 'SPLIT';

export interface ReceiptItem {
  itemType: 'PRODUCT' | 'TICKET' | 'SERVICE' | 'FEE';
  productId?: string;
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  lineTotal: number;
  seatNumber?: string;
  passengerName?: string;
}

export interface ReceiptBusinessInfo {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessTaxId?: string;
}

export interface ReceiptCustomerInfo {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface ReceiptStaffInfo {
  staffId: string;
  staffName: string;
}

export interface ReceiptParkHubInfo {
  routeId?: string;
  routeName?: string;
  tripId?: string;
  tripNumber?: string;
  seatNumbers?: string[];
  departureMode?: 'WHEN_FULL' | 'SCHEDULED' | 'HYBRID';
  manifestId?: string;
}

export interface ReceiptPaymentInfo {
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeGiven?: number;
  paymentReference?: string;
}

export interface GeneratePosReceiptInput {
  tenantId: string;
  locationId: string;
  saleId: string;
  business: ReceiptBusinessInfo;
  customer?: ReceiptCustomerInfo;
  staff: ReceiptStaffInfo;
  items: ReceiptItem[];
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  roundingAmount?: number;
  roundingMode?: string;
  grandTotal: number;
  payment: ReceiptPaymentInfo;
  transactionDate?: Date;
  isDemo?: boolean;
  offlineId?: string;
  notes?: string;
}

export interface GenerateParkHubReceiptInput {
  tenantId: string;
  parkId: string;
  queueId?: string;
  ticketId?: string;
  business: ReceiptBusinessInfo;
  customer?: ReceiptCustomerInfo;
  staff: ReceiptStaffInfo;
  parkHub: ReceiptParkHubInfo;
  items: ReceiptItem[];
  subtotal: number;
  discountTotal?: number;
  roundingAmount?: number;
  roundingMode?: string;
  grandTotal: number;
  payment: ReceiptPaymentInfo;
  transactionDate?: Date;
  isDemo?: boolean;
  offlineId?: string;
  notes?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  receiptType: ReceiptType;
  syncStatus: ReceiptSyncStatus;
  offlineId?: string;
  sourceType: string;
  sourceId: string;
  business: ReceiptBusinessInfo;
  customer?: ReceiptCustomerInfo;
  staff: ReceiptStaffInfo;
  parkHub?: ReceiptParkHubInfo;
  items: ReceiptItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundingAmount: number;
  roundingMode?: string;
  grandTotal: number;
  currency: string;
  payment: ReceiptPaymentInfo;
  transactionDate: Date;
  isDemo: boolean;
  isVerified: boolean;
  verificationQrCode?: string;
  notes?: string;
  createdAt: Date;
}

export interface ReceiptDelivery {
  id: string;
  receiptId: string;
  channel: ReceiptDeliveryChannel;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  printerType?: string;
  printerName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  messageId?: string;
  errorMessage?: string;
  initiatedById?: string;
  initiatedByName?: string;
  createdAt: Date;
}

export interface DeliverReceiptInput {
  receiptId: string;
  channel: ReceiptDeliveryChannel;
  printerType?: 'BLUETOOTH' | 'WEBUSB' | 'USB';
  printerName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  initiatedById?: string;
  initiatedByName?: string;
}

export interface ThermalPrintData {
  receiptNumber: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  transactionDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  roundingAmount?: number;
  grandTotal: number;
  paymentMethod: string;
  amountTendered?: number;
  changeGiven?: number;
  staffName: string;
  customerName?: string;
  syncStatus: ReceiptSyncStatus;
  isDemo: boolean;
  qrCodeUrl?: string;
  parkHubInfo?: {
    routeName?: string;
    tripNumber?: string;
    seatNumbers?: string[];
    departureMode?: string;
  };
}

export interface ReceiptVerification {
  receiptId: string;
  receiptNumber: string;
  isValid: boolean;
  verifiedAt: Date;
  businessName: string;
  grandTotal: number;
  transactionDate: Date;
  syncStatus: ReceiptSyncStatus;
}
