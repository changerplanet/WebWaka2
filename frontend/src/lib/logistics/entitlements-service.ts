/**
 * MODULE 4: LOGISTICS & DELIVERY
 * Entitlements Service - Feature gating and plan enforcement
 * 
 * Examples:
 * - logistics_enabled
 * - max_delivery_zones
 * - max_riders
 * - auto_assignment_enabled
 * 
 * Rules:
 * - Module checks entitlements only
 * - No plan or pricing awareness
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface LogisticsEntitlements {
  logistics_enabled: boolean
  max_delivery_zones: number
  max_riders: number
  max_assignments_per_day: number
  auto_assignment_enabled: boolean
  real_time_tracking_enabled: boolean
  proof_of_delivery_enabled: boolean
  express_delivery_enabled: boolean
  api_access_enabled: boolean
}

export interface EntitlementCheckResult {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
}

export interface LogisticsUsage {
  deliveryZones: number
  riders: number
  assignmentsToday: number
  totalAssignments: number
  completedAssignments: number
}

// Default entitlements by plan tier
const PLAN_ENTITLEMENTS: Record<string, LogisticsEntitlements> = {
  FREE: {
    logistics_enabled: false,
    max_delivery_zones: 0,
    max_riders: 0,
    max_assignments_per_day: 0,
    auto_assignment_enabled: false,
    real_time_tracking_enabled: false,
    proof_of_delivery_enabled: false,
    express_delivery_enabled: false,
    api_access_enabled: false,
  },
  STARTER: {
    logistics_enabled: true,
    max_delivery_zones: 5,
    max_riders: 5,
    max_assignments_per_day: 50,
    auto_assignment_enabled: false,
    real_time_tracking_enabled: false,
    proof_of_delivery_enabled: true,
    express_delivery_enabled: false,
    api_access_enabled: false,
  },
  PROFESSIONAL: {
    logistics_enabled: true,
    max_delivery_zones: 20,
    max_riders: 20,
    max_assignments_per_day: 200,
    auto_assignment_enabled: true,
    real_time_tracking_enabled: true,
    proof_of_delivery_enabled: true,
    express_delivery_enabled: true,
    api_access_enabled: true,
  },
  ENTERPRISE: {
    logistics_enabled: true,
    max_delivery_zones: -1, // Unlimited
    max_riders: -1, // Unlimited
    max_assignments_per_day: -1, // Unlimited
    auto_assignment_enabled: true,
    real_time_tracking_enabled: true,
    proof_of_delivery_enabled: true,
    express_delivery_enabled: true,
    api_access_enabled: true,
  },
}

// ============================================================================
// ENTITLEMENTS SERVICE
// ============================================================================

export class EntitlementsService {
  /**
   * Get entitlements for a tenant
   */
  static async getEntitlements(tenantId: string): Promise<LogisticsEntitlements> {
    // Get tenant's subscription from Core
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            Plan: { select: { slug: true } },
          },
        },
      },
    })

    if (!tenant) {
      return PLAN_ENTITLEMENTS.FREE
    }

    // Map plan slug to entitlement key
    const planSlug = tenant.subscription?.plan?.slug || 'free'
    const planKey = planSlug.toUpperCase().replace(/-/g, '_')
    const baseEntitlements = PLAN_ENTITLEMENTS[planKey] || PLAN_ENTITLEMENTS.FREE

    return baseEntitlements
  }

  /**
   * Get current usage
   */
  static async getUsage(tenantId: string): Promise<LogisticsUsage> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [zoneCount, riderCount, todayAssignments, totalStats] = await Promise.all([
      prisma.logistics_delivery_zones.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      prisma.logistics_delivery_agents.count({
        where: { tenantId, status: { not: 'TERMINATED' } },
      }),
      prisma.logistics_delivery_assignments.count({
        where: { tenantId, createdAt: { gte: today } },
      }),
      prisma.logistics_delivery_assignments.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
    ])

    const statusCounts: Record<string, number> = {}
    totalStats.forEach(s => { statusCounts[s.status] = s._count })

    return {
      deliveryZones: zoneCount,
      riders: riderCount,
      assignmentsToday: todayAssignments,
      totalAssignments: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      completedAssignments: statusCounts['DELIVERED'] || 0,
    }
  }

  /**
   * Check if a specific action is allowed
   */
  static async checkEntitlement(
    tenantId: string,
    action: keyof LogisticsEntitlements | 'create_zone' | 'create_rider' | 'create_assignment'
  ): Promise<EntitlementCheckResult> {
    const entitlements = await this.getEntitlements(tenantId)
    const usage = await this.getUsage(tenantId)

    // First check if logistics is enabled at all
    if (!entitlements.logistics_enabled) {
      return {
        allowed: false,
        reason: 'Logistics module is not enabled for this plan',
      }
    }

    switch (action) {
      case 'logistics_enabled':
        return { allowed: entitlements.logistics_enabled }

      case 'create_zone':
        if (entitlements.max_delivery_zones === -1) {
          return { allowed: true }
        }
        return {
          allowed: usage.deliveryZones < entitlements.max_delivery_zones,
          reason: usage.deliveryZones >= entitlements.max_delivery_zones
            ? `Maximum delivery zones (${entitlements.max_delivery_zones}) reached`
            : undefined,
          current: usage.deliveryZones,
          limit: entitlements.max_delivery_zones,
        }

      case 'create_rider':
        if (entitlements.max_riders === -1) {
          return { allowed: true }
        }
        return {
          allowed: usage.riders < entitlements.max_riders,
          reason: usage.riders >= entitlements.max_riders
            ? `Maximum riders (${entitlements.max_riders}) reached`
            : undefined,
          current: usage.riders,
          limit: entitlements.max_riders,
        }

      case 'create_assignment':
        if (entitlements.max_assignments_per_day === -1) {
          return { allowed: true }
        }
        return {
          allowed: usage.assignmentsToday < entitlements.max_assignments_per_day,
          reason: usage.assignmentsToday >= entitlements.max_assignments_per_day
            ? `Daily assignment limit (${entitlements.max_assignments_per_day}) reached`
            : undefined,
          current: usage.assignmentsToday,
          limit: entitlements.max_assignments_per_day,
        }

      case 'auto_assignment_enabled':
        return {
          allowed: entitlements.auto_assignment_enabled,
          reason: !entitlements.auto_assignment_enabled
            ? 'Auto-assignment is not available on this plan'
            : undefined,
        }

      case 'real_time_tracking_enabled':
        return {
          allowed: entitlements.real_time_tracking_enabled,
          reason: !entitlements.real_time_tracking_enabled
            ? 'Real-time tracking is not available on this plan'
            : undefined,
        }

      case 'express_delivery_enabled':
        return {
          allowed: entitlements.express_delivery_enabled,
          reason: !entitlements.express_delivery_enabled
            ? 'Express delivery is not available on this plan'
            : undefined,
        }

      case 'api_access_enabled':
        return {
          allowed: entitlements.api_access_enabled,
          reason: !entitlements.api_access_enabled
            ? 'API access is not available on this plan'
            : undefined,
        }

      default:
        // For boolean entitlements
        const value = entitlements[action as keyof LogisticsEntitlements]
        if (typeof value === 'boolean') {
          return { allowed: value }
        }
        return { allowed: true }
    }
  }

  /**
   * Get entitlements summary for dashboard
   */
  static async getEntitlementsSummary(tenantId: string) {
    const [entitlements, usage] = await Promise.all([
      this.getEntitlements(tenantId),
      this.getUsage(tenantId),
    ])

    return {
      enabled: entitlements.logistics_enabled,
      usage,
      limits: {
        deliveryZones: {
          current: usage.deliveryZones,
          max: entitlements.max_delivery_zones,
          unlimited: entitlements.max_delivery_zones === -1,
        },
        riders: {
          current: usage.riders,
          max: entitlements.max_riders,
          unlimited: entitlements.max_riders === -1,
        },
        dailyAssignments: {
          current: usage.assignmentsToday,
          max: entitlements.max_assignments_per_day,
          unlimited: entitlements.max_assignments_per_day === -1,
        },
      },
      features: {
        autoAssignment: entitlements.auto_assignment_enabled,
        realTimeTracking: entitlements.real_time_tracking_enabled,
        proofOfDelivery: entitlements.proof_of_delivery_enabled,
        expressDelivery: entitlements.express_delivery_enabled,
        apiAccess: entitlements.api_access_enabled,
      },
    }
  }

  /**
   * Enforce entitlement (throws if not allowed)
   */
  static async enforceEntitlement(
    tenantId: string,
    action: keyof LogisticsEntitlements | 'create_zone' | 'create_rider' | 'create_assignment'
  ): Promise<void> {
    const check = await this.checkEntitlement(tenantId, action)
    if (!check.allowed) {
      throw new Error(check.reason || `Action '${action}' is not allowed`)
    }
  }
}
