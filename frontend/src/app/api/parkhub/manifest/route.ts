/**
 * ParkHub Manifest API
 * Wave F8: Manifest Generation
 * 
 * API endpoint for manifest generation, retrieval, and management.
 * User-triggered only - NO automation.
 * 
 * POST: Generate manifest for a trip
 * GET: Get manifest by ID, trip ID, or list manifests
 * PATCH: Update manifest status or record print
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createManifestService } from '@/lib/parkhub/manifest';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No active tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      tripId, 
      parkId, 
      parkName, 
      parkLocation, 
      parkPhone, 
      isDemo,
      offlineManifestNumber,
      offlineVerificationHash,
      offlineQrCodeData,
      offlineGeneratedAt,
    } = body;

    if (!tripId) {
      return NextResponse.json(
        { success: false, error: 'tripId is required' },
        { status: 400 }
      );
    }

    if (!parkId) {
      return NextResponse.json(
        { success: false, error: 'parkId is required' },
        { status: 400 }
      );
    }

    const manifestService = createManifestService(tenantId);

    const result = await manifestService.generateManifest({
      tenantId,
      tripId,
      parkId,
      parkName,
      parkLocation,
      parkPhone,
      generatedById: session.user.id,
      generatedByName: session.user.name || session.user.email || 'Unknown',
      isDemo: isDemo ?? false,
      offlineManifestNumber,
      offlineVerificationHash,
      offlineQrCodeData,
      offlineGeneratedAt: offlineGeneratedAt ? new Date(offlineGeneratedAt) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Manifest API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No active tenant' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const manifestId = searchParams.get('manifestId');
    const tripId = searchParams.get('tripId');
    const manifestNumber = searchParams.get('manifestNumber');
    const action = searchParams.get('action');
    const parkId = searchParams.get('parkId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const manifestService = createManifestService(tenantId);

    if (action === 'revisions' && manifestId) {
      const revisions = await manifestService.getRevisions(manifestId);
      return NextResponse.json({ success: true, data: revisions });
    }

    if (manifestId) {
      const manifest = await manifestService.getManifest(manifestId);
      if (!manifest) {
        return NextResponse.json(
          { success: false, error: 'Manifest not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: manifest });
    }

    if (tripId) {
      const manifest = await manifestService.getManifestByTrip(tripId);
      if (!manifest) {
        return NextResponse.json(
          { success: false, error: 'Manifest not found for trip' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: manifest });
    }

    if (manifestNumber) {
      const manifest = await manifestService.getManifestByNumber(manifestNumber);
      if (!manifest) {
        return NextResponse.json(
          { success: false, error: 'Manifest not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: manifest });
    }

    const result = await manifestService.listManifests({
      parkId: parkId || undefined,
      status: status as 'DRAFT' | 'GENERATED' | 'PRINTED' | 'DEPARTED' | 'COMPLETED' | 'VOIDED' | undefined,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Manifest API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.activeTenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'No active tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { manifestId, action, status, reason } = body;

    if (!manifestId) {
      return NextResponse.json(
        { success: false, error: 'manifestId is required' },
        { status: 400 }
      );
    }

    const manifestService = createManifestService(tenantId);

    if (action === 'print') {
      const result = await manifestService.recordPrint(
        manifestId,
        session.user.id,
        session.user.name || session.user.email || 'Unknown',
        reason
      );
      return NextResponse.json(result);
    }

    if (action === 'updateStatus' && status) {
      const validStatuses = ['DRAFT', 'GENERATED', 'PRINTED', 'DEPARTED', 'COMPLETED', 'VOIDED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      const manifest = await manifestService.updateStatus(
        manifestId,
        status,
        session.user.id,
        session.user.name || session.user.email || 'Unknown'
      );

      if (!manifest) {
        return NextResponse.json(
          { success: false, error: 'Manifest not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: manifest });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "print" or "updateStatus"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Manifest API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
