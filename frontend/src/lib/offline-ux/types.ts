/**
 * OFFLINE UX TYPES
 * Wave 2.5: Offline UX Clarity & Trust Signals
 * 
 * Types for offline indicators, sync states, and trust signals.
 * All states are informational only — NO automation, NO background jobs.
 */

export type ConnectionState = 'online' | 'offline' | 'unstable';

export type SyncState = 
  | 'synced'           // All data is synchronized
  | 'syncing'          // Currently syncing
  | 'queued'           // Items waiting to sync
  | 'error'            // Sync failed
  | 'pending_review';  // Requires human review

export type TrustLevel = 
  | 'verified'         // Confirmed/approved
  | 'pending'          // Awaiting verification
  | 'demo'             // Demo/test data
  | 'unverified'       // Not yet verified
  | 'rejected';        // Failed verification

export interface OnlineStatus {
  state: ConnectionState;
  lastOnlineAt: Date | null;
  lastCheckedAt: Date;
}

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: Date | null;
  pendingCount: number;
  errorMessage?: string;
}

export interface TrustSignal {
  level: TrustLevel;
  label: string;
  description: string;
  timestamp?: Date;
}

export interface StatusMessage {
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
}

export const CONNECTION_MESSAGES: Record<ConnectionState, StatusMessage> = {
  online: {
    title: 'Connected',
    description: 'You are online. All changes will sync automatically.',
  },
  offline: {
    title: 'You are offline',
    description: 'Your changes are saved locally and will sync when you reconnect.',
    action: 'retry',
    actionLabel: 'Try to reconnect',
  },
  unstable: {
    title: 'Connection unstable',
    description: 'Your connection is slow. Changes are being saved locally.',
  },
};

export const SYNC_MESSAGES: Record<SyncState, StatusMessage> = {
  synced: {
    title: 'All synced',
    description: 'Everything is up to date.',
  },
  syncing: {
    title: 'Syncing...',
    description: 'Your changes are being saved to the server.',
  },
  queued: {
    title: 'Changes queued',
    description: 'Your changes are saved locally and waiting to sync.',
  },
  error: {
    title: 'Sync failed',
    description: 'Some changes could not be saved. Please try again.',
    action: 'retry',
    actionLabel: 'Retry sync',
  },
  pending_review: {
    title: 'Pending review',
    description: 'Your submission is being reviewed by an admin.',
  },
};

export const TRUST_LABELS: Record<TrustLevel, { label: string; description: string }> = {
  verified: {
    label: 'Verified',
    description: 'This has been confirmed and approved.',
  },
  pending: {
    label: 'Pending',
    description: 'Waiting for review or approval.',
  },
  demo: {
    label: 'Demo',
    description: 'This is demo data for testing purposes.',
  },
  unverified: {
    label: 'Unverified',
    description: 'This has not yet been verified.',
  },
  rejected: {
    label: 'Rejected',
    description: 'This was reviewed and not approved.',
  },
};

export interface OfflineQueueItem {
  id: string;
  type: string;
  createdAt: Date;
  status: 'queued' | 'syncing' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface OfflineQueueSummary {
  totalItems: number;
  pendingItems: number;
  failedItems: number;
  oldestItemAge?: number;
}

export function formatTimeSince(date: Date | null): string {
  if (!date) return 'Never';
  
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export function formatTimeAgo(date: Date | null): string {
  if (!date) return 'never';
  
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return 'yesterday';
  return `${Math.floor(seconds / 86400)} days ago`;
}
