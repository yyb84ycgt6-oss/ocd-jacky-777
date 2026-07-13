// appStorage v2: Transactional safety for pod integrity
import { Mutex } from './mutex';

interface StorageTransaction {
  namespace: string;
  key: string;
  value: unknown;
  timestamp: number;
  version: number;
}

export class AppStorageV2 {
  private static instance: AppStorageV2;
  private mutex = new Mutex();
  private version = 2;
  private transactionLog: StorageTransaction[] = [];

  private constructor() {}

  static getInstance(): AppStorageV2 {
    if (!AppStorageV2.instance) {
      AppStorageV2.instance = new AppStorageV2();
    }
    return AppStorageV2.instance;
  }

  async set(namespace: string, key: string, value: unknown): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const storageKey = `${namespace}:${key}`;
      const transaction: StorageTransaction = {
        namespace,
        key,
        value,
        timestamp: Date.now(),
        version: this.version,
      };

      // Write to IDB first (primary)
      try {
        await this.writeToIDB(storageKey, value);
      } catch (err) {
        console.warn('IDB write failed, falling back to localStorage:', err);
        localStorage.setItem(storageKey, JSON.stringify(value));
      }

      // Log transaction for audit trail
      this.transactionLog.push(transaction);
      if (this.transactionLog.length > 1000) {
        this.transactionLog.shift();
      }
    } finally {
      release();
    }
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const release = await this.mutex.acquire();
    try {
      const storageKey = `${namespace}:${key}`;

      // Try IDB first
      try {
        const value = await this.readFromIDB<T>(storageKey);
        if (value !== null) return value;
      } catch (err) {
        console.warn('IDB read failed:', err);
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } finally {
      release();
    }
  }

  async delete(namespace: string, key: string): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const storageKey = `${namespace}:${key}`;

      // Delete from IDB
      try {
        await this.deleteFromIDB(storageKey);
      } catch (err) {
        console.warn('IDB delete failed:', err);
      }

      // Delete from localStorage
      localStorage.removeItem(storageKey);
    } finally {
      release();
    }
  }

  async clearNamespace(namespace: string): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const prefix = `${namespace}:`;
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      keys.forEach(k => localStorage.removeItem(k));

      try {
        await this.clearIDBNamespace(namespace);
      } catch (err) {
        console.warn('IDB clear failed:', err);
      }
    } finally {
      release();
    }
  }

  getTransactionLog(): StorageTransaction[] {
    return [...this.transactionLog];
  }

  // IDB helpers
  private async writeToIDB(key: string, value: unknown): Promise<void> {
    const db = await this.getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['appstore'], 'readwrite');
      const store = tx.objectStore('appstore');
      const req = store.put({ key, value, timestamp: Date.now() });
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
    });
  }

  private async readFromIDB<T>(key: string): Promise<T | null> {
    const db = await this.getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['appstore'], 'readonly');
      const store = tx.objectStore('appstore');
      const req = store.get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result?.value || null);
    });
  }

  private async deleteFromIDB(key: string): Promise<void> {
    const db = await this.getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['appstore'], 'readwrite');
      const store = tx.objectStore('appstore');
      const req = store.delete(key);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
    });
  }

  private async clearIDBNamespace(namespace: string): Promise<void> {
    const db = await this.getIDB();
    const prefix = `${namespace}:`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['appstore'], 'readwrite');
      const store = tx.objectStore('appstore');
      const req = store.openCursor();
      req.onerror = () => reject(req.error);
      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.key.startsWith(prefix)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
    });
  }

  private async getIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('OCD_Jacky_v2', 2);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('appstore')) {
          db.createObjectStore('appstore', { keyPath: 'key' });
        }
      };
    });
  }
}

export const appStorage = AppStorageV2.getInstance();
