import { describe, expect, it } from "bun:test";
import { createActionResult, createSkippedResult } from "../src/actions/types";
import { createTestConsequence } from "./helpers/fixtures";

describe("action types", () => {
   describe("createActionResult", () => {
      it("should create a success result", () => {
         const consequence = createTestConsequence({
            type: "set_category",
         });
         const result = createActionResult(consequence, true);

         expect(result.type).toBe("set_category");
         expect(result.success).toBe(true);
         expect(result.error).toBeUndefined();
         expect(result.result).toBeUndefined();
      });

      it("should create a failure result", () => {
         const consequence = createTestConsequence({ type: "add_tag" });
         const result = createActionResult(consequence, false);

         expect(result.type).toBe("add_tag");
         expect(result.success).toBe(false);
      });

      it("should include result data when provided", () => {
         const consequence = createTestConsequence({ type: "set_category" });
         const data = { categoryId: "cat-123", updated: true };
         const result = createActionResult(consequence, true, data);

         expect(result.result).toEqual(data);
      });

      it("should include error message when provided", () => {
         const consequence = createTestConsequence({ type: "add_tag" });
         const errorMessage = "Tag not found";
         const result = createActionResult(
            consequence,
            false,
            undefined,
            errorMessage,
         );

         expect(result.error).toBe(errorMessage);
         expect(result.success).toBe(false);
      });

      it("should include both result and error", () => {
         const consequence = createTestConsequence({ type: "update_description" });
         const data = { partial: true };
         const errorMessage = "Partial update";
         const result = createActionResult(consequence, false, data, errorMessage);

         expect(result.result).toEqual(data);
         expect(result.error).toBe(errorMessage);
      });

      it("should preserve action type correctly", () => {
         const actionTypes = [
            "set_category",
            "add_tag",
            "remove_tag",
            "set_cost_center",
            "update_description",
            "create_transaction",
            "send_email",
            "send_push_notification",
            "stop_execution",
         ] as const;

         for (const type of actionTypes) {
            const consequence = createTestConsequence({ type });
            const result = createActionResult(consequence, true);
            expect(result.type).toBe(type);
         }
      });
   });

   describe("createSkippedResult", () => {
      it("should create a skipped result with reason", () => {
         const consequence = createTestConsequence({
            type: "send_email",
         });
         const reason = "Email client not configured";
         const result = createSkippedResult(consequence, reason);

         expect(result.type).toBe("send_email");
         expect(result.skipped).toBe(true);
         expect(result.skipReason).toBe(reason);
         expect(result.success).toBe(true);
      });

      it("should always mark skipped results as successful", () => {
         const consequence = createTestConsequence({ type: "set_category" });
         const result = createSkippedResult(consequence, "Missing required config");

         expect(result.success).toBe(true);
         expect(result.skipped).toBe(true);
      });

      it("should handle empty reason", () => {
         const consequence = createTestConsequence({ type: "add_tag" });
         const result = createSkippedResult(consequence, "");

         expect(result.skipReason).toBe("");
         expect(result.skipped).toBe(true);
      });

      it("should preserve action type", () => {
         const consequence = createTestConsequence({
            type: "stop_execution",
         });
         const result = createSkippedResult(consequence, "Reason");

         expect(result.type).toBe("stop_execution");
      });
   });
});
