import { beforeEach, describe, expect, it } from "bun:test";
import type { Condition, ConditionGroup } from "@f-o-t/condition-evaluator";
import { z } from "zod";
import { createEngine, type Engine } from "../src/engine/engine";
import type { ConsequenceDefinitions } from "../src/types/consequence";

type TestContext = {
   age: number;
   country: string;
   premium: boolean;
   score: number;
};

const TestConsequences = {
   applyDiscount: z.object({
      percentage: z.number(),
      reason: z.string(),
   }),
   sendNotification: z.object({
      type: z.enum(["email", "sms", "push"]),
      message: z.string(),
   }),
   setFlag: z.object({
      name: z.string(),
      value: z.boolean(),
   }),
} satisfies ConsequenceDefinitions;

type TestConsequences = typeof TestConsequences;

const cond = (
   id: string,
   conditions: (Condition | ConditionGroup)[],
): ConditionGroup => ({
   id,
   operator: "AND",
   conditions,
});

const condOr = (
   id: string,
   conditions: (Condition | ConditionGroup)[],
): ConditionGroup => ({
   id,
   operator: "OR",
   conditions,
});

const numCond = (
   id: string,
   field: string,
   operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq",
   value: number,
): Condition => ({
   id,
   type: "number",
   field,
   operator,
   value,
});

const boolCond = (
   id: string,
   field: string,
   operator: "eq" | "neq",
   value: boolean,
): Condition => ({
   id,
   type: "boolean",
   field,
   operator,
   value,
});

describe("createEngine", () => {
   let engine: Engine<TestContext, TestConsequences>;

   beforeEach(() => {
      engine = createEngine<TestContext, TestConsequences>({
         consequences: TestConsequences,
      });
   });

   describe("rule management", () => {
      it("should add a rule and return it", () => {
         const rule = engine.addRule({
            name: "test-rule",
            conditions: cond("g1", [numCond("c1", "age", "gte", 18)]),
            consequences: [
               {
                  type: "applyDiscount",
                  payload: { percentage: 10, reason: "Adult discount" },
               },
            ],
         });

         expect(rule.id).toBeDefined();
         expect(rule.name).toBe("test-rule");
         expect(rule.enabled).toBe(true);
         expect(rule.priority).toBe(0);
      });

      it("should add multiple rules", () => {
         const rules = engine.addRules([
            {
               name: "rule-1",
               conditions: cond("g1", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "flag1", value: true },
                  },
               ],
            },
            {
               name: "rule-2",
               conditions: cond("g2", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "flag2", value: false },
                  },
               ],
            },
         ]);

         expect(rules).toHaveLength(2);
         expect(engine.getRules()).toHaveLength(2);
      });

      it("should get rule by id", () => {
         engine.addRule({
            id: "custom-id",
            name: "test-rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const found = engine.getRule("custom-id");
         expect(found).toBeDefined();
         expect(found?.id).toBe("custom-id");
      });

      it("should return undefined for non-existent rule", () => {
         const found = engine.getRule("non-existent");
         expect(found).toBeUndefined();
      });

      it("should remove rule", () => {
         const rule = engine.addRule({
            name: "test-rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const removed = engine.removeRule(rule.id);
         expect(removed).toBe(true);
         expect(engine.getRule(rule.id)).toBeUndefined();
      });

      it("should update rule", () => {
         const rule = engine.addRule({
            name: "original",
            priority: 1,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const updated = engine.updateRule(rule.id, {
            name: "updated",
            priority: 100,
         });

         expect(updated?.name).toBe("updated");
         expect(updated?.priority).toBe(100);
      });

      it("should enable and disable rules", () => {
         const rule = engine.addRule({
            name: "test-rule",
            enabled: true,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         engine.disableRule(rule.id);
         expect(engine.getRule(rule.id)?.enabled).toBe(false);

         engine.enableRule(rule.id);
         expect(engine.getRule(rule.id)?.enabled).toBe(true);
      });

      it("should filter rules by enabled status", () => {
         engine.addRule({
            name: "enabled-rule",
            enabled: true,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });
         engine.addRule({
            name: "disabled-rule",
            enabled: false,
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: false },
               },
            ],
         });

         const enabled = engine.getRules({ enabled: true });
         const disabled = engine.getRules({ enabled: false });

         expect(enabled).toHaveLength(1);
         expect(disabled).toHaveLength(1);
         expect(enabled[0]?.name).toBe("enabled-rule");
         expect(disabled[0]?.name).toBe("disabled-rule");
      });

      it("should filter rules by tags", () => {
         engine.addRule({
            name: "tagged-rule",
            tags: ["vip", "premium"],
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });
         engine.addRule({
            name: "other-rule",
            tags: ["basic"],
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: false },
               },
            ],
         });

         const vipRules = engine.getRules({ tags: ["vip"] });
         expect(vipRules).toHaveLength(1);
         expect(vipRules[0]?.name).toBe("tagged-rule");
      });

      it("should filter rules by category", () => {
         engine.addRule({
            name: "pricing-rule",
            category: "pricing",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "applyDiscount",
                  payload: { percentage: 10, reason: "test" },
               },
            ],
         });
         engine.addRule({
            name: "notification-rule",
            category: "notifications",
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "sendNotification",
                  payload: { type: "email", message: "test" },
               },
            ],
         });

         const pricingRules = engine.getRules({ category: "pricing" });
         expect(pricingRules).toHaveLength(1);
         expect(pricingRules[0]?.name).toBe("pricing-rule");
      });

      it("should clear all rules", () => {
         engine.addRules([
            {
               name: "rule-1",
               conditions: cond("g1", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "test", value: true },
                  },
               ],
            },
            {
               name: "rule-2",
               conditions: cond("g2", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "test", value: false },
                  },
               ],
            },
         ]);

         engine.clearRules();
         expect(engine.getRules()).toHaveLength(0);
      });
   });

   describe("rule sets", () => {
      it("should add and get rule set", () => {
         const rule1 = engine.addRule({
            name: "rule-1",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const ruleSet = engine.addRuleSet({
            name: "test-set",
            description: "A test rule set",
            ruleIds: [rule1.id],
         });

         expect(ruleSet.id).toBeDefined();
         expect(ruleSet.name).toBe("test-set");
         expect(ruleSet.ruleIds).toContain(rule1.id);
      });

      it("should get all rule sets", () => {
         engine.addRuleSet({ name: "set-1", ruleIds: [] });
         engine.addRuleSet({ name: "set-2", ruleIds: [] });

         const ruleSets = engine.getRuleSets();
         expect(ruleSets).toHaveLength(2);
      });

      it("should remove rule set", () => {
         const ruleSet = engine.addRuleSet({ name: "test-set", ruleIds: [] });

         const removed = engine.removeRuleSet(ruleSet.id);
         expect(removed).toBe(true);
         expect(engine.getRuleSet(ruleSet.id)).toBeUndefined();
      });
   });

   describe("evaluation", () => {
      it("should evaluate rules and return matching results", async () => {
         engine.addRule({
            name: "adult-discount",
            priority: 10,
            conditions: cond("g1", [numCond("c1", "age", "gte", 18)]),
            consequences: [
               {
                  type: "applyDiscount",
                  payload: { percentage: 10, reason: "Adult discount" },
               },
            ],
         });

         const result = await engine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(result.totalRulesMatched).toBe(1);
         expect(result.consequences).toHaveLength(1);
         expect(result.consequences[0]?.type).toBe("applyDiscount");
         expect(result.consequences[0]?.payload).toEqual({
            percentage: 10,
            reason: "Adult discount",
         });
      });

      it("should not match rules when conditions fail", async () => {
         engine.addRule({
            name: "adult-only",
            conditions: cond("g1", [numCond("c1", "age", "gte", 18)]),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "adult", value: true },
               },
            ],
         });

         const result = await engine.evaluate({
            age: 16,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(result.totalRulesMatched).toBe(0);
         expect(result.consequences).toHaveLength(0);
      });

      it("should respect rule priority order", async () => {
         engine.addRule({
            name: "low-priority",
            priority: 1,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "low", value: true },
               },
            ],
         });
         engine.addRule({
            name: "high-priority",
            priority: 100,
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "high", value: true },
               },
            ],
         });

         const result = await engine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(result.matchedRules[0]?.name).toBe("high-priority");
         expect(result.matchedRules[1]?.name).toBe("low-priority");
      });

      it("should skip disabled rules", async () => {
         engine.addRule({
            name: "enabled-rule",
            enabled: true,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "enabled", value: true },
               },
            ],
         });
         engine.addRule({
            name: "disabled-rule",
            enabled: false,
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "disabled", value: true },
               },
            ],
         });

         const result = await engine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(result.totalRulesEvaluated).toBe(1);
         expect(result.matchedRules[0]?.name).toBe("enabled-rule");
      });

      it("should stop on match when stopOnMatch is true", async () => {
         engine.addRule({
            name: "stop-rule",
            priority: 100,
            stopOnMatch: true,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "stop", value: true },
               },
            ],
         });
         engine.addRule({
            name: "after-stop",
            priority: 50,
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "after", value: true },
               },
            ],
         });

         const result = await engine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(result.stoppedEarly).toBe(true);
         expect(result.stoppedByRuleId).toBe(result.matchedRules[0]?.id);
         expect(result.totalRulesMatched).toBe(1);
      });

      it("should use first-match conflict resolution", async () => {
         const engineFirstMatch = createEngine<TestContext, TestConsequences>({
            consequences: TestConsequences,
            conflictResolution: "first-match",
         });

         engineFirstMatch.addRule({
            name: "first",
            priority: 100,
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "first", value: true },
               },
            ],
         });
         engineFirstMatch.addRule({
            name: "second",
            priority: 50,
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "second", value: true },
               },
            ],
         });

         const result = await engineFirstMatch.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(result.stoppedEarly).toBe(true);
         expect(result.totalRulesMatched).toBe(1);
         expect(result.matchedRules[0]?.name).toBe("first");
      });

      it("should filter by tags during evaluation", async () => {
         engine.addRule({
            name: "vip-rule",
            tags: ["vip"],
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "applyDiscount",
                  payload: { percentage: 20, reason: "VIP" },
               },
            ],
         });
         engine.addRule({
            name: "regular-rule",
            tags: ["regular"],
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "applyDiscount",
                  payload: { percentage: 5, reason: "Regular" },
               },
            ],
         });

         const result = await engine.evaluate(
            {
               age: 25,
               country: "US",
               premium: false,
               score: 100,
            },
            { tags: ["vip"] },
         );

         expect(result.totalRulesEvaluated).toBe(1);
         expect(result.matchedRules[0]?.name).toBe("vip-rule");
      });

      it("should limit max rules evaluated", async () => {
         engine.addRules([
            {
               name: "rule-1",
               priority: 100,
               conditions: cond("g1", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "r1", value: true },
                  },
               ],
            },
            {
               name: "rule-2",
               priority: 90,
               conditions: cond("g2", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "r2", value: true },
                  },
               ],
            },
            {
               name: "rule-3",
               priority: 80,
               conditions: cond("g3", []),
               consequences: [
                  {
                     type: "setFlag",
                     payload: { name: "r3", value: true },
                  },
               ],
            },
         ]);

         const result = await engine.evaluate(
            {
               age: 25,
               country: "US",
               premium: false,
               score: 100,
            },
            { maxRules: 2 },
         );

         expect(result.totalRulesEvaluated).toBe(2);
      });

      it("should evaluate only rules in specified rule set", async () => {
         const rule1 = engine.addRule({
            name: "in-set",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "inSet", value: true },
               },
            ],
         });
         engine.addRule({
            name: "not-in-set",
            conditions: cond("g2", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "notInSet", value: true },
               },
            ],
         });

         const ruleSet = engine.addRuleSet({
            name: "test-set",
            ruleIds: [rule1.id],
         });

         const result = await engine.evaluate(
            {
               age: 25,
               country: "US",
               premium: false,
               score: 100,
            },
            { ruleSetId: ruleSet.id },
         );

         expect(result.totalRulesEvaluated).toBe(1);
         expect(result.matchedRules[0]?.name).toBe("in-set");
      });
   });

   describe("caching", () => {
      it("should cache evaluation results", async () => {
         engine.addRule({
            name: "cached-rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "cached", value: true },
               },
            ],
         });

         const context = {
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         };

         const result1 = await engine.evaluate(context);
         const result2 = await engine.evaluate(context);

         expect(result1.cacheHit).toBe(false);
         expect(result2.cacheHit).toBe(true);
      });

      it("should bypass cache when requested", async () => {
         engine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const context = {
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         };

         await engine.evaluate(context);
         const result = await engine.evaluate(context, { bypassCache: true });

         expect(result.cacheHit).toBe(false);
      });

      it("should clear cache", async () => {
         engine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const context = {
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         };

         await engine.evaluate(context);
         engine.clearCache();
         const result = await engine.evaluate(context);

         expect(result.cacheHit).toBe(false);
      });

      it("should clear cache when rules are modified", async () => {
         const rule = engine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const context = {
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         };

         await engine.evaluate(context);

         engine.updateRule(rule.id, { priority: 100 });
         const result = await engine.evaluate(context);

         expect(result.cacheHit).toBe(false);
      });

      it("should work without cache", async () => {
         const noCacheEngine = createEngine<TestContext, TestConsequences>({
            consequences: TestConsequences,
            cache: { enabled: false },
         });

         noCacheEngine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const context = {
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         };

         const result1 = await noCacheEngine.evaluate(context);
         const result2 = await noCacheEngine.evaluate(context);

         expect(result1.cacheHit).toBe(false);
         expect(result2.cacheHit).toBe(false);
      });
   });

   describe("statistics", () => {
      it("should track evaluation stats", async () => {
         engine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         await engine.evaluate(
            { age: 25, country: "US", premium: false, score: 100 },
            { bypassCache: true },
         );
         await engine.evaluate(
            { age: 30, country: "US", premium: false, score: 100 },
            { bypassCache: true },
         );

         const stats = engine.getStats();

         expect(stats.totalRules).toBe(1);
         expect(stats.enabledRules).toBe(1);
         expect(stats.disabledRules).toBe(0);
         expect(stats.totalEvaluations).toBe(2);
         expect(stats.totalMatches).toBe(2);
         expect(stats.avgEvaluationTimeMs).toBeGreaterThanOrEqual(0);
      });

      it("should track cache hit rate", async () => {
         engine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         const context = {
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         };

         await engine.evaluate(context);
         await engine.evaluate(context);
         await engine.evaluate(context);

         const stats = engine.getStats();

         expect(stats.cacheHits).toBe(2);
         expect(stats.cacheMisses).toBe(1);
         expect(stats.cacheHitRate).toBeCloseTo(2 / 3, 2);
      });
   });

   describe("hooks", () => {
      it("should call beforeEvaluation hook", async () => {
         let hookCalled = false;

         const hookEngine = createEngine<TestContext, TestConsequences>({
            consequences: TestConsequences,
            hooks: {
               beforeEvaluation: (context) => {
                  hookCalled = true;
                  expect(context.data.age).toBe(25);
               },
            },
         });

         hookEngine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         await hookEngine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(hookCalled).toBe(true);
      });

      it("should call afterEvaluation hook", async () => {
         let hookCalled = false;

         const hookEngine = createEngine<TestContext, TestConsequences>({
            consequences: TestConsequences,
            hooks: {
               afterEvaluation: (result) => {
                  hookCalled = true;
                  expect(result.totalRulesMatched).toBe(1);
               },
            },
         });

         hookEngine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         await hookEngine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(hookCalled).toBe(true);
      });

      it("should call onRuleMatch hook", async () => {
         const matchedRuleNames: string[] = [];

         const hookEngine = createEngine<TestContext, TestConsequences>({
            consequences: TestConsequences,
            hooks: {
               onRuleMatch: (rule) => {
                  matchedRuleNames.push(rule.name);
               },
            },
         });

         hookEngine.addRule({
            name: "match-me",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         await hookEngine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(matchedRuleNames).toContain("match-me");
      });

      it("should call onConsequenceCollected hook", async () => {
         const collectedConsequences: string[] = [];

         const hookEngine = createEngine<TestContext, TestConsequences>({
            consequences: TestConsequences,
            hooks: {
               onConsequenceCollected: (_rule, consequence) => {
                  collectedConsequences.push(consequence.type as string);
               },
            },
         });

         hookEngine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "applyDiscount",
                  payload: { percentage: 10, reason: "Test" },
               },
               {
                  type: "sendNotification",
                  payload: { type: "email", message: "Discount applied" },
               },
            ],
         });

         await hookEngine.evaluate({
            age: 25,
            country: "US",
            premium: false,
            score: 100,
         });

         expect(collectedConsequences).toContain("applyDiscount");
         expect(collectedConsequences).toContain("sendNotification");
      });
   });

   describe("state", () => {
      it("should return engine state", () => {
         const rule = engine.addRule({
            name: "rule",
            conditions: cond("g1", []),
            consequences: [
               {
                  type: "setFlag",
                  payload: { name: "test", value: true },
               },
            ],
         });

         engine.addRuleSet({
            name: "set",
            ruleIds: [rule.id],
         });

         const state = engine.getState();

         expect(state.rules.size).toBe(1);
         expect(state.ruleSets.size).toBe(1);
         expect(state.ruleOrder).toHaveLength(1);
      });
   });
});

describe("complex conditions", () => {
   it("should handle nested AND/OR conditions", async () => {
      const engine = createEngine<TestContext, TestConsequences>({
         consequences: TestConsequences,
      });

      engine.addRule({
         name: "complex-rule",
         conditions: cond("g1", [
            numCond("c1", "age", "gte", 18),
            condOr("g2", [
               boolCond("c2", "premium", "eq", true),
               numCond("c3", "score", "gte", 90),
            ]),
         ]),
         consequences: [
            {
               type: "applyDiscount",
               payload: { percentage: 15, reason: "Complex condition met" },
            },
         ],
      });

      const adult_premium = await engine.evaluate({
         age: 25,
         country: "US",
         premium: true,
         score: 50,
      });

      const adult_high_score = await engine.evaluate(
         { age: 25, country: "US", premium: false, score: 95 },
         { bypassCache: true },
      );

      const adult_low_score = await engine.evaluate(
         { age: 25, country: "US", premium: false, score: 50 },
         { bypassCache: true },
      );

      const minor_premium = await engine.evaluate(
         { age: 16, country: "US", premium: true, score: 50 },
         { bypassCache: true },
      );

      expect(adult_premium.totalRulesMatched).toBe(1);
      expect(adult_high_score.totalRulesMatched).toBe(1);
      expect(adult_low_score.totalRulesMatched).toBe(0);
      expect(minor_premium.totalRulesMatched).toBe(0);
   });
});
