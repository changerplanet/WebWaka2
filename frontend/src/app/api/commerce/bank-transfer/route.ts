/**
 * Bank Transfer Payment API
 * Wave 2.2: Bank Transfer & COD Deepening
 * 
 * Handles bank transfer creation, proof upload, and verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  createBankTransferService,
  createPaymentExpiryService,
} from '@/lib/commerce/payment-verification';

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

    const bankTransferService = createBankTransferService(tenantId);
    const expiryService = createPaymentExpiryService(tenantId);

    switch (action) {
      case 'create': {
        const { orderId, orderNumber, amount, bankAccount, customerPhone, customerEmail, customerName, expiryHours } = body;
        
        if (!amount || !bankAccount) {
          return NextResponse.json({ error: 'Missing required fields: amount, bankAccount' }, { status: 400 });
        }

        const payment = await bankTransferService.createPayment({
          tenantId,
          orderId,
          orderNumber,
          amount,
          bankAccount,
          customerPhone,
          customerEmail,
          customerName,
          expiryHours,
        });

        return NextResponse.json({ success: true, payment });
      }

      case 'submit_proof': {
        const { paymentId, proofType, fileUrl, fileName, fileSize, mimeType, extractedAmount, extractedReference, extractedDate, extractedBankName } = body;

        if (!paymentId || !proofType || !fileUrl) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, proofType, fileUrl' }, { status: 400 });
        }

        const result = await bankTransferService.submitProof({
          paymentId,
          proofType,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          extractedAmount,
          extractedReference,
          extractedDate: extractedDate ? new Date(extractedDate) : undefined,
          extractedBankName,
          submittedById: session.user.id,
          submittedByName: session.user.name || session.user.email,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'verify': {
        const { paymentId, decision, note, customerReference } = body;

        if (!paymentId || !decision) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, decision' }, { status: 400 });
        }

        const result = await bankTransferService.verifyPayment({
          paymentId,
          decision,
          note,
          customerReference,
          verifiedById: session.user.id,
          verifiedByName: session.user.name || session.user.email || 'Unknown',
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'cancel': {
        const { paymentId, reason } = body;

        if (!paymentId) {
          return NextResponse.json({ error: 'Missing required field: paymentId' }, { status: 400 });
        }

        const result = await bankTransferService.cancelPayment(paymentId, reason);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'extend_expiry': {
        const { paymentId, additionalHours } = body;

        if (!paymentId || !additionalHours) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, additionalHours' }, { status: 400 });
        }

        const result = await expiryService.extendExpiry(paymentId, additionalHours);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, newExpiresAt: result.newExpiresAt });
      }

      case 'check_expiry': {
        const result = await expiryService.checkAndExpirePayments();
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Bank Transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const paymentId = searchParams.get('paymentId');
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeProofs = searchParams.get('includeProofs') === 'true';
    const expiryStats = searchParams.get('expiryStats') === 'true';
    const expiringSoon = searchParams.get('expiringSoon') === 'true';

    const bankTransferService = createBankTransferService(tenantId);
    const expiryService = createPaymentExpiryService(tenantId);

    if (expiryStats) {
      const stats = await expiryService.getExpiryStats();
      return NextResponse.json(stats);
    }

    if (expiringSoon) {
      const hours = parseInt(searchParams.get('hours') || '2', 10);
      const payments = await expiryService.getExpiringPayments(hours);
      return NextResponse.json({ payments });
    }

    if (paymentId) {
      const payment = await bankTransferService.getPayment(paymentId);
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      let proofs = undefined;
      if (includeProofs) {
        proofs = await bankTransferService.getProofs(paymentId);
      }

      return NextResponse.json({ payment, proofs });
    }

    if (reference) {
      const payment = await bankTransferService.getPaymentByReference(reference);
      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      return NextResponse.json({ payment });
    }

    const { payments, total } = await bankTransferService.listPayments({
      status: status as any,
      orderId: orderId || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ payments, total, limit, offset });
  } catch (error) {
    console.error('Bank Transfer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
