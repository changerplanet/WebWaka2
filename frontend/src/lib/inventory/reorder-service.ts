/**
 * MODULE 1: Inventory & Warehouse Management
 * Reorder Service - Intelligent reordering logic
 * 
 * CRITICAL: This is ADVISORY ONLY - no automatic purchasing.
 * Generates suggestions based on rules, velocity, and thresholds.
 * 
 * Nigeria-first considerations:
 * - Support informal suppliers (phone, WhatsApp)
 * - Manual fulfillment workflows
 * - No automatic purchase execution
 */

import { prisma } from '../prisma';
import { emitInventoryEvent } from './event-emitter';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================================
// TYPES
// ============================================================================

export interface ReorderRuleInput {
  name: string;
  description?: string;
  productId?: string;
  variantId?: string;
  categoryId?: string;
  locationId?: string;
  triggerType: 'BELOW_THRESHOLD' | 'VELOCITY_BASED' | 'SCHEDULED' | 'MANUAL';
  reorderPoint?: number;
  reorderQuantity?: number;
  minDaysOfStock?: number;
  targetDaysOfStock?: number;
  velocityPeriodDays?: number;
  preferredSupplierId?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  orderMultiple?: number;
  supplierLeadTimeDays?: number;
  maxUnitCost?: number;
  scheduleExpression?: string;
  priority?: number;
}

export interface ReorderSuggestionResponse {
  id: string;
  tenantId: string;
  ruleId?: string;
  ruleName?: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku?: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  avgDailySales?: number;
  daysOfStockLeft?: number;
  velocityTrend?: string;
  suggestedQuantity: number;
  suggestedSupplierId?: string;
  suggestedSupplierName?: string;
  estimatedUnitCost?: number;
  estimatedTotalCost?: number;
  currency: string;
  urgency: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface VelocityData {
  productId: string;
  variantId?: string;
  locationId: string;
  avgDailySales: number;
  totalSold: number;
  periodDays: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

// ============================================================================
// REORDER RULE SERVICE
// ============================================================================

export class ReorderRuleService {
  /**
   * Create a new reorder rule
   */
  static async create(
    tenantId: string,
    data: ReorderRuleInput
  ): Promise<{ id: string }> {
    const rule = await (prisma.inv_reorder_rules.create as any)({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        productId: data.productId,
        variantId: data.variantId,
        categoryId: data.categoryId,
        locationId: data.locationId,
        triggerType: data.triggerType,
        reorderPoint: data.reorderPoint,
        reorderQuantity: data.reorderQuantity,
        minDaysOfStock: data.minDaysOfStock,
        targetDaysOfStock: data.targetDaysOfStock,
        velocityPeriodDays: data.velocityPeriodDays || 30,
        preferredSupplierId: data.preferredSupplierId,
        minOrderQuantity: data.minOrderQuantity,
        maxOrderQuantity: data.maxOrderQuantity,
        orderMultiple: data.orderMultiple,
        supplierLeadTimeDays: data.supplierLeadTimeDays || 7,
        maxUnitCost: data.maxUnitCost,
        scheduleExpression: data.scheduleExpression,
        priority: data.priority || 0,
        isActive: true,
      },
    });

    return { id: rule.id };
  }

  /**
   * List reorder rules for a tenant
   */
  static async list(
    tenantId: string,
    options?: {
      productId?: string;
      categoryId?: string;
      locationId?: string;
      triggerType?: string;
      isActive?: boolean;
    }
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (options?.productId) where.productId = options.productId;
    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.locationId) where.locationId = options.locationId;
    if (options?.triggerType) where.triggerType = options.triggerType;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    return prisma.inv_reorder_rules.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Update a reorder rule
   */
  static async update(
    tenantId: string,
    ruleId: string,
    data: Partial<ReorderRuleInput>
  ) {
    const existing = await prisma.inv_reorder_rules.findFirst({
      where: { id: ruleId, tenantId },
    });

    if (!existing) {
      throw new Error('Reorder rule not found');
    }

    return prisma.inv_reorder_rules.update({
      where: { id: ruleId },
      data: {
        name: data.name,
        description: data.description,
        productId: data.productId,
        variantId: data.variantId,
        categoryId: data.categoryId,
        locationId: data.locationId,
        triggerType: data.triggerType,
        reorderPoint: data.reorderPoint,
        reorderQuantity: data.reorderQuantity,
        minDaysOfStock: data.minDaysOfStock,
        targetDaysOfStock: data.targetDaysOfStock,
        velocityPeriodDays: data.velocityPeriodDays,
        preferredSupplierId: data.preferredSupplierId,
        minOrderQuantity: data.minOrderQuantity,
        maxOrderQuantity: data.maxOrderQuantity,
        orderMultiple: data.orderMultiple,
        supplierLeadTimeDays: data.supplierLeadTimeDays,
        maxUnitCost: data.maxUnitCost,
        scheduleExpression: data.scheduleExpression,
        priority: data.priority,
      },
    });
  }

  /**
   * Delete (deactivate) a reorder rule
   */
  static async deactivate(tenantId: string, ruleId: string) {
    const existing = await prisma.inv_reorder_rules.findFirst({
      where: { id: ruleId, tenantId },
    });

    if (!existing) {
      throw new Error('Reorder rule not found');
    }

    await prisma.inv_reorder_rules.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
  }
}

// ============================================================================
// REORDER SUGGESTION ENGINE
// ============================================================================

export class ReorderSuggestionEngine {
  /**
   * Calculate sales velocity for a product at a location
   * Uses stock movements to estimate daily sales
   */
  static async calculateVelocity(
    tenantId: string,
    productId: string,
    locationId: string,
    periodDays: number = 30,
    variantId?: string
  ): Promise<VelocityData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get sales movements (negative quantities = sold)
    const movements = await (prisma.wh_stock_movement.findMany as any)({
      where: {
        tenantId,
        productId,
        variantId: variantId || null,
        warehouseId: locationId, // wh_stock_movement uses warehouseId
        reason: 'SALE',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalSold = movements.reduce(
      (sum: number, m: any) => sum + Math.abs(m.quantity),
      0
    );
    const avgDailySales = totalSold / periodDays;

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(movements.length / 2);
    const firstHalf = movements.slice(0, midpoint);
    const secondHalf = movements.slice(midpoint);

    const firstHalfTotal = firstHalf.reduce(
      (sum: number, m: any) => sum + Math.abs(m.quantity),
      0
    );
    const secondHalfTotal = secondHalf.reduce(
      (sum: number, m: any) => sum + Math.abs(m.quantity),
      0
    );

    let trend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
    if (secondHalfTotal > firstHalfTotal * 1.2) {
      trend = 'INCREASING';
    } else if (secondHalfTotal < firstHalfTotal * 0.8) {
      trend = 'DECREASING';
    }

    return {
      productId,
      variantId,
      locationId,
      avgDailySales,
      totalSold,
      periodDays,
      trend,
    };
  }

  /**
   * Check if a product needs reordering based on a rule
   */
  static async checkRule(
    tenantId: string,
    rule: {
      id: string;
      productId: string | null;
      variantId: string | null;
      categoryId: string | null;
      locationId: string | null;
      triggerType: string;
      reorderPoint: number | null;
      reorderQuantity: number | null;
      minDaysOfStock: number | null;
      targetDaysOfStock: number | null;
      velocityPeriodDays: number;
      preferredSupplierId: string | null;
      minOrderQuantity: number | null;
      maxOrderQuantity: number | null;
      orderMultiple: number | null;
      supplierLeadTimeDays: number;
      maxUnitCost: Decimal | null;
    }
  ): Promise<Array<{
    productId: string;
    variantId?: string;
    locationId: string;
    suggestedQuantity: number;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    reason: string;
    velocity?: VelocityData;
    currentQuantity: number;
    availableQuantity: number;
  }>> {
    const suggestions: Array<{
      productId: string;
      variantId?: string;
      locationId: string;
      suggestedQuantity: number;
      urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
      reason: string;
      velocity?: VelocityData;
      currentQuantity: number;
      availableQuantity: number;
    }> = [];

    // Build query for inventory levels
    const inventoryWhere: Record<string, unknown> = { tenantId };

    if (rule.productId) {
      inventoryWhere.productId = rule.productId;
    }
    if (rule.variantId) {
      inventoryWhere.variantId = rule.variantId;
    }
    if (rule.locationId) {
      inventoryWhere.locationId = rule.locationId;
    }

    // If category-based, get products in category
    let productIds: string[] = [];
    if (rule.categoryId) {
      const products = await prisma.product.findMany({
        where: { tenantId, categoryId: rule.categoryId },
        select: { id: true },
      });
      productIds = products.map(p => p.id);
      inventoryWhere.productId = { in: productIds };
    }

    const inventoryLevels = await prisma.inventoryLevel.findMany({
      where: inventoryWhere,
      include: {
        Product: true,
        ProductVariant: true,
        Location: true,
      },
    });

    for (const inventory of inventoryLevels) {
      let shouldReorder = false;
      let suggestedQty = rule.reorderQuantity || 0;
      let urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';
      let reason = '';
      let velocity: VelocityData | undefined;

      if (rule.triggerType === 'BELOW_THRESHOLD' && rule.reorderPoint) {
        // Simple threshold check
        if (inventory.quantityAvailable <= rule.reorderPoint) {
          shouldReorder = true;
          reason = `Stock (${inventory.quantityAvailable}) at or below reorder point (${rule.reorderPoint})`;

          // Determine urgency
          if (inventory.quantityAvailable <= 0) {
            urgency = 'CRITICAL';
          } else if (inventory.quantityAvailable <= rule.reorderPoint * 0.5) {
            urgency = 'HIGH';
          }
        }
      } else if (rule.triggerType === 'VELOCITY_BASED') {
        // Calculate velocity-based reorder
        velocity = await this.calculateVelocity(
          tenantId,
          inventory.productId,
          inventory.locationId,
          rule.velocityPeriodDays,
          inventory.variantId || undefined
        );

        const daysOfStock = velocity.avgDailySales > 0
          ? inventory.quantityAvailable / velocity.avgDailySales
          : Infinity;

        const minDays = rule.minDaysOfStock || 7;
        const targetDays = rule.targetDaysOfStock || 30;
        const leadTime = rule.supplierLeadTimeDays || 7;

        // Account for lead time
        const effectiveMinDays = minDays + leadTime;

        if (daysOfStock <= effectiveMinDays) {
          shouldReorder = true;
          
          // Calculate quantity needed to reach target days
          const targetQuantity = Math.ceil(velocity.avgDailySales * targetDays);
          suggestedQty = Math.max(
            targetQuantity - inventory.quantityAvailable,
            rule.reorderQuantity || 0
          );

          reason = `${Math.round(daysOfStock)} days of stock remaining (min: ${minDays}, lead time: ${leadTime} days)`;

          // Adjust for velocity trend
          if (velocity.trend === 'INCREASING') {
            suggestedQty = Math.ceil(suggestedQty * 1.2);
            reason += '. Sales trend: INCREASING (+20% buffer)';
          }

          // Determine urgency
          if (daysOfStock <= leadTime) {
            urgency = 'CRITICAL';
          } else if (daysOfStock <= effectiveMinDays * 0.5) {
            urgency = 'HIGH';
          } else if (daysOfStock <= effectiveMinDays) {
            urgency = 'NORMAL';
          }
        }
      }

      if (shouldReorder && suggestedQty > 0) {
        // Apply order constraints
        if (rule.minOrderQuantity && suggestedQty < rule.minOrderQuantity) {
          suggestedQty = rule.minOrderQuantity;
        }
        if (rule.maxOrderQuantity && suggestedQty > rule.maxOrderQuantity) {
          suggestedQty = rule.maxOrderQuantity;
        }
        if (rule.orderMultiple && rule.orderMultiple > 1) {
          suggestedQty = Math.ceil(suggestedQty / rule.orderMultiple) * rule.orderMultiple;
        }

        suggestions.push({
          productId: inventory.productId,
          variantId: inventory.variantId || undefined,
          locationId: inventory.locationId,
          suggestedQuantity: suggestedQty,
          urgency,
          reason,
          velocity,
          currentQuantity: inventory.quantityOnHand,
          availableQuantity: inventory.quantityAvailable,
        });
      }
    }

    return suggestions;
  }

  /**
   * Run all active reorder rules and generate suggestions
   */
  static async generateSuggestions(
    tenantId: string,
    options?: {
      ruleId?: string;
      productId?: string;
      locationId?: string;
    }
  ): Promise<ReorderSuggestionResponse[]> {
    // Get active rules
    const rulesWhere: Record<string, unknown> = {
      tenantId,
      isActive: true,
    };

    if (options?.ruleId) {
      rulesWhere.id = options.ruleId;
    }
    if (options?.productId) {
      rulesWhere.OR = [
        { productId: options.productId },
        { productId: null }, // Also include global rules
      ];
    }
    if (options?.locationId) {
      rulesWhere.OR = [
        ...(rulesWhere.OR as Array<Record<string, unknown>> || []),
        { locationId: options.locationId },
        { locationId: null },
      ];
    }

    const rules = await prisma.inv_reorder_rules.findMany({
      where: rulesWhere,
      orderBy: { priority: 'desc' },
    });

    const allSuggestions: ReorderSuggestionResponse[] = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Suggestions expire in 7 days

    for (const rule of rules) {
      const ruleSuggestions = await this.checkRule(tenantId, rule);

      for (const suggestion of ruleSuggestions) {
        // Check for existing pending suggestion for same product/location
        const existing = await prisma.inv_reorder_suggestions.findFirst({
          where: {
            tenantId,
            productId: suggestion.productId,
            variantId: suggestion.variantId || null,
            locationId: suggestion.locationId,
            status: 'PENDING',
          },
        });

        if (existing) {
          // Update existing suggestion if new one is more urgent
          const urgencyOrder = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
          if (urgencyOrder.indexOf(suggestion.urgency) > urgencyOrder.indexOf(existing.urgency)) {
            await prisma.inv_reorder_suggestions.update({
              where: { id: existing.id },
              data: {
                suggestedQuantity: suggestion.suggestedQuantity,
                urgency: suggestion.urgency,
                currentQuantity: suggestion.currentQuantity,
                availableQuantity: suggestion.availableQuantity,
                avgDailySales: suggestion.velocity?.avgDailySales,
                daysOfStockLeft: suggestion.velocity
                  ? Math.round(suggestion.availableQuantity / (suggestion.velocity.avgDailySales || 1))
                  : null,
                velocityTrend: suggestion.velocity?.trend,
                expiresAt,
              },
            });
          }
          continue;
        }

        // Get product and location details
        const [product, location, supplier] = await Promise.all([
          prisma.product.findUnique({
            where: { id: suggestion.productId },
            include: { ProductVariant: true },
          }),
          prisma.location.findUnique({ where: { id: suggestion.locationId } }),
          rule.preferredSupplierId
            ? prisma.supplier.findUnique({ where: { id: rule.preferredSupplierId } })
            : null,
        ]);

        if (!product || !location) continue;

        const productAny = product as any;
        const variant = suggestion.variantId
          ? productAny.ProductVariant?.find((v: any) => v.id === suggestion.variantId)
          : null;

        // Calculate estimated cost
        const unitCost = variant?.costPrice || product.costPrice;
        const estimatedUnitCost = unitCost ? Number(unitCost) : undefined;
        const estimatedTotalCost = estimatedUnitCost
          ? estimatedUnitCost * suggestion.suggestedQuantity
          : undefined;

        // Create suggestion
        const created = await (prisma.inv_reorder_suggestions.create as any)({
          data: {
            tenantId,
            ruleId: rule.id,
            productId: suggestion.productId,
            variantId: suggestion.variantId,
            productName: product.name,
            variantName: variant?.name,
            sku: variant?.sku || product.sku,
            locationId: suggestion.locationId,
            locationName: location.name,
            currentQuantity: suggestion.currentQuantity,
            reservedQuantity: suggestion.currentQuantity - suggestion.availableQuantity,
            availableQuantity: suggestion.availableQuantity,
            avgDailySales: suggestion.velocity?.avgDailySales,
            daysOfStockLeft: suggestion.velocity
              ? Math.round(suggestion.availableQuantity / (suggestion.velocity.avgDailySales || 1))
              : null,
            velocityTrend: suggestion.velocity?.trend,
            suggestedQuantity: suggestion.suggestedQuantity,
            suggestedSupplierId: rule.preferredSupplierId,
            suggestedSupplierName: supplier?.name,
            estimatedUnitCost,
            estimatedTotalCost,
            currency: 'NGN',
            urgency: suggestion.urgency,
            status: 'PENDING',
            expiresAt,
            calculationDetails: JSON.parse(JSON.stringify({
              reason: suggestion.reason,
              velocity: suggestion.velocity,
              rule: {
                id: rule.id,
                name: rule.name,
                triggerType: rule.triggerType,
              },
            })),
          },
        });

        // Emit event
        await emitInventoryEvent({
          type: 'REORDER_SUGGESTED',
          tenantId,
          payload: {
            suggestionId: created.id,
            productId: suggestion.productId,
            variantId: suggestion.variantId,
            locationId: suggestion.locationId,
            currentQuantity: suggestion.currentQuantity,
            suggestedQuantity: suggestion.suggestedQuantity,
            suggestedSupplierId: rule.preferredSupplierId || undefined,
            urgency: suggestion.urgency,
            reason: suggestion.reason,
          },
        });

        allSuggestions.push(this.toResponse(created, rule.name));
      }
    }

    return allSuggestions;
  }

  /**
   * List suggestions with filters
   */
  static async listSuggestions(
    tenantId: string,
    options?: {
      status?: string | string[];
      urgency?: string | string[];
      productId?: string;
      locationId?: string;
      supplierId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ suggestions: ReorderSuggestionResponse[]; total: number }> {
    const where: Record<string, unknown> = { tenantId };

    if (options?.status) {
      where.status = Array.isArray(options.status)
        ? { in: options.status }
        : options.status;
    }
    if (options?.urgency) {
      where.urgency = Array.isArray(options.urgency)
        ? { in: options.urgency }
        : options.urgency;
    }
    if (options?.productId) {
      where.productId = options.productId;
    }
    if (options?.locationId) {
      where.locationId = options.locationId;
    }
    if (options?.supplierId) {
      where.suggestedSupplierId = options.supplierId;
    }

    const [suggestions, total] = await Promise.all([
      prisma.inv_reorder_suggestions.findMany({
        where,
        include: { inv_reorder_rules: true },
        orderBy: [
          { urgency: 'desc' },
          { createdAt: 'desc' },
        ],
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.inv_reorder_suggestions.count({ where }),
    ]);

    return {
      suggestions: suggestions.map(s => this.toResponse(s, (s as any).inv_reorder_rules?.name)),
      total,
    };
  }

  /**
   * Approve a suggestion (marks it for ordering)
   */
  static async approveSuggestion(
    tenantId: string,
    suggestionId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    const suggestion = await prisma.inv_reorder_suggestions.findFirst({
      where: { id: suggestionId, tenantId },
    });

    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    if (suggestion.status !== 'PENDING') {
      throw new Error('Suggestion is not pending');
    }

    await prisma.inv_reorder_suggestions.update({
      where: { id: suggestionId },
      data: {
        status: 'APPROVED',
        reviewedById: userId,
        reviewedByName: userName,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Reject a suggestion
   */
  static async rejectSuggestion(
    tenantId: string,
    suggestionId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    const suggestion = await prisma.inv_reorder_suggestions.findFirst({
      where: { id: suggestionId, tenantId },
    });

    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    if (suggestion.status !== 'PENDING') {
      throw new Error('Suggestion is not pending');
    }

    await prisma.inv_reorder_suggestions.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        reviewedById: userId,
        reviewedByName: userName,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  /**
   * Get low stock alerts (quick check without full rule processing)
   */
  static async getLowStockAlerts(
    tenantId: string,
    options?: {
      locationId?: string;
      threshold?: number; // Default: use reorderPoint from InventoryLevel
    }
  ): Promise<Array<{
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    sku?: string;
    locationId: string;
    locationName: string;
    quantityAvailable: number;
    reorderPoint: number;
    urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  }>> {
    const where: Record<string, unknown> = { tenantId };
    
    if (options?.locationId) {
      where.locationId = options.locationId;
    }

    const inventoryLevels = await prisma.inventoryLevel.findMany({
      where,
      include: {
        Product: true,
        ProductVariant: true,
        Location: true,
      },
    });

    const alerts: Array<{
      productId: string;
      productName: string;
      variantId?: string;
      variantName?: string;
      sku?: string;
      locationId: string;
      locationName: string;
      quantityAvailable: number;
      reorderPoint: number;
      urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    }> = [];

    for (const inv of inventoryLevels) {
      const threshold = options?.threshold || inv.reorderPoint || 10;
      const invAny = inv as any;

      if (inv.quantityAvailable <= threshold) {
        let urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';

        if (inv.quantityAvailable <= 0) {
          urgency = 'CRITICAL';
        } else if (inv.quantityAvailable <= threshold * 0.25) {
          urgency = 'HIGH';
        } else if (inv.quantityAvailable <= threshold * 0.5) {
          urgency = 'NORMAL';
        } else {
          urgency = 'LOW';
        }

        alerts.push({
          productId: inv.productId,
          productName: invAny.Product?.name || 'Unknown',
          variantId: inv.variantId || undefined,
          variantName: invAny.ProductVariant?.name || undefined,
          sku: invAny.ProductVariant?.sku || invAny.Product?.sku || undefined,
          locationId: inv.locationId,
          locationName: invAny.Location?.name || 'Unknown',
          quantityAvailable: inv.quantityAvailable,
          reorderPoint: threshold,
          urgency,
        });
      }
    }

    // Sort by urgency
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
    alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return alerts;
  }

  /**
   * Convert to response format
   */
  private static toResponse(
    suggestion: {
      id: string;
      tenantId: string;
      ruleId: string | null;
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string | null;
      locationId: string;
      locationName: string;
      currentQuantity: number;
      reservedQuantity: number;
      availableQuantity: number;
      avgDailySales: Decimal | null;
      daysOfStockLeft: number | null;
      velocityTrend: string | null;
      suggestedQuantity: number;
      suggestedSupplierId: string | null;
      suggestedSupplierName: string | null;
      estimatedUnitCost: Decimal | null;
      estimatedTotalCost: Decimal | null;
      currency: string;
      urgency: string;
      status: string;
      expiresAt: Date;
      createdAt: Date;
    },
    ruleName?: string
  ): ReorderSuggestionResponse {
    return {
      id: suggestion.id,
      tenantId: suggestion.tenantId,
      ruleId: suggestion.ruleId || undefined,
      ruleName,
      productId: suggestion.productId,
      variantId: suggestion.variantId || undefined,
      productName: suggestion.productName,
      variantName: suggestion.variantName || undefined,
      sku: suggestion.sku || undefined,
      locationId: suggestion.locationId,
      locationName: suggestion.locationName,
      currentQuantity: suggestion.currentQuantity,
      reservedQuantity: suggestion.reservedQuantity,
      availableQuantity: suggestion.availableQuantity,
      avgDailySales: suggestion.avgDailySales ? Number(suggestion.avgDailySales) : undefined,
      daysOfStockLeft: suggestion.daysOfStockLeft || undefined,
      velocityTrend: suggestion.velocityTrend || undefined,
      suggestedQuantity: suggestion.suggestedQuantity,
      suggestedSupplierId: suggestion.suggestedSupplierId || undefined,
      suggestedSupplierName: suggestion.suggestedSupplierName || undefined,
      estimatedUnitCost: suggestion.estimatedUnitCost ? Number(suggestion.estimatedUnitCost) : undefined,
      estimatedTotalCost: suggestion.estimatedTotalCost ? Number(suggestion.estimatedTotalCost) : undefined,
      currency: suggestion.currency,
      urgency: suggestion.urgency,
      status: suggestion.status,
      expiresAt: suggestion.expiresAt,
      createdAt: suggestion.createdAt,
    };
  }
}
