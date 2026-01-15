/**
 * WhatsApp Notification Service
 * Wave 2.1: WhatsApp Integration
 * 
 * Provider-agnostic WhatsApp messaging with demo-safe fallback.
 * Transactional messages only - no automations, no AI, no marketing.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  WhatsAppProvider,
  WhatsAppConfig,
  SendMessageRequest,
  SendMessageResult,
  MessageType,
  OrderConfirmationData,
  POSReceiptData,
  VendorOrderAlertData,
  ParkHubTicketData,
  MessageLog,
} from './whatsapp-types';

const WHATSAPP_API_VERSION = 'v18.0';

export class WhatsAppService {
  private config: WhatsAppConfig;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.config = this.loadConfig();
  }

  private loadConfig(): WhatsAppConfig {
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (metaPhoneId && metaToken) {
      return {
        provider: 'META_CLOUD',
        enabled: true,
        metaCloud: {
          phoneNumberId: metaPhoneId,
          accessToken: metaToken,
          apiVersion: WHATSAPP_API_VERSION,
        },
      };
    }

    if (twilioSid && twilioToken && twilioFrom) {
      return {
        provider: 'TWILIO',
        enabled: true,
        twilio: {
          accountSid: twilioSid,
          authToken: twilioToken,
          fromNumber: twilioFrom,
        },
      };
    }

    return {
      provider: 'DEMO',
      enabled: false,
    };
  }

  isConfigured(): boolean {
    return this.config.enabled && this.config.provider !== 'DEMO';
  }

  getProvider(): WhatsAppProvider {
    return this.config.provider;
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    const { to, messageType, textBody } = request;

    try {
      let result: SendMessageResult;

      if (!this.isConfigured()) {
        result = this.createDemoResult();
        console.log('[WhatsApp DEMO MODE] Message would be sent:', {
          to: request.to,
          messageType: request.messageType,
          textBody: request.textBody?.substring(0, 100),
          templateName: request.templateName,
          timestamp: new Date().toISOString(),
        });
      } else {
        switch (this.config.provider) {
          case 'META_CLOUD':
            result = await this.sendViaMetaCloud(request);
            break;
          case 'TWILIO':
            result = await this.sendViaTwilio(request);
            break;
          default:
            result = this.createDemoResult();
        }
      }

      await this.logMessage(request, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failResult: SendMessageResult = {
        success: false,
        provider: this.config.provider,
        timestamp: new Date(),
        error: errorMessage,
      };
      await this.logMessage(request, failResult);
      return failResult;
    }
  }

  private createDemoResult(): SendMessageResult {
    return {
      success: true,
      messageId: `demo-${Date.now()}`,
      provider: 'DEMO',
      timestamp: new Date(),
      demoMode: true,
    };
  }

  private async sendViaMetaCloud(request: SendMessageRequest): Promise<SendMessageResult> {
    const { metaCloud } = this.config;
    if (!metaCloud) {
      throw new Error('Meta Cloud API not configured');
    }

    const url = `https://graph.facebook.com/${metaCloud.apiVersion}/${metaCloud.phoneNumberId}/messages`;

    const payload = request.templateName
      ? {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(request.to),
          type: 'template',
          template: {
            name: request.templateName,
            language: { code: 'en' },
            components: request.templateParams
              ? [
                  {
                    type: 'body',
                    parameters: Object.values(request.templateParams).map((value) => ({
                      type: 'text',
                      text: value,
                    })),
                  },
                ]
              : [],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(request.to),
          type: 'text',
          text: { body: request.textBody },
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaCloud.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message via Meta Cloud');
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      provider: 'META_CLOUD',
      timestamp: new Date(),
    };
  }

  private async sendViaTwilio(request: SendMessageRequest): Promise<SendMessageResult> {
    const { twilio } = this.config;
    if (!twilio) {
      throw new Error('Twilio not configured');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
    const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64');

    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${twilio.fromNumber}`);
    formData.append('To', `whatsapp:${this.formatPhoneNumber(request.to)}`);
    formData.append('Body', request.textBody || '');

    if (request.mediaUrl) {
      formData.append('MediaUrl', request.mediaUrl);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message via Twilio');
    }

    return {
      success: true,
      messageId: data.sid,
      provider: 'TWILIO',
      timestamp: new Date(),
    };
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    }
    return cleaned;
  }

  private async logMessage(
    request: SendMessageRequest,
    result: SendMessageResult
  ): Promise<void> {
    try {
      await prisma.whatsapp_message_log.create({
        data: {
          tenantId: this.tenantId,
          to: request.to,
          messageType: request.messageType,
          provider: result.provider,
          status: result.demoMode ? 'DEMO' : result.success ? 'SENT' : 'FAILED',
          messageId: result.messageId,
          error: result.error,
          payload: JSON.parse(JSON.stringify(request)) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error('Failed to log WhatsApp message:', error);
    }
  }

  async sendOrderConfirmation(
    to: string,
    data: OrderConfirmationData
  ): Promise<SendMessageResult> {
    const message = this.formatOrderConfirmation(data);
    return this.sendMessage({
      to,
      messageType: 'ORDER_CONFIRMATION',
      textBody: message,
    });
  }

  async sendPOSReceipt(to: string, data: POSReceiptData): Promise<SendMessageResult> {
    const message = this.formatPOSReceipt(data);
    return this.sendMessage({
      to,
      messageType: 'POS_RECEIPT',
      textBody: message,
    });
  }

  async sendVendorOrderAlert(
    to: string,
    data: VendorOrderAlertData
  ): Promise<SendMessageResult> {
    const message = this.formatVendorOrderAlert(data);
    return this.sendMessage({
      to,
      messageType: 'VENDOR_ORDER_ALERT',
      textBody: message,
    });
  }

  async sendParkHubTicket(
    to: string,
    data: ParkHubTicketData
  ): Promise<SendMessageResult> {
    const message = this.formatParkHubTicket(data);
    return this.sendMessage({
      to,
      messageType: 'PARKHUB_TICKET',
      textBody: message,
    });
  }

  private formatOrderConfirmation(data: OrderConfirmationData): string {
    const lines = [
      `✅ Order Confirmed!`,
      ``,
      `Order: ${data.orderNumber}`,
      `Customer: ${data.customerName}`,
      `Items: ${data.itemCount}`,
      `Total: ${data.currency} ${data.totalAmount.toLocaleString()}`,
    ];

    if (data.estimatedDelivery) {
      lines.push(`Delivery: ${data.estimatedDelivery}`);
    }

    if (data.trackingUrl) {
      lines.push(``, `Track your order: ${data.trackingUrl}`);
    }

    lines.push(``, `Thank you for your order!`);

    return lines.join('\n');
  }

  private formatPOSReceipt(data: POSReceiptData): string {
    const lines = [
      `🧾 ${data.storeName}`,
      `Receipt: ${data.receiptNumber}`,
      `Date: ${data.timestamp.toLocaleDateString()}`,
      ``,
      `--- Items ---`,
    ];

    data.items.forEach((item) => {
      lines.push(`${item.name} x${item.quantity} - ₦${item.price.toLocaleString()}`);
    });

    lines.push(
      ``,
      `Subtotal: ₦${data.subtotal.toLocaleString()}`,
      `Tax: ₦${data.tax.toLocaleString()}`,
      `*Total: ₦${data.total.toLocaleString()}*`,
      ``,
      `Payment: ${data.paymentMethod}`
    );

    if (data.cashierName) {
      lines.push(`Served by: ${data.cashierName}`);
    }

    lines.push(``, `Thank you for shopping with us!`);

    return lines.join('\n');
  }

  private formatVendorOrderAlert(data: VendorOrderAlertData): string {
    const lines = [
      `🔔 New Order Alert!`,
      ``,
      `Hi ${data.vendorName},`,
      ``,
      `You have a new order:`,
      `Order: ${data.orderNumber}`,
      `Items: ${data.itemCount}`,
      `Value: ${data.currency} ${data.orderValue.toLocaleString()}`,
    ];

    if (data.customerLocation) {
      lines.push(`Delivery to: ${data.customerLocation}`);
    }

    if (data.dashboardUrl) {
      lines.push(``, `View details: ${data.dashboardUrl}`);
    }

    lines.push(``, `Please confirm and prepare for dispatch.`);

    return lines.join('\n');
  }

  private formatParkHubTicket(data: ParkHubTicketData): string {
    const lines = [
      `🎫 Your Ticket`,
      ``,
      `Ticket: ${data.ticketNumber}`,
      `Trip: ${data.tripNumber}`,
      `Passenger: ${data.passengerName}`,
      `Route: ${data.route}`,
    ];

    if (data.seatNumber) {
      lines.push(`Seat: ${data.seatNumber}`);
    }

    if (data.departureTime) {
      lines.push(`Departure: ${data.departureTime.toLocaleString()}`);
    }

    lines.push(``, `Price: ${data.currency} ${data.price.toLocaleString()}`);

    if (data.qrCodeUrl) {
      lines.push(``, `Show this QR at boarding: ${data.qrCodeUrl}`);
    }

    lines.push(``, `Safe travels!`);

    return lines.join('\n');
  }
}

export function createWhatsAppService(tenantId: string): WhatsAppService {
  return new WhatsAppService(tenantId);
}
