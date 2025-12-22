import type { CacheStats } from "../types/state.ts";
import type { Cache } from "./cache.ts";

export const createNoopCache = <T>(): Cache<T> => {
   return {
      get: () => undefined,
      set: () => {},
      has: () => false,
      delete: () => false,
      clear: () => {},
      getStats: (): CacheStats => ({
         size: 0,
         maxSize: 0,
         hits: 0,
         misses: 0,
         hitRate: 0,
         evictions: 0,
      }),
   };
};
