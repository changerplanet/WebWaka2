'use client';

/**
 * Vendor Earnings View Component
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first earnings display with period selection.
 * Read-only financial visibility.
 */

import { useState } from 'react';
import {
  VendorEarningsResult,
  VendorPayoutInfo,
  formatNaira,
} from '@/lib/commerce/vendor-dashboard';

interface VendorEarningsViewProps {
  earnings?: VendorEarningsResult;
  payoutInfo?: VendorPayoutInfo;
  isLoading?: boolean;
  onPeriodChange?: (period: string) => void;
  currentPeriod?: string;
}

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export function VendorEarningsView({
  earnings,
  payoutInfo,
  isLoading,
  onPeriodChange,
  currentPeriod = '30d',
}: VendorEarningsViewProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
      </div>
    );
  }

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodChange?.(option.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentPeriod === option.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {earnings && (
        <>
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-5 text-white">
            <p className="text-sm font-medium opacity-90 mb-1">
              Net Earnings ({earnings.summary.label})
            </p>
            <p className="text-3xl font-bold mb-3">
              {formatNaira(earnings.summary.netEarnings)}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="opacity-75">Gross Sales</p>
                <p className="font-semibold">{formatNaira(earnings.summary.grossSales)}</p>
              </div>
              <div>
                <p className="opacity-75">Commission</p>
                <p className="font-semibold">-{formatNaira(earnings.summary.commissions)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm opacity-75">
              {earnings.summary.orderCount} delivered order{earnings.summary.orderCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <span className="font-medium text-gray-900">Payment Breakdown</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showBreakdown ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBreakdown && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Card/Paystack</span>
                  <span className="font-medium">{formatNaira(earnings.byPaymentMethod.paystack)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bank Transfer</span>
                  <span className="font-medium">{formatNaira(earnings.byPaymentMethod.bankTransfer)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash on Delivery</span>
                  <span className="font-medium">{formatNaira(earnings.byPaymentMethod.cod)}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {payoutInfo && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="font-medium text-gray-900 mb-4">Payout Status</h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Ready for Payout</p>
                <p className="text-xs text-gray-400">Minimum: {formatNaira(payoutInfo.minimumPayout)}</p>
              </div>
              <p className={`text-lg font-bold ${
                payoutInfo.eligibleAmount >= payoutInfo.minimumPayout
                  ? 'text-green-600'
                  : 'text-gray-900'
              }`}>
                {formatNaira(payoutInfo.eligibleAmount)}
              </p>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Pending Orders</p>
                <p className="font-semibold text-yellow-600">
                  {formatNaira(payoutInfo.pendingAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Paid</p>
                <p className="font-semibold text-gray-900">
                  {formatNaira(payoutInfo.paidAmount)}
                </p>
              </div>
            </div>

            {payoutInfo.lastPayoutDate && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-600">Last Payout</p>
                <p className="font-medium">
                  {formatNaira(payoutInfo.lastPayoutAmount || 0)} on {formatDate(payoutInfo.lastPayoutDate)}
                </p>
              </div>
            )}

            {payoutInfo.eligibleAmount < payoutInfo.minimumPayout && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium">Not Yet Eligible</p>
                <p>You need {formatNaira(payoutInfo.minimumPayout - payoutInfo.eligibleAmount)} more to reach the minimum payout threshold.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {earnings?.recentOrders && earnings.recentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recent Completed Orders</h4>
          <div className="space-y-3">
            {earnings.recentOrders.slice(0, 5).map((order) => (
              <div key={order.subOrderNumber} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">#{order.subOrderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+{formatNaira(order.netEarning)}</p>
                  <p className="text-xs text-gray-500">of {formatNaira(order.grossAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
