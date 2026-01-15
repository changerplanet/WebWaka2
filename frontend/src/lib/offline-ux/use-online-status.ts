/**
 * USE ONLINE STATUS HOOK
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * React hook for detecting online/offline state.
 * NO automation, NO background jobs — purely reactive to browser events.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectionState, OnlineStatus } from './types';

const UNSTABLE_THRESHOLD_MS = 5000;

export function useOnlineStatus(): OnlineStatus & {
  checkConnection: () => void;
  isOnline: boolean;
  isOffline: boolean;
  isUnstable: boolean;
} {
  const [status, setStatus] = useState<OnlineStatus>({
    state: typeof window !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    lastOnlineAt: typeof window !== 'undefined' && navigator.onLine ? new Date() : null,
    lastCheckedAt: new Date(),
  });

  const determineState = useCallback((online: boolean, timeSinceLastOnline: number | null): ConnectionState => {
    if (!online) return 'offline';
    if (timeSinceLastOnline !== null && timeSinceLastOnline > UNSTABLE_THRESHOLD_MS) {
      return 'unstable';
    }
    return 'online';
  }, []);

  const handleOnline = useCallback(() => {
    const now = new Date();
    const timeSinceLastOnline = status.lastOnlineAt 
      ? now.getTime() - status.lastOnlineAt.getTime() 
      : null;
    
    setStatus({
      state: determineState(true, timeSinceLastOnline),
      lastOnlineAt: now,
      lastCheckedAt: now,
    });
  }, [status.lastOnlineAt, determineState]);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      state: 'offline',
      lastCheckedAt: new Date(),
    }));
  }, []);

  const checkConnection = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const online = navigator.onLine;
    const now = new Date();
    
    setStatus(prev => ({
      state: online ? 'online' : 'offline',
      lastOnlineAt: online ? now : prev.lastOnlineAt,
      lastCheckedAt: now,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, checkConnection]);

  return {
    ...status,
    checkConnection,
    isOnline: status.state === 'online',
    isOffline: status.state === 'offline',
    isUnstable: status.state === 'unstable',
  };
}

export default useOnlineStatus;
