/**
 * POS OFFLINE CLIENT
 * Wave 1: Nigeria-First Modular Commerce
 * 
 * IndexedDB-based offline queue for POS transactions.
 * Works in browser/PWA with visual sync status indicators.
 */

const DB_NAME = 'webwaka-pos-offline';
const DB_VERSION = 1;
const STORE_SALES = 'offline_sales';
const STORE_PRODUCTS = 'product_cache';

export interface OfflineSale {
  clientSaleId: string;
  clientTimestamp: string;
  tenantId: string;
  locationId: string;
  items: Array<{
    productId: string;
    productName: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffId: string;
  staffName: string;
  roundingAmount?: number;
  roundingMode?: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  syncError?: string;
  serverSaleId?: string;
}

export interface CachedProduct {
  id: string;
  tenantId: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  categoryId?: string;
  status: string;
  trackInventory: boolean;
  quantityAvailable?: number;
  cachedAt: string;
}

class PosOfflineClient {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.setupOnlineListeners();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_SALES)) {
          const salesStore = db.createObjectStore(STORE_SALES, { keyPath: 'clientSaleId' });
          salesStore.createIndex('tenantId', 'tenantId', { unique: false });
          salesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          salesStore.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
          const productStore = db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
          productStore.createIndex('tenantId', 'tenantId', { unique: false });
          productStore.createIndex('barcode', 'barcode', { unique: false });
          productStore.createIndex('sku', 'sku', { unique: false });
        }
      };
    });
  }

  private setupOnlineListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPending();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  async queueSale(sale: Omit<OfflineSale, 'clientSaleId' | 'clientTimestamp' | 'syncStatus'>): Promise<OfflineSale> {
    if (!this.db) await this.init();

    const offlineSale: OfflineSale = {
      ...sale,
      clientSaleId: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientTimestamp: new Date().toISOString(),
      syncStatus: 'pending',
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SALES], 'readwrite');
      const store = transaction.objectStore(STORE_SALES);
      const request = store.add(offlineSale);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.notifyListeners();
        resolve(offlineSale);
      };
    });
  }

  async getPendingSales(tenantId?: string): Promise<OfflineSale[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SALES], 'readonly');
      const store = transaction.objectStore(STORE_SALES);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let sales = request.result as OfflineSale[];
        if (tenantId) {
          sales = sales.filter(s => s.tenantId === tenantId);
        }
        resolve(sales);
      };
    });
  }

  async getConflictedSales(tenantId?: string): Promise<OfflineSale[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SALES], 'readonly');
      const store = transaction.objectStore(STORE_SALES);
      const index = store.index('syncStatus');
      const request = index.getAll('conflict');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let sales = request.result as OfflineSale[];
        if (tenantId) {
          sales = sales.filter(s => s.tenantId === tenantId);
        }
        resolve(sales);
      };
    });
  }

  async updateSaleStatus(
    clientSaleId: string,
    status: OfflineSale['syncStatus'],
    extra?: { serverSaleId?: string; syncError?: string }
  ): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SALES], 'readwrite');
      const store = transaction.objectStore(STORE_SALES);
      const getRequest = store.get(clientSaleId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const sale = getRequest.result as OfflineSale;
        if (!sale) {
          reject(new Error('Sale not found'));
          return;
        }

        sale.syncStatus = status;
        if (extra?.serverSaleId) sale.serverSaleId = extra.serverSaleId;
        if (extra?.syncError) sale.syncError = extra.syncError;

        const putRequest = store.put(sale);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          this.notifyListeners();
          resolve();
        };
      };
    });
  }

  async syncPending(): Promise<{ synced: number; failed: number; conflicts: number }> {
    if (!this.isOnline || this.syncInProgress) {
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    this.syncInProgress = true;
    this.notifyListeners();

    const pending = await this.getPendingSales();
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    for (const sale of pending) {
      try {
        await this.updateSaleStatus(sale.clientSaleId, 'syncing');

        const response = await fetch('/api/commerce/pos-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: sale.tenantId,
            locationId: sale.locationId,
            action: 'queue',
            saleData: sale,
          }),
        });

        const result = await response.json();

        if (result.success) {
          await this.updateSaleStatus(sale.clientSaleId, 'synced', {
            serverSaleId: result.syncedSaleId,
          });
          synced++;
        } else if (result.hasConflict) {
          await this.updateSaleStatus(sale.clientSaleId, 'conflict', {
            syncError: result.message,
          });
          conflicts++;
        } else {
          await this.updateSaleStatus(sale.clientSaleId, 'failed', {
            syncError: result.message || 'Unknown error',
          });
          failed++;
        }
      } catch (error) {
        await this.updateSaleStatus(sale.clientSaleId, 'pending', {
          syncError: error instanceof Error ? error.message : 'Network error',
        });
        failed++;
      }
    }

    this.syncInProgress = false;
    this.notifyListeners();

    return { synced, failed, conflicts };
  }

  async cacheProducts(products: CachedProduct[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRODUCTS], 'readwrite');
      const store = transaction.objectStore(STORE_PRODUCTS);

      for (const product of products) {
        store.put({
          ...product,
          cachedAt: new Date().toISOString(),
        });
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCachedProducts(tenantId: string): Promise<CachedProduct[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PRODUCTS], 'readonly');
      const store = transaction.objectStore(STORE_PRODUCTS);
      const index = store.index('tenantId');
      const request = index.getAll(tenantId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async lookupProductByBarcode(tenantId: string, barcode: string): Promise<CachedProduct | null> {
    if (!this.db) await this.init();

    const products = await this.getCachedProducts(tenantId);
    return products.find(p => p.barcode === barcode) || null;
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(cb => cb(status));
  }

  async clearSyncedSales(olderThanDays: number = 7): Promise<number> {
    if (!this.db) await this.init();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_SALES], 'readwrite');
      const store = transaction.objectStore(STORE_SALES);
      const index = store.index('syncStatus');
      const request = index.openCursor('synced');
      let deleted = 0;

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const sale = cursor.value as OfflineSale;
          if (new Date(sale.clientTimestamp) < cutoff) {
            cursor.delete();
            deleted++;
          }
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
    });
  }
}

export interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
}

export const posOfflineClient = new PosOfflineClient();
