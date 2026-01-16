import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface OrderVerificationResult {
  valid: boolean;
  tampered: boolean;
  revoked: boolean;
  sourceType: string;
  verifiedAt: string;
  orderNumber?: string;
  status?: string;
  grandTotal?: number;
  currency?: string;
  isDemo?: boolean;
  requiresVerification?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderRef: string }> }
) {
  try {
    const { orderRef } = await params;
    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get('tenant');
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug is required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json<OrderVerificationResult>(
        {
          valid: false,
          tampered: false,
          revoked: false,
          sourceType: 'UNKNOWN',
          verifiedAt: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const isDemo = tenant.slug.toLowerCase().startsWith('demo') || 
                   tenant.name.toLowerCase().includes('demo');

    if (!isDemo && !email && !phone) {
      return NextResponse.json<OrderVerificationResult>(
        {
          valid: false,
          tampered: false,
          revoked: false,
          sourceType: 'UNKNOWN',
          verifiedAt: new Date().toISOString(),
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    const svmOrder = await prisma.svm_orders.findFirst({
      where: { tenantId: tenant.id, orderNumber: orderRef },
    });

    if (svmOrder) {
      if (!isDemo && (email || phone)) {
        const emailMatch = email && svmOrder.customerEmail?.toLowerCase() === email.toLowerCase();
        const phoneMatch = phone && normalizePhone(svmOrder.customerPhone) === normalizePhone(phone);
        if (!emailMatch && !phoneMatch) {
          return NextResponse.json<OrderVerificationResult>(
            {
              valid: false,
              tampered: false,
              revoked: false,
              sourceType: 'SVM_ORDER',
              verifiedAt: new Date().toISOString(),
            },
            { status: 404 }
          );
        }
      }

      const svmExt = svmOrder as typeof svmOrder & { verificationHash?: string | null };
      const isCancelled = svmOrder.status === 'CANCELLED';

      return NextResponse.json<OrderVerificationResult>({
        valid: !isCancelled,
        tampered: false,
        revoked: isCancelled,
        sourceType: 'SVM_ORDER',
        verifiedAt: new Date().toISOString(),
        orderNumber: svmOrder.orderNumber,
        status: svmOrder.status,
        grandTotal: Number(svmOrder.grandTotal),
        currency: svmOrder.currency,
        isDemo: (svmOrder as any).isDemo || isDemo,
      });
    }

    const mvmOrder = await prisma.mvm_parent_order.findFirst({
      where: { tenantId: tenant.id, orderNumber: orderRef },
    });

    if (mvmOrder) {
      if (!isDemo && (email || phone)) {
        const emailMatch = email && mvmOrder.customerEmail?.toLowerCase() === email.toLowerCase();
        const phoneMatch = phone && normalizePhone(mvmOrder.customerPhone) === normalizePhone(phone);
        if (!emailMatch && !phoneMatch) {
          return NextResponse.json<OrderVerificationResult>(
            {
              valid: false,
              tampered: false,
              revoked: false,
              sourceType: 'MVM_ORDER',
              verifiedAt: new Date().toISOString(),
            },
            { status: 404 }
          );
        }
      }

      const isCancelled = mvmOrder.status === 'CANCELLED';

      return NextResponse.json<OrderVerificationResult>({
        valid: !isCancelled,
        tampered: false,
        revoked: isCancelled,
        sourceType: 'MVM_PARENT_ORDER',
        verifiedAt: new Date().toISOString(),
        orderNumber: mvmOrder.orderNumber,
        status: mvmOrder.status,
        grandTotal: Number(mvmOrder.grandTotal),
        currency: mvmOrder.currency,
        isDemo: (mvmOrder as any).isDemo || isDemo,
      });
    }

    return NextResponse.json<OrderVerificationResult>(
      {
        valid: false,
        tampered: false,
        revoked: false,
        sourceType: 'UNKNOWN',
        verifiedAt: new Date().toISOString(),
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Order Verify API] Error:', error);
    return NextResponse.json(
      { error: 'Unable to verify order' },
      { status: 500 }
    );
  }
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let normalized = phone.replace(/[\s\-\(\)\.]/g, '').toLowerCase();
  if (normalized.startsWith('+234')) {
    normalized = '0' + normalized.slice(4);
  } else if (normalized.startsWith('234') && normalized.length > 10) {
    normalized = '0' + normalized.slice(3);
  }
  return normalized;
}
