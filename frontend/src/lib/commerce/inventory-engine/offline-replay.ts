/**
 * OFFLINE REPLAY ENGINE
 * Wave F9: Inventory Sync Engine (Advanced)
 * 
 * Deterministic replay, idempotent handling, and sync status propagation.
 * Offline-first with conflict detection.
 * 
 * REPLAY PRINCIPLES:
 * 1. Client-side timestamp ordering for deterministic replay
 * 2. Idempotent event IDs to prevent duplicate processing
 * 3. Sync status propagation to UI components
 * 4. Integrity checks before applying events
 */

import { StockEvent, EventProcessingResult, ChannelSource, StockEventType } from './types';

export interface OfflineStockEvent {
  id: string;
  clientEventId: string;
  channel: ChannelSource;
  eventType: StockEventType;
  productId: string;
  variantId: string | null;
  locationId: string | null;
  quantity: number;
  unitPrice?: number;
  referenceType: string;
  referenceId: string;
  clientTimestamp: number;
  metadata?: Record<string, unknown>;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  conflictDetails?: Record<string, unknown>;
  retryCount: number;
  lastRetryAt?: number;
}

export interface OfflineReplayResult {
  totalEvents: number;
  successCount: number;
  conflictCount: number;
  failedCount: number;
  events: Array<{
    eventId: string;
    status: 'SYNCED' | 'CONFLICT' | 'FAILED';
    result?: EventProcessingResult;
    error?: string;
  }>;
}

export interface SyncStatusState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  syncInProgress: boolean;
  lastError: string | null;
}

const DB_NAME = 'webwaka_inventory_offline';
const STORE_NAME = 'stock_events';
const SYNC_STATUS_KEY = 'webwaka_inventory_sync_status';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000;

export class OfflineReplayEngine {
  private db: IDBDatabase | null = null;
  private syncStatusListeners: Set<(status: SyncStatusState) => void> = new Set();
  private syncStatus: SyncStatusState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    lastSyncAt: null,
    syncInProgress: false,
    lastError: null,
  };

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadSyncStatus();
        this.setupOnlineListener();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('channel', 'channel', { unique: false });
          store.createIndex('productId', 'productId', { unique: false });
        }
      };
    });
  }

  private setupOnlineListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.updateSyncStatus({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.updateSyncStatus({ isOnline: false });
    });
  }

  private loadSyncStatus(): void {
    if (typeof localStorage === 'undefined') return;

    const stored = localStorage.getItem(SYNC_STATUS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.syncStatus = { ...this.syncStatus, ...parsed };
      } catch {
        // Ignore parse errors
      }
    }
  }

  private saveSyncStatus(): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      lastSyncAt: this.syncStatus.lastSyncAt,
      pendingCount: this.syncStatus.pendingCount,
    }));
  }

  private updateSyncStatus(updates: Partial<SyncStatusState>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.saveSyncStatus();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.syncStatusListeners.forEach(listener => listener(this.syncStatus));
  }

  subscribeSyncStatus(listener: (status: SyncStatusState) => void): () => void {
    this.syncStatusListeners.add(listener);
    listener(this.syncStatus);
    return () => this.syncStatusListeners.delete(listener);
  }

  getSyncStatus(): SyncStatusState {
    return { ...this.syncStatus };
  }

  generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `offline_${timestamp}_${random}`;
  }

  async queueEvent(event: Omit<OfflineStockEvent, 'id' | 'syncStatus' | 'retryCount'>): Promise<string> {
    if (!this.db) {
      await this.initialize();
    }

    const offlineEvent: OfflineStockEvent = {
      ...event,
      id: this.generateEventId(),
      syncStatus: 'PENDING',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(offlineEvent);

      request.onsuccess = () => {
        this.updateSyncStatus({ pendingCount: this.syncStatus.pendingCount + 1 });
        resolve(offlineEvent.id);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getPendingEvents(limit?: number): Promise<OfflineStockEvent[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const range = IDBKeyRange.only('PENDING');
      const request = index.openCursor(range);
      const events: OfflineStockEvent[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor && (!limit || events.length < limit)) {
          events.push(cursor.value);
          cursor.continue();
        } else {
          events.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
          resolve(events);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateEventStatus(
    eventId: string,
    status: OfflineStockEvent['syncStatus'],
    conflictDetails?: Record<string, unknown>
  ): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(eventId);

      getRequest.onsuccess = () => {
        const event = getRequest.result as OfflineStockEvent | undefined;
        if (!event) {
          resolve();
          return;
        }

        event.syncStatus = status;
        if (conflictDetails) {
          event.conflictDetails = conflictDetails;
        }
        if (status === 'FAILED') {
          event.retryCount++;
          event.lastRetryAt = Date.now();
        }

        const putRequest = store.put(event);
        putRequest.onsuccess = () => {
          if (status === 'SYNCED' || status === 'FAILED') {
            this.updateSyncStatus({
              pendingCount: Math.max(0, this.syncStatus.pendingCount - 1),
            });
          }
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async incrementRetryCount(eventId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(eventId);

      getRequest.onsuccess = () => {
        const event = getRequest.result as OfflineStockEvent | undefined;
        if (!event) {
          resolve();
          return;
        }

        event.retryCount++;
        event.lastRetryAt = Date.now();

        const putRequest = store.put(event);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async replayPendingEvents(
    apiEndpoint: string,
    tenantId: string
  ): Promise<OfflineReplayResult> {
    if (!this.syncStatus.isOnline) {
      return {
        totalEvents: 0,
        successCount: 0,
        conflictCount: 0,
        failedCount: 0,
        events: [],
      };
    }

    this.updateSyncStatus({ syncInProgress: true, lastError: null });

    const pendingEvents = await this.getPendingEvents();
    const result: OfflineReplayResult = {
      totalEvents: pendingEvents.length,
      successCount: 0,
      conflictCount: 0,
      failedCount: 0,
      events: [],
    };

    for (const offlineEvent of pendingEvents) {
      if (offlineEvent.retryCount >= MAX_RETRY_COUNT) {
        await this.updateEventStatus(offlineEvent.id, 'FAILED', {
          reason: 'Max retries exceeded',
        });
        result.failedCount++;
        result.events.push({
          eventId: offlineEvent.id,
          status: 'FAILED',
          error: 'Max retries exceeded',
        });
        continue;
      }

      if (offlineEvent.retryCount > 0 && offlineEvent.lastRetryAt) {
        const timeSinceLastRetry = Date.now() - offlineEvent.lastRetryAt;
        const backoffDelay = RETRY_DELAY_MS * Math.pow(2, offlineEvent.retryCount - 1);
        if (timeSinceLastRetry < backoffDelay) {
          continue;
        }
      }

      try {
        await this.updateEventStatus(offlineEvent.id, 'SYNCING');

        const serverEvent: Partial<StockEvent> = {
          id: offlineEvent.clientEventId,
          tenantId,
          channel: offlineEvent.channel,
          eventType: offlineEvent.eventType,
          productId: offlineEvent.productId,
          variantId: offlineEvent.variantId,
          locationId: offlineEvent.locationId,
          quantity: offlineEvent.quantity,
          unitPrice: offlineEvent.unitPrice,
          referenceType: offlineEvent.referenceType,
          referenceId: offlineEvent.referenceId,
          clientTimestamp: new Date(offlineEvent.clientTimestamp),
          isOffline: true,
          offlineEventId: offlineEvent.id,
          metadata: offlineEvent.metadata,
        };

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'process_event',
            ...serverEvent,
          }),
        });

        const responseData = await response.json();

        if (responseData.success) {
          if (responseData.result?.conflict && responseData.result.conflict.type !== 'NONE') {
            const conflictSeverity = responseData.result.conflict.severity;
            if (conflictSeverity === 'CRITICAL') {
              await this.updateEventStatus(offlineEvent.id, 'CONFLICT', responseData.result.conflict);
              result.conflictCount++;
              result.events.push({
                eventId: offlineEvent.id,
                status: 'CONFLICT',
                result: responseData.result,
              });
            } else {
              await this.updateEventStatus(offlineEvent.id, 'SYNCED');
              result.successCount++;
              result.events.push({
                eventId: offlineEvent.id,
                status: 'SYNCED',
                result: responseData.result,
              });
            }
          } else {
            await this.updateEventStatus(offlineEvent.id, 'SYNCED');
            result.successCount++;
            result.events.push({
              eventId: offlineEvent.id,
              status: 'SYNCED',
              result: responseData.result,
            });
          }
        } else {
          throw new Error(responseData.error || 'Unknown error');
        }
      } catch (error) {
        await this.incrementRetryCount(offlineEvent.id);
        result.failedCount++;
        result.events.push({
          eventId: offlineEvent.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.updateSyncStatus({
      syncInProgress: false,
      lastSyncAt: Date.now(),
      lastError: result.failedCount > 0 ? `${result.failedCount} events failed to sync` : null,
    });

    return result;
  }

  async clearSyncedEvents(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(0);
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const range = IDBKeyRange.only('SYNCED');
      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getEventsByProduct(productId: string): Promise<OfflineStockEvent[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('productId');
      const range = IDBKeyRange.only(productId);
      const request = index.getAll(range);

      request.onsuccess = () => {
        const events = request.result as OfflineStockEvent[];
        events.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
        resolve(events);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getConflictEvents(): Promise<OfflineStockEvent[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const range = IDBKeyRange.only('CONFLICT');
      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result as OfflineStockEvent[]);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

let offlineReplayEngineInstance: OfflineReplayEngine | null = null;

export function getOfflineReplayEngine(): OfflineReplayEngine {
  if (!offlineReplayEngineInstance) {
    offlineReplayEngineInstance = new OfflineReplayEngine();
  }
  return offlineReplayEngineInstance;
}

export function useSyncStatus(): SyncStatusState {
  const engine = getOfflineReplayEngine();
  return engine.getSyncStatus();
}
