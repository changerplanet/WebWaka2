/**
 * PRODUCT CHANNEL CONFIGURATION TESTS
 * Wave 1.5: Test Hardening
 * 
 * Tests channel visibility rules, pricing overrides, inventory modes,
 * and vendor subscription combinations.
 */

import { ChannelConfigService } from '@/lib/commerce/channel-config/channel-config-service';
import { prisma } from '@/lib/prisma';
import { ChannelType, ChannelStatus, InventoryMode } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    productChannelConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    entitlement: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

describe('ChannelConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTenantId = 'tenant-123';
  const mockProductId = 'product-456';

  describe('Channel Visibility Rules', () => {
    it('should return false for product not configured in channel', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue(null);

      const isVisible = await ChannelConfigService.isVisibleInChannel(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(isVisible).toBe(false);
    });

    it('should return true only for ACTIVE status', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });

      const isVisible = await ChannelConfigService.isVisibleInChannel(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(isVisible).toBe(true);
    });

    it('should return false for PAUSED status', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        status: 'PAUSED',
      });

      const isVisible = await ChannelConfigService.isVisibleInChannel(
        mockTenantId,
        mockProductId,
        'SVM'
      );

      expect(isVisible).toBe(false);
    });

    it('should return false for INACTIVE status', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        status: 'INACTIVE',
      });

      const isVisible = await ChannelConfigService.isVisibleInChannel(
        mockTenantId,
        mockProductId,
        'MVM'
      );

      expect(isVisible).toBe(false);
    });
  });

  describe('Pricing Overrides', () => {
    it('should use base product price when useBasePrice is true', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        useBasePrice: true,
        channelPrice: 1500,
      });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        price: 1000,
      });

      const price = await ChannelConfigService.getChannelPrice(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(price).toBe(1000);
    });

    it('should use channel-specific price when useBasePrice is false', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        useBasePrice: false,
        channelPrice: 1500,
      });

      const price = await ChannelConfigService.getChannelPrice(
        mockTenantId,
        mockProductId,
        'SVM'
      );

      expect(price).toBe(1500);
    });

    it('should fall back to base price when channelPrice is null', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        useBasePrice: false,
        channelPrice: null,
      });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        price: 2000,
      });

      const price = await ChannelConfigService.getChannelPrice(
        mockTenantId,
        mockProductId,
        'MVM'
      );

      expect(price).toBe(2000);
    });

    it('should return null when product not found', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue({
        useBasePrice: true,
      });
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const price = await ChannelConfigService.getChannelPrice(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(price).toBeNull();
    });

    it('should return null when config not found', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue(null);

      const price = await ChannelConfigService.getChannelPrice(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(price).toBeNull();
    });
  });

  describe('Inventory Modes', () => {
    it('should create config with SHARED inventory mode by default', async () => {
      (prisma.productChannelConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.productChannelConfig.create as jest.Mock).mockResolvedValue({
        id: 'config-1',
        inventoryMode: 'SHARED',
        syncInventory: true,
      });

      const config = await ChannelConfigService.getOrCreateConfig(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(prisma.productChannelConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryMode: 'SHARED',
            syncInventory: true,
          }),
        })
      );
    });

    it('should support ALLOCATED inventory mode with quantity', async () => {
      const mockConfig = {
        inventoryMode: 'ALLOCATED',
        allocatedQuantity: 50,
        syncInventory: false,
      };
      
      (prisma.productChannelConfig.upsert as jest.Mock).mockResolvedValue(mockConfig);

      const config = await ChannelConfigService.updateConfig(
        mockTenantId,
        mockProductId,
        'POS',
        {
          inventoryMode: 'ALLOCATED',
          allocatedQuantity: 50,
          syncInventory: false,
        }
      );

      expect(prisma.productChannelConfig.upsert).toHaveBeenCalled();
    });

    it('should support UNLIMITED inventory mode', async () => {
      const mockConfig = {
        inventoryMode: 'UNLIMITED',
        syncInventory: false,
      };
      
      (prisma.productChannelConfig.upsert as jest.Mock).mockResolvedValue(mockConfig);

      const config = await ChannelConfigService.updateConfig(
        mockTenantId,
        mockProductId,
        'SVM',
        { inventoryMode: 'UNLIMITED' }
      );

      expect(prisma.productChannelConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('Vendor Subscription Combinations', () => {
    it('should return empty array when tenant has no commerce entitlements', async () => {
      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue([]);

      const channels = await ChannelConfigService.getTenantChannels(mockTenantId);

      expect(channels).toEqual([]);
    });

    it('should return POS channel for pos entitlement', async () => {
      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue([
        { module: 'pos' },
      ]);

      const channels = await ChannelConfigService.getTenantChannels(mockTenantId);

      expect(channels).toEqual(['POS']);
    });

    it('should return multiple channels for combined entitlements', async () => {
      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue([
        { module: 'pos' },
        { module: 'svm' },
        { module: 'mvm' },
      ]);

      const channels = await ChannelConfigService.getTenantChannels(mockTenantId);

      expect(channels).toContain('POS');
      expect(channels).toContain('SVM');
      expect(channels).toContain('MVM');
      expect(channels.length).toBe(3);
    });

    it('should deny access to channel without subscription', async () => {
      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue([
        { module: 'pos' },
      ]);

      const canAccessMVM = await ChannelConfigService.canAccessChannel(mockTenantId, 'MVM');

      expect(canAccessMVM).toBe(false);
    });

    it('should allow access to subscribed channel', async () => {
      (prisma.entitlement.findMany as jest.Mock).mockResolvedValue([
        { module: 'svm' },
      ]);

      const canAccessSVM = await ChannelConfigService.canAccessChannel(mockTenantId, 'SVM');

      expect(canAccessSVM).toBe(true);
    });
  });

  describe('Channel Status Transitions', () => {
    it('should enable channel correctly', async () => {
      (prisma.productChannelConfig.upsert as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });

      const config = await ChannelConfigService.enableChannel(
        mockTenantId,
        mockProductId,
        'POS'
      );

      expect(prisma.productChannelConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });

    it('should pause channel correctly', async () => {
      (prisma.productChannelConfig.upsert as jest.Mock).mockResolvedValue({
        status: 'PAUSED',
      });

      const config = await ChannelConfigService.pauseChannel(
        mockTenantId,
        mockProductId,
        'SVM'
      );

      expect(prisma.productChannelConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: 'PAUSED' }),
        })
      );
    });

    it('should disable channel correctly', async () => {
      (prisma.productChannelConfig.upsert as jest.Mock).mockResolvedValue({
        status: 'INACTIVE',
      });

      const config = await ChannelConfigService.disableChannel(
        mockTenantId,
        mockProductId,
        'MVM'
      );

      expect(prisma.productChannelConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: 'INACTIVE' }),
        })
      );
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk enable products for a channel', async () => {
      const productIds = ['prod-1', 'prod-2', 'prod-3'];
      
      (prisma.productChannelConfig.upsert as jest.Mock).mockResolvedValue({
        status: 'ACTIVE',
      });

      const results = await ChannelConfigService.bulkEnableChannel(
        mockTenantId,
        productIds,
        'POS'
      );

      expect(results.length).toBe(3);
    });
  });
});
