import { beforeEach, describe, expect, it } from "bun:test";
import { z } from "zod";
import {
   all,
   and,
   any,
   arr,
   bool,
   conditions,
   date,
   num,
   or,
   resetBuilderIds,
   str,
} from "../src/builder/conditions";
import { createRule, rule } from "../src/builder/rule";
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

describe("Condition Builder", () => {
   beforeEach(() => {
      resetBuilderIds();
   });

   describe("conditions()", () => {
      it("should create an empty condition builder", () => {
         const builder = conditions();
         expect(builder.getConditions()).toHaveLength(0);
      });

      it("should chain number conditions", () => {
         const group = conditions()
            .number("age", "gte", 18)
            .number("score", "gt", 100)
            .build();

         expect(group.operator).toBe("AND");
         expect(group.conditions).toHaveLength(2);
      });

      it("should chain string conditions", () => {
         const group = conditions()
            .string("country", "eq", "US")
            .string("status", "in", ["active", "pending"])
            .build();

         expect(group.conditions).toHaveLength(2);
      });

      it("should chain boolean conditions", () => {
         const group = conditions()
            .boolean("premium", "eq", true)
            .boolean("verified", "neq", false)
            .build();

         expect(group.conditions).toHaveLength(2);
      });

      it("should handle date conditions with Date objects", () => {
         const now = new Date();
         const group = conditions().date("createdAt", "gte", now).build();

         expect(group.conditions).toHaveLength(1);
      });

      it("should handle array conditions", () => {
         const group = conditions()
            .array("tags", "contains", "vip")
            .array("items", "is_not_empty", undefined)
            .build();

         expect(group.conditions).toHaveLength(2);
      });

      it("should support nested AND groups", () => {
         const group = conditions()
            .number("age", "gte", 18)
            .and((cb) =>
               cb.string("country", "eq", "US").boolean("premium", "eq", true),
            )
            .build();

         expect(group.conditions).toHaveLength(2);
         const nestedGroup = group.conditions[1] as { operator: string };
         expect(nestedGroup.operator).toBe("AND");
      });

      it("should support nested OR groups", () => {
         const group = conditions()
            .number("age", "gte", 18)
            .or((cb) =>
               cb.string("country", "eq", "US").string("country", "eq", "CA"),
            )
            .build();

         expect(group.conditions).toHaveLength(2);
         const nestedGroup = group.conditions[1] as { operator: string };
         expect(nestedGroup.operator).toBe("OR");
      });
   });

   describe("and() / or()", () => {
      it("should create AND group from builder function", () => {
         const group = and((cb) =>
            cb.number("age", "gte", 18).string("country", "eq", "US"),
         );

         expect(group.operator).toBe("AND");
         expect(group.conditions).toHaveLength(2);
      });

      it("should create OR group from builder function", () => {
         const group = or((cb) =>
            cb.boolean("premium", "eq", true).number("score", "gte", 90),
         );

         expect(group.operator).toBe("OR");
         expect(group.conditions).toHaveLength(2);
      });
   });

   describe("all() / any()", () => {
      it("should create AND group from conditions", () => {
         const group = all(
            num("age", "gte", 18),
            str("country", "eq", "US"),
            bool("premium", "eq", true),
         );

         expect(group.operator).toBe("AND");
         expect(group.conditions).toHaveLength(3);
      });

      it("should create OR group from conditions", () => {
         const group = any(
            bool("premium", "eq", true),
            num("score", "gte", 90),
         );

         expect(group.operator).toBe("OR");
         expect(group.conditions).toHaveLength(2);
      });

      it("should support nested groups", () => {
         const group = all(
            num("age", "gte", 18),
            any(bool("premium", "eq", true), num("score", "gte", 90)),
         );

         expect(group.operator).toBe("AND");
         expect(group.conditions).toHaveLength(2);
         const nestedGroup = group.conditions[1] as { operator: string };
         expect(nestedGroup.operator).toBe("OR");
      });
   });

   describe("condition helpers", () => {
      it("num() should create number condition", () => {
         const cond = num("age", "gte", 18);
         expect(cond.type).toBe("number");
         expect(cond.field).toBe("age");
         expect(cond.operator).toBe("gte");
         expect(cond.value).toBe(18);
      });

      it("str() should create string condition", () => {
         const cond = str("country", "eq", "US");
         expect(cond.type).toBe("string");
         expect(cond.field).toBe("country");
         expect(cond.operator).toBe("eq");
      });

      it("bool() should create boolean condition", () => {
         const cond = bool("premium", "eq", true);
         expect(cond.type).toBe("boolean");
         expect(cond.field).toBe("premium");
         expect(cond.operator).toBe("eq");
         expect(cond.value).toBe(true);
      });

      it("date() should create date condition", () => {
         const cond = date("createdAt", "gte", "2024-01-01");
         expect(cond.type).toBe("date");
         expect(cond.field).toBe("createdAt");
         expect(cond.operator).toBe("gte");
      });

      it("arr() should create array condition", () => {
         const cond = arr("tags", "contains", "vip");
         expect(cond.type).toBe("array");
         expect(cond.field).toBe("tags");
         expect(cond.operator).toBe("contains");
      });
   });
});

describe("Rule Builder", () => {
   beforeEach(() => {
      resetBuilderIds();
   });

   describe("rule()", () => {
      it("should create a rule builder", () => {
         const builder = rule<TestContext, TestConsequences>();
         const state = builder.getState();

         expect(state.consequences).toHaveLength(0);
         expect(state.priority).toBe(0);
         expect(state.enabled).toBe(true);
         expect(state.stopOnMatch).toBe(false);
         expect(state.tags).toHaveLength(0);
      });

      it("should build a complete rule", () => {
         const ruleInput = rule<TestContext, TestConsequences>()
            .id("rule-1")
            .named("Adult Discount")
            .describedAs("Apply discount for adults")
            .when(all(num("age", "gte", 18)))
            .then("applyDiscount", { percentage: 10, reason: "Adult discount" })
            .withPriority(100)
            .tagged("pricing", "adult")
            .inCategory("discounts")
            .build();

         expect(ruleInput.id).toBe("rule-1");
         expect(ruleInput.name).toBe("Adult Discount");
         expect(ruleInput.description).toBe("Apply discount for adults");
         expect(ruleInput.priority).toBe(100);
         expect(ruleInput.enabled).toBe(true);
         expect(ruleInput.stopOnMatch).toBe(false);
         expect(ruleInput.tags).toContain("pricing");
         expect(ruleInput.tags).toContain("adult");
         expect(ruleInput.category).toBe("discounts");
         expect(ruleInput.consequences).toHaveLength(1);
      });

      it("should support multiple consequences", () => {
         const ruleInput = rule<TestContext, TestConsequences>()
            .named("Multi-consequence rule")
            .when(all(bool("premium", "eq", true)))
            .then("applyDiscount", { percentage: 20, reason: "VIP" })
            .then("sendNotification", {
               type: "email",
               message: "Discount applied",
            })
            .then("setFlag", { name: "vip_treated", value: true })
            .build();

         expect(ruleInput.consequences).toHaveLength(3);
      });

      it("should support disabling rules", () => {
         const ruleInput = rule<TestContext, TestConsequences>()
            .named("Disabled rule")
            .when(all())
            .then("setFlag", { name: "test", value: true })
            .disabled()
            .build();

         expect(ruleInput.enabled).toBe(false);
      });

      it("should support stopOnMatch", () => {
         const ruleInput = rule<TestContext, TestConsequences>()
            .named("Stop rule")
            .when(all())
            .then("setFlag", { name: "test", value: true })
            .stopOnMatch()
            .build();

         expect(ruleInput.stopOnMatch).toBe(true);
      });

      it("should support metadata", () => {
         const ruleInput = rule<TestContext, TestConsequences>()
            .named("Rule with metadata")
            .when(all())
            .then("setFlag", { name: "test", value: true })
            .withMetadata({ author: "admin", version: 1 })
            .build();

         expect(ruleInput.metadata).toEqual({ author: "admin", version: 1 });
      });

      it("should throw error if name is missing", () => {
         expect(() => {
            rule<TestContext, TestConsequences>()
               .when(all())
               .then("setFlag", { name: "test", value: true })
               .build();
         }).toThrow("Rule must have a name");
      });

      it("should throw error if conditions are missing", () => {
         expect(() => {
            rule<TestContext, TestConsequences>()
               .named("Test rule")
               .then("setFlag", { name: "test", value: true })
               .build();
         }).toThrow("Rule must have conditions");
      });

      it("should throw error if consequences are missing", () => {
         expect(() => {
            rule<TestContext, TestConsequences>()
               .named("Test rule")
               .when(all())
               .build();
         }).toThrow("Rule must have at least one consequence");
      });

      it("should support builder function in when()", () => {
         const ruleInput = rule<TestContext, TestConsequences>()
            .named("Builder condition")
            .when((cb) =>
               cb.number("age", "gte", 18).boolean("premium", "eq", true),
            )
            .then("setFlag", { name: "test", value: true })
            .build();

         expect(ruleInput.conditions.operator).toBe("AND");
         expect(ruleInput.conditions.conditions).toHaveLength(2);
      });
   });

   describe("createRule()", () => {
      it("should create rule using function", () => {
         const ruleInput = createRule<TestContext, TestConsequences>((rb) =>
            rb
               .named("Test rule")
               .when(all(num("age", "gte", 18)))
               .then("setFlag", { name: "adult", value: true }),
         );

         expect(ruleInput.name).toBe("Test rule");
         expect(ruleInput.consequences).toHaveLength(1);
      });
   });
});
