/**
 * Commerce → WhatsApp Integration
 * Wave 2.1: WhatsApp Integration
 * 
 * Helper functions to send WhatsApp notifications from commerce modules.
 * All functions are demo-safe - they log when WhatsApp is not configured.
 */

import { createWhatsAppService } from './whatsapp-service';
import {
  OrderConfirmationData,
  POSReceiptData,
  VendorOrderAlertData,
  ParkHubTicketData,
} from './whatsapp-types';

export async function notifyOrderConfirmation(
  tenantId: string,
  customerPhone: string,
  orderNumber: string,
  customerName: string,
  itemCount: number,
  totalAmount: number,
  currency: string = 'NGN',
  estimatedDelivery?: string
): Promise<boolean> {
  try {
    const service = createWhatsAppService(tenantId);
    const result = await service.sendOrderConfirmation(customerPhone, {
      orderNumber,
      customerName,
      itemCount,
      totalAmount,
      currency,
      estimatedDelivery,
    });
    return result.success;
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    return false;
  }
}

export async function notifyVendorNewOrder(
  tenantId: string,
  vendorPhone: string,
  vendorName: string,
  orderNumber: string,
  orderId: string,
  itemCount: number,
  orderValue: number,
  currency: string = 'NGN',
  customerLocation?: string
): Promise<boolean> {
  try {
    const service = createWhatsAppService(tenantId);
    const result = await service.sendVendorOrderAlert(vendorPhone, {
      orderId,
      orderNumber,
      vendorName,
      itemCount,
      orderValue,
      currency,
      customerLocation,
    });
    return result.success;
  } catch (error) {
    console.error('Failed to send vendor order alert:', error);
    return false;
  }
}

export async function sendPOSReceiptToCustomer(
  tenantId: string,
  customerPhone: string,
  receiptNumber: string,
  storeName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  subtotal: number,
  tax: number,
  total: number,
  paymentMethod: string,
  cashierName?: string
): Promise<boolean> {
  try {
    const service = createWhatsAppService(tenantId);
    const result = await service.sendPOSReceipt(customerPhone, {
      receiptNumber,
      storeName,
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      cashierName,
      timestamp: new Date(),
    });
    return result.success;
  } catch (error) {
    console.error('Failed to send POS receipt:', error);
    return false;
  }
}

export async function sendParkHubTicketToPassenger(
  tenantId: string,
  passengerPhone: string,
  ticketNumber: string,
  tripNumber: string,
  passengerName: string,
  route: string,
  price: number,
  currency: string = 'NGN',
  departureTime?: Date,
  seatNumber?: string,
  qrCodeUrl?: string
): Promise<boolean> {
  try {
    const service = createWhatsAppService(tenantId);
    const result = await service.sendParkHubTicket(passengerPhone, {
      ticketNumber,
      tripNumber,
      passengerName,
      route,
      price,
      currency,
      departureTime,
      seatNumber,
      qrCodeUrl,
    });
    return result.success;
  } catch (error) {
    console.error('Failed to send ParkHub ticket:', error);
    return false;
  }
}

export async function checkWhatsAppStatus(tenantId: string): Promise<{
  configured: boolean;
  provider: string;
  demoMode: boolean;
}> {
  const service = createWhatsAppService(tenantId);
  return {
    configured: service.isConfigured(),
    provider: service.getProvider(),
    demoMode: !service.isConfigured(),
  };
}
