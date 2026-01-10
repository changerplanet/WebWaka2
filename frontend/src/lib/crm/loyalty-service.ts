/**
 * MODULE 3: CRM & Customer Engagement
 * Loyalty Service
 * 
 * Implements points-based loyalty system with earn/redeem rules.
 * Nigeria-first: Simple points logic, offline-safe earning.
 * 
 * CONSTRAINTS:
 * - Loyalty points are NOT money (not stored in wallets)
 * - Redemption emits events only (Core applies discounts)
 * - Ledger is append-only (immutable)
 * - Offline POS can earn points (synced later)
 */

import { prisma } from '@/lib/prisma';
import { CrmLoyaltyTransactionType, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

// ============================================================================
// TYPES
// ============================================================================

export interface LoyaltyProgramInput {
  name: string;
  description?: string;
  pointsName?: string;
  pointsSymbol?: string;
  pointsPerCurrency?: number;
  currencyPerPoint?: number;
  pointsExpireMonths?: number;
  tierConfig?: TierConfig;
}

export interface TierConfig {
  tiers: Array<{
    name: string;
    minPoints: number;
    multiplier?: number;
    perks?: string[];
  }>;
}

export interface EarnInput {
  customerId: string;
  points: number;
  sourceType: string;
  sourceId?: string;
  description?: string;
  ruleId?: string;
  expiresAt?: Date;
}

export interface RedeemInput {
  customerId: string;
  points: number;
  sourceType: string;
  sourceId?: string;
  description?: string;
}

export interface LoyaltyRuleInput {
  name: string;
  description?: string;
  ruleType: 'EARN' | 'REDEEM' | 'BONUS' | 'MULTIPLIER';
  conditions?: Record<string, unknown>;
  pointsValue?: number;
  pointsMultiplier?: number;
  percentValue?: number;
  segmentId?: string;
  startsAt?: Date;
  endsAt?: Date;
  maxUsesPerCustomer?: number;
  maxTotalUses?: number;
  priority?: number;
}

// ============================================================================
// DEFAULT TIER CONFIGURATION (Nigeria SME)
// ============================================================================

export const DEFAULT_TIER_CONFIG: TierConfig = {
  tiers: [
    { name: 'Bronze', minPoints: 0, multiplier: 1, perks: ['Basic rewards'] },
    { name: 'Silver', minPoints: 1000, multiplier: 1.25, perks: ['5% bonus points', 'Birthday reward'] },
    { name: 'Gold', minPoints: 5000, multiplier: 1.5, perks: ['10% bonus points', 'Priority support', 'Exclusive offers'] },
    { name: 'Platinum', minPoints: 10000, multiplier: 2, perks: ['20% bonus points', 'VIP events', 'Free delivery'] },
  ],
};

// ============================================================================
// LOYALTY SERVICE
// ============================================================================

export class LoyaltyService {
  /**
   * Initialize loyalty program for tenant
   */
  static async initialize(tenantId: string, input: LoyaltyProgramInput, createdBy?: string) {
    // Check if already exists
    const existing = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (existing) {
      return { action: 'exists', program: existing };
    }

    const program = await prisma.crm_loyalty_programs.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        pointsName: input.pointsName || 'Points',
        pointsSymbol: input.pointsSymbol || 'pts',
        pointsPerCurrency: input.pointsPerCurrency || 1,
        currencyPerPoint: input.currencyPerPoint,
        pointsExpireMonths: input.pointsExpireMonths,
        tierConfig: (input.tierConfig || DEFAULT_TIER_CONFIG) as unknown as Prisma.InputJsonValue,
        createdBy,
      },
    });

    // Update CRM config
    await prisma.crm_configurations.upsert({
      where: { tenantId },
      create: {
        tenantId,
        loyaltyEnabled: true,
        loyaltyProgramId: program.id,
      },
      update: {
        loyaltyEnabled: true,
        loyaltyProgramId: program.id,
      },
    });

    return { action: 'created', program };
  }

  /**
   * Get loyalty program
   */
  static async getProgram(tenantId: string) {
    return prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
      include: {
        rules: { where: { isActive: true }, orderBy: { priority: 'desc' } },
        _count: { select: { transactions: true } },
      },
    });
  }

  /**
   * Update loyalty program
   */
  static async updateProgram(tenantId: string, input: Partial<LoyaltyProgramInput>) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program) {
      throw new Error('Loyalty program not found. Initialize it first.');
    }

    return prisma.crm_loyalty_programs.update({
      where: { tenantId },
      data: {
        name: input.name,
        description: input.description,
        pointsName: input.pointsName,
        pointsSymbol: input.pointsSymbol,
        pointsPerCurrency: input.pointsPerCurrency,
        currencyPerPoint: input.currencyPerPoint,
        pointsExpireMonths: input.pointsExpireMonths,
        tierConfig: input.tierConfig as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Create loyalty rule
   */
  static async createRule(tenantId: string, input: LoyaltyRuleInput) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program) {
      throw new Error('Loyalty program not found. Initialize it first.');
    }

    return prisma.crm_loyalty_rules.create({
      data: {
        tenantId,
        programId: program.id,
        name: input.name,
        description: input.description,
        ruleType: input.ruleType,
        conditions: input.conditions as Prisma.InputJsonValue | undefined,
        pointsValue: input.pointsValue,
        pointsMultiplier: input.pointsMultiplier,
        percentValue: input.percentValue,
        segmentId: input.segmentId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        maxUsesPerCustomer: input.maxUsesPerCustomer,
        maxTotalUses: input.maxTotalUses,
        priority: input.priority || 0,
      },
    });
  }

  /**
   * Get loyalty rules
   */
  static async getRules(tenantId: string, options?: { ruleType?: string; isActive?: boolean }) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program) {
      return [];
    }

    return prisma.crm_loyalty_rules.findMany({
      where: {
        tenantId,
        programId: program.id,
        ruleType: options?.ruleType,
        isActive: options?.isActive,
      },
      orderBy: { priority: 'desc' },
      include: {
        segment: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Earn points for customer
   */
  static async earnPoints(tenantId: string, input: EarnInput, createdBy?: string) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program || !program.isActive) {
      throw new Error('Loyalty program is not active');
    }

    // Get current balance
    const currentBalance = await this.getCustomerBalance(tenantId, input.customerId);

    // Calculate expiry date if program has expiry
    let expiresAt = input.expiresAt;
    if (!expiresAt && program.pointsExpireMonths) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + program.pointsExpireMonths);
    }

    // Create transaction
    const transaction = await prisma.crm_loyalty_transactions.create({
      data: {
        tenantId,
        programId: program.id,
        customerId: input.customerId,
        transactionType: 'EARN',
        points: input.points,
        balanceAfter: currentBalance + input.points,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        ruleId: input.ruleId,
        description: input.description || `Earned ${input.points} points`,
        expiresAt,
        createdBy,
      },
    });

    // Update customer's loyalty points in Core
    await prisma.customer.update({
      where: { id: input.customerId },
      data: {
        loyaltyPoints: { increment: input.points },
        loyaltyTier: this.calculateTier(currentBalance + input.points, program.tierConfig as unknown as TierConfig),
      },
    });

    return transaction;
  }

  /**
   * Redeem points for customer
   */
  static async redeemPoints(tenantId: string, input: RedeemInput, createdBy?: string) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program || !program.isActive) {
      throw new Error('Loyalty program is not active');
    }

    // Get current balance
    const currentBalance = await this.getCustomerBalance(tenantId, input.customerId);

    if (currentBalance < input.points) {
      throw new Error(`Insufficient points. Available: ${currentBalance}, Requested: ${input.points}`);
    }

    // Create transaction
    const transaction = await prisma.crm_loyalty_transactions.create({
      data: {
        tenantId,
        programId: program.id,
        customerId: input.customerId,
        transactionType: 'REDEEM',
        points: -input.points, // Negative for redemption
        balanceAfter: currentBalance - input.points,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        description: input.description || `Redeemed ${input.points} points`,
        createdBy,
      },
    });

    // Update customer's loyalty points in Core
    await prisma.customer.update({
      where: { id: input.customerId },
      data: {
        loyaltyPoints: { decrement: input.points },
        loyaltyTier: this.calculateTier(currentBalance - input.points, program.tierConfig as unknown as TierConfig),
      },
    });

    return transaction;
  }

  /**
   * Award bonus points
   */
  static async awardBonus(
    tenantId: string,
    customerId: string,
    points: number,
    reason: string,
    createdBy?: string
  ) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program) {
      throw new Error('Loyalty program not found');
    }

    const currentBalance = await this.getCustomerBalance(tenantId, customerId);

    const transaction = await prisma.crm_loyalty_transactions.create({
      data: {
        tenantId,
        programId: program.id,
        customerId,
        transactionType: 'BONUS',
        points,
        balanceAfter: currentBalance + points,
        sourceType: 'MANUAL',
        description: reason,
        createdBy,
      },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: { increment: points },
        loyaltyTier: this.calculateTier(currentBalance + points, program.tierConfig as unknown as TierConfig),
      },
    });

    return transaction;
  }

  /**
   * Adjust points (admin)
   */
  static async adjustPoints(
    tenantId: string,
    customerId: string,
    points: number,
    reason: string,
    createdBy: string
  ) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program) {
      throw new Error('Loyalty program not found');
    }

    const currentBalance = await this.getCustomerBalance(tenantId, customerId);
    const newBalance = currentBalance + points;

    if (newBalance < 0) {
      throw new Error('Adjustment would result in negative balance');
    }

    const transaction = await prisma.crm_loyalty_transactions.create({
      data: {
        tenantId,
        programId: program.id,
        customerId,
        transactionType: 'ADJUSTMENT',
        points,
        balanceAfter: newBalance,
        sourceType: 'MANUAL',
        description: `Adjustment: ${reason}`,
        createdBy,
      },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: newBalance,
        loyaltyTier: this.calculateTier(newBalance, program.tierConfig as unknown as TierConfig),
      },
    });

    return transaction;
  }

  /**
   * Get customer balance
   */
  static async getCustomerBalance(tenantId: string, customerId: string): Promise<number> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { loyaltyPoints: true },
    });

    return customer?.loyaltyPoints || 0;
  }

  /**
   * Get customer transactions
   */
  static async getCustomerTransactions(
    tenantId: string,
    customerId: string,
    options?: { limit?: number; offset?: number; transactionType?: CrmLoyaltyTransactionType }
  ) {
    const where: Prisma.CrmLoyaltyTransactionWhereInput = { tenantId, customerId };
    if (options?.transactionType) {
      where.transactionType = options.transactionType;
    }

    return prisma.crm_loyalty_transactions.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get customer loyalty summary
   */
  static async getCustomerSummary(tenantId: string, customerId: string) {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
    });

    if (!program) {
      return null;
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      },
    });

    if (!customer) {
      return null;
    }

    // Get transaction stats
    const [totalEarned, totalRedeemed, transactionCount] = await Promise.all([
      prisma.crm_loyalty_transactions.aggregate({
        where: { tenantId, customerId, transactionType: 'EARN' },
        _sum: { points: true },
      }),
      prisma.crm_loyalty_transactions.aggregate({
        where: { tenantId, customerId, transactionType: 'REDEEM' },
        _sum: { points: true },
      }),
      prisma.crm_loyalty_transactions.count({
        where: { tenantId, customerId },
      }),
    ]);

    // Calculate tier progress
    const tierConfig = program.tierConfig as unknown as TierConfig;
    const currentTier = tierConfig?.tiers?.find(t => t.name === customer.loyaltyTier) ||
      tierConfig?.tiers?.[0];
    const nextTier = tierConfig?.tiers?.find(t => t.minPoints > customer.loyaltyPoints);
    const pointsToNextTier = nextTier ? nextTier.minPoints - customer.loyaltyPoints : 0;

    return {
      customer: {
        id: customer.id,
        name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
      program: {
        name: program.name,
        pointsName: program.pointsName,
        pointsSymbol: program.pointsSymbol,
      },
      balance: customer.loyaltyPoints,
      tier: customer.loyaltyTier || currentTier?.name || 'Bronze',
      tierPerks: currentTier?.perks || [],
      nextTier: nextTier?.name,
      pointsToNextTier,
      stats: {
        totalEarned: totalEarned._sum.points || 0,
        totalRedeemed: Math.abs(totalRedeemed._sum.points || 0),
        transactionCount,
      },
    };
  }

  /**
   * Calculate points to award for a purchase
   */
  static async calculateEarnPoints(
    tenantId: string,
    customerId: string,
    purchaseAmount: number,
    channel: string
  ): Promise<{ points: number; ruleId?: string; breakdown: string }> {
    const program = await prisma.crm_loyalty_programs.findUnique({
      where: { tenantId },
      include: {
        rules: {
          where: {
            isActive: true,
            ruleType: { in: ['EARN', 'MULTIPLIER'] },
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ],
            AND: [
              { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
            ],
          },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!program || !program.isActive) {
      return { points: 0, breakdown: 'Loyalty program not active' };
    }

    // Base points from program rate
    const basePoints = Math.floor(purchaseAmount * parseFloat(program.pointsPerCurrency.toString()));
    let finalPoints = basePoints;
    let appliedRuleId: string | undefined;
    let breakdown = `Base: ${basePoints} pts (₦${purchaseAmount} × ${program.pointsPerCurrency})`;

    // Check for applicable rules
    for (const rule of program.rules) {
      const conditions = rule.conditions as Record<string, unknown> | null;

      // Check channel condition
      if (conditions?.channels && Array.isArray(conditions.channels)) {
        if (!conditions.channels.includes(channel)) continue;
      }

      // Check min purchase condition
      if (conditions?.minPurchase && purchaseAmount < (conditions.minPurchase as number)) {
        continue;
      }

      // Apply rule
      if (rule.ruleType === 'EARN' && rule.pointsValue) {
        finalPoints = rule.pointsValue;
        appliedRuleId = rule.id;
        breakdown = `Rule "${rule.name}": ${rule.pointsValue} pts`;
        break;
      } else if (rule.ruleType === 'MULTIPLIER' && rule.pointsMultiplier) {
        const multiplier = parseFloat(rule.pointsMultiplier.toString());
        finalPoints = Math.floor(basePoints * multiplier);
        appliedRuleId = rule.id;
        breakdown = `${breakdown} × ${multiplier} (${rule.name}) = ${finalPoints} pts`;
        break;
      }
    }

    return { points: finalPoints, ruleId: appliedRuleId, breakdown };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static calculateTier(points: number, tierConfig: TierConfig | null): string {
    if (!tierConfig?.tiers?.length) {
      return 'Bronze';
    }

    // Find highest tier customer qualifies for
    let tier = tierConfig.tiers[0].name;
    for (const t of tierConfig.tiers) {
      if (points >= t.minPoints) {
        tier = t.name;
      }
    }

    return tier;
  }
}
