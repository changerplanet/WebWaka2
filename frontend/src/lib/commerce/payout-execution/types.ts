/**
 * Payout Execution Types
 * Wave F2: Payout Execution Engine (MVM)
 * 
 * Types for payout batch creation, approval, and execution.
 * Manual-trigger only, no automation.
 */

export type PayoutBatchStatus = 
  | 'PENDING'      // Created, awaiting approval
  | 'APPROVED'     // Approved, ready to process
  | 'PROCESSING'   // Payouts being executed
  | 'COMPLETED'    // All payouts done
  | 'FAILED'       // Batch failed
  | 'CANCELLED';   // Cancelled before processing

export type PayoutPeriodType = 'DAILY' | 'WEEKLY' | 'ON_DEMAND';

export type PayoutLogAction =
  | 'BATCH_CREATED'
  | 'BATCH_APPROVED'
  | 'BATCH_PROCESSING'
  | 'BATCH_COMPLETED'
  | 'BATCH_FAILED'
  | 'BATCH_CANCELLED'
  | 'PAYOUT_CREATED'
  | 'PAYOUT_PROCESSING'
  | 'PAYOUT_COMPLETED'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_CANCELLED'
  | 'PAYOUT_RETRY'
  | 'VENDOR_ADDED'
  | 'VENDOR_REMOVED'
  | 'AMOUNT_ADJUSTED'
  | 'NOTES_ADDED';

export interface CreateBatchInput {
  tenantId: string;
  periodType: PayoutPeriodType;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  minPayoutThreshold?: number;
  createdBy: string;
  createdByName?: string;
  isDemo?: boolean;
}

export interface ApproveBatchInput {
  batchId: string;
  approvedBy: string;
  approvedByName?: string;
}

export interface ProcessBatchInput {
  batchId: string;
  processedBy: string;
  processedByName?: string;
}

export interface CancelBatchInput {
  batchId: string;
  cancelledBy: string;
  cancelledByName?: string;
  reason?: string;
}

export interface VendorPayoutPreview {
  vendorId: string;
  vendorName: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  
  eligibleOrders: number;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  
  belowThreshold: boolean;
  thresholdAmount: number;
  
  subOrders: {
    subOrderId: string;
    subOrderNumber: string;
    orderDate: Date;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    paymentMethod: string;
    collectionStatus?: string;
  }[];
}

export interface BatchPreview {
  tenantId: string;
  periodType: PayoutPeriodType;
  periodStart: Date;
  periodEnd: Date;
  
  totalVendors: number;
  eligibleVendors: number;
  excludedVendors: number;
  
  totalGross: number;
  totalCommissions: number;
  totalNet: number;
  
  minPayoutThreshold: number;
  currency: string;
  
  vendors: VendorPayoutPreview[];
}

export interface BatchSummary {
  id: string;
  batchNumber: string;
  description?: string;
  status: PayoutBatchStatus;
  
  periodType: PayoutPeriodType;
  periodStart: Date;
  periodEnd: Date;
  
  vendorCount: number;
  payoutCount: number;
  
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  currency: string;
  
  isDemo: boolean;
  
  createdAt: Date;
  createdBy: string;
  approvedAt?: Date;
  approvedBy?: string;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export interface PayoutDetail {
  id: string;
  payoutNumber: string;
  vendorId: string;
  vendorName: string;
  
  status: string;
  
  grossAmount: number;
  deductions: number;
  netAmount: number;
  currency: string;
  
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  
  paymentRef?: string;
  
  scheduledAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export interface VendorPayoutView {
  vendorId: string;
  vendorName: string;
  tenantId: string;
  currency: string;
  
  pendingPayouts: number;
  processingPayouts: number;
  completedPayouts: number;
  
  totalPaidAmount: number;
  totalPendingAmount: number;
  
  recentPayouts: PayoutDetail[];
  
  bankDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    isVerified: boolean;
  };
}

export interface PayoutLogEntry {
  id: string;
  action: PayoutLogAction;
  fromStatus?: string;
  toStatus?: string;
  details?: string;
  performedBy: string;
  performedByName?: string;
  performedAt: Date;
}
