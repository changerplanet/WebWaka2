'use client';

/**
 * Vendor Order List Component
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first order list with status filtering.
 * Optimized for touch interaction and low-bandwidth.
 */

import { useState } from 'react';
import {
  VendorOrder,
  OrderFilterStatus,
  ORDER_STATUS_COLORS,
  formatNaira,
} from '@/lib/commerce/vendor-dashboard';

interface VendorOrderListProps {
  orders: VendorOrder[];
  total: number;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onFilterChange?: (status: OrderFilterStatus) => void;
  onOrderClick?: (order: VendorOrder) => void;
  currentFilter?: OrderFilterStatus;
}

const FILTER_OPTIONS: { value: OrderFilterStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export function VendorOrderList({
  orders,
  total,
  isLoading,
  hasMore,
  onLoadMore,
  onFilterChange,
  onOrderClick,
  currentFilter = 'ALL',
}: VendorOrderListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Urgent
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Normal
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Orders
          <span className="ml-2 text-sm font-normal text-gray-500">({total})</span>
        </h3>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange?.(option.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              currentFilter === option.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No orders found</p>
          <p className="text-sm">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => {
                  if (expandedId === order.id) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(order.id);
                    onOrderClick?.(order);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      #{order.subOrderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(order.fulfillmentPriority)}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    {order.customerName && (
                      <span>{order.customerName}</span>
                    )}
                    {order.shippingCity && (
                      <span className="ml-1">
                        ({order.shippingCity}, {order.shippingState})
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatNaira(order.grandTotal)}
                    </p>
                    <p className="text-xs text-green-600">
                      Earn: {formatNaira(order.vendorPayout)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                  {order.daysSinceOrder > 0 && (
                    <span className="ml-2">
                      ({order.daysSinceOrder} day{order.daysSinceOrder !== 1 ? 's' : ''} ago)
                    </span>
                  )}
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">N/A</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-gray-500">{item.variantName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">x{item.quantity}</p>
                          <p className="text-xs text-gray-500">{formatNaira(item.lineTotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-3 text-center text-green-600 font-medium bg-white rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
