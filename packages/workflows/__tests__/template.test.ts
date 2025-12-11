import { describe, expect, it } from "bun:test";
import {
   createTemplateContext,
   extractTemplateVariables,
   formatAmount,
   formatDate,
   getNestedValue,
   hasTemplateVariables,
   renderTemplate,
   validateTemplate,
} from "../src/utils/template";

describe("template utilities", () => {
   describe("renderTemplate", () => {
      it("should replace simple variables", () => {
         const template = "Hello {{name}}!";
         const context = { name: "World" };
         expect(renderTemplate(template, context)).toBe("Hello World!");
      });

      it("should handle multiple variables", () => {
         const template = "{{greeting}} {{name}}!";
         const context = { greeting: "Hello", name: "World" };
         expect(renderTemplate(template, context)).toBe("Hello World!");
      });

      it("should handle nested variables", () => {
         const template = "Amount: {{transaction.amount}}";
         const context = { transaction: { amount: 100 } };
         expect(renderTemplate(template, context)).toBe("Amount: 100");
      });

      it("should return empty string for undefined variables", () => {
         const template = "Hello {{name}}!";
         const context = {};
         expect(renderTemplate(template, context)).toBe("Hello !");
      });

      it("should handle null values", () => {
         const template = "Value: {{value}}";
         const context = { value: null };
         expect(renderTemplate(template, context)).toBe("Value: ");
      });

      it("should stringify objects", () => {
         const template = "Data: {{data}}";
         const context = { data: { a: 1, b: 2 } };
         expect(renderTemplate(template, context)).toBe('Data: {"a":1,"b":2}');
      });

      it("should handle whitespace in variable names", () => {
         const template = "Hello {{ name }}!";
         const context = { name: "World" };
         expect(renderTemplate(template, context)).toBe("Hello World!");
      });
   });

   describe("getNestedValue", () => {
      it("should get simple value", () => {
         const obj = { name: "test" };
         expect(getNestedValue(obj, "name")).toBe("test");
      });

      it("should get nested value", () => {
         const obj = { user: { name: "test" } };
         expect(getNestedValue(obj, "user.name")).toBe("test");
      });

      it("should get deeply nested value", () => {
         const obj = { a: { b: { c: { d: "deep" } } } };
         expect(getNestedValue(obj, "a.b.c.d")).toBe("deep");
      });

      it("should return undefined for missing path", () => {
         const obj = { name: "test" };
         expect(getNestedValue(obj, "missing")).toBeUndefined();
      });

      it("should return undefined for partial missing path", () => {
         const obj = { user: { name: "test" } };
         expect(getNestedValue(obj, "user.email")).toBeUndefined();
      });

      it("should handle array access", () => {
         const obj = { items: ["a", "b", "c"] };
         expect(getNestedValue(obj, "items[0]")).toBe("a");
         expect(getNestedValue(obj, "items[1]")).toBe("b");
         expect(getNestedValue(obj, "items[2]")).toBe("c");
      });

      it("should return undefined for out of bounds array access", () => {
         const obj = { items: ["a", "b"] };
         expect(getNestedValue(obj, "items[5]")).toBeUndefined();
      });
   });

   describe("extractTemplateVariables", () => {
      it("should extract single variable", () => {
         const template = "Hello {{name}}!";
         expect(extractTemplateVariables(template)).toEqual(["name"]);
      });

      it("should extract multiple variables", () => {
         const template = "{{greeting}} {{name}}!";
         const vars = extractTemplateVariables(template);
         expect(vars).toContain("greeting");
         expect(vars).toContain("name");
      });

      it("should extract nested variables", () => {
         const template = "{{user.name}} - {{user.email}}";
         const vars = extractTemplateVariables(template);
         expect(vars).toContain("user.name");
         expect(vars).toContain("user.email");
      });

      it("should not duplicate variables", () => {
         const template = "{{name}} and {{name}}";
         expect(extractTemplateVariables(template)).toEqual(["name"]);
      });

      it("should return empty array for no variables", () => {
         const template = "Hello World!";
         expect(extractTemplateVariables(template)).toEqual([]);
      });
   });

   describe("hasTemplateVariables", () => {
      it("should return true for template with variables", () => {
         expect(hasTemplateVariables("Hello {{name}}!")).toBe(true);
      });

      it("should return false for template without variables", () => {
         expect(hasTemplateVariables("Hello World!")).toBe(false);
      });

      it("should return false for empty string", () => {
         expect(hasTemplateVariables("")).toBe(false);
      });
   });

   describe("validateTemplate", () => {
      it("should validate template with available fields", () => {
         const template = "{{name}} - {{amount}}";
         const availableFields = ["name", "amount", "date"];
         const result = validateTemplate(template, availableFields);
         expect(result.valid).toBe(true);
         expect(result.missingFields).toEqual([]);
      });

      it("should detect missing fields", () => {
         const template = "{{name}} - {{missing}}";
         const availableFields = ["name", "amount"];
         const result = validateTemplate(template, availableFields);
         expect(result.valid).toBe(false);
         expect(result.missingFields).toContain("missing");
      });

      it("should handle nested field validation", () => {
         const template = "{{user.name}}";
         const availableFields = ["user", "amount"];
         const result = validateTemplate(template, availableFields);
         expect(result.valid).toBe(true);
      });
   });

   describe("formatAmount", () => {
      it("should format amount in BRL", () => {
         const formatted = formatAmount(1234.56);
         expect(formatted).toContain("1.234,56");
         expect(formatted).toContain("R$");
      });

      it("should handle zero", () => {
         const formatted = formatAmount(0);
         expect(formatted).toContain("0,00");
      });

      it("should handle negative amounts", () => {
         const formatted = formatAmount(-100);
         expect(formatted).toContain("100,00");
      });
   });

   describe("formatDate", () => {
      it("should format date string", () => {
         const formatted = formatDate("2024-01-15");
         expect(formatted).toBeTruthy();
      });

      it("should format Date object", () => {
         const date = new Date(2024, 0, 15);
         const formatted = formatDate(date);
         expect(formatted).toBeTruthy();
      });
   });

   describe("createTemplateContext", () => {
      it("should include event data", () => {
         const eventData = { amount: 100, description: "Test" };
         const context = createTemplateContext(eventData);
         expect(context.amount).toBe(100);
         expect(context.description).toBe("Test");
      });

      it("should include helpers", () => {
         const context = createTemplateContext({});
         expect(context.helpers).toBeDefined();
         expect(
            typeof (context.helpers as Record<string, unknown>).uppercase,
         ).toBe("function");
         expect(
            typeof (context.helpers as Record<string, unknown>).lowercase,
         ).toBe("function");
         expect(
            typeof (context.helpers as Record<string, unknown>).formatAmount,
         ).toBe("function");
      });

      it("should merge additional context", () => {
         const eventData = { amount: 100 };
         const additional = { extra: "data" };
         const context = createTemplateContext(eventData, additional);
         expect(context.amount).toBe(100);
         expect(context.extra).toBe("data");
      });
   });
});
