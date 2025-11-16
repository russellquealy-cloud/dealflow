/**
 * Universal Storage Abstraction
 * 
 * Provides a consistent interface for persistent storage that works in:
 * - Web browsers (localStorage)
 * - React Native (AsyncStorage)
 * - Server-side (no-op)
 * 
 * Usage:
 *   import { storage } from '@/lib/storage';
 *   await storage.setItem('key', 'value');
 *   const value = await storage.getItem('key');
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/**
 * Web localStorage adapter
 */
class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
      // Handle quota exceeded errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded');
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('localStorage.clear failed:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.warn('localStorage.getAllKeys failed:', error);
      return [];
    }
  }
}

/**
 * Memory storage adapter (for testing or server-side)
 */
class MemoryStorageAdapter implements StorageAdapter {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

/**
 * Storage service with adapter pattern
 */
class StorageService {
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    if (adapter) {
      this.adapter = adapter;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.adapter = new LocalStorageAdapter();
    } else {
      this.adapter = new MemoryStorageAdapter();
    }
  }

  /**
   * Set a storage adapter (useful for React Native)
   */
  setAdapter(adapter: StorageAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    return this.adapter.getItem(key);
  }

  /**
   * Set an item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    return this.adapter.setItem(key, value);
  }

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    return this.adapter.removeItem(key);
  }

  /**
   * Clear all items from storage
   */
  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  /**
   * Get all keys from storage
   */
  async getAllKeys(): Promise<string[]> {
    return this.adapter.getAllKeys();
  }

  /**
   * Get and parse JSON from storage
   */
  async getJSON<T = unknown>(key: string): Promise<T | null> {
    const item = await this.getItem(key);
    if (!item) {
      return null;
    }
    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse JSON for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set JSON in storage
   */
  async setJSON(key: string, value: unknown): Promise<void> {
    const json = JSON.stringify(value);
    return this.setItem(key, json);
  }
}

// Create singleton instance
let storageInstance: StorageService | null = null;

/**
 * Get or create the storage service instance
 */
export function getStorage(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService();
  }
  return storageInstance;
}

/**
 * Create a new storage service instance (useful for testing)
 */
export function createStorage(adapter?: StorageAdapter): StorageService {
  return new StorageService(adapter);
}

// Export default instance
export const storage = getStorage();

// Export types
export type { StorageAdapter, StorageService };

