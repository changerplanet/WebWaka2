/**
 * MODULE 3: CRM & Customer Engagement
 * Segmentation Service
 * 
 * Implements rule-based and manual customer segmentation.
 * Nigeria-first: Supports incomplete profiles, phone-first identification.
 * 
 * SEGMENT TYPES:
 * - DYNAMIC: Auto-computed from rules
 * - STATIC: Manual membership
 * - COMBINED: Rules + manual additions
 * 
 * CONSTRAINTS:
 * - No direct customer data queries outside events
 * - Segments computed via aggregate queries
 * - Updates via scheduled jobs or events
 */

import { prisma } from '@/lib/prisma';
import { CrmSegmentType, CrmSegmentStatus, Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface SegmentRule {
  field: string;      // "totalSpent", "purchaseCount", "lastPurchaseDate", "channel", "tier"
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'notIn' | 'daysAgo';
  value: unknown;
}

export interface SegmentRuleSet {
  rules: SegmentRule[];
  combinator: 'AND' | 'OR';
}

export interface SegmentInput {
  name: string;
  slug?: string;
  description?: string;
  segmentType?: CrmSegmentType;
  rules?: SegmentRuleSet;
  tags?: string[];
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface SegmentUpdate {
  name?: string;
  description?: string;
  status?: CrmSegmentStatus;
  rules?: SegmentRuleSet;
  tags?: string[];
  priority?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// DEFAULT SEGMENTS (Nigeria SME)
// ============================================================================

export const DEFAULT_SEGMENTS: SegmentInput[] = [
  {
    name: 'VIP Customers',
    slug: 'vip-customers',
    description: 'High-value customers with total spend over ₦100,000',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'totalSpent', operator: 'gte', value: 100000 }],
      combinator: 'AND',
    },
    tags: ['auto', 'high-value'],
    priority: 100,
  },
  {
    name: 'Active Customers',
    slug: 'active-customers',
    description: 'Customers with purchases in the last 30 days',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'lastPurchaseDate', operator: 'daysAgo', value: 30 }],
      combinator: 'AND',
    },
    tags: ['auto', 'active'],
    priority: 80,
  },
  {
    name: 'At-Risk Customers',
    slug: 'at-risk-customers',
    description: 'Customers with no purchases in 60-90 days',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [
        { field: 'lastPurchaseDate', operator: 'daysAgo', value: 60 },
        { field: 'lastPurchaseDate', operator: 'daysAgo', value: 90 },
      ],
      combinator: 'AND',
    },
    tags: ['auto', 'at-risk'],
    priority: 90,
  },
  {
    name: 'Churned Customers',
    slug: 'churned-customers',
    description: 'Customers with no purchases in over 90 days',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'lastPurchaseDate', operator: 'daysAgo', value: 90 }],
      combinator: 'AND',
    },
    tags: ['auto', 'churned'],
    priority: 70,
  },
  {
    name: 'POS Customers',
    slug: 'pos-customers',
    description: 'Customers who primarily shop in-store',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'primaryChannel', operator: 'eq', value: 'POS' }],
      combinator: 'AND',
    },
    tags: ['auto', 'channel'],
    priority: 50,
  },
  {
    name: 'Online Customers',
    slug: 'online-customers',
    description: 'Customers who primarily shop online',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'primaryChannel', operator: 'in', value: ['ONLINE', 'MARKETPLACE'] }],
      combinator: 'AND',
    },
    tags: ['auto', 'channel'],
    priority: 50,
  },
  {
    name: 'New Customers',
    slug: 'new-customers',
    description: 'Customers created in the last 30 days',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'createdAt', operator: 'daysAgo', value: 30 }],
      combinator: 'AND',
    },
    tags: ['auto', 'new'],
    priority: 60,
  },
  {
    name: 'Repeat Customers',
    slug: 'repeat-customers',
    description: 'Customers with 3+ purchases',
    segmentType: 'DYNAMIC',
    rules: {
      rules: [{ field: 'purchaseCount', operator: 'gte', value: 3 }],
      combinator: 'AND',
    },
    tags: ['auto', 'repeat'],
    priority: 75,
  },
];

// ============================================================================
// SEGMENTATION SERVICE
// ============================================================================

export class SegmentationService {
  /**
   * Initialize default segments for a tenant
   */
  static async initializeDefaults(tenantId: string, createdBy?: string) {
    const results = [];

    for (const segment of DEFAULT_SEGMENTS) {
      // Check if already exists
      const existing = await prisma.crm_customer_segments.findUnique({
        where: { tenantId_slug: { tenantId, slug: segment.slug! } },
      });

      if (!existing) {
        const created = await this.create(tenantId, segment, createdBy);
        results.push({ action: 'created', segment: created });
      } else {
        results.push({ action: 'exists', segment: existing });
      }
    }

    return { success: true, results };
  }

  /**
   * Create a new segment
   */
  static async create(tenantId: string, input: SegmentInput, createdBy?: string) {
    // Generate slug if not provided
    const slug = input.slug || this.generateSlug(input.name);

    return prisma.crm_customer_segments.create({
      data: {
        tenantId,
        name: input.name,
        slug,
        description: input.description,
        segmentType: input.segmentType || 'DYNAMIC',
        rules: input.rules as Prisma.InputJsonValue | undefined,
        tags: input.tags || [],
        priority: input.priority || 0,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        createdBy,
      },
    });
  }

  /**
   * Update a segment
   */
  static async update(tenantId: string, segmentId: string, input: SegmentUpdate) {
    const segment = await prisma.crm_customer_segments.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    return prisma.crm_customer_segments.update({
      where: { id: segmentId },
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
        rules: input.rules as Prisma.InputJsonValue | undefined,
        tags: input.tags,
        priority: input.priority,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Delete a segment
   */
  static async delete(tenantId: string, segmentId: string) {
    const segment = await prisma.crm_customer_segments.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    // Check if used by campaigns
    const campaignUse = await prisma.crm_campaign_audiences.count({
      where: { segmentId },
    });

    if (campaignUse > 0) {
      throw new Error(`Segment is used by ${campaignUse} campaign(s). Archive it instead.`);
    }

    await prisma.crm_customer_segments.delete({
      where: { id: segmentId },
    });

    return { success: true };
  }

  /**
   * List segments
   */
  static async list(
    tenantId: string,
    options?: {
      status?: CrmSegmentStatus;
      segmentType?: CrmSegmentType;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.CrmCustomerSegmentWhereInput = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.segmentType) where.segmentType = options.segmentType;
    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    const [segments, total] = await Promise.all([
      prisma.crm_customer_segments.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.crm_customer_segments.count({ where }),
    ]);

    return { segments, total };
  }

  /**
   * Get segment by ID
   */
  static async getById(tenantId: string, segmentId: string) {
    return prisma.crm_customer_segments.findFirst({
      where: { id: segmentId, tenantId },
      include: {
        _count: {
          select: { memberships: true, campaigns: true },
        },
      },
    });
  }

  /**
   * Add customer to segment (manual)
   */
  static async addCustomer(
    tenantId: string,
    segmentId: string,
    customerId: string,
    addedBy?: string
  ) {
    const segment = await prisma.crm_customer_segments.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    // Check if already member
    const existing = await prisma.crm_segment_memberships.findUnique({
      where: { segmentId_customerId: { segmentId, customerId } },
    });

    if (existing) {
      return { action: 'exists', membership: existing };
    }

    const membership = await prisma.crm_segment_memberships.create({
      data: {
        tenantId,
        segmentId,
        customerId,
        addedBy,
        isManual: true,
      },
    });

    // Update member count
    await prisma.crm_customer_segments.update({
      where: { id: segmentId },
      data: { memberCount: { increment: 1 } },
    });

    return { action: 'added', membership };
  }

  /**
   * Remove customer from segment
   */
  static async removeCustomer(tenantId: string, segmentId: string, customerId: string) {
    const membership = await prisma.crm_segment_memberships.findUnique({
      where: { segmentId_customerId: { segmentId, customerId } },
    });

    if (!membership) {
      throw new Error('Customer is not a member of this segment');
    }

    await prisma.crm_segment_memberships.delete({
      where: { id: membership.id },
    });

    // Update member count
    await prisma.crm_customer_segments.update({
      where: { id: segmentId },
      data: { memberCount: { decrement: 1 } },
    });

    return { success: true };
  }

  /**
   * Get segment members
   */
  static async getMembers(
    tenantId: string,
    segmentId: string,
    options?: { limit?: number; offset?: number }
  ) {
    const memberships = await prisma.crm_segment_memberships.findMany({
      where: { segmentId, tenantId },
      orderBy: { addedAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    // Get customer details from Core
    const customerIds = memberships.map(m => m.customerId);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        totalSpent: true,
        totalOrders: true,
        loyaltyTier: true,
      },
    });

    const customerMap = new Map(customers.map(c => [c.id, { ...c, name: c.fullName }]));

    return memberships.map(m => ({
      ...m,
      customer: customerMap.get(m.customerId) || null,
    }));
  }

  /**
   * Compute segment membership based on rules
   * This is called by a scheduled job or event processor
   */
  static async computeSegment(tenantId: string, segmentId: string) {
    const segment = await prisma.crm_customer_segments.findFirst({
      where: { id: segmentId, tenantId },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    if (segment.segmentType === 'STATIC') {
      return { success: true, message: 'Static segments are not computed', memberCount: segment.memberCount };
    }

    const rules = segment.rules as SegmentRuleSet | null;
    if (!rules?.rules?.length) {
      return { success: true, message: 'No rules defined', memberCount: 0 };
    }

    try {
      // Build customer query based on rules
      const customerWhere = this.buildCustomerQuery(tenantId, rules);
      
      // Get matching customers
      const matchingCustomers = await prisma.customer.findMany({
        where: customerWhere,
        select: { id: true },
      });

      const matchingIds = new Set(matchingCustomers.map(c => c.id));

      // Get current memberships
      const currentMemberships = await prisma.crm_segment_memberships.findMany({
        where: { segmentId, isManual: false },
        select: { id: true, customerId: true },
      });

      const currentIds = new Set(currentMemberships.map(m => m.customerId));

      // Determine additions and removals
      const toAdd = [...matchingIds].filter(id => !currentIds.has(id));
      const toRemove = currentMemberships.filter(m => !matchingIds.has(m.customerId));

      // Add new members
      if (toAdd.length > 0) {
        await prisma.crm_segment_memberships.createMany({
          data: toAdd.map(customerId => ({
            tenantId,
            segmentId,
            customerId,
            isManual: false,
          })),
          skipDuplicates: true,
        });
      }

      // Remove old members (non-manual only)
      if (toRemove.length > 0) {
        await prisma.crm_segment_memberships.deleteMany({
          where: { id: { in: toRemove.map(m => m.id) } },
        });
      }

      // Update segment metadata
      const finalCount = await prisma.crm_segment_memberships.count({ where: { segmentId } });
      await prisma.crm_customer_segments.update({
        where: { id: segmentId },
        data: {
          memberCount: finalCount,
          lastComputedAt: new Date(),
          computeError: null,
        },
      });

      return {
        success: true,
        added: toAdd.length,
        removed: toRemove.length,
        memberCount: finalCount,
      };
    } catch (error) {
      // Log error to segment
      await prisma.crm_customer_segments.update({
        where: { id: segmentId },
        data: {
          computeError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Get customer's segments
   */
  static async getCustomerSegments(tenantId: string, customerId: string) {
    const memberships = await prisma.crm_segment_memberships.findMany({
      where: { tenantId, customerId },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            priority: true,
            tags: true,
          },
        },
      },
    });

    return memberships.map(m => ({
      ...m.segment,
      isManual: m.isManual,
      addedAt: m.addedAt,
    }));
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private static buildCustomerQuery(
    tenantId: string,
    ruleSet: SegmentRuleSet
  ): Prisma.CustomerWhereInput {
    const conditions: Prisma.CustomerWhereInput[] = [];

    for (const rule of ruleSet.rules) {
      const condition = this.buildRuleCondition(rule);
      if (condition) {
        conditions.push(condition);
      }
    }

    const where: Prisma.CustomerWhereInput = { tenantId };

    if (conditions.length > 0) {
      if (ruleSet.combinator === 'OR') {
        where.OR = conditions;
      } else {
        where.AND = conditions;
      }
    }

    return where;
  }

  private static buildRuleCondition(rule: SegmentRule): Prisma.CustomerWhereInput | null {
    const { field, operator, value } = rule;

    switch (field) {
      case 'totalSpent':
        return this.buildNumericCondition('totalSpent', operator, value as number);
      
      case 'purchaseCount':
      case 'totalOrders':
        return this.buildNumericCondition('totalOrders', operator, value as number);
      
      case 'loyaltyPoints':
        return this.buildNumericCondition('loyaltyPoints', operator, value as number);
      
      case 'loyaltyTier':
        return { loyaltyTier: operator === 'eq' ? value as string : undefined };
      
      case 'lastPurchaseDate':
        if (operator === 'daysAgo') {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - (value as number));
          return { lastOrderAt: { gte: daysAgo } };
        }
        return null;
      
      case 'createdAt':
        if (operator === 'daysAgo') {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - (value as number));
          return { createdAt: { gte: daysAgo } };
        }
        return null;
      
      case 'primaryChannel':
        // This would need to be computed from orders
        return null;
      
      default:
        return null;
    }
  }

  private static buildNumericCondition(
    field: string,
    operator: string,
    value: number
  ): Prisma.CustomerWhereInput {
    const prismaOp: Record<string, unknown> = {};

    switch (operator) {
      case 'eq': prismaOp.equals = value; break;
      case 'ne': prismaOp.not = value; break;
      case 'gt': prismaOp.gt = value; break;
      case 'gte': prismaOp.gte = value; break;
      case 'lt': prismaOp.lt = value; break;
      case 'lte': prismaOp.lte = value; break;
      default: return {};
    }

    return { [field]: prismaOp };
  }
}
