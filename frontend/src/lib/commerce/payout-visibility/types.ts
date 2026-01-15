/**
 * Payout Visibility Types
 * Wave 2.3: Vendor Payout Visibility (MVM)
 * 
 * Read-only visibility into earnings, commissions, and payment status.
 * NO payout execution - visibility only.
 */

export type PayoutStatus = 
  | 'PENDING'           // Order placed, payment not confirmed
  | 'ELIGIBLE'          // Payment confirmed, awaiting payout
  | 'HOLD'              // Temporarily held (dispute, verification)
  | 'SCHEDULED'         // Scheduled for future payout
  | 'PAID'              // Payout completed (manually recorded)
  | 'CANCELLED';        // Order cancelled, no payout

export type PaymentMethodType = 
  | 'PAYSTACK'
  | 'BANK_TRANSFER'
  | 'COD'
  | 'UNKNOWN';

export interface VendorEarningsSummary {
  vendorId: string;
  vendorName: string;
  tenantId: string;
  currency: string;
  
  // Totals
  totalOrders: number;
  totalGrossSales: number;
  totalCommissions: number;
  totalNetEarnings: number;
  
  // By Status
  pendingEarnings: number;
  eligibleEarnings: number;
  paidEarnings: number;
  
  // By Payment Method
  paystackEarnings: number;
  bankTransferEarnings: number;
  codEarnings: number;
  
  // Collection Status (for COD/Bank Transfer)
  collectedAmount: number;
  pendingCollectionAmount: number;
  
  // Period
  periodStart?: Date;
  periodEnd?: Date;
}

export interface VendorOrderEarning {
  subOrderId: string;
  subOrderNumber: string;
  parentOrderId: string;
  parentOrderNumber: string;
  
  // Order Details
  orderDate: Date;
  status: string;
  itemCount: number;
  
  // Financial
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netEarning: number;
  currency: string;
  
  // Payment
  paymentMethod: PaymentMethodType;
  paymentStatus: PayoutStatus;
  paymentVerified: boolean;
  
  // Collection (for COD/Bank Transfer)
  collectedAmount?: number;
  collectionStatus?: string;
  reconciledAt?: Date;
  
  // Customer (sanitized)
  customerName?: string;
  shippingCity?: string;
  shippingState?: string;
}

export interface PartnerPayoutOverview {
  partnerId: string;
  partnerName: string;
  tenantId: string;
  currency: string;
  
  // Aggregate Metrics
  totalVendors: number;
  activeVendors: number;
  
  // Platform Totals
  totalGrossSales: number;
  totalCommissionsCollected: number;
  totalVendorEarnings: number;
  
  // By Payment Method
  paystackVolume: number;
  bankTransferVolume: number;
  codVolume: number;
  
  // Collection Status
  totalCollected: number;
  totalPendingCollection: number;
  
  // Payout Status
  totalEligibleForPayout: number;
  totalPaid: number;
  totalPending: number;
  
  // Period
  periodStart?: Date;
  periodEnd?: Date;
}

export interface VendorPayoutBreakdown {
  vendorId: string;
  vendorName: string;
  totalOrders: number;
  grossSales: number;
  commissions: number;
  netEarnings: number;
  eligibleAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface TimeFilter {
  period: 'today' | '7d' | '30d' | '90d' | 'all' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export function getTimeFilterDates(filter: TimeFilter): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  
  let start: Date;
  
  switch (filter.period) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case '90d':
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      start = filter.startDate || new Date(0);
      if (filter.endDate) {
        end.setTime(filter.endDate.getTime());
        end.setHours(23, 59, 59, 999);
      }
      break;
    case 'all':
    default:
      start = new Date(0);
      break;
  }
  
  return { start, end };
}
