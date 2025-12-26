import { describe, expect, test } from "bun:test";
import type { ConditionGroup } from "@f-o-t/condition-evaluator";
import { evaluateRule, evaluateRules } from "../src/core/evaluate";
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
      conditions: [
         {
            id: "cond-1",
            type: "number",
            field: "amount",
            operator: "gt",
            value: 100,
         },
      ],
   },
   consequences: [
      {
         type: "set_category",
         payload: { categoryId: "high-value" },
      },
   ],
   priority: 10,
   enabled: true,
   stopOnMatch: false,
   tags: ["test"],
   category: "finance",
   createdAt: new Date(),
   updatedAt: new Date(),
   ...overrides,
});

describe("evaluateRule", () => {
   test("should match rule when conditions pass", () => {
      const rule = createTestRule();
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context);

      expect(result.matched).toBe(true);
      expect(result.ruleId).toBe("rule-1");
      expect(result.ruleName).toBe("Test Rule");
      expect(result.consequences).toHaveLength(1);
      expect(result.consequences[0]?.type).toBe("set_category");
      expect(result.skipped).toBe(false);
   });

   test("should not match rule when conditions fail", () => {
      const rule = createTestRule();
      const context = {
         data: { amount: 50 },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context);

      expect(result.matched).toBe(false);
      expect(result.consequences).toHaveLength(0);
   });

   test("should skip disabled rules when skipDisabled is true", () => {
      const rule = createTestRule({ enabled: false });
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context, { skipDisabled: true });

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe("Rule is disabled");
      expect(result.matched).toBe(false);
   });

   test("should evaluate disabled rules when skipDisabled is false", () => {
      const rule = createTestRule({ enabled: false });
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context, { skipDisabled: false });

      expect(result.skipped).toBe(false);
      expect(result.matched).toBe(true);
   });

   test("should include evaluation time", () => {
      const rule = createTestRule();
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context);

      expect(result.evaluationTimeMs).toBeGreaterThanOrEqual(0);
   });

   test("should handle complex condition groups", () => {
      const conditions: ConditionGroup = {
         id: "group-1",
         operator: "AND",
         conditions: [
            {
               id: "cond-1",
               type: "number",
               field: "amount",
               operator: "gt",
               value: 100,
            },
            {
               id: "cond-2",
               type: "string",
               field: "status",
               operator: "eq",
               value: "active",
            },
         ],
      };

      const rule = createTestRule({ conditions });
      const context = {
         data: { amount: 150, status: "active" },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context);

      expect(result.matched).toBe(true);
   });

   test("should handle OR condition groups", () => {
      const conditions: ConditionGroup = {
         id: "group-1",
         operator: "OR",
         conditions: [
            {
               id: "cond-1",
               type: "number",
               field: "amount",
               operator: "gt",
               value: 1000,
            },
            {
               id: "cond-2",
               type: "string",
               field: "status",
               operator: "eq",
               value: "premium",
            },
         ],
      };

      const rule = createTestRule({ conditions });
      const context = {
         data: { amount: 50, status: "premium" },
         timestamp: new Date(),
      };

      const result = evaluateRule(rule, context);

      expect(result.matched).toBe(true);
   });
});

describe("evaluateRules", () => {
   test("should evaluate multiple rules", () => {
      const rules = [
         createTestRule({ id: "rule-1", priority: 10 }),
         createTestRule({ id: "rule-2", priority: 5 }),
      ];
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRules(rules, context);

      expect(result.results).toHaveLength(2);
      expect(result.matchedRules).toHaveLength(2);
      expect(result.stoppedEarly).toBe(false);
   });

   test("should stop on stopOnMatch", () => {
      const rules = [
         createTestRule({ id: "rule-1", stopOnMatch: true }),
         createTestRule({ id: "rule-2" }),
      ];
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRules(rules, context);

      expect(result.results).toHaveLength(1);
      expect(result.matchedRules).toHaveLength(1);
      expect(result.stoppedEarly).toBe(true);
      expect(result.stoppedByRuleId).toBe("rule-1");
   });

   test("should stop on first-match conflict resolution", () => {
      const rules = [
         createTestRule({ id: "rule-1" }),
         createTestRule({ id: "rule-2" }),
      ];
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRules(rules, context, {
         config: { conflictResolution: "first-match" },
      });

      expect(result.matchedRules).toHaveLength(1);
      expect(result.stoppedEarly).toBe(true);
   });

   test("should collect all consequences with priority strategy", () => {
      const rules = [
         createTestRule({
            id: "rule-1",
            consequences: [{ type: "action1", payload: {} }],
         }),
         createTestRule({
            id: "rule-2",
            consequences: [{ type: "action2", payload: {} }],
         }),
      ];
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRules(rules, context);

      expect(result.consequences).toHaveLength(2);
   });

   test("should skip disabled rules", () => {
      const rules = [
         createTestRule({ id: "rule-1", enabled: true }),
         createTestRule({ id: "rule-2", enabled: false }),
      ];
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const result = evaluateRules(rules, context);

      expect(result.matchedRules).toHaveLength(1);
      expect(result.results[1]?.skipped).toBe(true);
   });

   test("should call onRuleEvaluated callback", () => {
      const rules = [createTestRule({ id: "rule-1" })];
      const context = {
         data: { amount: 150 },
         timestamp: new Date(),
      };

      const evaluatedRules: string[] = [];

      evaluateRules(rules, context, {
         onRuleEvaluated: (result) => {
            evaluatedRules.push(result.ruleId);
         },
      });

      expect(evaluatedRules).toContain("rule-1");
   });
});
