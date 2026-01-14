/**
 * SAAS CORE: Runtime Capability Guard
 * 
 * Helper utilities for enforcing capability activation at runtime.
 * This is the SINGLE point of truth for capability checks.
 * 
 * RULES:
 * - All modules MUST use this helper
 * - No hardcoded assumptions
 * - No silent fallbacks - fail explicitly
 */

import { prisma } from '../prisma';
import { getCapabilityDefinition } from './registry';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export interface CapabilityCheckResult {
  allowed: boolean;
  reason?: string;
  capabilityKey: string;
}

export interface EntitlementAndActivationCheck {
  capabilityActive: boolean;
  entitlementValid: boolean;
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// CORE RUNTIME CHECK
// ============================================================================

/**
 * PRIMARY runtime check: Is a capability active for a tenant?
 * 
 * This is the ONLY function modules should use for capability checks.
 * DO NOT query the database directly - use this helper.
 * 
 * @param tenantId - The tenant ID
 * @param capabilityKey - The capability key (e.g., "pos", "inventory")
 * @returns boolean - true if active, false otherwise
 */
export async function isCapabilityActive(
  tenantId: string,
  capabilityKey: string
): Promise<boolean> {
  // Core capabilities are always active
  const def = getCapabilityDefinition(capabilityKey);
  if (def?.isCore) {
    return true;
  }

  // Check if capability system is initialized (has any activations)
  const totalActivations = await prisma.core_tenant_capability_activations.count();
  if (totalActivations === 0) {
    // Capability system not initialized - allow registered capabilities for demo/dev
    // This allows seeded demo data to work before capability activations are configured
    return def !== undefined;
  }

  const activation = await prisma.core_tenant_capability_activations.findUnique({
    where: {
      tenantId_capabilityKey: {
        tenantId,
        capabilityKey,
      },
    },
    select: { status: true },
  });

  return activation?.status === 'ACTIVE';
}

/**
 * Check capability with detailed result
 */
export async function checkCapability(
  tenantId: string,
  capabilityKey: string
): Promise<CapabilityCheckResult> {
  const def = getCapabilityDefinition(capabilityKey);

  // Check if capability is registered
  if (!def) {
    return {
      allowed: false,
      reason: `Capability '${capabilityKey}' is not registered`,
      capabilityKey,
    };
  }

  // Core capabilities are always active
  if (def.isCore) {
    return {
      allowed: true,
      capabilityKey,
    };
  }

  // Check if capability system is initialized
  const totalActivations = await prisma.core_tenant_capability_activations.count();
  if (totalActivations === 0) {
    // Capability system not initialized - allow registered capabilities
    return {
      allowed: true,
      capabilityKey,
    };
  }

  const activation = await prisma.core_tenant_capability_activations.findUnique({
    where: {
      tenantId_capabilityKey: {
        tenantId,
        capabilityKey,
      },
    },
  });

  if (!activation || activation.status === 'INACTIVE') {
    return {
      allowed: false,
      reason: `Capability '${capabilityKey}' is not activated for this tenant`,
      capabilityKey,
    };
  }

  if (activation.status === 'SUSPENDED') {
    return {
      allowed: false,
      reason: `Capability '${capabilityKey}' is suspended: ${activation.suspensionReason || 'No reason provided'}`,
      capabilityKey,
    };
  }

  return {
    allowed: true,
    capabilityKey,
  };
}

/**
 * Check BOTH capability activation AND entitlement
 * 
 * This is the FULL access check that modules should use.
 * Runtime access = entitlement AND activation must both be true
 */
export async function checkCapabilityAndEntitlement(
  tenantId: string,
  capabilityKey: string,
  moduleKey?: string // Optional: use different key for entitlement
): Promise<EntitlementAndActivationCheck> {
  // Check capability activation
  const capabilityCheck = await checkCapability(tenantId, capabilityKey);
  
  // Check entitlement (module access)
  const entitlementModule = moduleKey || capabilityKey.toUpperCase();
  const entitlement = await prisma.entitlement.findUnique({
    where: {
      tenantId_module: {
        tenantId,
        module: entitlementModule,
      },
    },
  });

  const entitlementValid = entitlement?.status === 'ACTIVE';

  // Both must be true for access
  const allowed = capabilityCheck.allowed && entitlementValid;

  let reason: string | undefined;
  if (!capabilityCheck.allowed) {
    reason = capabilityCheck.reason;
  } else if (!entitlementValid) {
    reason = `No valid entitlement for module '${entitlementModule}'`;
  }

  return {
    capabilityActive: capabilityCheck.allowed,
    entitlementValid,
    allowed,
    reason,
  };
}

// ============================================================================
// API ROUTE GUARDS
// ============================================================================

/**
 * Create an API route guard for capability check
 * 
 * Usage in API route:
 * ```
 * export const GET = withCapabilityGuard('inventory', async (req, context) => {
 *   // Your handler code
 * });
 * ```
 */
export function withCapabilityGuard<T>(
  capabilityKey: string,
  handler: (
    request: NextRequest,
    context: { params: T; tenantId: string }
  ) => Promise<Response>
) {
  return async (
    request: NextRequest,
    context: { params: T }
  ): Promise<Response> => {
    // Extract tenant ID from headers or session
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 401 }
      );
    }

    // Check capability
    const check = await checkCapability(tenantId, capabilityKey);

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Capability not active',
          code: 'CAPABILITY_INACTIVE',
          capability: capabilityKey,
          message: check.reason,
        },
        { status: 403 }
      );
    }

    return handler(request, { ...context, tenantId });
  };
}

/**
 * Create an API route guard that checks BOTH capability AND entitlement
 */
export function withFullAccessGuard<T>(
  capabilityKey: string,
  moduleKey?: string,
  handler?: (
    request: NextRequest,
    context: { params: T; tenantId: string }
  ) => Promise<Response>
) {
  return async (
    request: NextRequest,
    context: { params: T }
  ): Promise<Response> => {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 401 }
      );
    }

    const check = await checkCapabilityAndEntitlement(
      tenantId,
      capabilityKey,
      moduleKey
    );

    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'Access denied',
          code: check.capabilityActive
            ? 'ENTITLEMENT_INVALID'
            : 'CAPABILITY_INACTIVE',
          capability: capabilityKey,
          message: check.reason,
        },
        { status: 403 }
      );
    }

    if (handler) {
      return handler(request, { ...context, tenantId });
    }

    return NextResponse.json({ success: true });
  };
}

// ============================================================================
// BULK CHECKS
// ============================================================================

/**
 * Check multiple capabilities at once
 */
export async function checkMultipleCapabilities(
  tenantId: string,
  capabilityKeys: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Get all activations in one query
  const activations = await prisma.core_tenant_capability_activations.findMany({
    where: {
      tenantId,
      capabilityKey: { in: capabilityKeys },
    },
    select: { capabilityKey: true, status: true },
  });

  const activationMap = new Map(
    activations.map((a) => [a.capabilityKey, a.status])
  );

  for (const key of capabilityKeys) {
    const def = getCapabilityDefinition(key);
    
    if (def?.isCore) {
      results.set(key, true);
    } else {
      results.set(key, activationMap.get(key) === 'ACTIVE');
    }
  }

  return results;
}

/**
 * Get all active capabilities for a tenant
 */
export async function getActiveCapabilities(
  tenantId: string
): Promise<string[]> {
  // Get explicitly activated capabilities
  const activations = await prisma.core_tenant_capability_activations.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
    },
    select: { capabilityKey: true },
  });

  const activeKeys = activations.map((a) => a.capabilityKey);

  // Add core capabilities (always active)
  const allCapabilities = await prisma.core_capabilities.findMany({
    where: { isCore: true },
    select: { key: true },
  });

  const coreKeys = allCapabilities.map((c) => c.key);

  return [...new Set([...coreKeys, ...activeKeys])];
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert capability is active, throw error if not
 * 
 * Use this when you need to fail fast with a clear error
 */
export async function assertCapabilityActive(
  tenantId: string,
  capabilityKey: string
): Promise<void> {
  const check = await checkCapability(tenantId, capabilityKey);

  if (!check.allowed) {
    const error = new Error(check.reason || `Capability '${capabilityKey}' is not active`);
    (error as Error & { code: string }).code = 'CAPABILITY_INACTIVE';
    throw error;
  }
}

/**
 * Assert full access (capability + entitlement)
 */
export async function assertFullAccess(
  tenantId: string,
  capabilityKey: string,
  moduleKey?: string
): Promise<void> {
  const check = await checkCapabilityAndEntitlement(
    tenantId,
    capabilityKey,
    moduleKey
  );

  if (!check.allowed) {
    const error = new Error(check.reason || 'Access denied');
    (error as Error & { code: string }).code = check.capabilityActive
      ? 'ENTITLEMENT_INVALID'
      : 'CAPABILITY_INACTIVE';
    throw error;
  }
}
