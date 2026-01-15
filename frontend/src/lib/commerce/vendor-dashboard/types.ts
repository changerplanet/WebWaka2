/**
 * Vendor Mobile Dashboard Types
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first vendor dashboard for marketplace vendors.
 * Read-only views for orders, fulfillment, and earnings.
 * Optimized for low-end Android devices and unstable networks.
 */

export type VendorDashboardTab = 'orders' | 'fulfillment' | 'earnings';

export type OrderFilterStatus = 
  | 'ALL'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type FulfillmentPriority = 'URGENT' | 'NORMAL' | 'LOW';

export interface VendorProfile {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  status: string;
  isVerified: boolean;
  tierName?: string;
  commissionRate: number;
  totalSales: number;
  totalOrders: number;
  averageRating?: number;
  reviewCount: number;
  createdAt: Date;
}

export interface VendorDashboardStats {
  pendingOrders: number;
  processingOrders: number;
  readyToShip: number;
  shippedOrders: number;
  deliveredToday: number;
  totalEarningsToday: number;
  pendingPayout: number;
  currency: string;
}

export interface VendorOrder {
  id: string;
  subOrderNumber: string;
  parentOrderNumber: string;
  status: string;
  statusLabel: string;
  customerName?: string;
  shippingCity?: string;
  shippingState?: string;
  itemCount: number;
  grandTotal: number;
  vendorPayout: number;
  currency: string;
  createdAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  items: VendorOrderItem[];
  fulfillmentPriority: FulfillmentPriority;
  daysSinceOrder: number;
}

export interface VendorOrderItem {
  id: string;
  productName: string;
  variantName?: string;
  sku?: string;
  imageUrl?: string;
  quantity: number;
  fulfilledQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface VendorFulfillmentItem {
  subOrderId: string;
  subOrderNumber: string;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  quantity: number;
  fulfilledQuantity: number;
  pendingQuantity: number;
  customerName?: string;
  shippingCity?: string;
  shippingState?: string;
  orderDate: Date;
  priority: FulfillmentPriority;
  daysWaiting: number;
}

export interface VendorEarningPeriod {
  label: string;
  grossSales: number;
  commissions: number;
  netEarnings: number;
  orderCount: number;
}

export interface VendorPayoutInfo {
  pendingAmount: number;
  eligibleAmount: number;
  paidAmount: number;
  nextPayoutDate?: Date;
  lastPayoutDate?: Date;
  lastPayoutAmount?: number;
  minimumPayout: number;
  currency: string;
}

export interface VendorDashboardData {
  profile: VendorProfile;
  stats: VendorDashboardStats;
  recentOrders: VendorOrder[];
  payoutInfo: VendorPayoutInfo;
  lastUpdated: Date;
  isOffline?: boolean;
}

export interface VendorOrderListParams {
  status?: OrderFilterStatus;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'amount' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface VendorOrderListResult {
  orders: VendorOrder[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface VendorFulfillmentListParams {
  priority?: FulfillmentPriority;
  limit?: number;
  offset?: number;
}

export interface VendorFulfillmentListResult {
  items: VendorFulfillmentItem[];
  total: number;
  hasMore: boolean;
  urgentCount: number;
  normalCount: number;
}

export interface VendorEarningsParams {
  period: 'today' | '7d' | '30d' | '90d' | 'all';
}

export interface VendorEarningsResult {
  summary: VendorEarningPeriod;
  payoutInfo: VendorPayoutInfo;
  byPaymentMethod: {
    paystack: number;
    bankTransfer: number;
    cod: number;
  };
  recentOrders: Array<{
    subOrderNumber: string;
    date: Date;
    grossAmount: number;
    netEarning: number;
  }>;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting Confirmation',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Preparing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateFulfillmentPriority(orderDate: Date, status: string): FulfillmentPriority {
  if (status === 'CANCELLED' || status === 'DELIVERED' || status === 'REFUNDED') {
    return 'LOW';
  }
  
  const daysSince = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (status === 'PENDING' && daysSince >= 1) {
    return 'URGENT';
  }
  if (status === 'CONFIRMED' && daysSince >= 2) {
    return 'URGENT';
  }
  if (status === 'PROCESSING' && daysSince >= 3) {
    return 'URGENT';
  }
  
  if (daysSince >= 2) {
    return 'NORMAL';
  }
  
  return 'LOW';
}

export function getDaysSinceOrder(orderDate: Date): number {
  return Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
}
