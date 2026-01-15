'use client';

/**
 * Network Status Banner Component
 * Wave F4: Vendor Mobile Dashboard (MVM)
 * 
 * Displays network connectivity status for offline-first awareness.
 * Critical for Nigerian vendors on unstable networks.
 */

import { useEffect, useState } from 'react';

interface NetworkStatusBannerProps {
  lastUpdated?: Date;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function NetworkStatusBanner({
  lastUpdated,
  isRefreshing,
  onRefresh,
}: NetworkStatusBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setShowBanner(!online);
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const formatLastUpdated = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {showBanner && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span className="font-medium">You&apos;re Offline</span>
          </div>
          <span className="text-xs opacity-90">Showing cached data</span>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-gray-600">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
          {lastUpdated && (
            <span className="text-gray-400">
              · Updated {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>

        {onRefresh && isOnline && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-green-600 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>
    </>
  );
}
