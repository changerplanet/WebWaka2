export const dynamic = 'force-dynamic';

/**
 * MVM VENDOR REGISTRATION API
 * Wave 1: Nigeria-First Modular Commerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { VendorRegistrationService } from '@/lib/commerce/mvm-vendor/vendor-registration-service';
import { getCurrentSession } from '@/lib/auth';

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
    const phone = searchParams.get('phone');
    const registrationId = searchParams.get('registrationId');
    const action = searchParams.get('action');

    if (action === 'pending') {
      const pending = await VendorRegistrationService.getPendingRegistrations(tenantId);
      return NextResponse.json({ registrations: pending });
    }

    if (registrationId) {
      const status = await VendorRegistrationService.getRegistrationStatus(registrationId);
      if (!status) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }
      return NextResponse.json({ registration: status });
    }

    if (phone) {
      const registration = await VendorRegistrationService.getByPhone(tenantId, phone);
      if (!registration) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }
      return NextResponse.json({ registration });
    }

    return NextResponse.json({ error: 'phone or registrationId required' }, { status: 400 });
  } catch (error) {
    console.error('Vendor registration GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

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
    const { action, phone, partnerId, registrationId, ...data } = body;

    switch (action) {
      case 'start':
        if (!phone) {
          return NextResponse.json({ error: 'phone required' }, { status: 400 });
        }
        const registration = await VendorRegistrationService.startRegistration(
          tenantId,
          phone,
          partnerId
        );
        return NextResponse.json({
          registration,
          message: 'Registration started. Verify your phone to continue.'
        });

      case 'verify-phone':
        if (!registrationId) {
          return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
        }
        const verified = await VendorRegistrationService.verifyPhone(registrationId);
        return NextResponse.json({ registration: verified, message: 'Phone verified' });

      case 'update-profile':
        if (!registrationId) {
          return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
        }
        const updated = await VendorRegistrationService.updateProfile(registrationId, data);
        return NextResponse.json({ registration: updated });

      case 'submit':
        if (!registrationId) {
          return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
        }
        const submitted = await VendorRegistrationService.submitForApproval(registrationId);
        return NextResponse.json({
          registration: submitted,
          message: 'Submitted for approval'
        });

      case 'approve':
        if (!registrationId) {
          return NextResponse.json(
            { error: 'registrationId required' },
            { status: 400 }
          );
        }
        const vendor = await VendorRegistrationService.approveVendor(
          registrationId,
          session.user.id,
          session.user.name || session.user.email || 'Admin'
        );
        return NextResponse.json({
          vendor,
          message: 'Vendor approved and created'
        });

      case 'reject':
        if (!registrationId || !data.reason) {
          return NextResponse.json(
            { error: 'registrationId and reason required' },
            { status: 400 }
          );
        }
        const rejected = await VendorRegistrationService.rejectVendor(
          registrationId,
          session.user.id,
          session.user.name || session.user.email || 'Admin',
          data.reason
        );
        return NextResponse.json({ registration: rejected, message: 'Vendor rejected' });

      case 'suspend':
        if (!registrationId || !data.reason) {
          return NextResponse.json(
            { error: 'registrationId and reason required' },
            { status: 400 }
          );
        }
        const suspended = await VendorRegistrationService.suspendVendor(
          registrationId,
          data.reason
        );
        return NextResponse.json({ registration: suspended, message: 'Vendor suspended' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Vendor registration POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
