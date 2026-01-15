import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createReceiptService } from '@/lib/commerce/receipt/receipt-service';
import type { GeneratePosReceiptInput, GenerateParkHubReceiptInput } from '@/lib/commerce/receipt/types';

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
    const { action } = body;
    
    const receiptService = createReceiptService(tenantId);
    
    switch (action) {
      case 'generate_pos': {
        const input: GeneratePosReceiptInput = {
          tenantId,
          locationId: body.locationId,
          saleId: body.saleId,
          business: body.business,
          customer: body.customer,
          staff: body.staff || {
            staffId: session.user.id,
            staffName: session.user.name || 'Staff',
          },
          items: body.items || [],
          subtotal: body.subtotal,
          discountTotal: body.discountTotal,
          taxTotal: body.taxTotal,
          roundingAmount: body.roundingAmount,
          roundingMode: body.roundingMode,
          grandTotal: body.grandTotal,
          payment: body.payment,
          transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
          isDemo: body.isDemo,
          offlineId: body.offlineId,
          notes: body.notes,
        };
        
        const receipt = await receiptService.generatePosReceipt(input);
        return NextResponse.json({ success: true, receipt });
      }
      
      case 'generate_parkhub': {
        const input: GenerateParkHubReceiptInput = {
          tenantId,
          parkId: body.parkId,
          queueId: body.queueId,
          ticketId: body.ticketId,
          business: body.business,
          customer: body.customer,
          staff: body.staff || {
            staffId: session.user.id,
            staffName: session.user.name || 'Agent',
          },
          parkHub: body.parkHub,
          items: body.items || [],
          subtotal: body.subtotal,
          discountTotal: body.discountTotal,
          roundingAmount: body.roundingAmount,
          roundingMode: body.roundingMode,
          grandTotal: body.grandTotal,
          payment: body.payment,
          transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
          isDemo: body.isDemo,
          offlineId: body.offlineId,
          notes: body.notes,
        };
        
        const receipt = await receiptService.generateParkHubReceipt(input);
        return NextResponse.json({ success: true, receipt });
      }
      
      case 'record_delivery': {
        const delivery = await receiptService.recordDelivery({
          receiptId: body.receiptId,
          channel: body.channel,
          printerType: body.printerType,
          printerName: body.printerName,
          recipientPhone: body.recipientPhone,
          recipientEmail: body.recipientEmail,
          initiatedById: session.user.id,
          initiatedByName: session.user.name || undefined,
        });
        return NextResponse.json({ success: true, delivery });
      }
      
      case 'sync': {
        const receipt = await receiptService.syncReceipt(body.receiptId);
        return NextResponse.json({ success: true, receipt });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate_pos, generate_parkhub, record_delivery, sync' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Receipt API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
    
    const { searchParams } = new URL(request.url);
    const receiptService = createReceiptService(tenantId);
    
    const receiptNumber = searchParams.get('receiptNumber');
    if (receiptNumber) {
      const receipt = await receiptService.getReceiptByNumber(receiptNumber);
      if (!receipt) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }
      return NextResponse.json({ receipt });
    }
    
    const sourceType = searchParams.get('sourceType');
    const sourceId = searchParams.get('sourceId');
    if (sourceType && sourceId) {
      const receipts = await receiptService.getReceiptsBySource(sourceType, sourceId);
      return NextResponse.json({ receipts });
    }
    
    const result = await receiptService.listReceipts({
      receiptType: searchParams.get('receiptType') || undefined,
      syncStatus: searchParams.get('syncStatus') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      staffId: searchParams.get('staffId') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Receipt API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
