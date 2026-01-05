/**
 * SAAS CORE: Capability Guard Middleware
 * 
 * Helper functions to guard API routes based on capability activation.
 * Use these to wrap route handlers for capability-protected modules.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isCapabilityActive, checkCapability } from './runtime-guard';

/**
 * Extract tenant ID from request
 * Supports: query params, request body, and headers
 */
export async function extractTenantId(request: NextRequest): Promise<string | null> {
  // Try query params first
  const { searchParams } = new URL(request.url);
  const tenantIdFromQuery = searchParams.get('tenantId');
  if (tenantIdFromQuery) return tenantIdFromQuery;

  // Try header
  const tenantIdFromHeader = request.headers.get('x-tenant-id');
  if (tenantIdFromHeader) return tenantIdFromHeader;

  // Try request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      if (body?.tenantId) return body.tenantId;
    } catch {
      // Body parsing failed, continue
    }
  }

  return null;
}

/**
 * Create a capability-guarded API response
 */
function capabilityInactiveResponse(capabilityKey: string, message?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Capability not active',
      code: 'CAPABILITY_INACTIVE',
      capability: capabilityKey,
      message: message || `The '${capabilityKey}' capability is not activated for this tenant. Please activate it from your dashboard.`,
    },
    { status: 403 }
  );
}

/**
 * Guard a route handler with capability check
 * 
 * Usage:
 * ```
 * export const GET = guardWithCapability('pos', async (request) => {
 *   // Your handler code
 * });
 * ```
 */
export function guardWithCapability(
  capabilityKey: string,
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const tenantId = await extractTenantId(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Check capability
    const isActive = await isCapabilityActive(tenantId, capabilityKey);
    if (!isActive) {
      return capabilityInactiveResponse(capabilityKey);
    }

    return handler(request, tenantId);
  };
}

/**
 * Guard with detailed check (includes reason)
 */
export function guardWithCapabilityDetailed(
  capabilityKey: string,
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const tenantId = await extractTenantId(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Check capability with details
    const check = await checkCapability(tenantId, capabilityKey);
    if (!check.allowed) {
      return capabilityInactiveResponse(capabilityKey, check.reason);
    }

    return handler(request, tenantId);
  };
}

/**
 * Inline capability check for existing handlers
 * 
 * Usage:
 * ```
 * export async function GET(request: NextRequest) {
 *   const guardResult = await checkCapabilityGuard(request, 'pos');
 *   if (guardResult) return guardResult; // Returns 403 if inactive
 *   
 *   // Continue with existing logic
 * }
 * ```
 */
export async function checkCapabilityGuard(
  request: NextRequest,
  capabilityKey: string
): Promise<NextResponse | null> {
  const tenantId = await extractTenantId(request);

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'tenantId is required' },
      { status: 400 }
    );
  }

  const isActive = await isCapabilityActive(tenantId, capabilityKey);
  if (!isActive) {
    return capabilityInactiveResponse(capabilityKey);
  }

  return null; // Guard passed
}

/**
 * Check capability for a known tenant ID
 * Use when tenantId is already extracted (e.g., from session)
 */
export async function checkCapabilityForTenant(
  tenantId: string,
  capabilityKey: string
): Promise<NextResponse | null> {
  const isActive = await isCapabilityActive(tenantId, capabilityKey);
  if (!isActive) {
    return capabilityInactiveResponse(capabilityKey);
  }
  return null;
}

/**
 * Check capability for session-based routes
 * Use when the route uses getCurrentSession() for auth
 * 
 * Usage:
 * ```
 * export async function GET(request: NextRequest) {
 *   const session = await getCurrentSession();
 *   if (!session?.user || !session.activeTenantId) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   
 *   const guardResult = await checkCapabilityForSession(session.activeTenantId, 'inventory');
 *   if (guardResult) return guardResult;
 *   
 *   // Continue with existing logic
 * }
 * ```
 */
export async function checkCapabilityForSession(
  activeTenantId: string,
  capabilityKey: string
): Promise<NextResponse | null> {
  return checkCapabilityForTenant(activeTenantId, capabilityKey);
}
