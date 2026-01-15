/**
 * QUEUED ITEMS INDICATOR COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Shows pending offline queue items with plain-language status.
 * For POS operators and Park agents who need to know their work is saved.
 */

'use client';

import { OfflineQueueSummary, formatTimeSince } from '@/lib/offline-ux/types';
import { cn } from '@/lib/utils';

export interface QueuedItemsIndicatorProps {
  summary: OfflineQueueSummary;
  className?: string;
  showDetails?: boolean;
  onViewQueue?: () => void;
}

export function QueuedItemsIndicator({
  summary,
  className,
  showDetails = false,
  onViewQueue,
}: QueuedItemsIndicatorProps) {
  const { totalItems, pendingItems, failedItems, oldestItemAge } = summary;

  if (totalItems === 0) {
    return null;
  }

  const hasFailures = failedItems > 0;
  const isAllPending = pendingItems === totalItems;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        hasFailures
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          hasFailures ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
        )}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-semibold',
            hasFailures ? 'text-red-800' : 'text-yellow-800'
          )}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} waiting to sync
          </h4>
          
          <p className={cn(
            'text-sm mt-1',
            hasFailures ? 'text-red-700' : 'text-yellow-700'
          )}>
            {isAllPending
              ? 'Your changes are saved locally and will sync when you reconnect.'
              : hasFailures
                ? `${failedItems} ${failedItems === 1 ? 'item' : 'items'} could not sync. The rest are waiting.`
                : 'Some items are syncing, others are waiting.'}
          </p>
          
          {showDetails && oldestItemAge !== undefined && (
            <p className="text-xs mt-2 opacity-75">
              Oldest item: {formatTimeSince(new Date(Date.now() - oldestItemAge))}
            </p>
          )}
          
          {onViewQueue && (
            <button
              onClick={onViewQueue}
              className={cn(
                'mt-3 text-sm font-medium underline hover:no-underline',
                hasFailures ? 'text-red-700' : 'text-yellow-700'
              )}
            >
              View queued items
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueuedItemsIndicator;
