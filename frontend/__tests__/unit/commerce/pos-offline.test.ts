/**
 * POS OFFLINE SYNC TESTS
 * Wave 1.5: Test Hardening
 * 
 * Tests offline sale queueing, sync on reconnect, conflict detection,
 * and manual resolution flow.
 */

import { PosOfflineService, OfflineSaleData, SyncResult } from '@/lib/commerce/pos-offline/pos-offline-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pos_offline_sale: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryLevel: {
      findFirst: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    pos_sale: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('PosOfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTenantId = 'tenant-123';
  const mockLocationId = 'location-456';

  const mockSaleData: OfflineSaleData = {
    clientSaleId: 'offline-1234567890',
    clientTimestamp: '2026-01-15T10:00:00Z',
    items: [
      {
        productId: 'prod-1',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 500,
        discount: 0,
      },
    ],
    subtotal: 1000,
    discount: 0,
    tax: 75,
    total: 1075,
    paymentMethod: 'CASH',
    staffId: 'staff-1',
    staffName: 'John Doe',
  };

  describe('Offline Sale Queueing', () => {
    it('should queue offline sale with PENDING status', async () => {
      const mockCreated = {
        id: 'queue-1',
        ...mockSaleData,
        syncStatus: 'PENDING',
        syncAttempts: 0,
      };
      (prisma.pos_offline_sale.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await PosOfflineService.queueOfflineSale(
        mockTenantId,
        mockLocationId,
        mockSaleData
      );

      expect(prisma.pos_offline_sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          locationId: mockLocationId,
          clientSaleId: mockSaleData.clientSaleId,
          syncStatus: 'PENDING',
          syncAttempts: 0,
        }),
      });
      expect(result.syncStatus).toBe('PENDING');
    });

    it('should store sale data as JSON', async () => {
      (prisma.pos_offline_sale.create as jest.Mock).mockResolvedValue({
        id: 'queue-1',
        saleData: mockSaleData,
      });

      await PosOfflineService.queueOfflineSale(
        mockTenantId,
        mockLocationId,
        mockSaleData
      );

      expect(prisma.pos_offline_sale.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          saleData: mockSaleData,
        }),
      });
    });
  });

  describe('Sync on Reconnect', () => {
    it('should get pending sales for sync', async () => {
      const mockPending = [
        { id: 'sale-1', syncStatus: 'PENDING' },
        { id: 'sale-2', syncStatus: 'CONFLICT' },
      ];
      (prisma.pos_offline_sale.findMany as jest.Mock).mockResolvedValue(mockPending);

      const pending = await PosOfflineService.getPendingSales(mockTenantId);

      expect(prisma.pos_offline_sale.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          syncStatus: { in: ['PENDING', 'CONFLICT'] },
        },
        orderBy: { clientTimestamp: 'asc' },
      });
      expect(pending.length).toBe(2);
    });

    it('should filter pending sales by location', async () => {
      (prisma.pos_offline_sale.findMany as jest.Mock).mockResolvedValue([]);

      await PosOfflineService.getPendingSales(mockTenantId, mockLocationId);

      expect(prisma.pos_offline_sale.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          locationId: mockLocationId,
        }),
        orderBy: { clientTimestamp: 'asc' },
      });
    });

    it('should update sync status to SYNCING during sync', async () => {
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };
      
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 100 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ price: 500, status: 'ACTIVE' });
      (prisma.pos_sale.count as jest.Mock).mockResolvedValue(0);
      (prisma.pos_sale.create as jest.Mock).mockResolvedValue({ id: 'synced-sale-1' });

      await PosOfflineService.syncOfflineSale('sale-1');

      expect(prisma.pos_offline_sale.update).toHaveBeenCalledWith({
        where: { id: 'sale-1' },
        data: expect.objectContaining({
          syncStatus: 'SYNCING',
          syncAttempts: { increment: 1 },
        }),
      });
    });

    it('should mark as SYNCED on successful sync', async () => {
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };
      
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 100 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ price: 500, status: 'ACTIVE' });
      (prisma.pos_sale.count as jest.Mock).mockResolvedValue(0);
      (prisma.pos_sale.create as jest.Mock).mockResolvedValue({ id: 'synced-sale-1' });

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(true);
      expect(result.hasConflict).toBe(false);
    });

    it('should return error when offline sale not found', async () => {
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await PosOfflineService.syncOfflineSale('non-existent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Offline sale not found');
    });
  });

  describe('Conflict Detection - OVERSELL', () => {
    it('should detect OVERSELL when quantity exceeds available by more than 2', async () => {
      const oversellSaleData = {
        ...mockSaleData,
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 10,
            unitPrice: 500,
          },
        ],
      };
      
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: oversellSaleData,
      };

      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 5 });

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(false);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('OVERSELL');
      expect(result.conflictDetails).toMatchObject({
        productId: 'prod-1',
        requestedQty: 10,
        availableQty: 5,
        shortage: 5,
      });
    });

    it('should allow sync when shortage is 2 or less (tolerance)', async () => {
      const tolerableSaleData = {
        ...mockSaleData,
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 5,
            unitPrice: 500,
          },
        ],
      };
      
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: tolerableSaleData,
      };

      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 3 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ price: 500, status: 'ACTIVE' });
      (prisma.pos_sale.count as jest.Mock).mockResolvedValue(0);
      (prisma.pos_sale.create as jest.Mock).mockResolvedValue({ id: 'synced-sale-1' });

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(true);
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('Conflict Detection - PRICE_MISMATCH', () => {
    it('should detect PRICE_MISMATCH when difference exceeds 10%', async () => {
      const priceMismatchData = {
        ...mockSaleData,
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 400,
          },
        ],
      };
      
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: priceMismatchData,
      };

      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 100 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ price: 500, status: 'ACTIVE' });

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(false);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('PRICE_MISMATCH');
      expect(result.conflictDetails).toMatchObject({
        productId: 'prod-1',
        salePrice: 400,
        currentPrice: 500,
      });
    });

    it('should allow sync when price difference is within 10%', async () => {
      const acceptablePriceData = {
        ...mockSaleData,
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 480,
          },
        ],
      };
      
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: acceptablePriceData,
      };

      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 100 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ price: 500, status: 'ACTIVE' });
      (prisma.pos_sale.count as jest.Mock).mockResolvedValue(0);
      (prisma.pos_sale.create as jest.Mock).mockResolvedValue({ id: 'synced-sale-1' });

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(true);
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('Conflict Detection - PRODUCT_UNAVAILABLE', () => {
    it('should detect when product is not ACTIVE', async () => {
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };

      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 100 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ price: 500, status: 'DISCONTINUED' });

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(false);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('PRODUCT_UNAVAILABLE');
    });

    it('should detect when product not found', async () => {
      const mockOfflineSale = {
        id: 'sale-1',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };

      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockOfflineSale);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryLevel.findFirst as jest.Mock).mockResolvedValue({ quantityAvailable: 100 });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await PosOfflineService.syncOfflineSale('sale-1');

      expect(result.success).toBe(false);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('PRODUCT_UNAVAILABLE');
    });
  });

  describe('Manual Resolution Flow', () => {
    it('should get conflicts for review', async () => {
      const mockConflicts = [
        { id: 'conflict-1', hasConflict: true, syncStatus: 'CONFLICT' },
      ];
      (prisma.pos_offline_sale.findMany as jest.Mock).mockResolvedValue(mockConflicts);

      const conflicts = await PosOfflineService.getConflicts(mockTenantId);

      expect(prisma.pos_offline_sale.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          hasConflict: true,
          syncStatus: 'CONFLICT',
        },
        orderBy: { clientTimestamp: 'asc' },
      });
      expect(conflicts.length).toBe(1);
    });

    it('should resolve conflict with REJECT action', async () => {
      const mockConflict = {
        id: 'conflict-1',
        hasConflict: true,
        syncStatus: 'CONFLICT',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockConflict);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});

      const result = await PosOfflineService.resolveConflict(
        'conflict-1',
        'REJECT',
        'admin-1'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sale rejected and discarded');
      expect(prisma.pos_offline_sale.update).toHaveBeenCalledWith({
        where: { id: 'conflict-1' },
        data: expect.objectContaining({
          syncStatus: 'RESOLVED',
          resolutionAction: 'REJECT',
        }),
      });
    });

    it('should resolve conflict with ACCEPT action and create sale', async () => {
      const mockConflict = {
        id: 'conflict-1',
        hasConflict: true,
        syncStatus: 'CONFLICT',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockConflict);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.pos_sale.count as jest.Mock).mockResolvedValue(0);
      (prisma.pos_sale.create as jest.Mock).mockResolvedValue({ id: 'synced-sale-1' });

      const result = await PosOfflineService.resolveConflict(
        'conflict-1',
        'ACCEPT',
        'admin-1'
      );

      expect(result.success).toBe(true);
      expect(result.syncedSaleId).toBe('synced-sale-1');
    });

    it('should resolve conflict with ADJUST action using adjustments', async () => {
      const adjustedData = {
        ...mockSaleData,
        items: [{ ...mockSaleData.items[0], quantity: 1 }],
        subtotal: 500,
        total: 537.5,
      };
      
      const mockConflict = {
        id: 'conflict-1',
        hasConflict: true,
        syncStatus: 'CONFLICT',
        tenantId: mockTenantId,
        locationId: mockLocationId,
        saleData: mockSaleData,
      };
      
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue(mockConflict);
      (prisma.pos_offline_sale.update as jest.Mock).mockResolvedValue({});
      (prisma.pos_sale.count as jest.Mock).mockResolvedValue(0);
      (prisma.pos_sale.create as jest.Mock).mockResolvedValue({ id: 'adjusted-sale-1' });

      const result = await PosOfflineService.resolveConflict(
        'conflict-1',
        'ADJUST',
        'admin-1',
        adjustedData
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('adjusted');
    });

    it('should fail resolution when no conflict exists', async () => {
      (prisma.pos_offline_sale.findUnique as jest.Mock).mockResolvedValue({
        hasConflict: false,
      });

      const result = await PosOfflineService.resolveConflict(
        'sale-1',
        'ACCEPT',
        'admin-1'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No conflict to resolve');
    });
  });
});
