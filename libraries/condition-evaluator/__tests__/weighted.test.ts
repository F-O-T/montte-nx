import { describe, expect, it } from "bun:test";
import { evaluateConditionGroup } from "../src/evaluator";
import type { ConditionGroup, EvaluationContext } from "../src/schemas";

describe("Weighted Scoring", () => {
   describe("basic weighted scoring", () => {
      it("calculates total score from passed conditions", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            threshold: 50,
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
                  options: { weight: 40 },
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
                  options: { weight: 30 },
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 0 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(40);
         expect(result.maxPossibleScore).toBe(70);
         expect(result.passed).toBe(false);
      });

      it("passes when threshold is met", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            threshold: 70,
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
                  options: { weight: 40 },
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
                  options: { weight: 30 },
               },
               {
                  id: "3",
                  type: "number",
                  field: "c",
                  operator: "gt",
                  value: 0,
                  options: { weight: 50 },
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 1, c: 0 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(70);
         expect(result.passed).toBe(true);
      });

      it("calculates scorePercentage correctly", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
                  options: { weight: 50 },
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
                  options: { weight: 50 },
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 0 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.scorePercentage).toBe(0.5);
      });

      it("passes with any score when no threshold", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
                  options: { weight: 10 },
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
                  options: { weight: 90 },
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 0 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(10);
         expect(result.passed).toBe(true);
      });

      it("fails when no conditions pass", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 100,
                  options: { weight: 50 },
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(0);
         expect(result.passed).toBe(false);
      });
   });

   describe("default behavior", () => {
      it("defaults to binary mode when scoringMode not specified", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 0 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.scoringMode).toBeUndefined();
         expect(result.passed).toBe(false);
      });

      it("uses default weight of 1 when not specified", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            scoringMode: "weighted",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 1 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.maxPossibleScore).toBe(2);
         expect(result.totalScore).toBe(2);
      });

      it("binary AND requires all to pass", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 0,
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 1 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });

      it("binary OR requires at least one to pass", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "OR",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
               },
               {
                  id: "2",
                  type: "number",
                  field: "b",
                  operator: "gt",
                  value: 100,
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 0 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.passed).toBe(true);
      });
   });

   describe("nested weighted groups", () => {
      it("accumulates scores from nested groups", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            scoringMode: "weighted",
            threshold: 60,
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
                  options: { weight: 30 },
               },
               {
                  id: "g2",
                  operator: "OR",
                  weight: 40,
                  conditions: [
                     {
                        id: "2",
                        type: "number",
                        field: "b",
                        operator: "gt",
                        value: 0,
                     },
                  ],
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1, b: 1 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(70);
         expect(result.passed).toBe(true);
      });

      it("nested group weight is used when condition passes", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            scoringMode: "weighted",
            conditions: [
               {
                  id: "g2",
                  operator: "OR",
                  weight: 100,
                  conditions: [
                     {
                        id: "1",
                        type: "number",
                        field: "a",
                        operator: "gt",
                        value: 0,
                     },
                  ],
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1 } };
         const result = evaluateConditionGroup(group, context);

         expect(result.maxPossibleScore).toBe(100);
         expect(result.totalScore).toBe(100);
      });
   });

   describe("fraud detection example", () => {
      it("detects suspicious transaction below threshold", () => {
         const fraudRule: ConditionGroup = {
            id: "fraud-check",
            operator: "OR",
            scoringMode: "weighted",
            threshold: 70,
            conditions: [
               {
                  id: "high-value",
                  type: "number",
                  field: "amount",
                  operator: "gt",
                  value: 5000,
                  options: { weight: 40 },
               },
               {
                  id: "late-night",
                  type: "number",
                  field: "hour",
                  operator: "between",
                  value: [23, 5],
                  options: { weight: 30 },
               },
               {
                  id: "risky-category",
                  type: "string",
                  field: "category",
                  operator: "one_of",
                  value: ["Casino", "Gambling", "Crypto"],
                  options: { weight: 50 },
               },
            ],
         };

         const context: EvaluationContext = {
            data: {
               amount: 6000,
               hour: 14,
               category: "Bar",
            },
         };

         const result = evaluateConditionGroup(fraudRule, context);
         expect(result.totalScore).toBe(40);
         expect(result.passed).toBe(false);
      });

      it("flags suspicious transaction above threshold", () => {
         const fraudRule: ConditionGroup = {
            id: "fraud-check",
            operator: "OR",
            scoringMode: "weighted",
            threshold: 70,
            conditions: [
               {
                  id: "high-value",
                  type: "number",
                  field: "amount",
                  operator: "gt",
                  value: 5000,
                  options: { weight: 40 },
               },
               {
                  id: "risky-category",
                  type: "string",
                  field: "category",
                  operator: "one_of",
                  value: ["Casino", "Gambling", "Crypto"],
                  options: { weight: 50 },
               },
            ],
         };

         const context: EvaluationContext = {
            data: {
               amount: 6000,
               category: "Casino",
            },
         };

         const result = evaluateConditionGroup(fraudRule, context);
         expect(result.totalScore).toBe(90);
         expect(result.passed).toBe(true);
         expect(result.scorePercentage).toBe(1);
      });
   });

   describe("edge cases", () => {
      it("handles empty group in weighted mode", () => {
         const group: ConditionGroup = {
            id: "g1",
            operator: "AND",
            scoringMode: "weighted",
            threshold: 10,
            conditions: [],
         };
         const context: EvaluationContext = { data: {} };
         const result = evaluateConditionGroup(group, context);

         expect(result.totalScore).toBe(0);
         expect(result.maxPossibleScore).toBe(0);
         expect(result.scorePercentage).toBe(0);
         expect(result.passed).toBe(false);
      });

      it("includes scoringMode in result only when weighted", () => {
         const binaryGroup: ConditionGroup = {
            id: "g1",
            operator: "AND",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
               },
            ],
         };
         const weightedGroup: ConditionGroup = {
            id: "g2",
            operator: "AND",
            scoringMode: "weighted",
            conditions: [
               {
                  id: "1",
                  type: "number",
                  field: "a",
                  operator: "gt",
                  value: 0,
               },
            ],
         };
         const context: EvaluationContext = { data: { a: 1 } };

         const binaryResult = evaluateConditionGroup(binaryGroup, context);
         const weightedResult = evaluateConditionGroup(weightedGroup, context);

         expect(binaryResult.scoringMode).toBeUndefined();
         expect(weightedResult.scoringMode).toBe("weighted");
      });
   });
});
