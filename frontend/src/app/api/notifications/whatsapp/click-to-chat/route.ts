/**
 * Click-to-WhatsApp API
 * Wave 2.1: WhatsApp Integration
 * 
 * Generates WhatsApp deep links for support actions.
 * User-initiated only - no automation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createClickToWhatsApp } from '@/lib/notifications/whatsapp/click-to-whatsapp';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { action, orderNumber, ticketNumber, vendorPhone, vendorName, issue } = body;

    const supportNumber = process.env.WHATSAPP_SUPPORT_NUMBER || '2348000000000';

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    const businessName = tenant?.name || 'Support';
    const clickToWhatsApp = createClickToWhatsApp(supportNumber, businessName);

    let link: string;

    switch (action) {
      case 'support':
        link = clickToWhatsApp.generateSupportLink({ orderNumber, issue });
        break;

      case 'order_inquiry':
        if (!orderNumber) {
          return NextResponse.json(
            { error: 'orderNumber required for order_inquiry' },
            { status: 400 }
          );
        }
        link = clickToWhatsApp.generateOrderInquiryLink(orderNumber);
        break;

      case 'delivery_help':
        if (!orderNumber) {
          return NextResponse.json(
            { error: 'orderNumber required for delivery_help' },
            { status: 400 }
          );
        }
        link = clickToWhatsApp.generateDeliveryHelpLink(orderNumber);
        break;

      case 'refund_request':
        if (!orderNumber) {
          return NextResponse.json(
            { error: 'orderNumber required for refund_request' },
            { status: 400 }
          );
        }
        link = clickToWhatsApp.generateRefundRequestLink(orderNumber);
        break;

      case 'parkhub_support':
        if (!ticketNumber) {
          return NextResponse.json(
            { error: 'ticketNumber required for parkhub_support' },
            { status: 400 }
          );
        }
        link = clickToWhatsApp.generateParkHubSupportLink(ticketNumber);
        break;

      case 'vendor_contact':
        if (!vendorPhone || !vendorName) {
          return NextResponse.json(
            { error: 'vendorPhone and vendorName required for vendor_contact' },
            { status: 400 }
          );
        }
        link = clickToWhatsApp.generateVendorContactLink({
          vendorPhone,
          vendorName,
          orderNumber,
        });
        break;

      default:
        link = clickToWhatsApp.generateSupportLink();
    }

    return NextResponse.json({
      success: true,
      link,
      action,
    });
  } catch (error) {
    console.error('Click-to-WhatsApp API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate WhatsApp link' },
      { status: 500 }
    );
  }
}
