import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TicketVerificationResult {
  valid: boolean;
  tampered: boolean;
  revoked: boolean;
  sourceType: string;
  verifiedAt: string;
  ticketNumber?: string;
  passengerName?: string;
  seatNumber?: string;
  status?: string;
  isDemo?: boolean;
  requiresVerification?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketRef: string }> }
) {
  try {
    const { ticketRef } = await params;
    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get('tenant');
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
      return NextResponse.json<TicketVerificationResult>(
        {
          valid: false,
          tampered: false,
          revoked: false,
          sourceType: 'PARK_TICKET',
          verifiedAt: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const isDemo = tenant.slug.toLowerCase().startsWith('demo') || 
                   tenant.name.toLowerCase().includes('demo');

    if (!isDemo && !phone) {
      return NextResponse.json<TicketVerificationResult>(
        {
          valid: false,
          tampered: false,
          revoked: false,
          sourceType: 'PARK_TICKET',
          verifiedAt: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const ticket = await prisma.park_ticket.findFirst({
      where: {
        tenantId: tenant.id,
        ticketNumber: ticketRef,
      },
      select: {
        ticketNumber: true,
        passengerName: true,
        passengerPhone: true,
        seatNumber: true,
        status: true,
        isDemo: true,
      },
    });

    if (!ticket) {
      return NextResponse.json<TicketVerificationResult>(
        {
          valid: false,
          tampered: false,
          revoked: false,
          sourceType: 'PARK_TICKET',
          verifiedAt: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (!isDemo && phone) {
      const normalizedInput = phone.replace(/[\s\-\(\)\.]/g, '').toLowerCase();
      let normalizedTicket = (ticket.passengerPhone || '').replace(/[\s\-\(\)\.]/g, '').toLowerCase();
      
      if (normalizedTicket.startsWith('+234')) {
        normalizedTicket = '0' + normalizedTicket.slice(4);
      } else if (normalizedTicket.startsWith('234') && normalizedTicket.length > 10) {
        normalizedTicket = '0' + normalizedTicket.slice(3);
      }

      let inputNormalized = normalizedInput;
      if (inputNormalized.startsWith('+234')) {
        inputNormalized = '0' + inputNormalized.slice(4);
      } else if (inputNormalized.startsWith('234') && inputNormalized.length > 10) {
        inputNormalized = '0' + inputNormalized.slice(3);
      }

      if (inputNormalized !== normalizedTicket) {
        return NextResponse.json<TicketVerificationResult>(
          {
            valid: false,
            tampered: false,
            revoked: false,
            sourceType: 'PARK_TICKET',
            verifiedAt: new Date().toISOString(),
          },
          { status: 404 }
        );
      }
    }

    const isCancelled = ticket.status === 'CANCELLED' || ticket.status === 'VOIDED';

    return NextResponse.json<TicketVerificationResult>({
      valid: !isCancelled,
      tampered: false,
      revoked: isCancelled,
      sourceType: 'PARK_TICKET',
      verifiedAt: new Date().toISOString(),
      ticketNumber: ticket.ticketNumber,
      passengerName: ticket.passengerName,
      seatNumber: ticket.seatNumber || undefined,
      status: ticket.status,
      isDemo: ticket.isDemo,
    });
  } catch (error) {
    console.error('[Ticket Verify API] Error:', error);
    return NextResponse.json(
      { error: 'Unable to verify ticket' },
      { status: 500 }
    );
  }
}
