/**
 * Click-to-WhatsApp Support Actions
 * Wave 2.1: WhatsApp Integration
 * 
 * Generates WhatsApp deep links for support and contact actions.
 * No automation - user-initiated actions only.
 */

export interface ClickToWhatsAppConfig {
  supportNumber: string;
  businessName: string;
  defaultMessage?: string;
}

export interface WhatsAppLinkOptions {
  phoneNumber: string;
  message?: string;
  includeOrderNumber?: string;
  includeTicketNumber?: string;
}

export class ClickToWhatsAppService {
  private config: ClickToWhatsAppConfig;

  constructor(config: ClickToWhatsAppConfig) {
    this.config = config;
  }

  generateSupportLink(options?: { orderNumber?: string; issue?: string }): string {
    let message = `Hi ${this.config.businessName}, I need help`;

    if (options?.orderNumber) {
      message += ` with order ${options.orderNumber}`;
    }

    if (options?.issue) {
      message += `: ${options.issue}`;
    }

    return this.generateLink({
      phoneNumber: this.config.supportNumber,
      message,
    });
  }

  generateVendorContactLink(options: {
    vendorPhone: string;
    vendorName: string;
    orderNumber?: string;
  }): string {
    let message = `Hi ${options.vendorName}`;

    if (options.orderNumber) {
      message += `, I'm inquiring about order ${options.orderNumber}`;
    }

    return this.generateLink({
      phoneNumber: options.vendorPhone,
      message,
    });
  }

  generateDriverContactLink(options: {
    driverPhone: string;
    tripNumber: string;
    passengerName: string;
  }): string {
    const message = `Hi, I'm ${options.passengerName} traveling on trip ${options.tripNumber}`;

    return this.generateLink({
      phoneNumber: options.driverPhone,
      message,
    });
  }

  generateOrderInquiryLink(orderNumber: string): string {
    return this.generateSupportLink({
      orderNumber,
      issue: 'order inquiry',
    });
  }

  generateDeliveryHelpLink(orderNumber: string): string {
    return this.generateSupportLink({
      orderNumber,
      issue: 'delivery issue',
    });
  }

  generateRefundRequestLink(orderNumber: string): string {
    return this.generateSupportLink({
      orderNumber,
      issue: 'refund request',
    });
  }

  generateParkHubSupportLink(ticketNumber: string): string {
    const message = `Hi ${this.config.businessName}, I need help with ticket ${ticketNumber}`;

    return this.generateLink({
      phoneNumber: this.config.supportNumber,
      message,
    });
  }

  private generateLink(options: WhatsAppLinkOptions): string {
    const phoneNumber = this.formatPhoneNumber(options.phoneNumber);
    const encodedMessage = encodeURIComponent(options.message || '');

    return `https://wa.me/${phoneNumber}${options.message ? `?text=${encodedMessage}` : ''}`;
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    }

    if (!cleaned.startsWith('234') && cleaned.length === 10) {
      cleaned = '234' + cleaned;
    }

    return cleaned;
  }

  generateWebLink(options: WhatsAppLinkOptions): string {
    const phoneNumber = this.formatPhoneNumber(options.phoneNumber);
    const encodedMessage = encodeURIComponent(options.message || '');

    return `https://web.whatsapp.com/send?phone=${phoneNumber}${
      options.message ? `&text=${encodedMessage}` : ''
    }`;
  }

  generateAPILink(options: WhatsAppLinkOptions): string {
    const phoneNumber = this.formatPhoneNumber(options.phoneNumber);
    const encodedMessage = encodeURIComponent(options.message || '');

    return `https://api.whatsapp.com/send?phone=${phoneNumber}${
      options.message ? `&text=${encodedMessage}` : ''
    }`;
  }
}

export function createClickToWhatsApp(
  supportNumber: string,
  businessName: string
): ClickToWhatsAppService {
  return new ClickToWhatsAppService({
    supportNumber,
    businessName,
  });
}

export function getDefaultSupportLink(tenantName?: string): string {
  const supportNumber = process.env.WHATSAPP_SUPPORT_NUMBER || '2348000000000';
  const businessName = tenantName || 'Support';

  const service = createClickToWhatsApp(supportNumber, businessName);
  return service.generateSupportLink();
}
