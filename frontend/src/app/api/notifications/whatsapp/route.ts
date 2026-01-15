/**
 * WhatsApp Notifications API
 * Wave 2.1: WhatsApp Integration
 * 
 * Handles WhatsApp message sending for transactional notifications.
 * Demo-safe: logs only when WhatsApp not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createWhatsAppService } from '@/lib/notifications/whatsapp/whatsapp-service';
import {
  OrderConfirmationData,
  POSReceiptData,
  VendorOrderAlertData,
  ParkHubTicketData,
} from '@/lib/notifications/whatsapp/whatsapp-types';

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
    const { action, to, data } = body;

    if (!action || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: action, to' },
        { status: 400 }
      );
    }

    const whatsappService = createWhatsAppService(tenantId);
    let result;

    switch (action) {
      case 'order_confirmation':
        result = await whatsappService.sendOrderConfirmation(
          to,
          data as OrderConfirmationData
        );
        break;

      case 'pos_receipt':
        result = await whatsappService.sendPOSReceipt(to, data as POSReceiptData);
        break;

      case 'vendor_order_alert':
        result = await whatsappService.sendVendorOrderAlert(
          to,
          data as VendorOrderAlertData
        );
        break;

      case 'parkhub_ticket':
        result = await whatsappService.sendParkHubTicket(
          to,
          data as ParkHubTicketData
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      demoMode: result.demoMode || false,
      timestamp: result.timestamp,
      error: result.error,
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }

    const whatsappService = createWhatsAppService(tenantId);

    return NextResponse.json({
      configured: whatsappService.isConfigured(),
      provider: whatsappService.getProvider(),
      demoMode: !whatsappService.isConfigured(),
    });
  } catch (error) {
    console.error('WhatsApp status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check WhatsApp status' },
      { status: 500 }
    );
  }
}
