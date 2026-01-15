/**
 * OFFLINE BANNER COMPONENT
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Fixed banner at top/bottom of screen for persistent offline awareness.
 * Mobile-first, non-intrusive, plain language.
 */

'use client';

import { useOnlineStatus } from '@/lib/offline-ux';
import { CONNECTION_MESSAGES, formatTimeSince } from '@/lib/offline-ux/types';
import { cn } from '@/lib/utils';

export interface OfflineBannerProps {
  position?: 'top' | 'bottom';
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineBanner({
  position = 'bottom',
  className,
  showWhenOnline = false,
}: OfflineBannerProps) {
  const { state, lastOnlineAt, checkConnection, isOnline } = useOnlineStatus();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  const message = CONNECTION_MESSAGES[state];

  const positionStyles = {
    top: 'top-0',
    bottom: 'bottom-0',
  };

  const stateStyles = {
    online: 'bg-green-500 text-white',
    offline: 'bg-red-500 text-white',
    unstable: 'bg-yellow-500 text-black',
  };

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 safe-area-inset',
        positionStyles[position],
        stateStyles[state],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            state === 'online' ? 'bg-white' : state === 'unstable' ? 'bg-black animate-pulse' : 'bg-white animate-pulse'
          )} />
          <span className="font-medium truncate">{message.title}</span>
          {state === 'offline' && lastOnlineAt && (
            <span className="text-sm opacity-80 hidden sm:inline">
              ({formatTimeSince(lastOnlineAt)})
            </span>
          )}
        </div>
        
        {state === 'offline' && (
          <button
            onClick={() => checkConnection()}
            className="text-sm font-medium underline hover:no-underline flex-shrink-0"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default OfflineBanner;
