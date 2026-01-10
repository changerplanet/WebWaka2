/**
 * RECRUITMENT SUITE — Offer Detail API
 * Phase 7C.1, S4 API Routes
 * 
 * GET /api/recruitment/offers/[id] - Get offer details
 * PATCH /api/recruitment/offers/[id] - Update offer
 * POST /api/recruitment/offers/[id] - Offer actions (approve, send, accept, decline, etc.)
 * DELETE /api/recruitment/offers/[id] - Delete draft offer
 */

import { NextResponse } from 'next/server';
import {
  getOfferById,
  updateOffer,
  submitForApproval,
  approveOffer,
  rejectApproval,
  sendOffer,
  markOfferViewed,
  acceptOffer,
  declineOffer,
  startNegotiation,
  withdrawOffer,
  markOfferExpired,
  deleteOffer,
  calculateTotalCompensation,
  type UpdateOfferInput,
} from '@/lib/recruitment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recruitment/offers/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const offer = await getOfferById(tenantId, id);

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Include total compensation calculation
    const totalCompensation = calculateTotalCompensation(offer);

    return NextResponse.json({ ...offer, totalCompensation });
  } catch (error) {
    console.error('GET /api/recruitment/offers/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/recruitment/offers/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateOfferInput = await request.json();

    const offer = await updateOffer(tenantId, id, body);

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('PATCH /api/recruitment/offers/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recruitment/offers/[id] - Actions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'submitForApproval':
        result = await submitForApproval(tenantId, id);
        break;

      case 'approve':
        result = await approveOffer(tenantId, id, userId || 'system', data.notes);
        break;

      case 'rejectApproval':
        if (!data.reason) {
          return NextResponse.json({ error: 'reason required' }, { status: 400 });
        }
        result = await rejectApproval(tenantId, id, userId || 'system', data.reason);
        break;

      case 'send':
        result = await sendOffer(tenantId, id, userId || 'system', data.sentVia || 'Email');
        break;

      case 'markViewed':
        result = await markOfferViewed(tenantId, id);
        break;

      case 'accept':
        result = await acceptOffer(tenantId, id, data.notes);
        break;

      case 'decline':
        result = await declineOffer(tenantId, id, data.reason);
        break;

      case 'negotiate':
        result = await startNegotiation(tenantId, id, data.counterOffer, data.request);
        break;

      case 'withdraw':
        result = await withdrawOffer(tenantId, id, data.reason, userId || undefined);
        break;

      case 'expire':
        result = await markOfferExpired(tenantId, id);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Action failed - offer not found or invalid state' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/recruitment/offers/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recruitment/offers/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Tenant context required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await deleteOffer(tenantId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Offer not found or cannot be deleted (must be DRAFT)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Offer deleted' });
  } catch (error) {
    console.error('DELETE /api/recruitment/offers/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
