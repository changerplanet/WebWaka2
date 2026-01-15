/**
 * Landmark Address API
 * Wave F5: Landmark-Based Addressing (SVM)
 * 
 * Manages landmark-based delivery addresses for Nigerian commerce.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createLandmarkAddressService } from '@/lib/commerce/landmark-address';

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
    const addressService = createLandmarkAddressService(tenantId);
    const customerId = session.user.id;

    const action = searchParams.get('action');

    switch (action) {
      case 'get_states': {
        const states = addressService.getStates();
        return NextResponse.json({ success: true, states });
      }

      case 'get_lgas': {
        const state = searchParams.get('state');
        if (!state) {
          return NextResponse.json({ error: 'State is required' }, { status: 400 });
        }
        const lgas = addressService.getLGAs(state);
        return NextResponse.json({ success: true, lgas });
      }

      case 'list': {
        const result = await addressService.getCustomerAddresses(customerId);
        return NextResponse.json({ success: true, ...result });
      }

      case 'get': {
        const addressId = searchParams.get('addressId');
        if (!addressId) {
          return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }
        const address = await addressService.getAddress(addressId, customerId);
        if (!address) {
          return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, address });
      }

      default:
        const result = await addressService.getCustomerAddresses(customerId);
        return NextResponse.json({ success: true, ...result });
    }
  } catch (error) {
    console.error('[Landmark Address API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
    const { action, ...data } = body;
    const customerId = session.user.id;

    const addressService = createLandmarkAddressService(tenantId);

    switch (action) {
      case 'validate': {
        const validation = addressService.validateAddress(data.address);
        return NextResponse.json({ success: true, validation });
      }

      case 'save': {
        const savedAddress = await addressService.saveAddress(customerId, data.address);
        return NextResponse.json({ success: true, address: savedAddress });
      }

      case 'update': {
        if (!data.addressId) {
          return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }
        const updated = await addressService.updateAddress(data.addressId, customerId, data.address);
        return NextResponse.json({ success: true, address: updated });
      }

      case 'delete': {
        if (!data.addressId) {
          return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }
        await addressService.deleteAddress(data.addressId, customerId);
        return NextResponse.json({ success: true });
      }

      case 'set_default': {
        if (!data.addressId) {
          return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }
        const updated = await addressService.setDefaultAddress(data.addressId, customerId);
        return NextResponse.json({ success: true, address: updated });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: validate, save, update, delete, set_default' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Landmark Address API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
