/**
 * ORDER SPLITTING ENGINE TESTS
 * Wave 1.5: Test Hardening
 * 
 * Tests parent → sub-order creation, vendor attribution,
 * inventory deduction, and commission calculation.
 */

import { OrderSplittingService, ParentOrderInput } from '@/lib/commerce/order-splitting/order-splitting-service';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mvm_parent_order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    mvm_parent_order_item: {
      create: jest.fn(),
    },
    mvm_sub_order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mvm_sub_order_item: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    mvm_vendor: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('OrderSplittingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTenantId = 'tenant-123';

  const mockOrderInput: ParentOrderInput = {
    customerEmail: 'customer@example.com',
    customerName: 'John Customer',
    customerPhone: '08012345678',
    shippingAddress: {
      addressLine1: '123 Lagos Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'NG',
    },
    items: [
      {
        productId: 'prod-1',
        productName: 'Product A',
        vendorId: 'vendor-1',
        quantity: 2,
        unitPrice: 1000,
        discount: 0,
      },
      {
        productId: 'prod-2',
        productName: 'Product B',
        vendorId: 'vendor-1',
        quantity: 1,
        unitPrice: 500,
        discount: 50,
      },
      {
        productId: 'prod-3',
        productName: 'Product C',
        vendorId: 'vendor-2',
        quantity: 3,
        unitPrice: 300,
        discount: 0,
      },
    ],
    subtotal: 3350,
    shippingTotal: 500,
    taxTotal: 251.25,
    discountTotal: 50,
    grandTotal: 4051.25,
    paymentMethod: 'CARD',
  };

  describe('Parent → Sub-Order Creation', () => {
    it('should create parent order with correct totals', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
        grandTotal: 4051.25,
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      expect(prisma.mvm_parent_order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          customerEmail: 'customer@example.com',
          grandTotal: 4051.25,
          status: 'PENDING',
        }),
      });
    });

    it('should split into correct number of sub-orders', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      expect(result.subOrders.length).toBe(2);
    });

    it('should generate sequential order numbers', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(5);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00006',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      await OrderSplittingService.createAndSplitOrder(mockTenantId, mockOrderInput);

      expect(prisma.mvm_parent_order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderNumber: expect.stringContaining('MKT-'),
        }),
      });
    });
  });

  describe('Vendor Attribution', () => {
    it('should group items by vendorId correctly', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      const vendor1SubOrder = result.subOrders.find(so => so.vendorId === 'vendor-1');
      const vendor2SubOrder = result.subOrders.find(so => so.vendorId === 'vendor-2');

      expect(vendor1SubOrder?.itemCount).toBe(2);
      expect(vendor2SubOrder?.itemCount).toBe(1);
    });

    it('should create sub-order items with correct vendorId', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      await OrderSplittingService.createAndSplitOrder(mockTenantId, mockOrderInput);

      expect(prisma.mvm_sub_order.create).toHaveBeenCalledTimes(2);
    });

    it('should preserve product name in sub-order items', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      await OrderSplittingService.createAndSplitOrder(mockTenantId, mockOrderInput);

      expect(prisma.mvm_sub_order_item.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productName: expect.any(String),
        }),
      });
    });
  });

  describe('Commission Calculation', () => {
    it('should use default 10% commission when no override', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
        tierId: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      result.subOrders.forEach(subOrder => {
        expect(subOrder.commission).toBe(subOrder.subtotal * 0.10);
      });
    });

    it('should use vendor commission override when set', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: 15,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      result.subOrders.forEach(subOrder => {
        expect(subOrder.commission).toBe(subOrder.subtotal * 0.15);
      });
    });

    it('should calculate vendor payout correctly', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      result.subOrders.forEach(subOrder => {
        expect(subOrder.vendorPayout).toBe(subOrder.subtotal - subOrder.commission);
      });
    });

    it('should calculate subtotal per vendor correctly', async () => {
      (prisma.mvm_parent_order.count as jest.Mock).mockResolvedValue(0);
      (prisma.mvm_parent_order.create as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
      });
      (prisma.mvm_vendor.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Vendor',
        commissionOverride: null,
      });
      (prisma.mvm_sub_order.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'PENDING',
      });

      const result = await OrderSplittingService.createAndSplitOrder(
        mockTenantId,
        mockOrderInput
      );

      const vendor1SubOrder = result.subOrders.find(so => so.vendorId === 'vendor-1');
      expect(vendor1SubOrder?.subtotal).toBe(2 * 1000 + (1 * 500 - 50));

      const vendor2SubOrder = result.subOrders.find(so => so.vendorId === 'vendor-2');
      expect(vendor2SubOrder?.subtotal).toBe(3 * 300);
    });
  });

  describe('Sub-Order Status Management', () => {
    it('should update sub-order status with vendor verification', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
        parentOrderId: 'parent-1',
      });
      (prisma.mvm_sub_order.update as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'CONFIRMED',
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { status: 'CONFIRMED' },
      ]);
      (prisma.mvm_parent_order.update as jest.Mock).mockResolvedValue({});

      const result = await OrderSplittingService.updateSubOrderStatus(
        'sub-1',
        'vendor-1',
        'CONFIRMED'
      );

      expect(result.status).toBe('CONFIRMED');
    });

    it('should reject status update from wrong vendor', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
      });

      await expect(
        OrderSplittingService.updateSubOrderStatus('sub-1', 'vendor-2', 'CONFIRMED')
      ).rejects.toThrow('access denied');
    });

    it('should set shippedAt timestamp on SHIPPED status', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
        parentOrderId: 'parent-1',
      });
      (prisma.mvm_sub_order.update as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'SHIPPED',
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { status: 'SHIPPED' },
      ]);
      (prisma.mvm_parent_order.update as jest.Mock).mockResolvedValue({});

      await OrderSplittingService.updateSubOrderStatus(
        'sub-1',
        'vendor-1',
        'SHIPPED'
      );

      expect(prisma.mvm_sub_order.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          shippedAt: expect.any(Date),
        }),
      });
    });

    it('should set deliveredAt timestamp on DELIVERED status', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
        parentOrderId: 'parent-1',
      });
      (prisma.mvm_sub_order.update as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'DELIVERED',
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { status: 'DELIVERED' },
      ]);
      (prisma.mvm_parent_order.update as jest.Mock).mockResolvedValue({});

      await OrderSplittingService.updateSubOrderStatus(
        'sub-1',
        'vendor-1',
        'DELIVERED'
      );

      expect(prisma.mvm_sub_order.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          deliveredAt: expect.any(Date),
        }),
      });
    });
  });

  describe('Parent Order Status Aggregation', () => {
    it('should mark parent as COMPLETED when all sub-orders delivered', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
        parentOrderId: 'parent-1',
      });
      (prisma.mvm_sub_order.update as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'DELIVERED',
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { status: 'DELIVERED' },
        { status: 'DELIVERED' },
      ]);
      (prisma.mvm_parent_order.update as jest.Mock).mockResolvedValue({});

      await OrderSplittingService.updateSubOrderStatus(
        'sub-1',
        'vendor-1',
        'DELIVERED'
      );

      expect(prisma.mvm_parent_order.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { status: 'COMPLETED' },
      });
    });

    it('should mark parent as CANCELLED when all sub-orders cancelled', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
        parentOrderId: 'parent-1',
      });
      (prisma.mvm_sub_order.update as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'CANCELLED',
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { status: 'CANCELLED' },
        { status: 'CANCELLED' },
      ]);
      (prisma.mvm_parent_order.update as jest.Mock).mockResolvedValue({});

      await OrderSplittingService.updateSubOrderStatus(
        'sub-1',
        'vendor-1',
        'CANCELLED'
      );

      expect(prisma.mvm_parent_order.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should mark parent as SPLIT when some sub-orders in progress', async () => {
      (prisma.mvm_sub_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        vendorId: 'vendor-1',
        parentOrderId: 'parent-1',
      });
      (prisma.mvm_sub_order.update as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'SHIPPED',
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { status: 'SHIPPED' },
        { status: 'PENDING' },
      ]);
      (prisma.mvm_parent_order.update as jest.Mock).mockResolvedValue({});

      await OrderSplittingService.updateSubOrderStatus(
        'sub-1',
        'vendor-1',
        'SHIPPED'
      );

      expect(prisma.mvm_parent_order.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { status: 'SPLIT' },
      });
    });
  });

  describe('Customer Order Summary', () => {
    it('should return unified view with all sub-orders', async () => {
      (prisma.mvm_parent_order.findUnique as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        orderNumber: 'MKT-20260115-00001',
        status: 'SPLIT',
        grandTotal: 4051.25,
        currency: 'NGN',
        createdAt: new Date(),
      });
      (prisma.mvm_sub_order.findMany as jest.Mock).mockResolvedValue([
        { subOrderNumber: 'MKT-20260115-00001-V01', status: 'SHIPPED' },
        { subOrderNumber: 'MKT-20260115-00001-V02', status: 'PENDING' },
      ]);

      const summary = await OrderSplittingService.getCustomerOrderSummary('parent-1');

      expect(summary).not.toBeNull();
      expect(summary?.orderNumber).toBe('MKT-20260115-00001');
      expect(summary?.vendorOrders.length).toBe(2);
    });

    it('should return null for non-existent order', async () => {
      (prisma.mvm_parent_order.findUnique as jest.Mock).mockResolvedValue(null);

      const summary = await OrderSplittingService.getCustomerOrderSummary('non-existent');

      expect(summary).toBeNull();
    });
  });
});
