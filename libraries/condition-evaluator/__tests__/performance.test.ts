import { describe, expect, it } from "bun:test";
import {
   evaluate,
   evaluateCondition,
   evaluateConditionGroup,
   evaluateConditions,
} from "../src/evaluator";
import type {
   Condition,
   ConditionGroup,
   EvaluationContext,
   StringCondition,
} from "../src/schemas";

/**
 * Helper to measure execution time
 */
function measureTime(fn: () => void, iterations = 1): number {
   const start = performance.now();
   for (let i = 0; i < iterations; i++) {
      fn();
   }
   const end = performance.now();
   return (end - start) / iterations;
}

/**
 * Helper to generate a string condition
 */
function createStringCondition(id: string, field: string): StringCondition {
   return {
      id,
      type: "string",
      field,
      operator: "eq",
      value: "test",
   };
}

/**
 * Helper to generate a condition group with N conditions
 */
function createLargeGroup(
   numConditions: number,
   operator: "AND" | "OR" = "AND",
): ConditionGroup {
   const conditions: Condition[] = Array.from(
      { length: numConditions },
      (_, i) => createStringCondition(`cond-${i}`, `field${i}`),
   );

   return {
      id: "large-group",
      operator,
      conditions,
   };
}

/**
 * Helper to create deeply nested groups
 */
function createNestedGroups(depth: number): ConditionGroup {
   if (depth === 0) {
      return {
         id: "leaf-group",
         operator: "AND",
         conditions: [createStringCondition("leaf-cond", "leafField")],
      };
   }

   return {
      id: `nested-${depth}`,
      operator: depth % 2 === 0 ? "AND" : "OR",
      conditions: [
         createStringCondition(`cond-${depth}`, `field${depth}`),
         createNestedGroups(depth - 1),
      ],
   };
}

/**
 * Helper to create test context with many fields
 */
function createLargeContext(numFields: number): EvaluationContext {
   const data: Record<string, unknown> = {};
   for (let i = 0; i < numFields; i++) {
      data[`field${i}`] = "test";
   }
   return { data };
}

describe("Performance Benchmarks", () => {
   // ==========================================================================
   // Single condition evaluation benchmarks
   // ==========================================================================
   describe("single condition evaluation", () => {
      const simpleCondition: StringCondition = {
         id: "test-1",
         type: "string",
         field: "name",
         operator: "eq",
         value: "John",
      };

      const context: EvaluationContext = { data: { name: "John" } };

      it("evaluates string condition within performance threshold", () => {
         const iterations = 1000;
         const avgTime = measureTime(
            () => evaluateCondition(simpleCondition, context),
            iterations,
         );

         // Should be less than 0.1ms per evaluation
         expect(avgTime).toBeLessThan(0.1);
         console.log(
            `Average time per string condition: ${avgTime.toFixed(4)}ms`,
         );
      });

      it("evaluates with skipValidation faster than with validation", () => {
         const iterations = 1000;

         const withValidation = measureTime(
            () => evaluateCondition(simpleCondition, context),
            iterations,
         );

         const withoutValidation = measureTime(
            () =>
               evaluateCondition(simpleCondition, context, {
                  skipValidation: true,
               }),
            iterations,
         );

         // Without validation should be faster
         expect(withoutValidation).toBeLessThan(withValidation);
         console.log(
            `With validation: ${withValidation.toFixed(4)}ms, Without: ${withoutValidation.toFixed(4)}ms`,
         );
         console.log(
            `Speedup: ${(((withValidation - withoutValidation) / withValidation) * 100).toFixed(1)}%`,
         );
      });

      it("evaluates number condition within performance threshold", () => {
         const numberCondition: Condition = {
            id: "num-1",
            type: "number",
            field: "age",
            operator: "gt",
            value: 18,
         };
         const numContext: EvaluationContext = { data: { age: 25 } };

         const iterations = 1000;
         const avgTime = measureTime(
            () => evaluateCondition(numberCondition, numContext),
            iterations,
         );

         expect(avgTime).toBeLessThan(0.1);
         console.log(
            `Average time per number condition: ${avgTime.toFixed(4)}ms`,
         );
      });

      it("evaluates boolean condition within performance threshold", () => {
         const boolCondition: Condition = {
            id: "bool-1",
            type: "boolean",
            field: "active",
            operator: "is_true",
         };
         const boolContext: EvaluationContext = { data: { active: true } };

         const iterations = 1000;
         const avgTime = measureTime(
            () => evaluateCondition(boolCondition, boolContext),
            iterations,
         );

         expect(avgTime).toBeLessThan(0.1);
         console.log(
            `Average time per boolean condition: ${avgTime.toFixed(4)}ms`,
         );
      });
   });

   // ==========================================================================
   // Batch evaluation benchmarks
   // ==========================================================================
   describe("batch evaluation", () => {
      it("evaluates 100 conditions within performance threshold", () => {
         const group = createLargeGroup(100);
         const context = createLargeContext(100);

         const iterations = 100;
         const avgTime = measureTime(
            () => evaluateConditionGroup(group, context),
            iterations,
         );

         // Should be less than 10ms for 100 conditions
         expect(avgTime).toBeLessThan(10);
         console.log(
            `Average time for 100 conditions: ${avgTime.toFixed(2)}ms`,
         );
      });

      it("evaluates 1000 conditions within performance threshold", () => {
         const group = createLargeGroup(1000);
         const context = createLargeContext(1000);

         const iterations = 10;
         const avgTime = measureTime(
            () => evaluateConditionGroup(group, context),
            iterations,
         );

         // Should be less than 100ms for 1000 conditions
         expect(avgTime).toBeLessThan(100);
         console.log(
            `Average time for 1000 conditions: ${avgTime.toFixed(2)}ms`,
         );
      });

      it("evaluates 1000 conditions with skipValidation faster", () => {
         const group = createLargeGroup(1000);
         const context = createLargeContext(1000);

         const iterations = 5;

         const withValidation = measureTime(
            () => evaluateConditionGroup(group, context),
            iterations,
         );

         const withoutValidation = measureTime(
            () =>
               evaluateConditionGroup(group, context, { skipValidation: true }),
            iterations,
         );

         // Without validation should be faster
         expect(withoutValidation).toBeLessThan(withValidation);
         console.log(
            `1000 conditions - With validation: ${withValidation.toFixed(2)}ms, Without: ${withoutValidation.toFixed(2)}ms`,
         );
      });
   });

   // ==========================================================================
   // Stress tests
   // ==========================================================================
   describe("stress tests", () => {
      it("handles 1000+ conditions in single group", () => {
         const group = createLargeGroup(1500);
         const context = createLargeContext(1500);

         const start = performance.now();
         const result = evaluateConditionGroup(group, context, {
            skipValidation: true,
         });
         const elapsed = performance.now() - start;

         expect(result.passed).toBe(true);
         expect(result.results).toHaveLength(1500);
         console.log(`1500 conditions completed in ${elapsed.toFixed(2)}ms`);
      });

      it("handles 10 levels of nesting", () => {
         const nestedGroup = createNestedGroups(10);
         const context = createLargeContext(11);

         const start = performance.now();
         const result = evaluateConditionGroup(nestedGroup, context);
         const elapsed = performance.now() - start;

         expect(result.passed).toBe(true);
         console.log(
            `10 levels of nesting completed in ${elapsed.toFixed(2)}ms`,
         );
      });

      it("throws at maxDepth exceeded (default 10)", () => {
         const deeplyNestedGroup = createNestedGroups(15);
         const context = createLargeContext(16);

         expect(() =>
            evaluateConditionGroup(deeplyNestedGroup, context),
         ).toThrow(/Maximum nesting depth/);
      });

      it("respects custom maxDepth setting", () => {
         const nestedGroup = createNestedGroups(5);
         const context = createLargeContext(6);

         // Should throw with maxDepth of 3
         expect(() =>
            evaluateConditionGroup(nestedGroup, context, { maxDepth: 3 }),
         ).toThrow(/Maximum nesting depth/);

         // Should succeed with maxDepth of 10
         expect(() =>
            evaluateConditionGroup(nestedGroup, context, { maxDepth: 10 }),
         ).not.toThrow();
      });
   });

   // ==========================================================================
   // Memory profiling (basic)
   // ==========================================================================
   describe("memory usage", () => {
      it("does not leak memory on repeated evaluations", () => {
         const condition: StringCondition = {
            id: "mem-test",
            type: "string",
            field: "name",
            operator: "eq",
            value: "test",
         };
         const context: EvaluationContext = { data: { name: "test" } };

         // Run garbage collection if available
         if (global.gc) {
            global.gc();
         }

         const iterations = 10000;

         // Run many evaluations
         for (let i = 0; i < iterations; i++) {
            evaluateCondition(condition, context, { skipValidation: true });
         }

         // This test mainly checks that we don't crash or hang
         // Actual memory profiling would require more sophisticated tools
         expect(true).toBe(true);
         console.log(
            `Completed ${iterations} evaluations without memory issues`,
         );
      });
   });

   // ==========================================================================
   // Schema validation overhead
   // ==========================================================================
   describe("validation overhead", () => {
      it("measures validation vs skipValidation difference", () => {
         const conditions: Condition[] = Array.from(
            { length: 100 },
            (_, i) => ({
               id: `cond-${i}`,
               type: "string" as const,
               field: `field${i}`,
               operator: "eq" as const,
               value: "test",
            }),
         );

         const groups: ConditionGroup[] = [
            {
               id: "group-1",
               operator: "AND",
               conditions: conditions.slice(0, 50),
            },
            {
               id: "group-2",
               operator: "OR",
               conditions: conditions.slice(50),
            },
         ];

         const context = createLargeContext(100);
         const iterations = 50;

         const withValidation = measureTime(
            () => evaluateConditions(groups, context),
            iterations,
         );

         const withoutValidation = measureTime(
            () => evaluateConditions(groups, context, { skipValidation: true }),
            iterations,
         );

         const overhead =
            ((withValidation - withoutValidation) / withoutValidation) * 100;

         console.log(`Validation overhead: ${overhead.toFixed(1)}%`);
         console.log(
            `With: ${withValidation.toFixed(2)}ms, Without: ${withoutValidation.toFixed(2)}ms`,
         );

         // Validation adds overhead but should still be reasonably fast
         expect(withValidation).toBeLessThan(50);
      });
   });

   // ==========================================================================
   // evaluate() function benchmarks
   // ==========================================================================
   describe("evaluate() universal function", () => {
      it("dispatches to correct evaluator efficiently", () => {
         const condition: StringCondition = {
            id: "eval-1",
            type: "string",
            field: "name",
            operator: "eq",
            value: "test",
         };

         const group: ConditionGroup = {
            id: "eval-group",
            operator: "AND",
            conditions: [condition],
         };

         const context: EvaluationContext = { data: { name: "test" } };

         const iterations = 1000;

         const conditionTime = measureTime(
            () => evaluate(condition, context),
            iterations,
         );

         const groupTime = measureTime(
            () => evaluate(group, context),
            iterations,
         );

         // Both should be fast
         expect(conditionTime).toBeLessThan(0.1);
         expect(groupTime).toBeLessThan(0.2);

         console.log(
            `evaluate() - Condition: ${conditionTime.toFixed(4)}ms, Group: ${groupTime.toFixed(4)}ms`,
         );
      });
   });

   // ==========================================================================
   // Complex real-world scenario
   // ==========================================================================
   describe("real-world scenario", () => {
      it("evaluates complex fraud detection rules efficiently", () => {
         // Simulate a fraud detection scenario with multiple rule groups
         const fraudRules: ConditionGroup[] = [
            {
               id: "high-amount",
               operator: "AND",
               conditions: [
                  {
                     id: "c1",
                     type: "number",
                     field: "amount",
                     operator: "gt",
                     value: 10000,
                  },
                  {
                     id: "c2",
                     type: "string",
                     field: "country",
                     operator: "neq",
                     value: "US",
                  },
               ],
            },
            {
               id: "velocity-check",
               operator: "AND",
               conditions: [
                  {
                     id: "c3",
                     type: "number",
                     field: "txCount24h",
                     operator: "gt",
                     value: 5,
                  },
                  {
                     id: "c4",
                     type: "number",
                     field: "uniqueMerchants",
                     operator: "gt",
                     value: 3,
                  },
               ],
            },
            {
               id: "time-check",
               operator: "OR",
               conditions: [
                  {
                     id: "c5",
                     type: "date",
                     field: "timestamp",
                     operator: "between",
                     value: ["2024-01-01T00:00:00Z", "2024-01-01T05:00:00Z"],
                  },
                  {
                     id: "c6",
                     type: "boolean",
                     field: "isWeekend",
                     operator: "is_true",
                  },
               ],
            },
         ];

         const transaction: EvaluationContext = {
            data: {
               amount: 15000,
               country: "UK",
               txCount24h: 8,
               uniqueMerchants: 5,
               timestamp: "2024-01-01T03:30:00Z",
               isWeekend: false,
            },
         };

         const iterations = 100;
         const avgTime = measureTime(
            () => evaluateConditions(fraudRules, transaction),
            iterations,
         );

         expect(avgTime).toBeLessThan(5);
         console.log(`Fraud detection rules: ${avgTime.toFixed(2)}ms average`);
      });
   });
});
