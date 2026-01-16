/**
 * Order Receipt Service
 * Wave C1: Receipt Integration for SVM and MVM Orders
 * 
 * Generates receipts for e-commerce orders on payment confirmation.
 * Idempotent: Duplicate calls are safely ignored (checks receiptId).
 * 
 * Trigger: Called by webhook processor on payment success (PAID/CAPTURED)
 * 
 * CONSTRAINTS:
 * - Receipts are generated ONLY for paid orders
 * - No retroactive backfills
 * - Receipt ID is written once and not changed
 */

import { prisma } from '@/lib/prisma';
import { createReceiptService } from './receipt-service';
import type { GenerateSvmReceiptInput, GenerateMvmReceiptInput, ReceiptItem } from './types';

interface TenantBranding {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessTaxId?: string;
}

async function getTenantBranding(tenantId: string): Promise<TenantBranding> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      appName: true,
    },
  });

  if (!tenant) {
    return { businessName: 'Unknown Business' };
  }
  
  return {
    businessName: tenant.appName || tenant.name,
  };
}

/**
 * Generate receipt for a paid SVM order
 * Idempotent: Skips if order already has a receipt
 */
export async function generateSvmOrderReceipt(
  orderId: string,
  isDemo: boolean = false
): Promise<{ success: boolean; receiptId?: string; error?: string }> {
  try {
    const order = await prisma.svm_orders.findUnique({
      where: { id: orderId },
      include: {
        svm_order_items: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Idempotency: Skip if receipt already exists
    const orderAny = order as typeof order & { receiptId?: string | null };
    if (orderAny.receiptId) {
      console.log(`[OrderReceiptService] SVM order ${order.orderNumber} already has receipt ${orderAny.receiptId}`);
      return { success: true, receiptId: orderAny.receiptId };
    }

    // Verify order is paid (SVM uses CAPTURED status)
    const paymentStatusStr = String(order.paymentStatus);
    if (paymentStatusStr !== 'CAPTURED') {
      return { success: false, error: `Order not paid (status: ${paymentStatusStr})` };
    }

    const branding = await getTenantBranding(order.tenantId);
    const receiptService = createReceiptService(order.tenantId);

    const items: ReceiptItem[] = order.svm_order_items.map(item => ({
      itemType: 'PRODUCT' as const,
      productId: item.productId,
      description: item.variantName 
        ? `${item.productName} - ${item.variantName}` 
        : item.productName,
      sku: item.sku || undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discountAmount) || undefined,
      tax: Number(item.taxAmount) || undefined,
      lineTotal: Number(item.lineTotal),
    }));

    const input: GenerateSvmReceiptInput = {
      tenantId: order.tenantId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      business: branding,
      customer: {
        customerName: order.customerName || undefined,
        customerPhone: order.customerPhone || undefined,
        customerEmail: order.customerEmail,
      },
      items,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal) || undefined,
      taxTotal: Number(order.taxTotal) || undefined,
      shippingTotal: Number(order.shippingTotal) || undefined,
      grandTotal: Number(order.grandTotal),
      payment: {
        paymentMethod: (order.paymentMethod as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'COD' | 'SPLIT') || 'CARD',
        paymentReference: order.paymentRef || undefined,
      },
      transactionDate: order.paidAt || order.createdAt,
      isDemo,
      notes: `Order #${order.orderNumber}`,
    };

    const receipt = await receiptService.generateSvmReceipt(input);

    // Link receipt to order (using raw update due to schema refresh timing)
    await prisma.$executeRaw`UPDATE svm_orders SET "receiptId" = ${receipt.id} WHERE id = ${orderId}`;

    console.log(`[OrderReceiptService] Generated SVM receipt ${receipt.receiptNumber} for order ${order.orderNumber}`);

    return { success: true, receiptId: receipt.id };
  } catch (error) {
    console.error('[OrderReceiptService] Failed to generate SVM receipt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate receipt for a paid MVM parent order
 * Idempotent: Skips if order already has a receipt
 */
export async function generateMvmOrderReceipt(
  orderId: string,
  isDemo: boolean = false
): Promise<{ success: boolean; receiptId?: string; error?: string }> {
  try {
    const order = await prisma.mvm_parent_order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Idempotency: Skip if receipt already exists
    const orderAny = order as typeof order & { receiptId?: string | null };
    if (orderAny.receiptId) {
      console.log(`[OrderReceiptService] MVM order ${order.orderNumber} already has receipt ${orderAny.receiptId}`);
      return { success: true, receiptId: orderAny.receiptId };
    }

    // Verify order is paid (MVM uses CAPTURED status)
    const paymentStatusStr = String(order.paymentStatus);
    if (paymentStatusStr !== 'CAPTURED') {
      return { success: false, error: `Order not paid (status: ${paymentStatusStr})` };
    }

    const branding = await getTenantBranding(order.tenantId);
    const receiptService = createReceiptService(order.tenantId);

    const items: ReceiptItem[] = order.items.map(item => ({
      itemType: 'PRODUCT' as const,
      productId: item.productId,
      description: item.variantName 
        ? `${item.productName} - ${item.variantName}` 
        : item.productName,
      sku: item.sku || undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount) || undefined,
      tax: Number(item.tax) || undefined,
      lineTotal: Number(item.lineTotal),
    }));

    const input: GenerateMvmReceiptInput = {
      tenantId: order.tenantId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      business: branding,
      customer: {
        customerName: order.customerName || undefined,
        customerPhone: order.customerPhone || undefined,
        customerEmail: order.customerEmail,
      },
      items,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal) || undefined,
      taxTotal: Number(order.taxTotal) || undefined,
      shippingTotal: Number(order.shippingTotal) || undefined,
      grandTotal: Number(order.grandTotal),
      payment: {
        paymentMethod: (order.paymentMethod as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'COD' | 'SPLIT') || 'CARD',
        paymentReference: order.paymentRef || undefined,
      },
      transactionDate: order.paidAt || order.createdAt,
      isDemo,
      notes: `Order #${order.orderNumber}`,
    };

    const receipt = await receiptService.generateMvmReceipt(input);

    // Link receipt to order (using raw update due to schema refresh timing)
    await prisma.$executeRaw`UPDATE mvm_parent_order SET "receiptId" = ${receipt.id} WHERE id = ${orderId}`;

    console.log(`[OrderReceiptService] Generated MVM receipt ${receipt.receiptNumber} for order ${order.orderNumber}`);

    return { success: true, receiptId: receipt.id };
  } catch (error) {
    console.error('[OrderReceiptService] Failed to generate MVM receipt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get receipt for an SVM order
 */
export async function getSvmOrderReceipt(orderId: string) {
  const results = await prisma.$queryRaw<Array<{ receiptId: string | null; tenantId: string }>>`
    SELECT "receiptId", "tenantId" FROM svm_orders WHERE id = ${orderId}
  `;
  
  const order = results[0];
  if (!order?.receiptId) return null;

  const receiptService = createReceiptService(order.tenantId);
  return receiptService.getReceipt(order.receiptId);
}

/**
 * Get receipt for an MVM parent order
 */
export async function getMvmOrderReceipt(orderId: string) {
  const results = await prisma.$queryRaw<Array<{ receiptId: string | null; tenantId: string }>>`
    SELECT "receiptId", "tenantId" FROM mvm_parent_order WHERE id = ${orderId}
  `;
  
  const order = results[0];
  if (!order?.receiptId) return null;

  const receiptService = createReceiptService(order.tenantId);
  return receiptService.getReceipt(order.receiptId);
}
