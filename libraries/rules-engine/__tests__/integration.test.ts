import { describe, expect, test } from "bun:test";
import type { ConditionGroup } from "@f-o-t/condition-evaluator";
import {
   addVersion,
   all,
   analyzeRuleSet,
   and,
   buildIndex,
   checkIntegrity,
   createEngine,
   createVersionStore,
   detectConflicts,
   exportToJson,
   getLatestVersion,
   getRulesByField,
   importFromJson,
   num,
   type Rule,
   rollbackToVersion,
   rule,
   simulate,
   str,
   validateRule,
   whatIf,
} from "../src/index";

const toRule = (input: ReturnType<ReturnType<typeof rule>["build"]>): Rule => ({
   id: input.id ?? `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
   name: input.name,
   description: input.description,
   conditions: input.conditions,
   consequences: input.consequences.map((c) => ({
      type: String(c.type),
      payload: c.payload,
   })),
   priority: input.priority ?? 0,
   enabled: input.enabled ?? true,
   stopOnMatch: input.stopOnMatch ?? false,
   tags: input.tags ?? [],
   category: input.category,
   metadata: input.metadata,
   createdAt: new Date(),
   updatedAt: new Date(),
});

describe("Integration Tests", () => {
   describe("Rule Builder and Conditions", () => {
      test("creates rules with fluent builder", () => {
         const discountRule = rule()
            .named("Discount Rule")
            .describedAs("Apply discount for large orders")
            .when(
               and((c) =>
                  c.number("amount", "gt", 100).number("itemCount", "gte", 5),
               ),
            )
            .then("apply_discount", { percentage: 10 })
            .withPriority(50)
            .tagged("pricing", "discount")
            .inCategory("pricing")
            .build();

         expect(discountRule.name).toBe("Discount Rule");
         expect(discountRule.description).toBe(
            "Apply discount for large orders",
         );
         expect(discountRule.priority).toBe(50);
         expect(discountRule.tags).toContain("pricing");
         expect(discountRule.category).toBe("pricing");
         expect(discountRule.consequences.length).toBe(1);
      });

      test("creates rules with shorthand condition helpers", () => {
         const conditions = all(
            num("amount", "gt", 50),
            str("customerType", "eq", "premium"),
         );

         const myRule = rule()
            .named("Simple Rule")
            .when(conditions)
            .then("notify", { message: "Hello" })
            .build();

         expect(myRule.name).toBe("Simple Rule");
         expect(myRule.enabled).toBe(true);
      });
   });

   describe("Engine Operations", () => {
      test("creates engine and manages rules", () => {
         const engine = createEngine();

         const ruleInput = rule()
            .named("Rule 1")
            .when(all(num("amount", "gt", 100)))
            .then("action", { type: "discount" })
            .build();

         const rule1 = engine.addRule(ruleInput);
         expect(engine.getRules().length).toBe(1);

         engine.disableRule(rule1.id);
         expect(engine.getRule(rule1.id)?.enabled).toBe(false);

         engine.enableRule(rule1.id);
         expect(engine.getRule(rule1.id)?.enabled).toBe(true);

         engine.removeRule(rule1.id);
         expect(engine.getRules().length).toBe(0);
      });

      test("evaluates rules against context", async () => {
         const engine = createEngine();

         engine.addRule(
            rule()
               .named("High Amount")
               .when(all(num("amount", "gt", 100)))
               .then("flag", { level: "high" })
               .withPriority(100)
               .build(),
         );

         engine.addRule(
            rule()
               .named("Medium Amount")
               .when(all(num("amount", "gt", 50)))
               .then("flag", { level: "medium" })
               .withPriority(50)
               .build(),
         );

         const result = await engine.evaluate({ amount: 150, itemCount: 2 });

         expect(result.matchedRules.length).toBe(2);
         expect(result.totalRulesEvaluated).toBe(2);
      });
   });

   describe("Simulation", () => {
      test("simulates rules without side effects", () => {
         const rules: Rule[] = [
            toRule(
               rule()
                  .named("Simulation Test")
                  .when(all(num("amount", "gt", 100)))
                  .then("discount", { percent: 10 })
                  .build(),
            ),
         ];

         const result = simulate(rules, { data: { amount: 150 } });

         expect(result.matchedRules.length).toBe(1);
         expect(result.consequences.length).toBe(1);
         expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      });

      test("compares rules with whatIf", () => {
         const originalRules: Rule[] = [
            toRule(
               rule()
                  .named("Original")
                  .when(all(num("amount", "gt", 100)))
                  .then("discount", { percent: 10 })
                  .build(),
            ),
         ];

         const modifiedRules: Rule[] = [
            toRule(
               rule()
                  .named("Modified")
                  .when(all(num("amount", "gt", 50)))
                  .then("discount", { percent: 15 })
                  .build(),
            ),
         ];

         const context = { data: { amount: 75 } };
         const comparison = whatIf(originalRules, modifiedRules, context);

         expect(comparison.original.matchedRules.length).toBe(0);
         expect(comparison.modified.matchedRules.length).toBe(1);
         expect(comparison.differences.newMatches.length).toBe(1);
      });
   });

   describe("Serialization", () => {
      test("exports and imports rules", () => {
         const rules: Rule[] = [
            toRule(
               rule()
                  .named("Export Test")
                  .when(all(num("amount", "gt", 0)))
                  .then("action", { type: "test" })
                  .tagged("test")
                  .build(),
            ),
         ];

         const json = exportToJson(rules);
         expect(json).toContain("Export Test");
         expect(json).toContain("action");

         const imported = importFromJson(json);
         expect(imported.success).toBe(true);
         expect(imported.rules.length).toBe(1);
         expect(imported.rules[0]?.name).toBe("Export Test");
      });

      test("generates new IDs on import", () => {
         const originalRule = toRule(
            rule()
               .named("ID Test")
               .when(all(num("amount", "gt", 0)))
               .then("action", {})
               .build(),
         );

         const json = exportToJson([originalRule]);
         const imported = importFromJson(json, { generateNewIds: true });

         expect(imported.rules[0]?.id).not.toBe(originalRule.id);
      });
   });

   describe("Versioning", () => {
      test("tracks rule versions", () => {
         const myRule = toRule(
            rule()
               .named("Versioned")
               .when(all(num("amount", "gt", 100)))
               .then("action", { version: 1 })
               .build(),
         );

         let store = createVersionStore();
         store = addVersion(store, myRule, "create", { comment: "v1" });

         const latest = getLatestVersion(store, myRule.id);
         expect(latest?.version).toBe(1);
         expect(latest?.comment).toBe("v1");
      });

      test("supports rollback", () => {
         const myRule = toRule(
            rule()
               .named("Rollback Test")
               .when(all(num("amount", "gt", 100)))
               .then("action", { v: 1 })
               .build(),
         );

         let store = createVersionStore();
         store = addVersion(store, myRule, "create");

         const updatedRule: Rule = {
            ...myRule,
            consequences: [{ type: "action", payload: { v: 2 } }],
            updatedAt: new Date(),
         };
         store = addVersion(store, updatedRule, "update");

         const { store: rolledBack } = rollbackToVersion(store, myRule.id, 1);
         const latest = getLatestVersion(rolledBack, myRule.id);

         expect(latest?.version).toBe(3);
      });
   });

   describe("Indexing", () => {
      test("builds and queries index", () => {
         const rules: Rule[] = [
            toRule(
               rule()
                  .named("Amount Rule")
                  .when(all(num("amount", "gt", 100)))
                  .then("action", {})
                  .build(),
            ),
            toRule(
               rule()
                  .named("Count Rule")
                  .when(all(num("itemCount", "gt", 5)))
                  .then("action", {})
                  .build(),
            ),
         ];

         const index = buildIndex(rules);

         expect(getRulesByField(index, "amount").length).toBe(1);
         expect(getRulesByField(index, "itemCount").length).toBe(1);
         expect(getRulesByField(index, "nonexistent").length).toBe(0);
      });
   });

   describe("Analysis", () => {
      test("analyzes rule set", () => {
         const rules: Rule[] = [
            toRule(
               rule()
                  .named("Rule 1")
                  .when(all(num("amount", "gt", 100)))
                  .then("action", {})
                  .inCategory("pricing")
                  .build(),
            ),
            toRule(
               rule()
                  .named("Rule 2")
                  .when(
                     and((c) =>
                        c
                           .number("amount", "gt", 50)
                           .number("itemCount", "gt", 3),
                     ),
                  )
                  .then("action", {})
                  .then("notify", { msg: "test" })
                  .inCategory("pricing")
                  .build(),
            ),
         ];

         const analysis = analyzeRuleSet(rules);

         expect(analysis.ruleCount).toBe(2);
         expect(analysis.uniqueCategories).toContain("pricing");
         expect(analysis.ruleComplexities.length).toBe(2);
      });
   });

   describe("Conflict Detection", () => {
      test("detects duplicate conditions", () => {
         const conditions: ConditionGroup = {
            id: "g1",
            operator: "AND",
            conditions: [
               {
                  id: "c1",
                  type: "number",
                  field: "amount",
                  operator: "gt",
                  value: 100,
               },
            ],
         };

         const rules: Rule[] = [
            {
               id: "rule-1",
               name: "Rule 1",
               conditions,
               consequences: [{ type: "a", payload: {} }],
               priority: 50,
               enabled: true,
               stopOnMatch: false,
               tags: [],
               createdAt: new Date(),
               updatedAt: new Date(),
            },
            {
               id: "rule-2",
               name: "Rule 2",
               conditions,
               consequences: [{ type: "b", payload: {} }],
               priority: 50,
               enabled: true,
               stopOnMatch: false,
               tags: [],
               createdAt: new Date(),
               updatedAt: new Date(),
            },
         ];

         const conflicts = detectConflicts(rules);
         expect(conflicts.some((c) => c.type === "DUPLICATE_CONDITIONS")).toBe(
            true,
         );
      });
   });

   describe("Validation", () => {
      test("validates rule structure", () => {
         const validRule = toRule(
            rule()
               .named("Valid Rule")
               .when(all(num("amount", "gt", 0)))
               .then("action", {})
               .build(),
         );

         const result = validateRule(validRule);
         expect(result.valid).toBe(true);
      });

      test("checks integrity", () => {
         const rules: Rule[] = [
            toRule(
               rule()
                  .named("Warning Rule")
                  .when(all(num("amount", "gt", 0)))
                  .then("action", {})
                  .withPriority(-10)
                  .build(),
            ),
         ];

         const integrity = checkIntegrity(rules);
         expect(
            integrity.issues.some((i) => i.code === "NEGATIVE_PRIORITY"),
         ).toBe(true);
      });
   });
});
