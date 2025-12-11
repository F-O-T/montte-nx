import { describe, expect, it } from "bun:test";
import { createActionResult, createSkippedResult } from "../src/actions/types";
import { createTestAction } from "./helpers/fixtures";

describe("action types", () => {
   describe("createActionResult", () => {
      it("should create a success result", () => {
         const action = createTestAction({
            id: "action-123",
            type: "set_category",
         });
         const result = createActionResult(action, true);

         expect(result.actionId).toBe("action-123");
         expect(result.type).toBe("set_category");
         expect(result.success).toBe(true);
         expect(result.error).toBeUndefined();
         expect(result.result).toBeUndefined();
      });

      it("should create a failure result", () => {
         const action = createTestAction({ id: "action-456", type: "add_tag" });
         const result = createActionResult(action, false);

         expect(result.actionId).toBe("action-456");
         expect(result.type).toBe("add_tag");
         expect(result.success).toBe(false);
      });

      it("should include result data when provided", () => {
         const action = createTestAction({ type: "set_category" });
         const data = { categoryId: "cat-123", updated: true };
         const result = createActionResult(action, true, data);

         expect(result.result).toEqual(data);
      });

      it("should include error message when provided", () => {
         const action = createTestAction({ type: "add_tag" });
         const errorMessage = "Tag not found";
         const result = createActionResult(
            action,
            false,
            undefined,
            errorMessage,
         );

         expect(result.error).toBe(errorMessage);
         expect(result.success).toBe(false);
      });

      it("should include both result and error", () => {
         const action = createTestAction({ type: "update_description" });
         const data = { partial: true };
         const errorMessage = "Partial update";
         const result = createActionResult(action, false, data, errorMessage);

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
            const action = createTestAction({ type });
            const result = createActionResult(action, true);
            expect(result.type).toBe(type);
         }
      });
   });

   describe("createSkippedResult", () => {
      it("should create a skipped result with reason", () => {
         const action = createTestAction({
            id: "action-789",
            type: "send_email",
         });
         const reason = "Email client not configured";
         const result = createSkippedResult(action, reason);

         expect(result.actionId).toBe("action-789");
         expect(result.type).toBe("send_email");
         expect(result.skipped).toBe(true);
         expect(result.skipReason).toBe(reason);
         expect(result.success).toBe(true);
      });

      it("should always mark skipped results as successful", () => {
         const action = createTestAction({ type: "set_category" });
         const result = createSkippedResult(action, "Missing required config");

         expect(result.success).toBe(true);
         expect(result.skipped).toBe(true);
      });

      it("should handle empty reason", () => {
         const action = createTestAction({ type: "add_tag" });
         const result = createSkippedResult(action, "");

         expect(result.skipReason).toBe("");
         expect(result.skipped).toBe(true);
      });

      it("should preserve action id and type", () => {
         const action = createTestAction({
            id: "specific-id",
            type: "stop_execution",
         });
         const result = createSkippedResult(action, "Reason");

         expect(result.actionId).toBe("specific-id");
         expect(result.type).toBe("stop_execution");
      });
   });
});
