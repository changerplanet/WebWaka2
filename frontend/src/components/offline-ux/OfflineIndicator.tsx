/**
 * OFFLINE INDICATOR COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Visual indicator showing online/offline/unstable connection state.
 * Mobile-first, plain-language messages, NO automation.
 */

'use client';

import { useOnlineStatus } from '@/lib/offline-ux';
import { CONNECTION_MESSAGES, formatTimeSince } from '@/lib/offline-ux/types';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
  compact?: boolean;
  onRetry?: () => void;
}

export function OfflineIndicator({
  className,
  showWhenOnline = false,
  compact = false,
  onRetry,
}: OfflineIndicatorProps) {
  const { state, lastOnlineAt, checkConnection, isOnline } = useOnlineStatus();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  const message = CONNECTION_MESSAGES[state];

  const handleRetry = () => {
    checkConnection();
    onRetry?.();
  };

  const stateStyles = {
    online: 'bg-green-50 border-green-200 text-green-800',
    offline: 'bg-red-50 border-red-200 text-red-800',
    unstable: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const iconStyles = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    unstable: 'bg-yellow-500 animate-pulse',
  };

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium',
          stateStyles[state],
          className
        )}
        role="status"
        aria-live="polite"
      >
        <span className={cn('w-2 h-2 rounded-full', iconStyles[state])} />
        <span>{message.title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        stateStyles[state],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-3 h-3 rounded-full mt-0.5 flex-shrink-0', iconStyles[state])} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base">{message.title}</h4>
          <p className="text-sm mt-1 opacity-90">{message.description}</p>
          
          {state === 'offline' && lastOnlineAt && (
            <p className="text-xs mt-2 opacity-75">
              Last online: {formatTimeSince(lastOnlineAt)}
            </p>
          )}
          
          {message.action === 'retry' && (
            <button
              onClick={handleRetry}
              className={cn(
                'mt-3 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                'bg-white/50 hover:bg-white/80 border border-current/20'
              )}
            >
              {message.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineIndicator;
