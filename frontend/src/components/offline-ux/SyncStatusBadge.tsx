/**
 * SYNC STATUS BADGE COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Badge showing sync state: Synced, Syncing, Queued, Error, Pending Review.
 * Mobile-first, plain-language messages, NO automation.
 */

'use client';

import React from 'react';
import { SyncState, SyncStatus, SYNC_MESSAGES, formatTimeSince } from '@/lib/offline-ux/types';
import { cn } from '@/lib/utils';

export interface SyncStatusBadgeProps {
  status: SyncStatus;
  className?: string;
  showTimestamp?: boolean;
  showPendingCount?: boolean;
  onRetry?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const stateStyles: Record<SyncState, string> = {
  synced: 'bg-green-100 text-green-800 border-green-200',
  syncing: 'bg-blue-100 text-blue-800 border-blue-200',
  queued: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  pending_review: 'bg-purple-100 text-purple-800 border-purple-200',
};

const iconContent: Record<SyncState, React.ReactNode> = {
  synced: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  syncing: (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  queued: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending_review: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
};

const sizeStyles = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function SyncStatusBadge({
  status,
  className,
  showTimestamp = false,
  showPendingCount = true,
  onRetry,
  size = 'md',
}: SyncStatusBadgeProps) {
  const message = SYNC_MESSAGES[status.state];

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border font-medium',
          stateStyles[status.state],
          sizeStyles[size]
        )}
        role="status"
        aria-live="polite"
      >
        {iconContent[status.state]}
        <span>{message.title}</span>
        {showPendingCount && status.pendingCount > 0 && (
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {status.pendingCount}
          </span>
        )}
      </div>
      
      {showTimestamp && status.lastSyncedAt && status.state === 'synced' && (
        <span className="text-xs text-gray-500 ml-1">
          {formatTimeSince(status.lastSyncedAt)}
        </span>
      )}
      
      {status.state === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:no-underline mt-1"
        >
          {message.actionLabel}
        </button>
      )}
    </div>
  );
}

export default SyncStatusBadge;
