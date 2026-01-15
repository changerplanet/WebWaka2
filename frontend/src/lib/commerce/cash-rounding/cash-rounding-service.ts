/**
 * CASH ROUNDING SERVICE
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * NGN-realistic rounding for cash transactions (₦5, ₦10, ₦50)
 * with audit trail and receipt transparency.
 */

import { prisma } from '@/lib/prisma';

export type RoundingMode = 'N5' | 'N10' | 'N50';

export interface RoundingResult {
  originalAmount: number;
  roundedAmount: number;
  roundingDiff: number;
  roundingMode: RoundingMode;
}

export interface RoundingConfig {
  defaultMode: RoundingMode;
  enabled: boolean;
  autoApply: boolean;
}

export class CashRoundingService {
  /**
   * Calculate rounded amount
   */
  static calculateRounding(
    amount: number,
    mode: RoundingMode
  ): RoundingResult {
    const roundingValue = this.getModeValue(mode);
    const roundedAmount = Math.round(amount / roundingValue) * roundingValue;
    const roundingDiff = roundedAmount - amount;

    return {
      originalAmount: amount,
      roundedAmount,
      roundingDiff,
      roundingMode: mode
    };
  }

  /**
   * Apply rounding and record in audit trail
   */
  static async applyAndRecord(
    tenantId: string,
    amount: number,
    mode: RoundingMode,
    context: {
      saleId?: string;
      shiftId?: string;
      appliedById?: string;
      appliedByName?: string;
    }
  ): Promise<RoundingResult> {
    const result = this.calculateRounding(amount, mode);

    if (result.roundingDiff !== 0) {
      await prisma.pos_cash_rounding.create({
        data: {
          tenantId,
          saleId: context.saleId,
          shiftId: context.shiftId,
          originalAmount: result.originalAmount,
          roundedAmount: result.roundedAmount,
          roundingDiff: result.roundingDiff,
          roundingMode: mode,
          appliedById: context.appliedById,
          appliedByName: context.appliedByName,
        }
      });
    }

    return result;
  }

  /**
   * Get rounding summary for a shift
   */
  static async getShiftRoundingSummary(shiftId: string) {
    const roundings = await prisma.pos_cash_rounding.findMany({
      where: { shiftId }
    });

    const totalRoundedUp = roundings
      .filter(r => Number(r.roundingDiff) > 0)
      .reduce((sum, r) => sum + Number(r.roundingDiff), 0);

    const totalRoundedDown = roundings
      .filter(r => Number(r.roundingDiff) < 0)
      .reduce((sum, r) => sum + Math.abs(Number(r.roundingDiff)), 0);

    const netRounding = totalRoundedUp - totalRoundedDown;

    return {
      transactionCount: roundings.length,
      totalRoundedUp,
      totalRoundedDown,
      netRounding,
      byMode: this.groupByMode(roundings)
    };
  }

  /**
   * Get daily rounding report
   */
  static async getDailyRoundingReport(tenantId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const roundings = await prisma.pos_cash_rounding.findMany({
      where: {
        tenantId,
        appliedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { appliedAt: 'asc' }
    });

    const totalRoundedUp = roundings
      .filter(r => Number(r.roundingDiff) > 0)
      .reduce((sum, r) => sum + Number(r.roundingDiff), 0);

    const totalRoundedDown = roundings
      .filter(r => Number(r.roundingDiff) < 0)
      .reduce((sum, r) => sum + Math.abs(Number(r.roundingDiff)), 0);

    return {
      date: date.toISOString().slice(0, 10),
      transactionCount: roundings.length,
      totalOriginal: roundings.reduce((sum, r) => sum + Number(r.originalAmount), 0),
      totalRounded: roundings.reduce((sum, r) => sum + Number(r.roundedAmount), 0),
      totalRoundedUp,
      totalRoundedDown,
      netRounding: totalRoundedUp - totalRoundedDown,
      byMode: this.groupByMode(roundings),
      transactions: roundings.map(r => ({
        id: r.id,
        saleId: r.saleId,
        original: Number(r.originalAmount),
        rounded: Number(r.roundedAmount),
        diff: Number(r.roundingDiff),
        mode: r.roundingMode,
        time: r.appliedAt,
        staff: r.appliedByName
      }))
    };
  }

  /**
   * Format for receipt display
   */
  static formatForReceipt(result: RoundingResult): string {
    const direction = result.roundingDiff > 0 ? '+' : '';
    return `Rounding (${result.roundingMode}): ${direction}₦${Math.abs(result.roundingDiff).toFixed(2)}`;
  }

  /**
   * Get recommended rounding mode based on amount
   */
  static getRecommendedMode(amount: number): RoundingMode {
    if (amount >= 10000) return 'N50';
    if (amount >= 1000) return 'N10';
    return 'N5';
  }

  /**
   * Validate rounding mode
   */
  static isValidMode(mode: string): mode is RoundingMode {
    return ['N5', 'N10', 'N50'].includes(mode);
  }

  private static getModeValue(mode: RoundingMode): number {
    switch (mode) {
      case 'N5': return 5;
      case 'N10': return 10;
      case 'N50': return 50;
    }
  }

  private static groupByMode(roundings: Array<{
    roundingMode: string;
    roundingDiff: unknown;
  }>) {
    const byMode: Record<string, { count: number; total: number }> = {
      N5: { count: 0, total: 0 },
      N10: { count: 0, total: 0 },
      N50: { count: 0, total: 0 }
    };

    for (const r of roundings) {
      if (byMode[r.roundingMode]) {
        byMode[r.roundingMode].count++;
        byMode[r.roundingMode].total += Number(r.roundingDiff);
      }
    }

    return byMode;
  }
}
