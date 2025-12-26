import { describe, expect, test } from "bun:test";
import {
   filterByCategory,
   filterByEnabled,
   filterByTags,
   filterRules,
} from "../src/core/filter";
import { groupByCategory, groupByCustom, groupRules } from "../src/core/group";
import { sortByName, sortByPriority, sortRules } from "../src/core/sort";
import type { DefaultConsequences } from "../src/types/consequence";
import type { Rule } from "../src/types/rule";

type TestRule = Rule<unknown, DefaultConsequences>;

const createTestRule = (overrides: Partial<TestRule> = {}): TestRule => ({
   id: "rule-1",
   name: "Test Rule",
   description: "A test rule",
   conditions: {
      id: "group-1",
      operator: "AND",
      conditions: [],
   },
   consequences: [],
   priority: 10,
   enabled: true,
   stopOnMatch: false,
   tags: ["test"],
   category: "finance",
   createdAt: new Date("2024-01-01"),
   updatedAt: new Date("2024-01-01"),
   ...overrides,
});

describe("filterRules", () => {
   test("should filter by enabled", () => {
      const rules = [
         createTestRule({ id: "rule-1", enabled: true }),
         createTestRule({ id: "rule-2", enabled: false }),
      ];

      const result = filterRules({ enabled: true })(rules);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("rule-1");
   });

   test("should filter by tags", () => {
      const rules = [
         createTestRule({ id: "rule-1", tags: ["finance", "alerts"] }),
         createTestRule({ id: "rule-2", tags: ["marketing"] }),
      ];

      const result = filterRules({ tags: ["finance"] })(rules);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("rule-1");
   });

   test("should filter by category", () => {
      const rules = [
         createTestRule({ id: "rule-1", category: "finance" }),
         createTestRule({ id: "rule-2", category: "marketing" }),
      ];

      const result = filterRules({ category: "finance" })(rules);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("rule-1");
   });

   test("should filter by ids", () => {
      const rules = [
         createTestRule({ id: "rule-1" }),
         createTestRule({ id: "rule-2" }),
         createTestRule({ id: "rule-3" }),
      ];

      const result = filterRules({ ids: ["rule-1", "rule-3"] })(rules);

      expect(result).toHaveLength(2);
   });

   test("should combine multiple filters", () => {
      const rules = [
         createTestRule({ id: "rule-1", enabled: true, category: "finance" }),
         createTestRule({ id: "rule-2", enabled: false, category: "finance" }),
         createTestRule({ id: "rule-3", enabled: true, category: "marketing" }),
      ];

      const result = filterRules({ enabled: true, category: "finance" })(rules);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("rule-1");
   });
});

describe("filterByEnabled", () => {
   test("should filter enabled rules", () => {
      const rules = [
         createTestRule({ id: "rule-1", enabled: true }),
         createTestRule({ id: "rule-2", enabled: false }),
      ];

      const result = filterByEnabled(true)(rules);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("rule-1");
   });
});

describe("filterByTags", () => {
   test("should filter by tags", () => {
      const rules = [
         createTestRule({ id: "rule-1", tags: ["finance"] }),
         createTestRule({ id: "rule-2", tags: ["marketing"] }),
      ];

      const result = filterByTags(["finance"])(rules);

      expect(result).toHaveLength(1);
   });
});

describe("filterByCategory", () => {
   test("should filter by category", () => {
      const rules = [
         createTestRule({ id: "rule-1", category: "finance" }),
         createTestRule({ id: "rule-2", category: "marketing" }),
      ];

      const result = filterByCategory("finance")(rules);

      expect(result).toHaveLength(1);
   });
});

describe("sortRules", () => {
   test("should sort by priority descending", () => {
      const rules = [
         createTestRule({ id: "rule-1", priority: 5 }),
         createTestRule({ id: "rule-2", priority: 10 }),
         createTestRule({ id: "rule-3", priority: 1 }),
      ];

      const result = sortRules("priority")(rules);

      expect(result[0]?.id).toBe("rule-2");
      expect(result[1]?.id).toBe("rule-1");
      expect(result[2]?.id).toBe("rule-3");
   });

   test("should sort by priority ascending", () => {
      const rules = [
         createTestRule({ id: "rule-1", priority: 5 }),
         createTestRule({ id: "rule-2", priority: 10 }),
         createTestRule({ id: "rule-3", priority: 1 }),
      ];

      const result = sortRules({ field: "priority", direction: "asc" })(rules);

      expect(result[0]?.id).toBe("rule-3");
      expect(result[1]?.id).toBe("rule-1");
      expect(result[2]?.id).toBe("rule-2");
   });

   test("should sort by name", () => {
      const rules = [
         createTestRule({ id: "rule-1", name: "Zebra" }),
         createTestRule({ id: "rule-2", name: "Alpha" }),
         createTestRule({ id: "rule-3", name: "Beta" }),
      ];

      const result = sortRules({ field: "name", direction: "asc" })(rules);

      expect(result[0]?.id).toBe("rule-2");
      expect(result[1]?.id).toBe("rule-3");
      expect(result[2]?.id).toBe("rule-1");
   });

   test("should sort by createdAt", () => {
      const rules = [
         createTestRule({ id: "rule-1", createdAt: new Date("2024-01-15") }),
         createTestRule({ id: "rule-2", createdAt: new Date("2024-01-01") }),
         createTestRule({ id: "rule-3", createdAt: new Date("2024-01-10") }),
      ];

      const result = sortRules({ field: "createdAt", direction: "desc" })(
         rules,
      );

      expect(result[0]?.id).toBe("rule-1");
      expect(result[2]?.id).toBe("rule-2");
   });
});

describe("sortByPriority", () => {
   test("should sort by priority", () => {
      const rules = [
         createTestRule({ id: "rule-1", priority: 1 }),
         createTestRule({ id: "rule-2", priority: 10 }),
      ];

      const result = sortByPriority()(rules);

      expect(result[0]?.id).toBe("rule-2");
   });
});

describe("sortByName", () => {
   test("should sort by name", () => {
      const rules = [
         createTestRule({ id: "rule-1", name: "Zebra" }),
         createTestRule({ id: "rule-2", name: "Alpha" }),
      ];

      const result = sortByName()(rules);

      expect(result[0]?.id).toBe("rule-2");
   });
});

describe("groupRules", () => {
   test("should group by category", () => {
      const rules = [
         createTestRule({ id: "rule-1", category: "finance" }),
         createTestRule({ id: "rule-2", category: "finance" }),
         createTestRule({ id: "rule-3", category: "marketing" }),
      ];

      const result = groupRules("category")(rules);

      expect(result.get("finance")).toHaveLength(2);
      expect(result.get("marketing")).toHaveLength(1);
   });

   test("should group by priority", () => {
      const rules = [
         createTestRule({ id: "rule-1", priority: 10 }),
         createTestRule({ id: "rule-2", priority: 10 }),
         createTestRule({ id: "rule-3", priority: 5 }),
      ];

      const result = groupRules("priority")(rules);

      expect(result.get(10)).toHaveLength(2);
      expect(result.get(5)).toHaveLength(1);
   });

   test("should group by enabled", () => {
      const rules = [
         createTestRule({ id: "rule-1", enabled: true }),
         createTestRule({ id: "rule-2", enabled: false }),
         createTestRule({ id: "rule-3", enabled: true }),
      ];

      const result = groupRules("enabled")(rules);

      expect(result.get(true)).toHaveLength(2);
      expect(result.get(false)).toHaveLength(1);
   });

   test("should handle uncategorized rules", () => {
      const rules = [
         createTestRule({ id: "rule-1", category: undefined }),
         createTestRule({ id: "rule-2", category: "finance" }),
      ];

      const result = groupRules("category")(rules);

      expect(result.get("uncategorized")).toHaveLength(1);
   });
});

describe("groupByCategory", () => {
   test("should group by category", () => {
      const rules = [
         createTestRule({ id: "rule-1", category: "finance" }),
         createTestRule({ id: "rule-2", category: "marketing" }),
      ];

      const result = groupByCategory()(rules);

      expect(result.size).toBe(2);
   });
});

describe("groupByCustom", () => {
   test("should group by custom function", () => {
      const rules = [
         createTestRule({ id: "rule-1", priority: 5 }),
         createTestRule({ id: "rule-2", priority: 15 }),
         createTestRule({ id: "rule-3", priority: 3 }),
      ];

      const result = groupByCustom<unknown, DefaultConsequences, string>(
         (rule) => (rule.priority >= 10 ? "high" : "low"),
      )(rules);

      expect(result.get("high")).toHaveLength(1);
      expect(result.get("low")).toHaveLength(2);
   });
});
