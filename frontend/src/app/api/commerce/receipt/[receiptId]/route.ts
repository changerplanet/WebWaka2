import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createReceiptService } from '@/lib/commerce/receipt/receipt-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active tenant' }, { status: 400 });
    }
    
    const { receiptId } = await params;
    const { searchParams } = new URL(request.url);
    const receiptService = createReceiptService(tenantId);
    
    const receipt = await receiptService.getReceipt(receiptId);
    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }
    
    const format = searchParams.get('format');
    
    if (format === 'thermal') {
      const thermalData = receiptService.formatForThermalPrint(receipt);
      return NextResponse.json({ receipt, thermalData });
    }
    
    if (format === 'deliveries') {
      const deliveries = await receiptService.getDeliveryHistory(receiptId);
      return NextResponse.json({ receipt, deliveries });
    }
    
    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('[Receipt API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
