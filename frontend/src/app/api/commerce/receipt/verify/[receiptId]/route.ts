import { NextRequest, NextResponse } from 'next/server';
import { verifyReceipt, verifyReceiptPublic } from '@/lib/commerce/receipt/receipt-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    
    if (format === 'public') {
      const result = await verifyReceiptPublic(receiptId);
      
      if (!result) {
        return NextResponse.json(
          { 
            valid: false, 
            tampered: false, 
            revoked: false, 
            sourceType: 'UNKNOWN',
            verifiedAt: new Date().toISOString(),
            error: 'Unable to verify' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result);
    }
    
    const verification = await verifyReceipt(receiptId);
    
    if (!verification) {
      return NextResponse.json(
        { error: 'Unable to verify receipt' },
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
