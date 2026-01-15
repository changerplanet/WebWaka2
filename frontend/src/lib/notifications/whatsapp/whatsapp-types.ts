/**
 * WhatsApp Notification Types
 * Wave 2.1: WhatsApp Integration
 * 
 * Type definitions for WhatsApp messaging service.
 * Transactional messages only - no marketing/broadcast.
 */

export type WhatsAppProvider = 'META_CLOUD' | 'TWILIO' | 'DEMO';

export type MessageType = 
  | 'ORDER_CONFIRMATION'
  | 'POS_RECEIPT'
  | 'VENDOR_ORDER_ALERT'
  | 'PARKHUB_TICKET'
  | 'PAYMENT_CONFIRMATION'
  | 'DELIVERY_UPDATE';

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  enabled: boolean;
  metaCloud?: {
    phoneNumberId: string;
    accessToken: string;
    apiVersion: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export interface SendMessageRequest {
  to: string;
  messageType: MessageType;
  templateName?: string;
  templateParams?: Record<string, string>;
  textBody?: string;
  mediaUrl?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  provider: WhatsAppProvider;
  timestamp: Date;
  error?: string;
  demoMode?: boolean;
}

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  currency: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
}

export interface POSReceiptData {
  receiptNumber: string;
  storeName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierName?: string;
  timestamp: Date;
}

export interface VendorOrderAlertData {
  orderId: string;
  orderNumber: string;
  vendorName: string;
  itemCount: number;
  orderValue: number;
  currency: string;
  customerLocation?: string;
  dashboardUrl?: string;
}

export interface ParkHubTicketData {
  ticketNumber: string;
  tripNumber: string;
  passengerName: string;
  route: string;
  departureTime?: Date;
  seatNumber?: string;
  price: number;
  currency: string;
  qrCodeUrl?: string;
}

export interface MessageLog {
  id: string;
  tenantId: string;
  to: string;
  messageType: MessageType;
  provider: WhatsAppProvider;
  status: 'SENT' | 'FAILED' | 'DEMO';
  messageId?: string;
  error?: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}
