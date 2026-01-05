/**
 * PARKHUB API Routes
 * 
 * API for ParkHub transport marketplace operations.
 * Uses existing MVM, Logistics, and Payments services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getParkHubDemoSummary, getParkHubDemoCredentials } from '@/lib/parkhub/demo-data';
import { 
  PARKHUB_LABELS, 
  PARKHUB_MVM_CONFIG, 
  PARKHUB_CAPABILITY_BUNDLE,
  formatRouteFromProduct,
  formatTicketFromOrder,
} from '@/lib/parkhub/config';
import {
  activateParkHub,
  canActivateParkHub,
  getParkHubActivationStatus,
  PARKHUB_SOLUTION_PACKAGE,
  PARKHUB_ACTIVATION_CHECKLIST,
} from '@/lib/parkhub/activation';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'config';

  try {
    switch (action) {
      case 'config':
        // Get ParkHub configuration
        return NextResponse.json({
          success: true,
          config: {
            labels: PARKHUB_LABELS,
            mvmConfig: PARKHUB_MVM_CONFIG,
            capabilityBundle: PARKHUB_CAPABILITY_BUNDLE,
          },
        });

      case 'solution-package':
        // Get solution package details for partners
        return NextResponse.json({
          success: true,
          solution: PARKHUB_SOLUTION_PACKAGE,
          activationChecklist: PARKHUB_ACTIVATION_CHECKLIST,
        });

      case 'demo-data':
        // Get demo data summary
        return NextResponse.json({
          success: true,
          demo: {
            summary: getParkHubDemoSummary(),
            credentials: getParkHubDemoCredentials(),
          },
        });

      case 'activation-status':
        // Check if ParkHub is activated for a tenant
        const tenantId = searchParams.get('tenantId');
        if (!tenantId) {
          return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
        }
        // In production: fetch actual tenant capabilities
        const tenantCapabilities: string[] = [];
        const status = getParkHubActivationStatus(tenantCapabilities);
        return NextResponse.json({ success: true, status });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('ParkHub API GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'activate': {
        // Activate ParkHub for a tenant (Partner-only)
        const { tenantId, platformInstanceId, parkName, parkAddress, parkPhone, parkEmail, commissionRate, tier } = body;
        
        if (!tenantId || !parkName) {
          return NextResponse.json({ success: false, error: 'Tenant ID and park name required' }, { status: 400 });
        }

        const result = await activateParkHub({
          tenantId,
          partnerId: session.user.id, // Assuming user is partner
          platformInstanceId: platformInstanceId || '',
          parkName,
          parkAddress: parkAddress || '',
          parkPhone: parkPhone || '',
          parkEmail,
          initialCommissionRate: commissionRate,
          selectedTier: tier || 'starter',
        });

        return NextResponse.json(result);
      }

      case 'check-activation': {
        // Check if partner can activate ParkHub
        const { tenantCapabilities, partnerPermissions } = body;
        const result = canActivateParkHub(
          tenantCapabilities || [],
          partnerPermissions || []
        );
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('ParkHub API POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
