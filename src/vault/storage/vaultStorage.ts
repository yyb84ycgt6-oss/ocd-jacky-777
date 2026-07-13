// IndexedDB + localStorage storage layer for vault data
import { encryptData, decryptData } from './encryption';

const DB_NAME = 'VaultDB';
const DB_VERSION = 1;
const STORES = {
  projects: 'vault_projects',
  media: 'vault_media',
  jobs: 'vault_jobs',
  outputs: 'vault_outputs',
  categories: 'vault_categories',
};

const LOCALSTORAGE_KEY = 'vault_state_encrypted';

interface VaultState {
  projects: any[];
  media: any[];
  jobs: any[];
  outputs: any[];
  categories: any[];
  lastModified: number;
}

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const idb = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      Object.values(STORES).forEach((storeName) => {
        if (!idb.objectStoreNames.contains(storeName)) {
          idb.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
  });
}

async function saveToIndexedDB(
  state: VaultState
): Promise<void> {
  try {
    const idb = await initDB();
    const tx = idb.transaction(Object.values(STORES), 'readwrite');

    // Clear existing data
    Object.values(STORES).forEach((storeName) => {
      tx.objectStore(storeName).clear();
    });

    // Save new data
    tx.objectStore(STORES.projects).add(...state.projects);
    tx.objectStore(STORES.media).add(...state.media);
    tx.objectStore(STORES.jobs).add(...state.jobs);
    tx.objectStore(STORES.outputs).add(...state.outputs);
    tx.objectStore(STORES.categories).add(...state.categories);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage:', err);
  }
}

async function loadFromIndexedDB(): Promise<VaultState | null> {
  try {
    const idb = await initDB();
    const tx = idb.transaction(Object.values(STORES), 'readonly');

    const result: VaultState = {
      projects: [],
      media: [],
      jobs: [],
      outputs: [],
      categories: [],
      lastModified: Date.now(),
    };

    const stores = [
      { name: STORES.projects, key: 'projects' },
      { name: STORES.media, key: 'media' },
      { name: STORES.jobs, key: 'jobs' },
      { name: STORES.outputs, key: 'outputs' },
      { name: STORES.categories, key: 'categories' },
    ] as const;

    for (const { name, key } of stores) {
      const items = await new Promise<any[]>((resolve, reject) => {
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      result[key] = items;
    }

    return result.projects.length > 0 ? result : null;
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
    return null;
  }
}

export async function saveVaultState(
  state: VaultState,
  userId: string
): Promise<void> {
  // Save to IndexedDB
  await saveToIndexedDB(state);

  // Also backup encrypted version to localStorage as fallback
  try {
    const encrypted = await encryptData(state, userId);
    localStorage.setItem(LOCALSTORAGE_KEY, encrypted);
  } catch (err) {
    console.warn('localStorage backup failed:', err);
  }
}

export async function loadVaultState(userId: string): Promise<VaultState | null> {
  // Try IndexedDB first
  let state = await loadFromIndexedDB();
  if (state) return state;

  // Fallback to localStorage
  try {
    const encrypted = localStorage.getItem(LOCALSTORAGE_KEY);
    if (encrypted) {
      state = await decryptData<VaultState>(encrypted, userId);
      return state;
    }
  } catch (err) {
    console.warn('localStorage restore failed:', err);
  }

  return null;
}

export async function clearVaultState(): Promise<void> {
  try {
    const idb = await initDB();
    const tx = idb.transaction(Object.values(STORES), 'readwrite');
    Object.values(STORES).forEach((storeName) => {
      tx.objectStore(storeName).clear();
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB:', err);
  }

  localStorage.removeItem(LOCALSTORAGE_KEY);
}

export async function exportVaultAsFile(
  state: VaultState,
  userId: string
): Promise<Blob> {
  const encrypted = await encryptData(state, userId);
  return new Blob([encrypted], { type: 'application/octet-stream' });
}

export async function importVaultFromFile(
  file: File,
  userId: string
): Promise<VaultState> {
  const encrypted = await file.text();
  return decryptData<VaultState>(encrypted, userId);
}
