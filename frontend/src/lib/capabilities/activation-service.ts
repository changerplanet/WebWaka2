/**
 * SAAS CORE: Capability Activation Service
 * 
 * Core service that manages capability activation per tenant.
 * 
 * RULES:
 * - ALL capabilities default to INACTIVE
 * - Requires explicit activation
 * - Emits events for all activation changes
 * - Enforces dependencies
 */

import { prisma } from '../prisma';
import {
  CAPABILITY_REGISTRY,
  getCapabilityDefinition,
  getCapabilityDependencies,
  getDependentCapabilities,
  getCoreCapabilities,
  isCapabilityRegistered,
  CapabilityDefinition,
} from './registry';
import { CapabilityStatus, CapabilityActivator } from '@prisma/client';
import { withPrismaDefaults } from '../db/prismaDefaults';

// ============================================================================
// TYPES
// ============================================================================

export interface ActivationResult {
  success: boolean;
  capabilityKey: string;
  status: CapabilityStatus;
  message?: string;
  activatedDependencies?: string[];
}

export interface DeactivationResult {
  success: boolean;
  capabilityKey: string;
  status: CapabilityStatus;
  message?: string;
  deactivatedDependents?: string[];
}

export interface CapabilityActivationInfo {
  key: string;
  displayName: string;
  domain: string;
  description?: string;
  status: CapabilityStatus;
  isCore: boolean;
  activatedAt?: Date;
  activatedBy?: CapabilityActivator;
  dependencies: string[];
  dependents: string[];
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export const CAPABILITY_EVENTS = {
  ACTIVATED: 'capability.activated',
  DEACTIVATED: 'capability.deactivated',
  SUSPENDED: 'capability.suspended',
  CONFIGURATION_CHANGED: 'capability.configuration_changed',
} as const;

// ============================================================================
// CAPABILITY ACTIVATION SERVICE
// ============================================================================

export class CapabilityActivationService {
  /**
   * Seed the Capability table with registry definitions
   * Call this during app initialization
   */
  static async seedCapabilities(): Promise<void> {
    const definitions = Object.values(CAPABILITY_REGISTRY);
    const crypto = await import('crypto');
    
    for (const def of definitions) {
      await prisma.core_capabilities.upsert({
        where: { key: def.key },
        update: {
          displayName: def.displayName,
          domain: def.domain,
          description: def.description || null,
          dependencies: def.dependencies || [],
          isCore: def.isCore || false,
          sortOrder: def.sortOrder || 0,
          icon: def.icon || null,
          metadata: def.metadata ? JSON.parse(JSON.stringify(def.metadata)) : undefined,
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          key: def.key,
          displayName: def.displayName,
          domain: def.domain,
          description: def.description || null,
          dependencies: def.dependencies || [],
          isCore: def.isCore || false,
          isAvailable: true,
          sortOrder: def.sortOrder || 0,
          icon: def.icon || null,
          metadata: def.metadata ? JSON.parse(JSON.stringify(def.metadata)) : undefined,
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Check if a capability is active for a tenant
   * This is the PRIMARY runtime check
   */
  static async isCapabilityActive(
    tenantId: string,
    capabilityKey: string
  ): Promise<boolean> {
    // Core capabilities are always active
    const def = getCapabilityDefinition(capabilityKey);
    if (def?.isCore) {
      return true;
    }

    const activation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey,
        },
      },
    });

    return activation?.status === 'ACTIVE';
  }

  /**
   * Get activation status for a capability
   */
  static async getActivationStatus(
    tenantId: string,
    capabilityKey: string
  ): Promise<CapabilityStatus> {
    const def = getCapabilityDefinition(capabilityKey);
    if (def?.isCore) {
      return 'ACTIVE';
    }

    const activation = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey,
        },
      },
    });

    return activation?.status || 'INACTIVE';
  }

  /**
   * Get all capability activations for a tenant
   */
  static async getTenantCapabilities(
    tenantId: string,
    options?: {
      domain?: string;
      status?: CapabilityStatus;
      includeUnavailable?: boolean;
    }
  ): Promise<CapabilityActivationInfo[]> {
    // Get all capabilities from database
    const capabilitiesQuery: Record<string, unknown> = {
      isAvailable: options?.includeUnavailable ? undefined : true,
    };
    if (options?.domain) {
      capabilitiesQuery.domain = options.domain;
    }

    const capabilities = await prisma.core_capabilities.findMany({
      where: capabilitiesQuery,
      orderBy: [{ domain: 'asc' }, { sortOrder: 'asc' }],
    });

    // Get tenant activations
    const activations = await prisma.core_tenant_capability_activations.findMany({
      where: { tenantId },
    });
    const activationMap = new Map(
      activations.map(a => [a.capabilityKey, a])
    );

    // Build response
    const result: CapabilityActivationInfo[] = [];

    for (const cap of capabilities) {
      const activation = activationMap.get(cap.key);
      
      // Apply status filter
      const status = cap.isCore ? 'ACTIVE' : (activation?.status || 'INACTIVE');
      if (options?.status && status !== options.status) {
        continue;
      }

      result.push({
        key: cap.key,
        displayName: cap.displayName,
        domain: cap.domain,
        description: cap.description || undefined,
        status,
        isCore: cap.isCore,
        activatedAt: activation?.activatedAt || undefined,
        activatedBy: activation?.activatedBy || undefined,
        dependencies: cap.dependencies,
        dependents: getDependentCapabilities(cap.key).map(d => d.key),
      });
    }

    return result;
  }

  /**
   * Activate a capability for a tenant
   */
  static async activate(
    tenantId: string,
    capabilityKey: string,
    userId: string,
    activatedBy: CapabilityActivator = 'SELF'
  ): Promise<ActivationResult> {
    // Validate capability exists
    if (!isCapabilityRegistered(capabilityKey)) {
      return {
        success: false,
        capabilityKey,
        status: 'INACTIVE',
        message: `Capability '${capabilityKey}' is not registered`,
      };
    }

    const def = getCapabilityDefinition(capabilityKey)!;

    // Core capabilities cannot be activated (always active)
    if (def.isCore) {
      return {
        success: true,
        capabilityKey,
        status: 'ACTIVE',
        message: 'Core capability is always active',
      };
    }

    // Check dependencies
    const activatedDependencies: string[] = [];
    if (def.dependencies?.length) {
      for (const depKey of def.dependencies) {
        const depStatus = await this.getActivationStatus(tenantId, depKey);
        if (depStatus !== 'ACTIVE') {
          // Auto-activate dependencies
          const depResult = await this.activate(tenantId, depKey, userId, 'SYSTEM');
          if (depResult.success) {
            activatedDependencies.push(depKey);
          } else {
            return {
              success: false,
              capabilityKey,
              status: 'INACTIVE',
              message: `Failed to activate dependency '${depKey}': ${depResult.message}`,
            };
          }
        }
      }
    }

    // Create or update activation
    const now = new Date();
    const activation = await prisma.core_tenant_capability_activations.upsert({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey,
        },
      },
      update: {
        status: 'ACTIVE',
        activatedAt: now,
        activatedBy,
        activatedByUserId: userId,
        deactivatedAt: null,
        suspendedAt: null,
        suspensionReason: null,
        auditLog: {
          push: {
            action: 'ACTIVATED',
            userId,
            timestamp: now.toISOString(),
            activatedBy,
          },
        },
      },
      create: withPrismaDefaults({
        tenantId,
        capabilityKey,
        status: 'ACTIVE',
        activatedAt: now,
        activatedBy,
        activatedByUserId: userId,
        auditLog: [{
          action: 'ACTIVATED',
          userId,
          timestamp: now.toISOString(),
          activatedBy,
        }],
      }),
    });

    // Log event
    await this.logEvent({
      eventType: CAPABILITY_EVENTS.ACTIVATED,
      tenantId,
      capabilityKey,
      triggeredBy: activatedBy,
      userId,
      previousStatus: 'INACTIVE',
      newStatus: 'ACTIVE',
    });

    return {
      success: true,
      capabilityKey,
      status: activation.status,
      activatedDependencies: activatedDependencies.length > 0 ? activatedDependencies : undefined,
    };
  }

  /**
   * Deactivate a capability for a tenant
   */
  static async deactivate(
    tenantId: string,
    capabilityKey: string,
    userId: string,
    reason?: string,
    deactivatedBy: CapabilityActivator = 'SELF'
  ): Promise<DeactivationResult> {
    // Validate capability exists
    if (!isCapabilityRegistered(capabilityKey)) {
      return {
        success: false,
        capabilityKey,
        status: 'INACTIVE',
        message: `Capability '${capabilityKey}' is not registered`,
      };
    }

    const def = getCapabilityDefinition(capabilityKey)!;

    // Core capabilities cannot be deactivated
    if (def.isCore) {
      return {
        success: false,
        capabilityKey,
        status: 'ACTIVE',
        message: 'Core capability cannot be deactivated',
      };
    }

    // Check for dependents
    const dependents = getDependentCapabilities(capabilityKey);
    const deactivatedDependents: string[] = [];

    for (const dependent of dependents) {
      const depStatus = await this.getActivationStatus(tenantId, dependent.key);
      if (depStatus === 'ACTIVE') {
        // Deactivate dependents first
        const depResult = await this.deactivate(
          tenantId,
          dependent.key,
          userId,
          `Dependency '${capabilityKey}' deactivated`,
          'SYSTEM'
        );
        if (depResult.success) {
          deactivatedDependents.push(dependent.key);
        }
      }
    }

    // Get current activation
    const existing = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey,
        },
      },
    });

    if (!existing || existing.status === 'INACTIVE') {
      return {
        success: true,
        capabilityKey,
        status: 'INACTIVE',
        message: 'Capability was already inactive',
      };
    }

    const previousStatus = existing.status;
    const now = new Date();

    // Update to inactive
    await prisma.core_tenant_capability_activations.update({
      where: { id: existing.id },
      data: {
        status: 'INACTIVE',
        deactivatedAt: now,
        auditLog: {
          push: {
            action: 'DEACTIVATED',
            userId,
            timestamp: now.toISOString(),
            reason,
            deactivatedBy,
          },
        },
      },
    });

    // Log event
    await this.logEvent({
      eventType: CAPABILITY_EVENTS.DEACTIVATED,
      tenantId,
      capabilityKey,
      triggeredBy: deactivatedBy,
      userId,
      previousStatus,
      newStatus: 'INACTIVE',
      reason,
    });

    return {
      success: true,
      capabilityKey,
      status: 'INACTIVE',
      deactivatedDependents: deactivatedDependents.length > 0 ? deactivatedDependents : undefined,
    };
  }

  /**
   * Suspend a capability for a tenant (admin action)
   */
  static async suspend(
    tenantId: string,
    capabilityKey: string,
    userId: string,
    reason: string
  ): Promise<ActivationResult> {
    const def = getCapabilityDefinition(capabilityKey);
    
    if (!def) {
      return {
        success: false,
        capabilityKey,
        status: 'INACTIVE',
        message: `Capability '${capabilityKey}' is not registered`,
      };
    }

    if (def.isCore) {
      return {
        success: false,
        capabilityKey,
        status: 'ACTIVE',
        message: 'Core capability cannot be suspended',
      };
    }

    const existing = await prisma.core_tenant_capability_activations.findUnique({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey,
        },
      },
    });

    const previousStatus = existing?.status || 'INACTIVE';
    const now = new Date();

    const activation = await prisma.core_tenant_capability_activations.upsert({
      where: {
        tenantId_capabilityKey: {
          tenantId,
          capabilityKey,
        },
      },
      update: {
        status: 'SUSPENDED',
        suspendedAt: now,
        suspensionReason: reason,
        auditLog: {
          push: {
            action: 'SUSPENDED',
            userId,
            timestamp: now.toISOString(),
            reason,
          },
        },
      },
      create: withPrismaDefaults({
        tenantId,
        capabilityKey,
        status: 'SUSPENDED',
        suspendedAt: now,
        suspensionReason: reason,
        auditLog: [{
          action: 'SUSPENDED',
          userId,
          timestamp: now.toISOString(),
          reason,
        }],
      }),
    });

    // Log event
    await this.logEvent({
      eventType: CAPABILITY_EVENTS.SUSPENDED,
      tenantId,
      capabilityKey,
      triggeredBy: 'ADMIN',
      userId,
      previousStatus,
      newStatus: 'SUSPENDED',
      reason,
    });

    return {
      success: true,
      capabilityKey,
      status: activation.status,
    };
  }

  /**
   * Bulk activate capabilities
   */
  static async bulkActivate(
    tenantId: string,
    capabilityKeys: string[],
    userId: string,
    activatedBy: CapabilityActivator = 'SELF'
  ): Promise<ActivationResult[]> {
    const results: ActivationResult[] = [];

    for (const key of capabilityKeys) {
      const result = await this.activate(tenantId, key, userId, activatedBy);
      results.push(result);
    }

    return results;
  }

  /**
   * Initialize a new tenant with default capabilities
   * By default, NO capabilities are active (except Core)
   */
  static async initializeTenant(tenantId: string): Promise<void> {
    // Core capabilities are automatically active, no need to create records
    // All other capabilities start as INACTIVE
    // Records are only created when explicitly activated
    
    // Log initialization
    await this.logEvent({
      eventType: 'tenant.initialized',
      tenantId,
      capabilityKey: 'system',
      triggeredBy: 'SYSTEM',
      metadata: {
        message: 'Tenant initialized with zero active capabilities',
      },
    });
  }

  /**
   * Log a capability event
   */
  private static async logEvent(data: {
    eventType: string;
    tenantId: string;
    capabilityKey: string;
    triggeredBy: CapabilityActivator | string;
    userId?: string;
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.capabilityEventLog.create({
      data: {
        eventType: data.eventType,
        tenantId: data.tenantId,
        capabilityKey: data.capabilityKey,
        triggeredBy: data.triggeredBy as CapabilityActivator,
        userId: data.userId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        reason: data.reason,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  /**
   * Get event log for a tenant
   */
  static async getEventLog(
    tenantId: string,
    options?: {
      capabilityKey?: string;
      eventType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    events: Array<{
      id: string;
      eventType: string;
      capabilityKey: string;
      triggeredBy: CapabilityActivator;
      userId?: string;
      previousStatus?: string;
      newStatus?: string;
      reason?: string;
      timestamp: Date;
    }>;
    total: number;
  }> {
    const where: Record<string, unknown> = { tenantId };
    if (options?.capabilityKey) where.capabilityKey = options.capabilityKey;
    if (options?.eventType) where.eventType = options.eventType;

    const [events, total] = await Promise.all([
      prisma.capabilityEventLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.capabilityEventLog.count({ where }),
    ]);

    return {
      events: events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        capabilityKey: e.capabilityKey,
        triggeredBy: e.triggeredBy,
        userId: e.userId || undefined,
        previousStatus: e.previousStatus || undefined,
        newStatus: e.newStatus || undefined,
        reason: e.reason || undefined,
        timestamp: e.timestamp,
      })),
      total,
    };
  }
}
