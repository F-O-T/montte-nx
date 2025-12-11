import { describe, expect, it } from "bun:test";
import {
   isStopExecutionResult,
   stopExecutionHandler,
} from "../../src/actions/handlers/stop-execution";
import type { ActionExecutionResult } from "../../src/types/actions";
import {
   createStopExecutionAction,
   createTestAction,
} from "../helpers/fixtures";
import { createMockContext } from "../helpers/mock-context";

type StopExecutionResult = ActionExecutionResult & {
   stopProcessing: boolean;
};

describe("stopExecutionHandler", () => {
   describe("execute", () => {
      it("should return stop result with provided reason", async () => {
         const action = createStopExecutionAction("Budget exceeded");
         const context = createMockContext();

         const result = (await stopExecutionHandler.execute(
            action,
            context,
         )) as StopExecutionResult;

         expect(result.success).toBe(true);
         expect(result.stopProcessing).toBe(true);
         expect(result.actionId).toBe(action.id);
         expect(result.type).toBe("stop_execution");
         expect((result.result as { reason: string }).reason).toBe(
            "Budget exceeded",
         );
      });

      it("should use default reason when not provided", async () => {
         const action = createTestAction({
            type: "stop_execution",
            config: {},
         });
         const context = createMockContext();

         const result = (await stopExecutionHandler.execute(
            action,
            context,
         )) as StopExecutionResult;

         expect(result.success).toBe(true);
         expect(result.stopProcessing).toBe(true);
         expect((result.result as { reason: string }).reason).toBe(
            "Stop execution action triggered",
         );
      });

      it("should always succeed regardless of context", async () => {
         const action = createStopExecutionAction("Stop now");
         const context = createMockContext({ dryRun: true });

         const result = (await stopExecutionHandler.execute(
            action,
            context,
         )) as StopExecutionResult;

         expect(result.success).toBe(true);
         expect(result.stopProcessing).toBe(true);
      });

      it("should work with empty reason", async () => {
         const action = createStopExecutionAction("");
         const context = createMockContext();

         const result = await stopExecutionHandler.execute(action, context);

         expect(result.success).toBe(true);
         expect((result.result as { reason: string }).reason).toBe("");
      });
   });

   describe("validate", () => {
      it("should always return valid", () => {
         const result = stopExecutionHandler.validate?.({});

         expect(result?.valid).toBe(true);
         expect(result?.errors).toEqual([]);
      });

      it("should return valid for any config", () => {
         const result = stopExecutionHandler.validate?.({
            reason: "test",
         });

         expect(result?.valid).toBe(true);
         expect(result?.errors).toEqual([]);
      });
   });

   describe("isStopExecutionResult", () => {
      it("should return true for stop execution result", async () => {
         const action = createStopExecutionAction("Stop");
         const context = createMockContext();

         const result = await stopExecutionHandler.execute(action, context);

         expect(isStopExecutionResult(result)).toBe(true);
      });

      it("should return false for regular action result", () => {
         const regularResult = {
            actionId: "action-1",
            type: "set_category" as const,
            success: true,
         };

         expect(isStopExecutionResult(regularResult)).toBe(false);
      });

      it("should return false when stopProcessing is false", () => {
         const result = {
            actionId: "action-1",
            type: "stop_execution" as const,
            success: true,
            stopProcessing: false,
         };

         expect(isStopExecutionResult(result)).toBe(false);
      });

      it("should return false when stopProcessing is missing", () => {
         const result = {
            actionId: "action-1",
            type: "stop_execution" as const,
            success: true,
         };

         expect(isStopExecutionResult(result)).toBe(false);
      });
   });
});
