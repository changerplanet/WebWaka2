/**
 * PRODUCT CHANNEL CONFIGURATION SERVICE
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * Manages vendor-controlled channel visibility, pricing, and inventory modes
 * across POS, SVM, and MVM channels.
 */

import { prisma } from '@/lib/prisma';
import { ChannelType, ChannelStatus, InventoryMode } from '@prisma/client';

export interface ChannelConfigInput {
  productId: string;
  channel: ChannelType;
  status?: ChannelStatus;
  useBasePrice?: boolean;
  channelPrice?: number;
  inventoryMode?: InventoryMode;
  allocatedQuantity?: number;
  syncInventory?: boolean;
  syncPrice?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
}

export interface ChannelConfigUpdate {
  status?: ChannelStatus;
  useBasePrice?: boolean;
  channelPrice?: number;
  inventoryMode?: InventoryMode;
  allocatedQuantity?: number;
  syncInventory?: boolean;
  syncPrice?: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
}

export class ChannelConfigService {
  /**
   * Get or create channel configuration for a product
   */
  static async getOrCreateConfig(
    tenantId: string,
    productId: string,
    channel: ChannelType
  ) {
    let config = await prisma.productChannelConfig.findUnique({
      where: {
        tenantId_productId_channel: { tenantId, productId, channel }
      }
    });

    if (!config) {
      config = await prisma.productChannelConfig.create({
        data: {
          tenantId,
          productId,
          channel,
          status: 'INACTIVE',
          useBasePrice: true,
          inventoryMode: 'SHARED',
          syncInventory: true,
          syncPrice: true,
        }
      });
    }

    return config;
  }

  /**
   * Get all channel configurations for a product
   */
  static async getProductChannels(tenantId: string, productId: string) {
    return prisma.productChannelConfig.findMany({
      where: { tenantId, productId },
      orderBy: { channel: 'asc' }
    });
  }

  /**
   * Update channel configuration
   */
  static async updateConfig(
    tenantId: string,
    productId: string,
    channel: ChannelType,
    updates: ChannelConfigUpdate
  ) {
    return prisma.productChannelConfig.upsert({
      where: {
        tenantId_productId_channel: { tenantId, productId, channel }
      },
      update: {
        ...updates,
        channelPrice: updates.channelPrice !== undefined 
          ? updates.channelPrice 
          : undefined,
      },
      create: {
        tenantId,
        productId,
        channel,
        status: updates.status || 'INACTIVE',
        useBasePrice: updates.useBasePrice ?? true,
        channelPrice: updates.channelPrice,
        inventoryMode: updates.inventoryMode || 'SHARED',
        allocatedQuantity: updates.allocatedQuantity,
        syncInventory: updates.syncInventory ?? true,
        syncPrice: updates.syncPrice ?? true,
        minOrderQuantity: updates.minOrderQuantity,
        maxOrderQuantity: updates.maxOrderQuantity,
      }
    });
  }

  /**
   * Enable a channel for a product
   */
  static async enableChannel(
    tenantId: string,
    productId: string,
    channel: ChannelType
  ) {
    return this.updateConfig(tenantId, productId, channel, {
      status: 'ACTIVE'
    });
  }

  /**
   * Pause a channel (keeps processing existing orders)
   */
  static async pauseChannel(
    tenantId: string,
    productId: string,
    channel: ChannelType
  ) {
    return this.updateConfig(tenantId, productId, channel, {
      status: 'PAUSED'
    });
  }

  /**
   * Disable a channel completely
   */
  static async disableChannel(
    tenantId: string,
    productId: string,
    channel: ChannelType
  ) {
    return this.updateConfig(tenantId, productId, channel, {
      status: 'INACTIVE'
    });
  }

  /**
   * Check if product is visible in a channel
   */
  static async isVisibleInChannel(
    tenantId: string,
    productId: string,
    channel: ChannelType
  ): Promise<boolean> {
    const config = await prisma.productChannelConfig.findUnique({
      where: {
        tenantId_productId_channel: { tenantId, productId, channel }
      }
    });
    return config?.status === 'ACTIVE';
  }

  /**
   * Get effective price for a channel
   */
  static async getChannelPrice(
    tenantId: string,
    productId: string,
    channel: ChannelType
  ): Promise<number | null> {
    const config = await prisma.productChannelConfig.findUnique({
      where: {
        tenantId_productId_channel: { tenantId, productId, channel }
      }
    });

    if (!config) return null;

    if (config.useBasePrice || !config.channelPrice) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { price: true }
      });
      return product ? Number(product.price) : null;
    }

    return Number(config.channelPrice);
  }

  /**
   * Get all products visible in a channel
   */
  static async getChannelProducts(
    tenantId: string,
    channel: ChannelType,
    options?: {
      limit?: number;
      offset?: number;
      includeProduct?: boolean;
    }
  ) {
    const { limit = 50, offset = 0, includeProduct = true } = options || {};

    return prisma.productChannelConfig.findMany({
      where: {
        tenantId,
        channel,
        status: 'ACTIVE'
      },
      include: includeProduct ? {
        Product: true
      } : undefined,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Bulk enable products for a channel
   */
  static async bulkEnableChannel(
    tenantId: string,
    productIds: string[],
    channel: ChannelType
  ) {
    const operations = productIds.map(productId =>
      prisma.productChannelConfig.upsert({
        where: {
          tenantId_productId_channel: { tenantId, productId, channel }
        },
        update: { status: 'ACTIVE' },
        create: {
          tenantId,
          productId,
          channel,
          status: 'ACTIVE',
          useBasePrice: true,
          inventoryMode: 'SHARED',
          syncInventory: true,
          syncPrice: true,
        }
      })
    );

    return prisma.$transaction(operations);
  }

  /**
   * Check tenant's subscribed channels (from entitlements)
   */
  static async getTenantChannels(tenantId: string): Promise<ChannelType[]> {
    const entitlements = await prisma.entitlement.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        module: { in: ['pos', 'svm', 'mvm'] }
      },
      select: { module: true }
    });

    const channelMap: Record<string, ChannelType> = {
      'pos': 'POS',
      'svm': 'SVM',
      'mvm': 'MVM'
    };

    return entitlements
      .map(e => channelMap[e.module])
      .filter(Boolean) as ChannelType[];
  }

  /**
   * Validate channel access based on subscription
   */
  static async canAccessChannel(
    tenantId: string,
    channel: ChannelType
  ): Promise<boolean> {
    const subscribedChannels = await this.getTenantChannels(tenantId);
    return subscribedChannels.includes(channel);
  }
}
