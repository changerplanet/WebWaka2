/**
 * USE SYNC STATUS HOOK
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * React hook for tracking sync state.
 * NO automation, NO background jobs — state is manually updated by calling code.
 */

'use client';

import { useState, useCallback } from 'react';
import { SyncState, SyncStatus } from './types';

export interface UseSyncStatusOptions {
  initialState?: SyncState;
  initialPendingCount?: number;
}

export function useSyncStatus(options: UseSyncStatusOptions = {}) {
  const [status, setStatus] = useState<SyncStatus>({
    state: options.initialState || 'synced',
    lastSyncedAt: null,
    pendingCount: options.initialPendingCount || 0,
  });

  const setSynced = useCallback(() => {
    setStatus({
      state: 'synced',
      lastSyncedAt: new Date(),
      pendingCount: 0,
    });
  }, []);

  const setSyncing = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      state: 'syncing',
    }));
  }, []);

  const setQueued = useCallback((count: number) => {
    setStatus(prev => ({
      ...prev,
      state: 'queued',
      pendingCount: count,
    }));
  }, []);

  const setError = useCallback((message?: string) => {
    setStatus(prev => ({
      ...prev,
      state: 'error',
      errorMessage: message,
    }));
  }, []);

  const setPendingReview = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      state: 'pending_review',
    }));
  }, []);

  const incrementPending = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      state: prev.pendingCount === 0 ? 'queued' : prev.state,
      pendingCount: prev.pendingCount + 1,
    }));
  }, []);

  const decrementPending = useCallback(() => {
    setStatus(prev => {
      const newCount = Math.max(0, prev.pendingCount - 1);
      return {
        ...prev,
        state: newCount === 0 ? 'synced' : prev.state,
        pendingCount: newCount,
        lastSyncedAt: newCount === 0 ? new Date() : prev.lastSyncedAt,
      };
    });
  }, []);

  return {
    ...status,
    setSynced,
    setSyncing,
    setQueued,
    setError,
    setPendingReview,
    incrementPending,
    decrementPending,
    isSynced: status.state === 'synced',
    isSyncing: status.state === 'syncing',
    isQueued: status.state === 'queued',
    hasError: status.state === 'error',
    isPendingReview: status.state === 'pending_review',
    hasPendingItems: status.pendingCount > 0,
  };
}

export default useSyncStatus;
