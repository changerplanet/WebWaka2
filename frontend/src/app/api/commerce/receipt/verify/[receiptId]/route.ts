import { NextRequest, NextResponse } from 'next/server';
import { verifyReceipt } from '@/lib/commerce/receipt/receipt-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await params;
    
    const verification = await verifyReceipt(receiptId);
    
    if (!verification) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ verification });
  } catch (error) {
    console.error('[Receipt Verify API] Error:', error);
    return NextResponse.json(
      { error: 'Unable to verify receipt' },
      { status: 500 }
    );
  }
}
