'use client';

/**
 * Vendor Fulfillment Queue Component
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Mobile-first fulfillment queue with priority indicators.
 * Read-only view of items needing fulfillment.
 */

import {
  VendorFulfillmentItem,
  FulfillmentPriority,
  formatNaira,
} from '@/lib/commerce/vendor-dashboard';

interface VendorFulfillmentQueueProps {
  items: VendorFulfillmentItem[];
  urgentCount: number;
  normalCount: number;
  isLoading?: boolean;
  onFilterChange?: (priority?: FulfillmentPriority) => void;
  currentFilter?: FulfillmentPriority;
}

export function VendorFulfillmentQueue({
  items,
  urgentCount,
  normalCount,
  isLoading,
  onFilterChange,
  currentFilter,
}: VendorFulfillmentQueueProps) {
  const getPriorityStyles = (priority: FulfillmentPriority) => {
    switch (priority) {
      case 'URGENT':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          border: 'border-l-red-500',
          dot: 'bg-red-500',
        };
      case 'NORMAL':
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          border: 'border-l-yellow-500',
          dot: 'bg-yellow-500',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          border: 'border-l-gray-300',
          dot: 'bg-gray-400',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Fulfillment Queue
        </h3>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => onFilterChange?.(undefined)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            !currentFilter
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
          <span className="text-xs opacity-75">({items.length})</span>
        </button>
        <button
          onClick={() => onFilterChange?.('URGENT')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            currentFilter === 'URGENT'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          Urgent
          <span className="text-xs opacity-75">({urgentCount})</span>
        </button>
        <button
          onClick={() => onFilterChange?.('NORMAL')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            currentFilter === 'NORMAL'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          Normal
          <span className="text-xs opacity-75">({normalCount})</span>
        </button>
      </div>

      {urgentCount > 0 && !currentFilter && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-800">Urgent Items Need Attention</p>
            <p className="text-sm text-red-700">
              {urgentCount} item{urgentCount !== 1 ? 's' : ''} waiting too long. Please fulfill soon.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">All Caught Up!</p>
          <p className="text-sm">No items waiting for fulfillment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const styles = getPriorityStyles(item.priority);
            return (
              <div
                key={`${item.subOrderId}-${index}`}
                className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${styles.border}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-gray-500">{item.variantName}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles.badge}`}>
                          {item.priority}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Qty:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {item.pendingQuantity}
                            {item.fulfilledQuantity > 0 && (
                              <span className="text-gray-500 font-normal">
                                {' '}({item.fulfilledQuantity}/{item.quantity} done)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Order #{item.subOrderNumber}</span>
                        <span>
                          {item.daysWaiting === 0 
                            ? 'Today'
                            : `${item.daysWaiting} day${item.daysWaiting !== 1 ? 's' : ''} ago`
                          }
                        </span>
                      </div>

                      {item.customerName && (
                        <div className="mt-1 text-xs text-gray-500">
                          Ship to: {item.customerName}
                          {item.shippingCity && ` (${item.shippingCity}, ${item.shippingState})`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
