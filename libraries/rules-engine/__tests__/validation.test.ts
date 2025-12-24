import { describe, expect, test } from "bun:test";
import type { ConditionGroup } from "@f-o-t/condition-evaluator";
import { z } from "zod";
import type { Rule } from "../src/types/rule";
import {
   detectConflicts,
   formatConflicts,
   getConflictsByType,
   hasConflicts,
   hasErrors,
} from "../src/validation/conflicts";
import {
   checkIntegrity,
   checkRuleFieldCoverage,
   formatIntegrityResult,
   getUsedFields,
   getUsedOperators,
} from "../src/validation/integrity";
import {
   createRuleValidator,
   parseRule,
   safeParseRule,
   validateConditions,
   validateRule,
   validateRules,
} from "../src/validation/schema";

const createValidConditions = (): ConditionGroup => ({
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
});

const createValidRule = (overrides: Partial<Rule> = {}): Rule => ({
   id: "rule-1",
   name: "Test Rule",
   conditions: createValidConditions(),
   consequences: [{ type: "apply_discount", payload: { percentage: 10 } }],
   priority: 0,
   enabled: true,
   stopOnMatch: false,
   tags: [],
   createdAt: new Date(),
   updatedAt: new Date(),
   ...overrides,
});

describe("Schema Validation", () => {
   describe("validateRule", () => {
      test("validates a valid rule", () => {
         const rule = createValidRule();
         const result = validateRule(rule);
         expect(result.valid).toBe(true);
         expect(result.errors).toHaveLength(0);
      });

      test("rejects rule without id", () => {
         const rule = createValidRule({ id: "" });
         const result = validateRule(rule);
         expect(result.valid).toBe(false);
         expect(result.errors.some((e) => e.path.includes("id"))).toBe(true);
      });

      test("rejects rule without name", () => {
         const rule = createValidRule({ name: "" });
         const result = validateRule(rule);
         expect(result.valid).toBe(false);
         expect(result.errors.some((e) => e.path.includes("name"))).toBe(true);
      });

      test("validates conditions structure", () => {
         const rule = createValidRule({
            conditions: {
               id: "",
               operator: "AND",
               conditions: [],
            },
         });
         const result = validateRule(rule, { validateConditions: true });
         expect(result.valid).toBe(false);
         expect(result.errors.some((e) => e.code === "MISSING_GROUP_ID")).toBe(
            true,
         );
      });

      test("validates empty conditions array", () => {
         const rule = createValidRule({
            conditions: {
               id: "group-1",
               operator: "AND",
               conditions: [],
            },
         });
         const result = validateRule(rule, { validateConditions: true });
         expect(result.valid).toBe(false);
         expect(
            result.errors.some((e) => e.code === "EMPTY_CONDITIONS_ARRAY"),
         ).toBe(true);
      });

      test("validates nested condition groups", () => {
         const rule = createValidRule({
            conditions: {
               id: "group-1",
               operator: "AND",
               conditions: [
                  {
                     id: "nested-group",
                     operator: "OR",
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
                  },
               ],
            },
         });
         const result = validateRule(rule);
         expect(result.valid).toBe(true);
      });

      test("skips condition validation when disabled", () => {
         const rule = createValidRule({
            conditions: {
               id: "",
               operator: "AND",
               conditions: [],
            },
         });
         const result = validateRule(rule, { validateConditions: false });
         expect(result.valid).toBe(true);
      });
   });

   describe("validateRules", () => {
      test("validates multiple rules", () => {
         const rules = [
            createValidRule({ id: "rule-1" }),
            createValidRule({ id: "rule-2", name: "Rule 2" }),
         ];
         const result = validateRules(rules);
         expect(result.valid).toBe(true);
      });

      test("reports errors with rule index", () => {
         const rules = [
            createValidRule({ id: "rule-1" }),
            createValidRule({ id: "", name: "Invalid Rule" }),
         ];
         const result = validateRules(rules);
         expect(result.valid).toBe(false);
         expect(result.errors.some((e) => e.path.includes("rules[1]"))).toBe(
            true,
         );
      });
   });

   describe("validateConditions", () => {
      test("validates valid conditions", () => {
         const result = validateConditions(createValidConditions());
         expect(result.valid).toBe(true);
      });

      test("rejects invalid operator", () => {
         const conditions: ConditionGroup = {
            id: "group-1",
            operator: "INVALID" as "AND",
            conditions: [
               {
                  id: "cond-1",
                  type: "number",
                  field: "amount",
                  operator: "gt",
                  value: 100,
               },
            ],
         };
         const result = validateConditions(conditions);
         expect(result.valid).toBe(false);
         expect(
            result.errors.some((e) => e.code === "INVALID_GROUP_OPERATOR"),
         ).toBe(true);
      });
   });

   describe("parseRule", () => {
      test("returns rule on valid input", () => {
         const rule = createValidRule();
         const parsed = parseRule(rule);
         expect(parsed.id).toBe(rule.id);
      });

      test("throws on invalid input", () => {
         const rule = createValidRule({ id: "" });
         expect(() => parseRule(rule)).toThrow();
      });
   });

   describe("safeParseRule", () => {
      test("returns success on valid input", () => {
         const rule = createValidRule();
         const result = safeParseRule(rule);
         expect(result.success).toBe(true);
         if (result.success) {
            expect(result.data.id).toBe(rule.id);
         }
      });

      test("returns errors on invalid input", () => {
         const rule = createValidRule({ id: "" });
         const result = safeParseRule(rule);
         expect(result.success).toBe(false);
         if (!result.success) {
            expect(result.errors.length).toBeGreaterThan(0);
         }
      });
   });

   describe("createRuleValidator", () => {
      const consequenceSchemas = {
         apply_discount: z.object({ percentage: z.number().min(0).max(100) }),
         send_notification: z.object({ message: z.string() }),
      };

      test("creates validator with custom schemas", () => {
         const validator = createRuleValidator(consequenceSchemas, {
            strictMode: true,
         });
         const rule = createValidRule();
         const result = validator.validate(rule);
         expect(result.valid).toBe(true);
      });

      test("validates consequence payloads in strict mode", () => {
         const validator = createRuleValidator(consequenceSchemas, {
            strictMode: true,
         });
         const rule = createValidRule({
            consequences: [
               { type: "apply_discount", payload: { percentage: 150 } },
            ],
         });
         const result = validator.validate(rule);
         expect(result.valid).toBe(false);
      });

      test("rejects unknown consequence types in strict mode", () => {
         const validator = createRuleValidator(consequenceSchemas, {
            strictMode: true,
         });
         const rule = createValidRule({
            consequences: [{ type: "unknown_action", payload: {} }],
         });
         const result = validator.validate(rule);
         expect(result.valid).toBe(false);
         expect(
            result.errors.some((e) => e.code === "UNKNOWN_CONSEQUENCE_TYPE"),
         ).toBe(true);
      });
   });
});

describe("Conflict Detection", () => {
   describe("detectConflicts", () => {
      test("detects duplicate IDs", () => {
         const rules = [
            createValidRule({ id: "duplicate-id" }),
            createValidRule({ id: "duplicate-id", name: "Rule 2" }),
         ];
         const conflicts = detectConflicts(rules);
         expect(conflicts.some((c) => c.type === "DUPLICATE_ID")).toBe(true);
      });

      test("detects duplicate conditions", () => {
         const conditions = createValidConditions();
         const rules = [
            createValidRule({ id: "rule-1", conditions }),
            createValidRule({ id: "rule-2", name: "Rule 2", conditions }),
         ];
         const conflicts = detectConflicts(rules);
         expect(conflicts.some((c) => c.type === "DUPLICATE_CONDITIONS")).toBe(
            true,
         );
      });

      test("detects overlapping conditions", () => {
         const rules = [
            createValidRule({
               id: "rule-1",
               conditions: {
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
               },
            }),
            createValidRule({
               id: "rule-2",
               name: "Rule 2",
               conditions: {
                  id: "g2",
                  operator: "AND",
                  conditions: [
                     {
                        id: "c2",
                        type: "number",
                        field: "amount",
                        operator: "gt",
                        value: 100,
                     },
                  ],
               },
            }),
         ];
         const conflicts = detectConflicts(rules);
         expect(
            conflicts.some((c) => c.type === "OVERLAPPING_CONDITIONS"),
         ).toBe(true);
      });

      test("detects priority collisions", () => {
         const rules = [
            createValidRule({
               id: "rule-1",
               priority: 10,
               conditions: {
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
               },
            }),
            createValidRule({
               id: "rule-2",
               name: "Rule 2",
               priority: 10,
               conditions: {
                  id: "g2",
                  operator: "AND",
                  conditions: [
                     {
                        id: "c2",
                        type: "number",
                        field: "amount",
                        operator: "gt",
                        value: 100,
                     },
                  ],
               },
            }),
         ];
         const conflicts = detectConflicts(rules);
         expect(conflicts.some((c) => c.type === "PRIORITY_COLLISION")).toBe(
            true,
         );
      });

      test("detects unreachable rules", () => {
         const conditions = createValidConditions();
         const rules = [
            createValidRule({
               id: "rule-1",
               priority: 100,
               stopOnMatch: true,
               conditions,
            }),
            createValidRule({
               id: "rule-2",
               name: "Rule 2",
               priority: 50,
               conditions,
            }),
         ];
         const conflicts = detectConflicts(rules);
         expect(conflicts.some((c) => c.type === "UNREACHABLE_RULE")).toBe(
            true,
         );
      });

      test("respects detection options", () => {
         const rules = [
            createValidRule({ id: "duplicate-id" }),
            createValidRule({ id: "duplicate-id", name: "Rule 2" }),
         ];
         const conflicts = detectConflicts(rules, { checkDuplicateIds: false });
         expect(conflicts.some((c) => c.type === "DUPLICATE_ID")).toBe(false);
      });
   });

   describe("hasConflicts", () => {
      test("returns true when conflicts exist", () => {
         const rules = [
            createValidRule({ id: "duplicate-id" }),
            createValidRule({ id: "duplicate-id", name: "Rule 2" }),
         ];
         expect(hasConflicts(rules)).toBe(true);
      });

      test("returns false when no conflicts", () => {
         const rules = [
            createValidRule({ id: "rule-1", priority: 1 }),
            createValidRule({ id: "rule-2", name: "Rule 2", priority: 2 }),
         ];
         expect(
            hasConflicts(rules, {
               checkDuplicateConditions: false,
               checkOverlappingConditions: false,
               checkPriorityCollisions: false,
               checkUnreachableRules: false,
            }),
         ).toBe(false);
      });
   });

   describe("hasErrors", () => {
      test("returns true for error severity conflicts", () => {
         const rules = [
            createValidRule({ id: "duplicate-id" }),
            createValidRule({ id: "duplicate-id", name: "Rule 2" }),
         ];
         expect(hasErrors(rules)).toBe(true);
      });

      test("returns false for warning-only conflicts", () => {
         const conditions = createValidConditions();
         const rules = [
            createValidRule({ id: "rule-1", conditions }),
            createValidRule({ id: "rule-2", name: "Rule 2", conditions }),
         ];
         const conflicts = detectConflicts(rules, { checkDuplicateIds: false });
         expect(conflicts.every((c) => c.severity !== "error")).toBe(true);
      });
   });

   describe("getConflictsByType", () => {
      test("filters conflicts by type", () => {
         const rules = [
            createValidRule({ id: "duplicate-id" }),
            createValidRule({ id: "duplicate-id", name: "Rule 2" }),
         ];
         const conflicts = detectConflicts(rules);
         const duplicateIdConflicts = getConflictsByType(
            conflicts,
            "DUPLICATE_ID",
         );
         expect(
            duplicateIdConflicts.every((c) => c.type === "DUPLICATE_ID"),
         ).toBe(true);
      });
   });

   describe("formatConflicts", () => {
      test("formats conflicts as string", () => {
         const rules = [
            createValidRule({ id: "duplicate-id" }),
            createValidRule({ id: "duplicate-id", name: "Rule 2" }),
         ];
         const conflicts = detectConflicts(rules);
         const formatted = formatConflicts(conflicts);
         expect(formatted).toContain("conflict");
         expect(formatted).toContain("DUPLICATE_ID");
      });

      test("returns message when no conflicts", () => {
         const formatted = formatConflicts([]);
         expect(formatted).toBe("No conflicts detected");
      });
   });
});

describe("Integrity Checks", () => {
   describe("checkIntegrity", () => {
      test("passes for valid rules", () => {
         const rules = [createValidRule()];
         const result = checkIntegrity(rules);
         expect(result.valid).toBe(true);
      });

      test("detects duplicate condition IDs within a rule", () => {
         const rule = createValidRule({
            conditions: {
               id: "group-1",
               operator: "AND",
               conditions: [
                  {
                     id: "duplicate-id",
                     type: "number",
                     field: "amount",
                     operator: "gt",
                     value: 100,
                  },
                  {
                     id: "duplicate-id",
                     type: "string",
                     field: "status",
                     operator: "eq",
                     value: "active",
                  },
               ],
            },
         });
         const result = checkIntegrity([rule]);
         expect(
            result.issues.some((i) => i.code === "DUPLICATE_CONDITION_ID"),
         ).toBe(true);
      });

      test("warns about negative priority", () => {
         const rule = createValidRule({ priority: -10 });
         const result = checkIntegrity([rule]);
         expect(result.issues.some((i) => i.code === "NEGATIVE_PRIORITY")).toBe(
            true,
         );
      });

      test("warns about no consequences", () => {
         const rule = createValidRule({ consequences: [] });
         const result = checkIntegrity([rule]);
         expect(result.issues.some((i) => i.code === "NO_CONSEQUENCES")).toBe(
            true,
         );
      });

      test("validates allowed categories", () => {
         const rule = createValidRule({ category: "invalid-category" });
         const result = checkIntegrity([rule], [], {
            allowedCategories: ["pricing", "shipping"],
         });
         expect(result.valid).toBe(false);
         expect(result.issues.some((i) => i.code === "INVALID_CATEGORY")).toBe(
            true,
         );
      });

      test("validates allowed tags", () => {
         const rule = createValidRule({ tags: ["valid-tag", "invalid-tag"] });
         const result = checkIntegrity([rule], [], {
            allowedTags: ["valid-tag"],
         });
         expect(result.issues.some((i) => i.code === "INVALID_TAGS")).toBe(
            true,
         );
      });

      test("checks field consistency across rules", () => {
         const rules = [
            createValidRule({
               id: "rule-1",
               conditions: {
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
               },
            }),
            createValidRule({
               id: "rule-2",
               name: "Rule 2",
               conditions: {
                  id: "g2",
                  operator: "AND",
                  conditions: [
                     {
                        id: "c2",
                        type: "string",
                        field: "amount",
                        operator: "eq",
                        value: "high",
                     },
                  ],
               },
            }),
         ];
         const result = checkIntegrity(rules);
         expect(
            result.issues.some((i) => i.code === "INCONSISTENT_FIELD_TYPE"),
         ).toBe(true);
      });

      test("validates rule set references", () => {
         const rules = [createValidRule({ id: "rule-1" })];
         const ruleSets = [
            {
               id: "set-1",
               name: "Test Set",
               ruleIds: ["rule-1", "non-existent-rule"],
               enabled: true,
            },
         ];
         const result = checkIntegrity(rules, ruleSets);
         expect(result.valid).toBe(false);
         expect(
            result.issues.some((i) => i.code === "MISSING_RULE_REFERENCE"),
         ).toBe(true);
      });

      test("warns about empty rule sets", () => {
         const rules = [createValidRule()];
         const ruleSets = [
            {
               id: "set-1",
               name: "Empty Set",
               ruleIds: [],
               enabled: true,
            },
         ];
         const result = checkIntegrity(rules, ruleSets);
         expect(result.issues.some((i) => i.code === "EMPTY_RULESET")).toBe(
            true,
         );
      });
   });

   describe("checkRuleFieldCoverage", () => {
      test("reports covered and uncovered fields", () => {
         const rules = [
            createValidRule({
               conditions: {
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
                     {
                        id: "c2",
                        type: "string",
                        field: "status",
                        operator: "eq",
                        value: "active",
                     },
                  ],
               },
            }),
         ];
         const expectedFields = ["amount", "status", "category"];
         const coverage = checkRuleFieldCoverage(rules, expectedFields);
         expect(coverage.coveredFields).toContain("amount");
         expect(coverage.coveredFields).toContain("status");
         expect(coverage.uncoveredFields).toContain("category");
         expect(coverage.coveragePercentage).toBeCloseTo(66.67, 0);
      });

      test("reports extra fields", () => {
         const rules = [
            createValidRule({
               conditions: {
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
                     {
                        id: "c2",
                        type: "string",
                        field: "extra_field",
                        operator: "eq",
                        value: "test",
                     },
                  ],
               },
            }),
         ];
         const coverage = checkRuleFieldCoverage(rules, ["amount"]);
         expect(coverage.extraFields).toContain("extra_field");
      });
   });

   describe("getUsedFields", () => {
      test("returns all fields used in rules", () => {
         const rules = [
            createValidRule({
               conditions: {
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
                     {
                        id: "c2",
                        type: "string",
                        field: "status",
                        operator: "eq",
                        value: "active",
                     },
                  ],
               },
            }),
         ];
         const fields = getUsedFields(rules);
         expect(fields).toContain("amount");
         expect(fields).toContain("status");
      });

      test("returns sorted unique fields", () => {
         const rules = [
            createValidRule({
               id: "rule-1",
               conditions: {
                  id: "g1",
                  operator: "AND",
                  conditions: [
                     {
                        id: "c1",
                        type: "number",
                        field: "zebra",
                        operator: "gt",
                        value: 1,
                     },
                  ],
               },
            }),
            createValidRule({
               id: "rule-2",
               name: "Rule 2",
               conditions: {
                  id: "g2",
                  operator: "AND",
                  conditions: [
                     {
                        id: "c2",
                        type: "number",
                        field: "apple",
                        operator: "gt",
                        value: 1,
                     },
                     {
                        id: "c3",
                        type: "number",
                        field: "zebra",
                        operator: "lt",
                        value: 10,
                     },
                  ],
               },
            }),
         ];
         const fields = getUsedFields(rules);
         expect(fields).toEqual(["apple", "zebra"]);
      });
   });

   describe("getUsedOperators", () => {
      test("returns all operators used in rules", () => {
         const rules = [
            createValidRule({
               conditions: {
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
                     {
                        id: "c2",
                        type: "string",
                        field: "status",
                        operator: "eq",
                        value: "active",
                     },
                  ],
               },
            }),
         ];
         const operators = getUsedOperators(rules);
         expect(operators).toContainEqual({
            field: "amount",
            operator: "gt",
            type: "number",
         });
         expect(operators).toContainEqual({
            field: "status",
            operator: "eq",
            type: "string",
         });
      });
   });

   describe("formatIntegrityResult", () => {
      test("formats passing result", () => {
         const result = { valid: true, issues: [] };
         const formatted = formatIntegrityResult(result);
         expect(formatted).toContain("passed");
         expect(formatted).toContain("no issues");
      });

      test("formats failing result with errors", () => {
         const result = {
            valid: false,
            issues: [
               {
                  code: "TEST_ERROR",
                  message: "Test error",
                  severity: "error" as const,
               },
            ],
         };
         const formatted = formatIntegrityResult(result);
         expect(formatted).toContain("failed");
         expect(formatted).toContain("TEST_ERROR");
      });
   });
});
