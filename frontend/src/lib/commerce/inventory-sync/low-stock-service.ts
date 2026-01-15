/**
 * LOW STOCK SERVICE
 * Wave 2.4: Inventory Sync & Low Stock
 * 
 * Low-stock visibility and detection.
 * NO automation, NO auto-reordering, NO background jobs.
 * Read-only visibility only.
 */

import { prisma } from '@/lib/prisma';
import { ChannelType } from '@prisma/client';
import {
  LowStockProduct,
  LowStockSummary,
} from './types';

export class LowStockService {
  constructor(private tenantId: string) {}

  async getLowStockProducts(options?: {
    categoryId?: string;
    channelFilter?: ChannelType;
    severityFilter?: 'CRITICAL' | 'WARNING' | 'ATTENTION';
    limit?: number;
    offset?: number;
  }): Promise<{ products: LowStockProduct[]; total: number }> {
    const { categoryId, channelFilter, severityFilter, limit = 50, offset = 0 } = options || {};

    const products = await prisma.product.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'ACTIVE',
        trackInventory: true,
        ...(categoryId && { categoryId }),
        ...(channelFilter && {
          ProductChannelConfig: {
            some: {
              channel: channelFilter,
              status: 'ACTIVE',
            },
          },
        }),
      },
      include: {
        InventoryLevel: true,
        ProductCategory: true,
        ProductChannelConfig: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    const lowStockProducts: LowStockProduct[] = [];

    for (const product of products) {
      const totalAvailable = product.InventoryLevel.reduce(
        (sum, inv) => sum + inv.quantityAvailable,
        0
      );

      const reorderPoint = product.InventoryLevel.find(inv => inv.reorderPoint)?.reorderPoint;
      const reorderQuantity = product.InventoryLevel.find(inv => inv.reorderQuantity)?.reorderQuantity;

      if (reorderPoint === undefined || reorderPoint === null) continue;
      if (totalAvailable > reorderPoint) continue;

      const shortage = reorderPoint - totalAvailable;

      const avgDailySales = await this.calculateAvgDailySales(product.id);
      const daysOfStockLeft = avgDailySales !== null && avgDailySales > 0 
        ? Math.floor(totalAvailable / avgDailySales) 
        : null;

      const severity = this.calculateSeverity(totalAvailable, reorderPoint, daysOfStockLeft);

      if (severityFilter && severity !== severityFilter) continue;

      const channelsAffected = product.ProductChannelConfig.map(c => c.channel);

      const lastRestock = await prisma.inv_stock_movements.findFirst({
        where: {
          tenantId: this.tenantId,
          productId: product.id,
          reason: { in: ['PURCHASE_ORDER', 'TRANSFER_IN', 'ADJUSTMENT_POSITIVE'] },
          quantity: { gt: 0 },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      lowStockProducts.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        categoryName: product.ProductCategory?.name || null,
        currentStock: totalAvailable,
        reorderPoint,
        reorderQuantity: reorderQuantity || null,
        shortage,
        daysOfStockLeft,
        avgDailySales,
        channelsAffected,
        severity,
        lastRestocked: lastRestock?.createdAt || null,
      });
    }

    lowStockProducts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, WARNING: 1, ATTENTION: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const paginated = lowStockProducts.slice(offset, offset + limit);

    return { products: paginated, total: lowStockProducts.length };
  }

  async getLowStockSummary(): Promise<LowStockSummary> {
    const { products } = await this.getLowStockProducts({ limit: 1000 });

    const criticalCount = products.filter(p => p.severity === 'CRITICAL').length;
    const warningCount = products.filter(p => p.severity === 'WARNING').length;
    const attentionCount = products.filter(p => p.severity === 'ATTENTION').length;

    let estimatedRevenueLoss = 0;
    for (const product of products) {
      if (product.avgDailySales && product.avgDailySales > 0) {
        const productPrice = await prisma.product.findUnique({
          where: { id: product.productId },
          select: { price: true },
        });
        if (productPrice) {
          const missedSales = Math.max(0, product.shortage);
          estimatedRevenueLoss += missedSales * Number(productPrice.price);
        }
      }
    }

    const categoryMap = new Map<string, { categoryId: string; categoryName: string; count: number }>();
    for (const product of products) {
      if (product.categoryId) {
        const existing = categoryMap.get(product.categoryId);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(product.categoryId, {
            categoryId: product.categoryId,
            categoryName: product.categoryName || 'Uncategorized',
            count: 1,
          });
        }
      }
    }

    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(c => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        lowStockCount: c.count,
      }));

    const totalProducts = await prisma.product.count({
      where: {
        tenantId: this.tenantId,
        status: 'ACTIVE',
        trackInventory: true,
      },
    });

    return {
      tenantId: this.tenantId,
      totalProducts,
      lowStockCount: products.length,
      criticalCount,
      warningCount,
      attentionCount,
      estimatedRevenueLoss,
      topCategories,
    };
  }

  async getChannelLowStock(channel: ChannelType): Promise<{
    channel: ChannelType;
    lowStockProducts: LowStockProduct[];
    summary: {
      total: number;
      critical: number;
      warning: number;
      attention: number;
    };
  }> {
    const { products } = await this.getLowStockProducts({ channelFilter: channel, limit: 100 });

    return {
      channel,
      lowStockProducts: products,
      summary: {
        total: products.length,
        critical: products.filter(p => p.severity === 'CRITICAL').length,
        warning: products.filter(p => p.severity === 'WARNING').length,
        attention: products.filter(p => p.severity === 'ATTENTION').length,
      },
    };
  }

  async getCategoryLowStock(categoryId: string): Promise<{
    categoryId: string;
    categoryName: string;
    lowStockProducts: LowStockProduct[];
    summary: {
      total: number;
      critical: number;
      warning: number;
      attention: number;
    };
  }> {
    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, tenantId: this.tenantId },
    });

    const { products } = await this.getLowStockProducts({ categoryId, limit: 100 });

    return {
      categoryId,
      categoryName: category?.name || 'Unknown',
      lowStockProducts: products,
      summary: {
        total: products.length,
        critical: products.filter(p => p.severity === 'CRITICAL').length,
        warning: products.filter(p => p.severity === 'WARNING').length,
        attention: products.filter(p => p.severity === 'ATTENTION').length,
      },
    };
  }

  private calculateSeverity(
    currentStock: number,
    reorderPoint: number,
    daysOfStockLeft: number | null
  ): 'CRITICAL' | 'WARNING' | 'ATTENTION' {
    if (currentStock === 0) return 'CRITICAL';
    
    if (daysOfStockLeft !== null && daysOfStockLeft <= 3) return 'CRITICAL';
    
    const percentOfReorder = (currentStock / reorderPoint) * 100;
    
    if (percentOfReorder <= 25 || (daysOfStockLeft !== null && daysOfStockLeft <= 7)) {
      return 'CRITICAL';
    }
    
    if (percentOfReorder <= 50 || (daysOfStockLeft !== null && daysOfStockLeft <= 14)) {
      return 'WARNING';
    }
    
    return 'ATTENTION';
  }

  private async calculateAvgDailySales(productId: string): Promise<number | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const movements = await prisma.inv_stock_movements.aggregate({
      where: {
        tenantId: this.tenantId,
        productId,
        reason: 'SALE',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { quantity: true },
    });

    const totalSold = Math.abs(movements._sum?.quantity || 0);
    if (totalSold === 0) return null;

    return Math.round((totalSold / 30) * 100) / 100;
  }
}

export function createLowStockService(tenantId: string): LowStockService {
  return new LowStockService(tenantId);
}
