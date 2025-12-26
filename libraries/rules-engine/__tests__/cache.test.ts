import { describe, expect, test } from "bun:test";
import { createCache } from "../src/cache/cache";
import { createNoopCache } from "../src/cache/noop";

describe("createCache", () => {
   test("should store and retrieve values", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
   });

   test("should return undefined for missing keys", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      expect(cache.get("missing")).toBeUndefined();
   });

   test("should track hits and misses", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      cache.set("key1", "value1");
      cache.get("key1");
      cache.get("missing");

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
   });

   test("should expire entries after TTL", async () => {
      const cache = createCache<string>({ ttl: 50, maxSize: 100 });

      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get("key1")).toBeUndefined();
   });

   test("should evict oldest entries when maxSize is reached", () => {
      const cache = createCache<string>({ ttl: 10000, maxSize: 3 });

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");
      cache.set("key4", "value4");

      expect(cache.get("key1")).toBeUndefined();
      expect(cache.get("key4")).toBe("value4");
   });

   test("should calculate hit rate correctly", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      cache.set("key1", "value1");
      cache.get("key1");
      cache.get("key1");
      cache.get("missing");

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
   });

   test("should check if key exists", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
      expect(cache.has("missing")).toBe(false);
   });

   test("should delete entries", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      cache.set("key1", "value1");
      expect(cache.delete("key1")).toBe(true);
      expect(cache.get("key1")).toBeUndefined();
   });

   test("should clear all entries", () => {
      const cache = createCache<string>({ ttl: 1000, maxSize: 100 });

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();

      expect(cache.getStats().size).toBe(0);
   });

   test("should call onEvict callback", async () => {
      const evicted: string[] = [];
      const cache = createCache<string>({
         ttl: 50,
         maxSize: 100,
         onEvict: (key) => evicted.push(key),
      });

      cache.set("key1", "value1");
      await new Promise((resolve) => setTimeout(resolve, 100));
      cache.get("key1");

      expect(evicted).toContain("key1");
   });
});

describe("createNoopCache", () => {
   test("should not store values", () => {
      const cache = createNoopCache<string>();

      cache.set("key1", "value1");
      expect(cache.get("key1")).toBeUndefined();
   });

   test("should always return false for has", () => {
      const cache = createNoopCache<string>();

      expect(cache.has("key1")).toBe(false);
   });

   test("should return empty stats", () => {
      const cache = createNoopCache<string>();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
   });
});
