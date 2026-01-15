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
    const dateFilter = this.getDateFilter(filter);

    let products: ChannelSalesRecord[] = [];
    let totalRevenue = 0;

    if (channel === 'POS') {
      const posSales = await this.aggregatePOSSales(dateFilter);
      products = posSales.products;
      totalRevenue = posSales.totalRevenue;
    } else if (channel === 'SVM') {
      const svmSales = await this.aggregateSVMSales(dateFilter);
      products = svmSales.products;
      totalRevenue = svmSales.totalRevenue;
    } else if (channel === 'MVM') {
      const mvmSales = await this.aggregateMVMSales(dateFilter);
      products = mvmSales.products;
      totalRevenue = mvmSales.totalRevenue;
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
        channel: 'POS' as ChannelType,
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

    const [posSummary, svmSummary, mvmSummary] = await Promise.all([
      this.aggregatePOSSales(dateFilter),
      this.aggregateSVMSales(dateFilter),
      this.aggregateMVMSales(dateFilter),
    ]);

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
        channel: 'SVM' as ChannelType,
        totalSales: svmSummary.products.reduce((sum, p) => sum + p.quantitySold, 0),
        totalRevenue: svmSummary.totalRevenue,
        productCount: svmSummary.products.length,
        topProduct: svmSummary.products[0] ? {
          productId: svmSummary.products[0].productId,
          productName: svmSummary.products[0].productName,
          revenue: svmSummary.products[0].revenue,
        } : null,
      },
      {
        channel: 'MVM' as ChannelType,
        totalSales: mvmSummary.products.reduce((sum, p) => sum + p.quantitySold, 0),
        totalRevenue: mvmSummary.totalRevenue,
        productCount: mvmSummary.products.length,
        topProduct: mvmSummary.products[0] ? {
          productId: mvmSummary.products[0].productId,
          productName: mvmSummary.products[0].productName,
          revenue: mvmSummary.products[0].revenue,
        } : null,
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
    const channels: ChannelSalesRecord[] = [];

    const posSales = await this.getProductPOSSales(productId, dateFilter);
    if (posSales.quantitySold > 0) {
      channels.push({
        channel: 'POS',
        productId,
        productName,
        variantId: null,
        ...posSales,
      });
    }

    const svmSales = await this.getProductSVMSales(productId, dateFilter);
    if (svmSales.quantitySold > 0) {
      channels.push({
        channel: 'SVM',
        productId,
        productName,
        variantId: null,
        ...svmSales,
      });
    }

    const mvmSales = await this.getProductMVMSales(productId, dateFilter);
    if (mvmSales.quantitySold > 0) {
      channels.push({
        channel: 'MVM',
        productId,
        productName,
        variantId: null,
        ...mvmSales,
      });
    }

    return channels;
  }

  private async getProductPOSSales(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<{ quantitySold: number; revenue: number; orderCount: number; lastSaleAt: Date | null }> {
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

    return { quantitySold, revenue, orderCount, lastSaleAt };
  }

  private async getProductSVMSales(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<{ quantitySold: number; revenue: number; orderCount: number; lastSaleAt: Date | null }> {
    const orders = await prisma.svm_orders.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        svm_order_items: {
          where: { productId },
        },
      },
    });

    let quantitySold = 0;
    let revenue = 0;
    let orderCount = 0;
    let lastSaleAt: Date | null = null;

    for (const order of orders) {
      for (const item of order.svm_order_items) {
        quantitySold += item.quantity;
        revenue += Number(item.lineTotal);
        orderCount++;
        if (!lastSaleAt || order.createdAt > lastSaleAt) {
          lastSaleAt = order.createdAt;
        }
      }
    }

    return { quantitySold, revenue, orderCount, lastSaleAt };
  }

  private async getProductMVMSales(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<{ quantitySold: number; revenue: number; orderCount: number; lastSaleAt: Date | null }> {
    const subOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
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

    for (const subOrder of subOrders) {
      for (const item of subOrder.items) {
        quantitySold += item.quantity;
        revenue += Number(item.lineTotal);
        orderCount++;
        if (!lastSaleAt || subOrder.createdAt > lastSaleAt) {
          lastSaleAt = subOrder.createdAt;
        }
      }
    }

    return { quantitySold, revenue, orderCount, lastSaleAt };
  }

  private async getLocationBreakdown(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<LocationSalesRecord[]> {
    const locationSalesMap = new Map<string, {
      locationId: string;
      locationName: string;
      quantitySold: number;
      revenue: number;
      orders: Set<string>;
      lastSaleAt: Date | null;
      channel: ChannelType;
    }>();

    const locations = await prisma.location.findMany({
      where: { tenantId: this.tenantId },
      select: { id: true, name: true },
    });
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    const posSales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: { where: { productId } },
      },
    });

    for (const sale of posSales) {
      if (sale.items.length === 0) continue;
      const locationId = sale.locationId;
      const locationName = locationMap.get(locationId) || 'Unknown';
      const key = `POS:${locationId}`;
      
      for (const item of sale.items) {
        const existing = locationSalesMap.get(key);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orders.add(sale.id);
          if (sale.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = sale.createdAt;
          }
        } else {
          locationSalesMap.set(key, {
            locationId,
            locationName,
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orders: new Set([sale.id]),
            lastSaleAt: sale.createdAt,
            channel: 'POS',
          });
        }
      }
    }

    const svmOrders = await prisma.svm_orders.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        svm_order_items: { where: { productId } },
      },
    });

    const svmLocationKey = 'SVM:online';
    for (const order of svmOrders) {
      if (order.svm_order_items.length === 0) continue;
      
      for (const item of order.svm_order_items) {
        const existing = locationSalesMap.get(svmLocationKey);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orders.add(order.id);
          if (order.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = order.createdAt;
          }
        } else {
          locationSalesMap.set(svmLocationKey, {
            locationId: 'online',
            locationName: 'Online Store (SVM)',
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orders: new Set([order.id]),
            lastSaleAt: order.createdAt,
            channel: 'SVM',
          });
        }
      }
    }

    const mvmSubOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: { where: { productId } },
      },
    });

    const mvmLocationKey = 'MVM:marketplace';
    for (const subOrder of mvmSubOrders) {
      if (subOrder.items.length === 0) continue;
      
      for (const item of subOrder.items) {
        const existing = locationSalesMap.get(mvmLocationKey);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orders.add(subOrder.id);
          if (subOrder.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = subOrder.createdAt;
          }
        } else {
          locationSalesMap.set(mvmLocationKey, {
            locationId: 'marketplace',
            locationName: 'Marketplace (MVM)',
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orders: new Set([subOrder.id]),
            lastSaleAt: subOrder.createdAt,
            channel: 'MVM',
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
      channel: l.channel,
    }));
  }

  private async getDailySales(
    productId: string,
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<DailySalesRecord[]> {
    const startDate = dateFilter?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateFilter?.lte || new Date();

    const dailyMap = new Map<string, {
      quantitySold: number;
      revenue: number;
      byChannel: Record<ChannelType, number>;
    }>();

    const posSales = await prisma.pos_sale.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: { where: { productId } },
      },
    });

    for (const sale of posSales) {
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

    const svmOrders = await prisma.svm_orders.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        svm_order_items: { where: { productId } },
      },
    });

    for (const order of svmOrders) {
      for (const item of order.svm_order_items) {
        const date = order.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(date);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.byChannel['SVM'] = (existing.byChannel['SVM'] || 0) + item.quantity;
        } else {
          dailyMap.set(date, {
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            byChannel: { POS: 0, SVM: item.quantity, MVM: 0 },
          });
        }
      }
    }

    const mvmSubOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: { where: { productId } },
      },
    });

    for (const subOrder of mvmSubOrders) {
      for (const item of subOrder.items) {
        const date = subOrder.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(date);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.byChannel['MVM'] = (existing.byChannel['MVM'] || 0) + item.quantity;
        } else {
          dailyMap.set(date, {
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            byChannel: { POS: 0, SVM: 0, MVM: item.quantity },
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
    dateFilter?: { gte?: Date; lte?: Date }
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

    const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

    return { products, totalRevenue };
  }

  private async aggregateSVMSales(
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<{ products: ChannelSalesRecord[]; totalRevenue: number }> {
    const orders = await prisma.svm_orders.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        svm_order_items: true,
      },
    });

    const productMap = new Map<string, ChannelSalesRecord>();

    for (const order of orders) {
      for (const item of order.svm_order_items) {
        const key = item.productId;
        const existing = productMap.get(key);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orderCount++;
          if (order.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = order.createdAt;
          }
        } else {
          productMap.set(key, {
            channel: 'SVM',
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId || null,
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orderCount: 1,
            lastSaleAt: order.createdAt,
          });
        }
      }
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

    return { products, totalRevenue };
  }

  private async aggregateMVMSales(
    dateFilter?: { gte?: Date; lte?: Date }
  ): Promise<{ products: ChannelSalesRecord[]; totalRevenue: number }> {
    const subOrders = await prisma.mvm_sub_order.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'DELIVERED',
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        items: true,
      },
    });

    const productMap = new Map<string, ChannelSalesRecord>();

    for (const subOrder of subOrders) {
      for (const item of subOrder.items) {
        const key = item.productId;
        const existing = productMap.get(key);

        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += Number(item.lineTotal);
          existing.orderCount++;
          if (subOrder.createdAt > (existing.lastSaleAt || new Date(0))) {
            existing.lastSaleAt = subOrder.createdAt;
          }
        } else {
          productMap.set(key, {
            channel: 'MVM',
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId || null,
            quantitySold: item.quantity,
            revenue: Number(item.lineTotal),
            orderCount: 1,
            lastSaleAt: subOrder.createdAt,
          });
        }
      }
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
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
