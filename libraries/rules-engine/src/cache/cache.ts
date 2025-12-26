import type { CacheStats } from "../types/state";

export type CacheEntry<T> = {
   value: T;
   expiresAt: number;
   createdAt: number;
};

export type Cache<T> = {
   readonly get: (key: string) => T | undefined;
   readonly set: (key: string, value: T) => void;
   readonly has: (key: string) => boolean;
   readonly delete: (key: string) => boolean;
   readonly clear: () => void;
   readonly getStats: () => CacheStats;
};

export type CacheOptions = {
   readonly ttl: number;
   readonly maxSize: number;
   readonly onEvict?: (key: string, value: unknown) => void;
};

export const createCache = <T>(options: CacheOptions): Cache<T> => {
   const entries = new Map<string, CacheEntry<T>>();
   let hits = 0;
   let misses = 0;
   let evictions = 0;

   const isExpired = (entry: CacheEntry<T>): boolean => {
      return Date.now() > entry.expiresAt;
   };

   const evictExpired = (): void => {
      const now = Date.now();
      for (const [key, entry] of entries) {
         if (now > entry.expiresAt) {
            entries.delete(key);
            evictions++;
            options.onEvict?.(key, entry.value);
         }
      }
   };

   const evictOldest = (): void => {
      if (entries.size === 0) return;

      // ES6 Maps maintain insertion order - first key is oldest (O(1) lookup)
      const oldestKey = entries.keys().next().value;
      if (oldestKey !== undefined) {
         const entry = entries.get(oldestKey);
         entries.delete(oldestKey);
         evictions++;
         if (entry) {
            options.onEvict?.(oldestKey, entry.value);
         }
      }
   };

   const get = (key: string): T | undefined => {
      const entry = entries.get(key);

      if (!entry) {
         misses++;
         return undefined;
      }

      if (isExpired(entry)) {
         entries.delete(key);
         evictions++;
         options.onEvict?.(key, entry.value);
         misses++;
         return undefined;
      }

      hits++;
      return entry.value;
   };

   const set = (key: string, value: T): void => {
      evictExpired();

      while (entries.size >= options.maxSize) {
         evictOldest();
      }

      const now = Date.now();
      entries.set(key, {
         value,
         expiresAt: now + options.ttl,
         createdAt: now,
      });
   };

   const has = (key: string): boolean => {
      const entry = entries.get(key);
      if (!entry) return false;
      if (isExpired(entry)) {
         entries.delete(key);
         evictions++;
         options.onEvict?.(key, entry.value);
         return false;
      }
      return true;
   };

   const deleteEntry = (key: string): boolean => {
      return entries.delete(key);
   };

   const clear = (): void => {
      entries.clear();
   };

   const getStats = (): CacheStats => {
      const totalRequests = hits + misses;
      return {
         size: entries.size,
         maxSize: options.maxSize,
         hits,
         misses,
         hitRate: totalRequests > 0 ? hits / totalRequests : 0,
         evictions,
      };
   };

   return {
      get,
      set,
      has,
      delete: deleteEntry,
      clear,
      getStats,
   };
};
