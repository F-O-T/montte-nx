import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { ActionType } from "@packages/database/schema";
import {
   getActionHandler,
   getRegisteredActionTypes,
   hasActionHandler,
   initializeDefaultHandlers,
   registerActionHandler,
   unregisterActionHandler,
} from "../src/actions/registry";
import type { ActionHandler } from "../src/actions/types";

describe("action registry", () => {
   beforeEach(() => {
      initializeDefaultHandlers();
   });

   describe("initializeDefaultHandlers", () => {
      it("should register all default handlers", () => {
         const expectedTypes: ActionType[] = [
            "set_category",
            "add_tag",
            "remove_tag",
            "set_cost_center",
            "update_description",
            "create_transaction",
            "send_push_notification",
            "send_email",
            "stop_execution",
         ];

         const registeredTypes = getRegisteredActionTypes();

         for (const type of expectedTypes) {
            expect(registeredTypes).toContain(type);
         }
      });

      it("should be idempotent", () => {
         const beforeCount = getRegisteredActionTypes().length;
         initializeDefaultHandlers();
         const afterCount = getRegisteredActionTypes().length;

         expect(beforeCount).toBe(afterCount);
      });
   });

   describe("registerActionHandler", () => {
      afterEach(() => {
         unregisterActionHandler("custom_action" as never);
      });

      it("should register a new handler", () => {
         const customHandler: ActionHandler = {
            type: "custom_action" as never,
            execute: async () => ({
               actionId: "test",
               type: "custom_action" as never,
               success: true,
            }),
         };

         registerActionHandler(customHandler);

         expect(hasActionHandler("custom_action" as never)).toBe(true);
      });

      it("should overwrite existing handler", () => {
         const newHandler: ActionHandler = {
            type: "set_category",
            execute: async () => ({
               actionId: "new",
               type: "set_category",
               success: true,
            }),
         };

         registerActionHandler(newHandler);
         const handler = getActionHandler("set_category");

         expect(handler).toBe(newHandler);
      });
   });

   describe("unregisterActionHandler", () => {
      it("should remove a registered handler", () => {
         expect(hasActionHandler("set_category")).toBe(true);

         const result = unregisterActionHandler("set_category");

         expect(result).toBe(true);
         expect(hasActionHandler("set_category")).toBe(false);
      });

      it("should return false for non-existent handler", () => {
         const result = unregisterActionHandler("non_existent" as never);

         expect(result).toBe(false);
      });
   });

   describe("getActionHandler", () => {
      it("should return handler for registered type", () => {
         const handler = getActionHandler("set_category");

         expect(handler).toBeDefined();
         expect(handler?.type).toBe("set_category");
      });

      it("should return undefined for unregistered type", () => {
         const handler = getActionHandler("non_existent" as never);

         expect(handler).toBeUndefined();
      });

      it("should return handlers with execute method", () => {
         const handler = getActionHandler("add_tag");

         expect(handler).toBeDefined();
         expect(typeof handler?.execute).toBe("function");
      });
   });

   describe("hasActionHandler", () => {
      it("should return true for registered handler", () => {
         expect(hasActionHandler("set_category")).toBe(true);
         expect(hasActionHandler("add_tag")).toBe(true);
         expect(hasActionHandler("send_email")).toBe(true);
      });

      it("should return false for unregistered handler", () => {
         expect(hasActionHandler("unknown" as never)).toBe(false);
      });
   });

   describe("getRegisteredActionTypes", () => {
      it("should return array of registered types", () => {
         const types = getRegisteredActionTypes();

         expect(Array.isArray(types)).toBe(true);
         expect(types.length).toBeGreaterThan(0);
      });

      it("should include all default action types", () => {
         const types = getRegisteredActionTypes();

         expect(types).toContain("set_category");
         expect(types).toContain("add_tag");
         expect(types).toContain("remove_tag");
         expect(types).toContain("set_cost_center");
         expect(types).toContain("update_description");
         expect(types).toContain("create_transaction");
         expect(types).toContain("send_push_notification");
         expect(types).toContain("send_email");
         expect(types).toContain("stop_execution");
      });
   });
});
