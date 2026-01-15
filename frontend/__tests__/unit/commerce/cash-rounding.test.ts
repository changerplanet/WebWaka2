/**
 * CASH ROUNDING TESTS
 * Wave 1.5: Test Hardening
 * 
 * Tests ₦5/₦10/₦50 rounding correctness and audit trail integrity.
 */

import { CashRoundingService, RoundingMode } from '@/lib/commerce/cash-rounding/cash-rounding-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pos_cash_rounding: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('CashRoundingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTenantId = 'tenant-123';

  describe('₦5 Rounding', () => {
    it('should round 1023 to 1025 (round up)', () => {
      const result = CashRoundingService.calculateRounding(1023, 'N5');

      expect(result.originalAmount).toBe(1023);
      expect(result.roundedAmount).toBe(1025);
      expect(result.roundingDiff).toBe(2);
      expect(result.roundingMode).toBe('N5');
    });

    it('should round 1022 to 1020 (round down)', () => {
      const result = CashRoundingService.calculateRounding(1022, 'N5');

      expect(result.originalAmount).toBe(1022);
      expect(result.roundedAmount).toBe(1020);
      expect(result.roundingDiff).toBe(-2);
    });

    it('should not change amounts already divisible by 5', () => {
      const result = CashRoundingService.calculateRounding(1025, 'N5');

      expect(result.roundedAmount).toBe(1025);
      expect(result.roundingDiff).toBe(0);
    });

    it('should handle ₦2.50 boundary (round to nearest)', () => {
      const result1 = CashRoundingService.calculateRounding(1002.5, 'N5');
      expect(result1.roundedAmount).toBe(1005);

      const result2 = CashRoundingService.calculateRounding(1002.4, 'N5');
      expect(result2.roundedAmount).toBe(1000);
    });
  });

  describe('₦10 Rounding', () => {
    it('should round 1005 to 1010 (round up)', () => {
      const result = CashRoundingService.calculateRounding(1005, 'N10');

      expect(result.originalAmount).toBe(1005);
      expect(result.roundedAmount).toBe(1010);
      expect(result.roundingDiff).toBe(5);
      expect(result.roundingMode).toBe('N10');
    });

    it('should round 1004 to 1000 (round down)', () => {
      const result = CashRoundingService.calculateRounding(1004, 'N10');

      expect(result.originalAmount).toBe(1004);
      expect(result.roundedAmount).toBe(1000);
      expect(result.roundingDiff).toBe(-4);
    });

    it('should not change amounts already divisible by 10', () => {
      const result = CashRoundingService.calculateRounding(1000, 'N10');

      expect(result.roundedAmount).toBe(1000);
      expect(result.roundingDiff).toBe(0);
    });

    it('should handle ₦5 boundary (round to nearest)', () => {
      const result = CashRoundingService.calculateRounding(1015, 'N10');
      expect(result.roundedAmount).toBe(1020);
    });
  });

  describe('₦50 Rounding', () => {
    it('should round 1025 to 1050 (round up)', () => {
      const result = CashRoundingService.calculateRounding(1025, 'N50');

      expect(result.originalAmount).toBe(1025);
      expect(result.roundedAmount).toBe(1050);
      expect(result.roundingDiff).toBe(25);
      expect(result.roundingMode).toBe('N50');
    });

    it('should round 1024 to 1000 (round down)', () => {
      const result = CashRoundingService.calculateRounding(1024, 'N50');

      expect(result.originalAmount).toBe(1024);
      expect(result.roundedAmount).toBe(1000);
      expect(result.roundingDiff).toBe(-24);
    });

    it('should not change amounts already divisible by 50', () => {
      const result = CashRoundingService.calculateRounding(1050, 'N50');

      expect(result.roundedAmount).toBe(1050);
      expect(result.roundingDiff).toBe(0);
    });

    it('should handle large amounts correctly', () => {
      const result = CashRoundingService.calculateRounding(15678, 'N50');

      expect(result.roundedAmount).toBe(15700);
      expect(result.roundingDiff).toBe(22);
    });
  });

  describe('Recommended Rounding Mode', () => {
    it('should recommend N5 for amounts under ₦1000', () => {
      const mode = CashRoundingService.getRecommendedMode(500);
      expect(mode).toBe('N5');
    });

    it('should recommend N10 for amounts ₦1000-₦9999', () => {
      const mode = CashRoundingService.getRecommendedMode(5000);
      expect(mode).toBe('N10');
    });

    it('should recommend N50 for amounts ₦10000+', () => {
      const mode = CashRoundingService.getRecommendedMode(15000);
      expect(mode).toBe('N50');
    });

    it('should recommend N10 for boundary amount ₦1000', () => {
      const mode = CashRoundingService.getRecommendedMode(1000);
      expect(mode).toBe('N10');
    });

    it('should recommend N50 for boundary amount ₦10000', () => {
      const mode = CashRoundingService.getRecommendedMode(10000);
      expect(mode).toBe('N50');
    });
  });

  describe('Mode Validation', () => {
    it('should validate N5 as valid mode', () => {
      expect(CashRoundingService.isValidMode('N5')).toBe(true);
    });

    it('should validate N10 as valid mode', () => {
      expect(CashRoundingService.isValidMode('N10')).toBe(true);
    });

    it('should validate N50 as valid mode', () => {
      expect(CashRoundingService.isValidMode('N50')).toBe(true);
    });

    it('should reject invalid modes', () => {
      expect(CashRoundingService.isValidMode('N1')).toBe(false);
      expect(CashRoundingService.isValidMode('N20')).toBe(false);
      expect(CashRoundingService.isValidMode('N100')).toBe(false);
      expect(CashRoundingService.isValidMode('invalid')).toBe(false);
    });
  });

  describe('Receipt Formatting', () => {
    it('should format positive rounding for receipt', () => {
      const result = CashRoundingService.calculateRounding(1023, 'N5');
      const formatted = CashRoundingService.formatForReceipt(result);

      expect(formatted).toBe('Rounding (N5): +₦2.00');
    });

    it('should format negative rounding for receipt', () => {
      const result = CashRoundingService.calculateRounding(1022, 'N5');
      const formatted = CashRoundingService.formatForReceipt(result);

      expect(formatted).toBe('Rounding (N5): ₦2.00');
    });

    it('should format zero rounding for receipt', () => {
      const result = CashRoundingService.calculateRounding(1025, 'N5');
      const formatted = CashRoundingService.formatForReceipt(result);

      expect(formatted).toBe('Rounding (N5): ₦0.00');
    });

    it('should include rounding mode in format', () => {
      const result10 = CashRoundingService.calculateRounding(1005, 'N10');
      const formatted10 = CashRoundingService.formatForReceipt(result10);
      expect(formatted10).toContain('N10');

      const result50 = CashRoundingService.calculateRounding(1025, 'N50');
      const formatted50 = CashRoundingService.formatForReceipt(result50);
      expect(formatted50).toContain('N50');
    });
  });

  describe('Audit Trail Recording', () => {
    it('should record rounding in audit trail when diff is non-zero', async () => {
      (prisma.pos_cash_rounding.create as jest.Mock).mockResolvedValue({
        id: 'rounding-1',
      });

      const result = await CashRoundingService.applyAndRecord(
        mockTenantId,
        1023,
        'N5',
        {
          saleId: 'sale-1',
          shiftId: 'shift-1',
          appliedById: 'staff-1',
          appliedByName: 'John Doe',
        }
      );

      expect(prisma.pos_cash_rounding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          saleId: 'sale-1',
          shiftId: 'shift-1',
          originalAmount: 1023,
          roundedAmount: 1025,
          roundingDiff: 2,
          roundingMode: 'N5',
          appliedById: 'staff-1',
          appliedByName: 'John Doe',
        }),
      });
    });

    it('should NOT record rounding when diff is zero', async () => {
      const result = await CashRoundingService.applyAndRecord(
        mockTenantId,
        1025,
        'N5',
        {
          saleId: 'sale-1',
          shiftId: 'shift-1',
        }
      );

      expect(prisma.pos_cash_rounding.create).not.toHaveBeenCalled();
      expect(result.roundingDiff).toBe(0);
    });

    it('should include staff details in audit record', async () => {
      (prisma.pos_cash_rounding.create as jest.Mock).mockResolvedValue({});

      await CashRoundingService.applyAndRecord(
        mockTenantId,
        1023,
        'N5',
        {
          appliedById: 'staff-123',
          appliedByName: 'Jane Smith',
        }
      );

      expect(prisma.pos_cash_rounding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          appliedById: 'staff-123',
          appliedByName: 'Jane Smith',
        }),
      });
    });
  });

  describe('Shift Rounding Summary', () => {
    it('should calculate shift summary correctly', async () => {
      (prisma.pos_cash_rounding.findMany as jest.Mock).mockResolvedValue([
        { roundingDiff: 2, roundingMode: 'N5' },
        { roundingDiff: -3, roundingMode: 'N5' },
        { roundingDiff: 5, roundingMode: 'N10' },
        { roundingDiff: -4, roundingMode: 'N10' },
        { roundingDiff: 25, roundingMode: 'N50' },
      ]);

      const summary = await CashRoundingService.getShiftRoundingSummary('shift-1');

      expect(summary.transactionCount).toBe(5);
      expect(summary.totalRoundedUp).toBe(32);
      expect(summary.totalRoundedDown).toBe(7);
      expect(summary.netRounding).toBe(25);
    });

    it('should group by mode correctly', async () => {
      (prisma.pos_cash_rounding.findMany as jest.Mock).mockResolvedValue([
        { roundingDiff: 2, roundingMode: 'N5' },
        { roundingDiff: 3, roundingMode: 'N5' },
        { roundingDiff: 5, roundingMode: 'N10' },
      ]);

      const summary = await CashRoundingService.getShiftRoundingSummary('shift-1');

      expect(summary.byMode.N5.count).toBe(2);
      expect(summary.byMode.N5.total).toBe(5);
      expect(summary.byMode.N10.count).toBe(1);
      expect(summary.byMode.N10.total).toBe(5);
      expect(summary.byMode.N50.count).toBe(0);
    });
  });

  describe('Daily Rounding Report', () => {
    it('should generate daily report with all transactions', async () => {
      const mockDate = new Date('2026-01-15');
      (prisma.pos_cash_rounding.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          saleId: 'sale-1',
          originalAmount: 1023,
          roundedAmount: 1025,
          roundingDiff: 2,
          roundingMode: 'N5',
          appliedAt: mockDate,
          appliedByName: 'John',
        },
        {
          id: 'r2',
          saleId: 'sale-2',
          originalAmount: 2004,
          roundedAmount: 2000,
          roundingDiff: -4,
          roundingMode: 'N10',
          appliedAt: mockDate,
          appliedByName: 'Jane',
        },
      ]);

      const report = await CashRoundingService.getDailyRoundingReport(
        mockTenantId,
        mockDate
      );

      expect(report.date).toBe('2026-01-15');
      expect(report.transactionCount).toBe(2);
      expect(report.totalOriginal).toBe(3027);
      expect(report.totalRounded).toBe(3025);
      expect(report.totalRoundedUp).toBe(2);
      expect(report.totalRoundedDown).toBe(4);
      expect(report.netRounding).toBe(-2);
      expect(report.transactions.length).toBe(2);
    });

    it('should include staff names in transaction details', async () => {
      const mockDate = new Date('2026-01-15');
      (prisma.pos_cash_rounding.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          saleId: 'sale-1',
          originalAmount: 1023,
          roundedAmount: 1025,
          roundingDiff: 2,
          roundingMode: 'N5',
          appliedAt: mockDate,
          appliedByName: 'John Doe',
        },
      ]);

      const report = await CashRoundingService.getDailyRoundingReport(
        mockTenantId,
        mockDate
      );

      expect(report.transactions[0].staff).toBe('John Doe');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount', () => {
      const result = CashRoundingService.calculateRounding(0, 'N5');

      expect(result.roundedAmount).toBe(0);
      expect(result.roundingDiff).toBe(0);
    });

    it('should handle very small amounts', () => {
      const result = CashRoundingService.calculateRounding(1, 'N5');

      expect(result.roundedAmount).toBe(0);
      expect(result.roundingDiff).toBe(-1);
    });

    it('should handle very large amounts', () => {
      const result = CashRoundingService.calculateRounding(999999999, 'N50');

      expect(result.roundedAmount).toBe(1000000000);
      expect(result.roundingDiff).toBe(1);
    });

    it('should handle decimal amounts', () => {
      const result = CashRoundingService.calculateRounding(1023.75, 'N5');

      expect(result.roundedAmount).toBe(1025);
      expect(result.roundingDiff).toBeCloseTo(1.25, 2);
    });
  });
});
