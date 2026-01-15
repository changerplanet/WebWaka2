/**
 * STOCK TRACEABILITY SERVICE
 * Wave 2.4: Inventory Sync & Low Stock
 * 
 * "What sold where" tracking across POS, SVM, MVM channels.
 * Read-only visibility only. NO automation, NO background jobs.
 */

import { prisma } from '@/lib/prisma';
import { ChannelType } from '@prisma/client';
import {
  ProductSalesTraceability,
  ChannelSalesRecord,
  LocationSalesRecord,
  DailySalesRecord,
  TimeFilter,
} from './types';

export class StockTraceabilityService {
  constructor(private tenantId: string) {}

  async getProductTraceability(
    productId: string,
    filter?: TimeFilter
  ): Promise<ProductSalesTraceability | null> {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
    });

    if (!product) return null;

    const dateFilter = this.getDateFilter(filter);

    const [channelBreakdown, locationBreakdown, dailySales] = await Promise.all([
      this.getChannelBreakdown(productId, dateFilter),
      this.getLocationBreakdown(productId, dateFilter),
      this.getDailySales(productId, dateFilter),
    ]);

    const totalQuantitySold = channelBreakdown.reduce((sum, c) => sum + c.quantitySold, 0);
    const totalRevenue = channelBreakdown.reduce((sum, c) => sum + c.revenue, 0);

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      totalQuantitySold,
      totalRevenue,
      channelBreakdown,
      locationBreakdown,
      dailySales,
    };
  }

  async getChannelSalesSummary(
    channel: ChannelType,
    filter?: TimeFilter,
    options?: { limit?: number; offset?: number }
  ): Promise<{ products: ChannelSalesRecord[]; total: number; totalRevenue: number }> {
    const { limit = 50, offset = 0 } = options || {};
    const dateFilter = this.getDateFilter(filter);

    let products: ChannelSalesRecord[] = [];
    let totalRevenue = 0;

    if (channel === 'POS') {
      const posSales = await this.aggregatePOSSales(dateFilter, limit, offset);
      products = posSales.products;
      totalRevenue = posSales.totalRevenue;
    }

    return { products, total: products.length, totalRevenue };
  }

  async getLocationSalesSummary(
    locationId: string,
    filter?: TimeFilter,
    options?: { limit?: number; offset?: number }
  ): Promise<{ products: LocationSalesRecord[]; total: number; totalRevenue: number }> {
    const { limit = 50, offset = 0 } = options || {};
    const dateFilter = this.getDateFilter(filter);

    const location = await prisma.location.findFirst({
      where: { id: locationId, tenantId: this.tenantId },
    });

    if (!location) {
      return { products: [], total: 0, totalRevenue: 0 };
    }

    const sales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        locationId,
        status: 'COMPLETED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: true,
      },
    });

    const productMap = new Map<string, {
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
      orderCount: Set<string>;
      lastSaleAt: Date | null;
    }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.productId;
        const existing = productMap.get(key);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orderCount.add(sale.id);
          if (sale.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = sale.createdAt;
          }
        } else {
          productMap.set(key, {
            productId: item.productId,
            productName: item.productName,
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orderCount: new Set([sale.id]),
            lastSaleAt: sale.createdAt,
          });
        }
      }
    }

    const products: LocationSalesRecord[] = Array.from(productMap.values())
      .map(p => ({
        locationId,
        locationName: location.name,
        quantitySold: p.quantitySold,
        revenue: p.revenue,
        orderCount: p.orderCount.size,
        lastSaleAt: p.lastSaleAt,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(offset, offset + limit);

    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

    return { products, total: productMap.size, totalRevenue };
  }

  async getCrossChannelComparison(
    filter?: TimeFilter
  ): Promise<{
    channels: Array<{
      channel: ChannelType;
      totalSales: number;
      totalRevenue: number;
      productCount: number;
      topProduct: { productId: string; productName: string; revenue: number } | null;
    }>;
    totalRevenue: number;
    totalSales: number;
  }> {
    const dateFilter = this.getDateFilter(filter);

    const posSummary = await this.aggregatePOSSales(dateFilter, 1, 0);

    const channels = [
      {
        channel: 'POS' as ChannelType,
        totalSales: posSummary.products.reduce((sum, p) => sum + p.quantitySold, 0),
        totalRevenue: posSummary.totalRevenue,
        productCount: posSummary.products.length,
        topProduct: posSummary.products[0] ? {
          productId: posSummary.products[0].productId,
          productName: posSummary.products[0].productName,
          revenue: posSummary.products[0].revenue,
        } : null,
      },
      {
        channel: 'MVM' as ChannelType,
        totalSales: 0,
        totalRevenue: 0,
        productCount: 0,
        topProduct: null,
      },
      {
        channel: 'SVM' as ChannelType,
        totalSales: 0,
        totalRevenue: 0,
        productCount: 0,
        topProduct: null,
      },
    ];

    return {
      channels,
      totalRevenue: channels.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalSales: channels.reduce((sum, c) => sum + c.totalSales, 0),
    };
  }

  private async getChannelBreakdown(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<ChannelSalesRecord[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    const productName = product?.name || 'Unknown';

    const sales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: {
          where: { productId },
        },
      },
    });

    let quantitySold = 0;
    let revenue = 0;
    let orderCount = 0;
    let lastSaleAt: Date | null = null;

    for (const sale of sales) {
      for (const item of sale.items) {
        quantitySold += item.quantity;
        revenue += Number(item.lineTotal);
        orderCount++;
        if (!lastSaleAt || sale.createdAt > lastSaleAt) {
          lastSaleAt = sale.createdAt;
        }
      }
    }

    const channels: ChannelSalesRecord[] = [];

    if (quantitySold > 0) {
      channels.push({
        channel: 'POS',
        productId,
        productName,
        variantId: null,
        quantitySold,
        revenue,
        orderCount,
        lastSaleAt,
      });
    }

    return channels;
  }

  private async getLocationBreakdown(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<LocationSalesRecord[]> {
    const sales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: {
          where: { productId },
        },
      },
    });

    const locations = await prisma.location.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, name: true },
    });
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    const locationSalesMap = new Map<string, {
      locationId: string;
      locationName: string;
      quantitySold: number;
      revenue: number;
      orders: Set<string>;
      lastSaleAt: Date | null;
    }>();

    for (const sale of sales) {
      if (sale.items.length === 0) continue;

      const locationId = sale.locationId;
      const locationName = locationMap.get(locationId) || 'Unknown';
      
      for (const item of sale.items) {
        const existing = locationSalesMap.get(locationId);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orders.add(sale.id);
          if (sale.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = sale.createdAt;
          }
        } else {
          locationSalesMap.set(locationId, {
            locationId,
            locationName,
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orders: new Set([sale.id]),
            lastSaleAt: sale.createdAt,
          });
        }
      }
    }

    return Array.from(locationSalesMap.values()).map(l => ({
      locationId: l.locationId,
      locationName: l.locationName,
      quantitySold: l.quantitySold,
      revenue: l.revenue,
      orderCount: l.orders.size,
      lastSaleAt: l.lastSaleAt,
    }));
  }

  private async getDailySales(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<DailySalesRecord[]> {
    const startDate = dateFilter?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateFilter?.lte || new Date();

    const sales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: {
          where: { productId },
        },
      },
    });

    const dailyMap = new Map<string, {
      quantitySold: number;
      revenue: number;
      byChannel: Record<ChannelType, number>;
    }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const date = sale.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(date);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.byChannel['POS'] = (existing.byChannel['POS'] || 0) + item.quantity;
        } else {
          dailyMap.set(date, {
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            byChannel: { POS: item.quantity, SVM: 0, MVM: 0 },
          });
        }
      }
    }

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        quantitySold: data.quantitySold,
        revenue: data.revenue,
        byChannel: data.byChannel,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  private async aggregatePOSSales(
    dateFilter?: { gte?: Date; lte?: Date },
    limit?: number,
    offset?: number
  ): Promise<{ products: ChannelSalesRecord[]; totalRevenue: number }> {
    const sales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: true,
      },
    });

    const productMap = new Map<string, ChannelSalesRecord>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.productId;
        const existing = productMap.get(key);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orderCount++;
          if (sale.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = sale.createdAt;
          }
        } else {
          productMap.set(key, {
            channel: 'POS',
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orderCount: 1,
            lastSaleAt: sale.createdAt,
          });
        }
      }
    }

    const products = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

    return { products, totalRevenue };
  }

  private getDateFilter(filter?: TimeFilter): { gte?: Date; lte?: Date } | undefined {
    if (!filter) return undefined;

    const now = new Date();
    switch (filter.period) {
      case 'today':
        return { gte: new Date(now.setHours(0, 0, 0, 0)) };
      case '7d':
        return { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      case '30d':
        return { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      case '90d':
        return { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
      case 'custom':
        return {
          ...(filter.startDate && { gte: filter.startDate }),
          ...(filter.endDate && { lte: filter.endDate }),
        };
      default:
        return undefined;
    }
  }
}

export function createStockTraceabilityService(tenantId: string): StockTraceabilityService {
  return new StockTraceabilityService(tenantId);
}
