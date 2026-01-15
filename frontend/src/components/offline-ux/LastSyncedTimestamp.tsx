/**
 * LAST SYNCED TIMESTAMP COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Simple component showing when data was last synced.
 * Builds trust for operators who need to know their data is current.
 */

'use client';

import { formatTimeAgo } from '@/lib/offline-ux/types';
import { cn } from '@/lib/utils';

export interface LastSyncedTimestampProps {
  timestamp: Date | null;
  className?: string;
  prefix?: string;
  showIcon?: boolean;
}

export function LastSyncedTimestamp({
  timestamp,
  className,
  prefix = 'Last synced',
  showIcon = true,
}: LastSyncedTimestampProps) {
  const timeAgo = formatTimeAgo(timestamp);

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-sm text-gray-500', className)}>
      {showIcon && (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      <span>
        {prefix}: <span className="font-medium">{timeAgo}</span>
      </span>
    </div>
  );
}

export default LastSyncedTimestamp;
