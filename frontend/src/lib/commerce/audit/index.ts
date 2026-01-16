/**
 * ORDER AUDIT MODULE - Wave D1
 * ============================
 * 
 * Unified exports for order audit, revision, hash, and commission services.
 * 
 * @module lib/commerce/audit
 */

export {
  OrderAuditService,
  logOrderStatusChange,
  logPaymentStatusChange,
  type StatusChangeParams,
  type PaymentStatusChangeParams,
} from './order-audit-service';

export {
  OrderHashService,
  computeSvmOrderHash,
  computeMvmParentOrderHash,
  computeMvmSubOrderHash,
} from './order-hash-service';

export {
  OrderRevisionService,
  createOrderRevision,
  type OrderChanges,
  type CreateRevisionParams,
} from './order-revision-service';

export {
  CommissionAuditService,
  recordCommissionAudit,
  type CommissionAuditParams,
} from './commission-audit-service';

export type { OrderType, AuditSource } from './order-audit-service';
export type { RevisionReason } from './order-revision-service';
