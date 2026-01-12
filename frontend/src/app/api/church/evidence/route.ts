export const dynamic = 'force-dynamic'

/**
 * Church Suite — Evidence Bundles API
 * Phase 4: Governance, Audit & Transparency
 * 
 * APPEND-ONLY with cryptographic integrity verification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createEvidenceBundle,
  getEvidenceBundles,
  sealEvidenceBundle,
  verifyBundleIntegrity,
  CHURCH_SUITE_DISCLAIMERS,
} from '@/lib/church';

// GET /api/church/evidence
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const churchId = searchParams.get('churchId');

    if (!churchId) {
      return NextResponse.json(
        { error: 'churchId is required' },
        { status: 400 }
      );
    }

    const bundleType = searchParams.get('bundleType') || undefined;
    const status = searchParams.get('status') || undefined;

    const bundles = await getEvidenceBundles(tenantId, churchId, bundleType, status);

    return NextResponse.json({
      bundles,
      total: bundles.length,
      ...CHURCH_SUITE_DISCLAIMERS,
    });
  } catch (error) {
    console.error('Get Evidence Bundles Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/church/evidence
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const actorId = req.headers.get('x-user-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 401 });
    }
    if (!actorId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Seal action
    if (action === 'seal') {
      if (!body.bundleId) {
        return NextResponse.json(
          { error: 'bundleId is required' },
          { status: 400 }
        );
      }
      const bundle = await sealEvidenceBundle(tenantId, body.bundleId, actorId);
      return NextResponse.json({
        bundle,
        _integrity: 'Bundle sealed with cryptographic hash',
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Verify integrity action
    if (action === 'verifyIntegrity') {
      if (!body.bundleId) {
        return NextResponse.json(
          { error: 'bundleId is required' },
          { status: 400 }
        );
      }
      const result = await verifyBundleIntegrity(tenantId, body.bundleId);
      return NextResponse.json({
        ...result,
        ...CHURCH_SUITE_DISCLAIMERS,
      });
    }

    // Create bundle
    if (!body.churchId || !body.bundleType || !body.title) {
      return NextResponse.json(
        { error: 'churchId, bundleType, and title are required' },
        { status: 400 }
      );
    }

    const bundle = await createEvidenceBundle(tenantId, body, actorId);

    return NextResponse.json({
      bundle,
      _integrity: 'Evidence bundle created with hash integrity',
      ...CHURCH_SUITE_DISCLAIMERS,
    }, { status: 201 });
  } catch (error) {
    console.error('Evidence Bundle Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PUT/PATCH/DELETE - FORBIDDEN (APPEND-ONLY)
export async function PUT() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Evidence bundles are APPEND-ONLY. Use POST with action: "seal" to seal.',
      _append_only: 'APPEND-ONLY: Cannot modify evidence bundles',
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Evidence bundles are APPEND-ONLY. Use POST with action: "seal" to seal.',
      _append_only: 'APPEND-ONLY: Cannot modify evidence bundles',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Evidence bundles are APPEND-ONLY and IMMUTABLE.',
      _append_only: 'APPEND-ONLY: Cannot delete evidence bundles',
    },
    { status: 403 }
  );
}
