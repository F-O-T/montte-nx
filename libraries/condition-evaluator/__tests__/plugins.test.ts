import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { createEvaluator } from "../src/plugins/create-evaluator";
import { createOperator } from "../src/plugins/create-operator";
import type { ConditionGroup, EvaluationContext } from "../src/schemas";

describe("Plugin System", () => {
   describe("createOperator", () => {
      it("creates a typed operator config", () => {
         const isEven = createOperator({
            name: "is_even",
            type: "number",
            evaluate: (val) => Number(val) % 2 === 0,
         });

         expect(isEven.name).toBe("is_even");
         expect(isEven.type).toBe("number");
         expect(isEven.evaluate(4, undefined)).toBe(true);
         expect(isEven.evaluate(3, undefined)).toBe(false);
      });

      it("creates operator with value schema validation", () => {
         const inRange = createOperator({
            name: "in_range",
            type: "number",
            valueSchema: z.object({
               min: z.number(),
               max: z.number(),
            }),
            evaluate: (val, expected) => {
               const num = Number(val);
               return num >= expected.min && num <= expected.max;
            },
         });

         expect(inRange.evaluate(5, { min: 1, max: 10 })).toBe(true);
         expect(inRange.evaluate(15, { min: 1, max: 10 })).toBe(false);
      });

      it("creates operator with custom reason generator", () => {
         const isPositive = createOperator({
            name: "is_positive",
            type: "number",
            evaluate: (val) => Number(val) > 0,
            reasonGenerator: (passed, val, _, field) =>
               passed
                  ? `${field} is positive`
                  : `${field} (${val}) is not positive`,
         });

         expect(
            isPositive.reasonGenerator?.(true, 5, undefined, "amount"),
         ).toBe("amount is positive");
         expect(
            isPositive.reasonGenerator?.(false, -5, undefined, "amount"),
         ).toBe("amount (-5) is not positive");
      });

      it("freezes the operator config", () => {
         const op = createOperator({
            name: "test",
            type: "string",
            evaluate: () => true,
         });

         expect(Object.isFrozen(op)).toBe(true);
      });
   });

   describe("createEvaluator", () => {
      it("uses custom operators in evaluation", () => {
         const { evaluate } = createEvaluator({
            operators: {
               is_even: createOperator({
                  name: "is_even",
                  type: "number",
                  evaluate: (val) => Number(val) % 2 === 0,
               }),
            },
         });

         const result = evaluate(
            { id: "1", type: "custom", field: "num", operator: "is_even" },
            { data: { num: 4 } },
         );

         expect(result.passed).toBe(true);
      });

      it("fails when custom operator returns false", () => {
         const { evaluate } = createEvaluator({
            operators: {
               is_even: createOperator({
                  name: "is_even",
                  type: "number",
                  evaluate: (val) => Number(val) % 2 === 0,
               }),
            },
         });

         const result = evaluate(
            { id: "1", type: "custom", field: "num", operator: "is_even" },
            { data: { num: 3 } },
         );

         expect(result.passed).toBe(false);
      });

      it("falls back to built-in operators", () => {
         const { evaluate } = createEvaluator({ operators: {} });

         const result = evaluate(
            {
               id: "1",
               type: "string",
               field: "name",
               operator: "eq",
               value: "John",
            },
            { data: { name: "John" } },
         );

         expect(result.passed).toBe(true);
      });

      it("handles errors from custom operators gracefully", () => {
         const { evaluate } = createEvaluator({
            operators: {
               throws_error: createOperator({
                  name: "throws_error",
                  type: "custom",
                  evaluate: () => {
                     throw new Error("Something went wrong");
                  },
               }),
            },
         });

         const result = evaluate(
            {
               id: "1",
               type: "custom",
               field: "test",
               operator: "throws_error",
            },
            { data: { test: "value" } },
         );

         expect(result.passed).toBe(false);
         expect("error" in result && result.error).toBe("Something went wrong");
      });

      it("validates value schema when provided", () => {
         const { evaluate } = createEvaluator({
            operators: {
               with_schema: createOperator({
                  name: "with_schema",
                  type: "custom",
                  valueSchema: z.number().positive(),
                  evaluate: (val, expected) => Number(val) > expected,
               }),
            },
         });

         const result1 = evaluate(
            {
               id: "1",
               type: "custom",
               field: "num",
               operator: "with_schema",
               value: 10,
            },
            { data: { num: 15 } },
         );
         expect(result1.passed).toBe(true);

         const result2 = evaluate(
            {
               id: "2",
               type: "custom",
               field: "num",
               operator: "with_schema",
               value: -5,
            },
            { data: { num: 15 } },
         );
         expect(result2.passed).toBe(false);
         expect("error" in result2 && result2.error).toContain("Invalid value");
      });

      it("supports negate option", () => {
         const { evaluate } = createEvaluator({
            operators: {
               is_even: createOperator({
                  name: "is_even",
                  type: "number",
                  evaluate: (val) => Number(val) % 2 === 0,
               }),
            },
         });

         const result = evaluate(
            {
               id: "1",
               type: "custom",
               field: "num",
               operator: "is_even",
               options: { negate: true },
            },
            { data: { num: 4 } },
         );

         expect(result.passed).toBe(false);
      });

      it("supports valueRef in custom conditions", () => {
         const { evaluate } = createEvaluator({
            operators: {
               is_greater: createOperator({
                  name: "is_greater",
                  type: "number",
                  evaluate: (val, expected) => Number(val) > Number(expected),
               }),
            },
         });

         const result = evaluate(
            {
               id: "1",
               type: "custom",
               field: "amount",
               operator: "is_greater",
               valueRef: "limit",
            },
            { data: { amount: 150, limit: 100 } },
         );

         expect(result.passed).toBe(true);
      });

      it("returns error for unknown custom operator", () => {
         const { evaluate } = createEvaluator({ operators: {} });

         const result = evaluate(
            {
               id: "1",
               type: "custom",
               field: "test",
               operator: "unknown_operator",
            },
            { data: { test: "value" } },
         );

         expect(result.passed).toBe(false);
         expect("error" in result && result.error).toContain(
            "Unknown custom operator",
         );
      });
   });

   describe("evaluateConditionGroup with custom operators", () => {
      it("evaluates groups containing custom conditions", () => {
         const { evaluateConditionGroup } = createEvaluator({
            operators: {
               is_even: createOperator({
                  name: "is_even",
                  type: "number",
                  evaluate: (val) => Number(val) % 2 === 0,
               }),
            },
         });

         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            conditions: [
               { id: "1", type: "custom", field: "a", operator: "is_even" },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
               },
            ],
         };

         const context: EvaluationContext = { data: { a: 4, b: 5 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });

      it("supports weighted scoring with custom operators", () => {
         const { evaluateConditionGroup } = createEvaluator({
            operators: {
               is_premium: createOperator({
                  name: "is_premium",
                  type: "string",
                  evaluate: (val) =>
                     ["gold", "platinum"].includes(String(val).toLowerCase()),
               }),
            },
         });

         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            threshold: 50,
            conditions: [
               {
                  id: "1",
                  type: "custom",
                  field: "tier",
                  operator: "is_premium",
                  options: { weight: 60 },
               },
               {
                  id: "2",
                  type: "number",
                  field: "purchases",
                  operator: "gt",
                  value: 10,
                  options: { weight: 40 },
               },
            ],
         };

         const context: EvaluationContext = {
            data: { tier: "gold", purchases: 5 },
         };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(60);
         expect(result.passed).toBe(true);
      });
   });

   describe("real-world examples", () => {
      it("validates Brazilian CPF", () => {
         const validateCpf = (cpf: string): boolean => {
            const cleaned = cpf.replace(/\D/g, "");
            if (cleaned.length !== 11) return false;
            if (/^(\d)\1+$/.test(cleaned)) return false;
            return true;
         };

         const { evaluate } = createEvaluator({
            operators: {
               is_cpf_valid: createOperator({
                  name: "is_cpf_valid",
                  type: "string",
                  evaluate: (val) => validateCpf(String(val)),
                  reasonGenerator: (passed, val, _, field) =>
                     passed
                        ? `${field} is a valid CPF`
                        : `${field} ("${val}") is not a valid CPF`,
               }),
            },
         });

         const result = evaluate(
            { id: "1", type: "custom", field: "cpf", operator: "is_cpf_valid" },
            { data: { cpf: "123.456.789-09" } },
         );

         expect(result.passed).toBe(true);
      });

      it("checks GPS radius", () => {
         const haversineDistance = (
            lat1: number,
            lng1: number,
            lat2: number,
            lng2: number,
         ): number => {
            const R = 6371e3;
            const toRad = (deg: number) => (deg * Math.PI) / 180;
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);

            const a =
               Math.sin(dLat / 2) ** 2 +
               Math.cos(toRad(lat1)) *
                  Math.cos(toRad(lat2)) *
                  Math.sin(dLng / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c;
         };

         const { evaluate } = createEvaluator({
            operators: {
               within_radius: createOperator({
                  name: "within_radius",
                  type: "custom",
                  valueSchema: z.object({
                     lat: z.number(),
                     lng: z.number(),
                     radius: z.number().positive(),
                  }),
                  evaluate: (val, expected) => {
                     const current = val as { lat: number; lng: number };
                     const distance = haversineDistance(
                        current.lat,
                        current.lng,
                        expected.lat,
                        expected.lng,
                     );
                     return distance <= expected.radius;
                  },
               }),
            },
         });

         const result = evaluate(
            {
               id: "1",
               type: "custom",
               field: "location",
               operator: "within_radius",
               value: { lat: -23.5505, lng: -46.6333, radius: 5000 },
            },
            { data: { location: { lat: -23.551, lng: -46.634 } } },
         );

         expect(result.passed).toBe(true);
      });

      it("validates email domain", () => {
         const { evaluate } = createEvaluator({
            operators: {
               has_domain: createOperator({
                  name: "has_domain",
                  type: "string",
                  valueSchema: z.array(z.string()),
                  evaluate: (val, allowedDomains) => {
                     const email = String(val);
                     const domain = email.split("@")[1]?.toLowerCase();
                     return allowedDomains.some(
                        (d) => d.toLowerCase() === domain,
                     );
                  },
               }),
            },
         });

         const result = evaluate(
            {
               id: "1",
               type: "custom",
               field: "email",
               operator: "has_domain",
               value: ["company.com", "partner.org"],
            },
            { data: { email: "user@company.com" } },
         );

         expect(result.passed).toBe(true);
      });
   });

   describe("type safety", () => {
      it("provides type inference for operator names", () => {
         const operators = {
            is_even: createOperator({
               name: "is_even",
               type: "number",
               evaluate: (val) => Number(val) % 2 === 0,
            }),
            is_positive: createOperator({
               name: "is_positive",
               type: "number",
               evaluate: (val) => Number(val) > 0,
            }),
         } as const;

         const { evaluate } = createEvaluator({ operators });

         const condition = {
            id: "1",
            type: "custom" as const,
            field: "num",
            operator: "is_even" as keyof typeof operators,
         };

         const result = evaluate(condition, { data: { num: 4 } });
         expect(result.passed).toBe(true);
      });
   });

   describe("createEvaluator without operators", () => {
      it("works with no custom operators", () => {
         const { evaluate } = createEvaluator();

         const result = evaluate(
            {
               id: "1",
               type: "string",
               field: "name",
               operator: "eq",
               value: "test",
            },
            { data: { name: "test" } },
         );

         expect(result.passed).toBe(true);
      });
   });
});
