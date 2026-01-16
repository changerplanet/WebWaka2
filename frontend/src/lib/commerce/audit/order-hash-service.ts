/**
 * ORDER HASH SERVICE - Wave D1
 * ============================
 * 
 * Generates and verifies integrity hashes for orders.
 * 
 * Features:
 * - SHA-256 hash of financially relevant fields
 * - Hash generated on creation and every revision
 * - Deterministic hash generation
 * 
 * @module lib/commerce/audit/order-hash-service
 */

import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export type OrderType = 'SVM_ORDER' | 'MVM_PARENT_ORDER' | 'MVM_SUB_ORDER' | 'PARK_TICKET';

interface SvmOrderHashData {
  orderNumber: string;
  tenantId: string;
  customerEmail: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  shippingTotal: Decimal;
  grandTotal: Decimal;
  currency: string;
  status: string;
  paymentStatus: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: Decimal;
    lineTotal: Decimal;
  }>;
}

interface MvmParentOrderHashData {
  orderNumber: string;
  tenantId: string;
  customerEmail: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  shippingTotal: Decimal;
  grandTotal: Decimal;
  currency: string;
  status: string;
  paymentStatus: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: Decimal;
    lineTotal: Decimal;
  }>;
}

interface MvmSubOrderHashData {
  subOrderNumber: string;
  tenantId: string;
  vendorId: string;
  subtotal: Decimal;
  discountTotal: Decimal;
  taxTotal: Decimal;
  shippingTotal: Decimal;
  grandTotal: Decimal;
  commissionRate: Decimal;
  commissionAmount: Decimal;
  vendorPayout: Decimal;
  currency: string;
  status: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: Decimal;
    lineTotal: Decimal;
  }>;
}

function normalizeDecimal(d: Decimal | number | null | undefined): string {
  if (d === null || d === undefined) return '0';
  return new Decimal(d).toFixed(2);
}

function hashPayload(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export class OrderHashService {
  /**
   * Generate hash for SVM order
   */
  static generateSvmOrderHash(data: SvmOrderHashData): string {
    const itemsPayload = data.items
      .sort((a, b) => a.productId.localeCompare(b.productId))
      .map(i => `${i.productId}:${i.quantity}:${normalizeDecimal(i.unitPrice)}:${normalizeDecimal(i.lineTotal)}`)
      .join('|');

    const payload = [
      data.orderNumber,
      data.tenantId,
      data.customerEmail,
      normalizeDecimal(data.subtotal),
      normalizeDecimal(data.discountTotal),
      normalizeDecimal(data.taxTotal),
      normalizeDecimal(data.shippingTotal),
      normalizeDecimal(data.grandTotal),
      data.currency,
      data.status,
      data.paymentStatus,
      itemsPayload,
    ].join(':');

    return hashPayload(payload);
  }

  /**
   * Generate hash for MVM parent order
   */
  static generateMvmParentOrderHash(data: MvmParentOrderHashData): string {
    const itemsPayload = data.items
      .sort((a, b) => a.productId.localeCompare(b.productId))
      .map(i => `${i.productId}:${i.quantity}:${normalizeDecimal(i.unitPrice)}:${normalizeDecimal(i.lineTotal)}`)
      .join('|');

    const payload = [
      data.orderNumber,
      data.tenantId,
      data.customerEmail,
      normalizeDecimal(data.subtotal),
      normalizeDecimal(data.discountTotal),
      normalizeDecimal(data.taxTotal),
      normalizeDecimal(data.shippingTotal),
      normalizeDecimal(data.grandTotal),
      data.currency,
      data.status,
      data.paymentStatus,
      itemsPayload,
    ].join(':');

    return hashPayload(payload);
  }

  /**
   * Generate hash for MVM sub-order
   */
  static generateMvmSubOrderHash(data: MvmSubOrderHashData): string {
    const itemsPayload = data.items
      .sort((a, b) => a.productId.localeCompare(b.productId))
      .map(i => `${i.productId}:${i.quantity}:${normalizeDecimal(i.unitPrice)}:${normalizeDecimal(i.lineTotal)}`)
      .join('|');

    const payload = [
      data.subOrderNumber,
      data.tenantId,
      data.vendorId,
      normalizeDecimal(data.subtotal),
      normalizeDecimal(data.discountTotal),
      normalizeDecimal(data.taxTotal),
      normalizeDecimal(data.shippingTotal),
      normalizeDecimal(data.grandTotal),
      normalizeDecimal(data.commissionRate),
      normalizeDecimal(data.commissionAmount),
      normalizeDecimal(data.vendorPayout),
      data.currency,
      data.status,
      itemsPayload,
    ].join(':');

    return hashPayload(payload);
  }

  /**
   * Compute and store hash for an SVM order
   */
  static async computeAndStoreSvmHash(orderId: string): Promise<string> {
    const order = await prisma.svm_orders.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        svm_order_items: {
          select: { productId: true, quantity: true, unitPrice: true, lineTotal: true },
        },
      },
    });

    const hash = this.generateSvmOrderHash({
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      customerEmail: order.customerEmail,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      shippingTotal: order.shippingTotal,
      grandTotal: order.grandTotal,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.svm_order_items,
    });

    await prisma.svm_orders.update({
      where: { id: orderId },
      data: { verificationHash: hash },
    });

    return hash;
  }

  /**
   * Compute and store hash for an MVM parent order
   */
  static async computeAndStoreMvmParentHash(orderId: string): Promise<string> {
    const order = await prisma.mvm_parent_order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          select: { productId: true, quantity: true, unitPrice: true, lineTotal: true },
        },
      },
    });

    const hash = this.generateMvmParentOrderHash({
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      customerEmail: order.customerEmail,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      shippingTotal: order.shippingTotal,
      grandTotal: order.grandTotal,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items,
    });

    await prisma.mvm_parent_order.update({
      where: { id: orderId },
      data: { verificationHash: hash },
    });

    return hash;
  }

  /**
   * Compute and store hash for an MVM sub-order
   */
  static async computeAndStoreMvmSubHash(subOrderId: string): Promise<string> {
    const order = await prisma.mvm_sub_order.findUniqueOrThrow({
      where: { id: subOrderId },
      include: {
        items: {
          select: { productId: true, quantity: true, unitPrice: true, lineTotal: true },
        },
      },
    });

    const hash = this.generateMvmSubOrderHash({
      subOrderNumber: order.subOrderNumber,
      tenantId: order.tenantId,
      vendorId: order.vendorId,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      shippingTotal: order.shippingTotal,
      grandTotal: order.grandTotal,
      commissionRate: order.commissionRate,
      commissionAmount: order.commissionAmount,
      vendorPayout: order.vendorPayout,
      currency: order.currency,
      status: order.status,
      items: order.items,
    });

    await prisma.mvm_sub_order.update({
      where: { id: subOrderId },
      data: { verificationHash: hash },
    });

    return hash;
  }

  /**
   * Verify hash for an SVM order
   */
  static async verifySvmOrderHash(orderId: string): Promise<{ valid: boolean; storedHash: string | null; computedHash: string }> {
    const order = await prisma.svm_orders.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        svm_order_items: {
          select: { productId: true, quantity: true, unitPrice: true, lineTotal: true },
        },
      },
    });

    const computedHash = this.generateSvmOrderHash({
      orderNumber: order.orderNumber,
      tenantId: order.tenantId,
      customerEmail: order.customerEmail,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      shippingTotal: order.shippingTotal,
      grandTotal: order.grandTotal,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.svm_order_items,
    });

    return {
      valid: order.verificationHash === computedHash,
      storedHash: order.verificationHash,
      computedHash,
    };
  }
}

export const computeSvmOrderHash = OrderHashService.computeAndStoreSvmHash.bind(OrderHashService);
export const computeMvmParentOrderHash = OrderHashService.computeAndStoreMvmParentHash.bind(OrderHashService);
export const computeMvmSubOrderHash = OrderHashService.computeAndStoreMvmSubHash.bind(OrderHashService);
