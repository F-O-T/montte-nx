import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, propagateError, validateInput } from "../src/errors";

describe("error utilities", () => {
   describe("propagateError", () => {
      it("should handle AppError objects", () => {
         const error = new AppError("Test error");
         expect(() => propagateError(error)).toThrow("Test error");
      });

      it("should not throw for regular Error objects", () => {
         const error = new Error("Test error");
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for string errors", () => {
         const error = "String error";
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should not throw for unknown objects", () => {
         const error = { message: "Object error" };
         expect(() => propagateError(error)).not.toThrow();
      });

      it("should handle null/undefined errors", () => {
         expect(() => propagateError(null)).not.toThrow();
         expect(() => propagateError(undefined)).not.toThrow();
      });
   });

   describe("validateInput", () => {
      it("should validate input against schema", () => {
         const schema = z.object({
            age: z.number(),
            name: z.string(),
         });

         const validInput = { age: 30, name: "John" };
         const result = validateInput(schema, validInput);
         expect(result).toEqual(validInput);
      });

      it("should throw for invalid input", () => {
         const schema = z.object({
            age: z.number(),
            name: z.string(),
         });

         const invalidInput = { age: "not-a-number", name: "John" };
         expect(() => validateInput(schema, invalidInput)).toThrow();
      });

      it("should handle partial validation", () => {
         const schema = z.object({
            age: z.number().optional(),
            name: z.string(),
         });

         const partialInput = { name: "John" };
         const result = validateInput(schema, partialInput);
         expect(result).toEqual({ name: "John" });
      });
   });
});
