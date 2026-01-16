/**
 * ORDER REVISION SERVICE - Wave D1
 * =================================
 * 
 * Captures immutable diffs for all order mutations.
 * 
 * Features:
 * - Diff capture for amounts, items, customer fields, shipping
 * - Revision number auto-increment per order
 * - Hash chain: previousHash → newHash
 * 
 * @module lib/commerce/audit/order-revision-service
 */

import { prisma } from '@/lib/prisma';
import { OrderHashService } from './order-hash-service';

export type OrderType = 'SVM_ORDER' | 'MVM_PARENT_ORDER' | 'MVM_SUB_ORDER' | 'PARK_TICKET';
export type RevisionReason = 'SYSTEM' | 'ADMIN' | 'PAYMENT' | 'RECOVERY' | 'REFUND' | 'CANCELLATION' | 'FULFILLMENT' | 'CUSTOMER_REQUEST';
export type AuditSource = 'SYSTEM' | 'USER' | 'WEBHOOK' | 'POS' | 'ADMIN' | 'API' | 'RECOVERY';

export interface OrderChanges {
  status?: { old: string | null; new: string };
  paymentStatus?: { old: string | null; new: string };
  amounts?: {
    subtotal?: { old: number; new: number };
    discountTotal?: { old: number; new: number };
    taxTotal?: { old: number; new: number };
    shippingTotal?: { old: number; new: number };
    grandTotal?: { old: number; new: number };
  };
  shipping?: {
    method?: { old: string | null; new: string | null };
    trackingNumber?: { old: string | null; new: string | null };
  };
  items?: {
    added?: Array<{ productId: string; quantity: number }>;
    removed?: Array<{ productId: string; quantity: number }>;
    modified?: Array<{ productId: string; oldQuantity: number; newQuantity: number }>;
  };
  [key: string]: unknown;
}

export interface CreateRevisionParams {
  tenantId: string;
  orderType: OrderType;
  orderId: string;
  reason: RevisionReason;
  reasonDetail?: string;
  changes: OrderChanges;
  triggeredBy?: string;
  triggeredByType?: AuditSource;
  transactionRef?: string;
  webhookRef?: string;
}

export class OrderRevisionService {
  /**
   * Create a new revision record for an order
   */
  static async createRevision(params: CreateRevisionParams): Promise<string> {
    const lastRevision = await prisma.order_revision.findFirst({
      where: {
        orderType: params.orderType,
        orderId: params.orderId,
      },
      orderBy: { revisionNumber: 'desc' },
      select: { revisionNumber: true, newHash: true },
    });

    const revisionNumber = (lastRevision?.revisionNumber ?? 0) + 1;
    const previousHash = lastRevision?.newHash ?? null;

    let newHash: string;
    switch (params.orderType) {
      case 'SVM_ORDER':
        newHash = await OrderHashService.computeAndStoreSvmHash(params.orderId);
        break;
      case 'MVM_PARENT_ORDER':
        newHash = await OrderHashService.computeAndStoreMvmParentHash(params.orderId);
        break;
      case 'MVM_SUB_ORDER':
        newHash = await OrderHashService.computeAndStoreMvmSubHash(params.orderId);
        break;
      case 'PARK_TICKET':
        newHash = `ticket-${params.orderId}-${Date.now()}`;
        break;
      default:
        newHash = `unknown-${params.orderId}-${Date.now()}`;
    }

    const record = await prisma.order_revision.create({
      data: {
        tenantId: params.tenantId,
        orderType: params.orderType,
        orderId: params.orderId,
        revisionNumber,
        reason: params.reason,
        reasonDetail: params.reasonDetail,
        previousHash,
        newHash,
        changes: params.changes,
        triggeredBy: params.triggeredBy,
        triggeredByType: params.triggeredByType || 'SYSTEM',
        transactionRef: params.transactionRef,
        webhookRef: params.webhookRef,
      },
    });

    console.log(`[OrderRevision] Revision ${revisionNumber} created for ${params.orderType} ${params.orderId}`);
    return record.id;
  }

  /**
   * Get all revisions for an order
   */
  static async getRevisions(orderType: OrderType, orderId: string) {
    return prisma.order_revision.findMany({
      where: { orderType, orderId },
      orderBy: { revisionNumber: 'asc' },
    });
  }

  /**
   * Verify revision chain integrity
   */
  static async verifyRevisionChain(orderType: OrderType, orderId: string): Promise<{
    valid: boolean;
    brokenAt?: number;
    message: string;
  }> {
    const revisions = await this.getRevisions(orderType, orderId);
    
    if (revisions.length === 0) {
      return { valid: true, message: 'No revisions to verify' };
    }

    if (revisions[0].previousHash !== null) {
      return { valid: false, brokenAt: 1, message: 'First revision should have null previousHash' };
    }

    for (let i = 1; i < revisions.length; i++) {
      if (revisions[i].previousHash !== revisions[i - 1].newHash) {
        return {
          valid: false,
          brokenAt: revisions[i].revisionNumber,
          message: `Chain broken at revision ${revisions[i].revisionNumber}: previousHash doesn't match prior revision's newHash`,
        };
      }
    }

    return { valid: true, message: `Chain verified: ${revisions.length} revisions` };
  }
}

export const createOrderRevision = OrderRevisionService.createRevision.bind(OrderRevisionService);
