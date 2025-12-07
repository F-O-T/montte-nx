import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { Action } from "@packages/database/schema";
import {
   executeAction,
   executeActions,
   isStopAction,
} from "../src/engine/executor";
import type { ActionExecutionContext } from "../src/types/actions";

const mockSetTransactionCategories = mock(() => Promise.resolve());
const mockAddTagToTransaction = mock(() => Promise.resolve());
const mockRemoveTagFromTransaction = mock(() => Promise.resolve());
const mockUpdateTransaction = mock(() => Promise.resolve());

mock.module("@packages/database/repositories/category-repository", () => ({
   setTransactionCategories: mockSetTransactionCategories,
}));

mock.module("@packages/database/repositories/tag-repository", () => ({
   addTagToTransaction: mockAddTagToTransaction,
   removeTagFromTransaction: mockRemoveTagFromTransaction,
}));

mock.module("@packages/database/repositories/transaction-repository", () => ({
   updateTransaction: mockUpdateTransaction,
}));

const mockDb = {} as any;

function createAction(
   type: Action["type"],
   config: Action["config"],
   overrides?: Partial<Action>,
): Action {
   return {
      config,
      continueOnError: false,
      id: `action-${Math.random().toString(36).slice(2)}`,
      type,
      ...overrides,
   };
}

function createContext(
   overrides?: Partial<ActionExecutionContext>,
): ActionExecutionContext {
   return {
      dryRun: false,
      eventData: {
         amount: 100,
         description: "Test transaction",
         id: "txn-123",
      },
      organizationId: "org-123",
      ruleId: "rule-123",
      ...overrides,
   };
}

describe("executor", () => {
   beforeEach(() => {
      mockSetTransactionCategories.mockClear();
      mockAddTagToTransaction.mockClear();
      mockRemoveTagFromTransaction.mockClear();
      mockUpdateTransaction.mockClear();
   });

   describe("executeAction", () => {
      describe("set_category action", () => {
         it("should fail when categoryId is missing", async () => {
            const action = createAction("set_category", {});
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Category ID is required");
         });

         it("should return dry run result when dryRun is true", async () => {
            const action = createAction("set_category", {
               categoryId: "cat-123",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               categoryId: "cat-123",
               dryRun: true,
            });
            expect(mockSetTransactionCategories).not.toHaveBeenCalled();
         });

         it("should fail when transaction ID is missing from event data", async () => {
            const action = createAction("set_category", {
               categoryId: "cat-123",
            });
            const context = createContext({ eventData: {} });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Transaction ID not found in event data");
         });

         it("should fail when database is not provided", async () => {
            const action = createAction("set_category", {
               categoryId: "cat-123",
            });
            const context = createContext();

            const result = await executeAction(action, context, undefined);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Database connection not available");
         });

         it("should successfully set category", async () => {
            const action = createAction("set_category", {
               categoryId: "cat-123",
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               categoryId: "cat-123",
               transactionId: "txn-123",
            });
            expect(mockSetTransactionCategories).toHaveBeenCalledWith(
               mockDb,
               "txn-123",
               ["cat-123"],
            );
         });

         it("should handle database errors", async () => {
            mockSetTransactionCategories.mockRejectedValueOnce(
               new Error("DB error"),
            );
            const action = createAction("set_category", {
               categoryId: "cat-123",
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Failed to set category");
         });
      });

      describe("add_tag action", () => {
         it("should fail when tagIds is missing", async () => {
            const action = createAction("add_tag", {});
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Tag IDs are required");
         });

         it("should fail when tagIds is empty array", async () => {
            const action = createAction("add_tag", { tagIds: [] });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Tag IDs are required");
         });

         it("should return dry run result", async () => {
            const action = createAction("add_tag", {
               tagIds: ["tag-1", "tag-2"],
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               dryRun: true,
               tagIds: ["tag-1", "tag-2"],
            });
         });

         it("should successfully add multiple tags", async () => {
            const action = createAction("add_tag", {
               tagIds: ["tag-1", "tag-2"],
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(mockAddTagToTransaction).toHaveBeenCalledTimes(2);
            expect(mockAddTagToTransaction).toHaveBeenCalledWith(
               mockDb,
               "txn-123",
               "tag-1",
            );
            expect(mockAddTagToTransaction).toHaveBeenCalledWith(
               mockDb,
               "txn-123",
               "tag-2",
            );
         });

         it("should continue adding tags even if one fails (duplicate)", async () => {
            mockAddTagToTransaction.mockRejectedValueOnce(
               new Error("Duplicate"),
            );
            const action = createAction("add_tag", {
               tagIds: ["tag-1", "tag-2"],
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(mockAddTagToTransaction).toHaveBeenCalledTimes(2);
         });
      });

      describe("remove_tag action", () => {
         it("should fail when tagIds is missing", async () => {
            const action = createAction("remove_tag", {});
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Tag IDs are required");
         });

         it("should return dry run result", async () => {
            const action = createAction("remove_tag", { tagIds: ["tag-1"] });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({ dryRun: true, tagIds: ["tag-1"] });
         });

         it("should successfully remove tags", async () => {
            const action = createAction("remove_tag", {
               tagIds: ["tag-1", "tag-2"],
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               removed: true,
               tagIds: ["tag-1", "tag-2"],
               transactionId: "txn-123",
            });
            expect(mockRemoveTagFromTransaction).toHaveBeenCalledTimes(2);
         });
      });

      describe("set_cost_center action", () => {
         it("should fail when costCenterId is missing", async () => {
            const action = createAction("set_cost_center", {});
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Cost Center ID is required");
         });

         it("should return dry run result", async () => {
            const action = createAction("set_cost_center", {
               costCenterId: "cc-123",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               costCenterId: "cc-123",
               dryRun: true,
            });
         });

         it("should successfully set cost center", async () => {
            const action = createAction("set_cost_center", {
               costCenterId: "cc-123",
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(mockUpdateTransaction).toHaveBeenCalledWith(
               mockDb,
               "txn-123",
               { costCenterId: "cc-123" },
            );
         });
      });

      describe("update_description action", () => {
         it("should fail when value is missing", async () => {
            const action = createAction("update_description", {});
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Value is required");
         });

         it("should replace description by default", async () => {
            const action = createAction("update_description", {
               value: "New description",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               description: "New description",
               dryRun: true,
            });
         });

         it("should append to description", async () => {
            const action = createAction("update_description", {
               mode: "append",
               value: " - appended",
            });
            const context = createContext({
               dryRun: true,
               eventData: { description: "Original", id: "txn-123" },
            });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               description: "Original - appended",
               dryRun: true,
            });
         });

         it("should prepend to description", async () => {
            const action = createAction("update_description", {
               mode: "prepend",
               value: "Prepended: ",
            });
            const context = createContext({
               dryRun: true,
               eventData: { description: "Original", id: "txn-123" },
            });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               description: "Prepended: Original",
               dryRun: true,
            });
         });

         it("should interpolate template variables", async () => {
            const action = createAction("update_description", {
               template: true,
               value: "Amount: {{amount}}",
            });
            const context = createContext({
               dryRun: true,
               eventData: { amount: 150.5, id: "txn-123" },
            });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               description: "Amount: 150.5",
               dryRun: true,
            });
         });

         it("should interpolate nested template variables", async () => {
            const action = createAction("update_description", {
               template: true,
               value: "{{user.name}}",
            });
            const context = createContext({
               dryRun: true,
               eventData: { id: "txn-123", user: { name: "John" } },
            });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               description: "John",
               dryRun: true,
            });
         });

         it("should handle missing template variables gracefully", async () => {
            const action = createAction("update_description", {
               template: true,
               value: "Value: {{missing}}",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               description: "Value: ",
               dryRun: true,
            });
         });

         it("should successfully update description in database", async () => {
            const action = createAction("update_description", {
               value: "Updated",
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(true);
            expect(mockUpdateTransaction).toHaveBeenCalledWith(
               mockDb,
               "txn-123",
               { description: "Updated" },
            );
         });
      });

      describe("create_transaction action", () => {
         it("should fail when type is missing", async () => {
            const action = createAction("create_transaction", {
               bankAccountId: "bank-123",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe(
               "Transaction type and bank account ID are required",
            );
         });

         it("should fail when bankAccountId is missing", async () => {
            const action = createAction("create_transaction", {
               type: "expense",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe(
               "Transaction type and bank account ID are required",
            );
         });

         it("should fail when neither amountFixed nor amountField is provided", async () => {
            const action = createAction("create_transaction", {
               bankAccountId: "bank-123",
               type: "expense",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe(
               "Either amountFixed or amountField is required",
            );
         });

         it("should fail when amountField references invalid value", async () => {
            const action = createAction("create_transaction", {
               amountField: "invalid.path",
               bankAccountId: "bank-123",
               type: "expense",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Invalid amount value from field");
         });

         it("should create transaction with fixed amount", async () => {
            const action = createAction("create_transaction", {
               amountFixed: 250,
               bankAccountId: "bank-123",
               description: "Fixed transaction",
               type: "income",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect(result.result).toMatchObject({
               dryRun: true,
               transaction: {
                  amount: 250,
                  bankAccountId: "bank-123",
                  description: "Fixed transaction",
                  organizationId: "org-123",
                  type: "income",
               },
            });
         });

         it("should create transaction with amount from field", async () => {
            const action = createAction("create_transaction", {
               amountField: "amount",
               bankAccountId: "bank-123",
               type: "expense",
            });
            const context = createContext({
               dryRun: true,
               eventData: { amount: 99.99 },
            });

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect((result.result as any).transaction.amount).toBe(99.99);
         });

         it("should use current date when dateField is not provided", async () => {
            const action = createAction("create_transaction", {
               amountFixed: 100,
               bankAccountId: "bank-123",
               type: "expense",
            });
            const context = createContext({ dryRun: true });
            const beforeTime = new Date();

            const result = await executeAction(action, context);

            const afterTime = new Date();
            const transactionDate = new Date(
               (result.result as any).transaction.date,
            );
            expect(transactionDate.getTime()).toBeGreaterThanOrEqual(
               beforeTime.getTime(),
            );
            expect(transactionDate.getTime()).toBeLessThanOrEqual(
               afterTime.getTime(),
            );
         });

         it("should use date from dateField when provided", async () => {
            const action = createAction("create_transaction", {
               amountFixed: 100,
               bankAccountId: "bank-123",
               dateField: "createdAt",
               type: "expense",
            });
            const context = createContext({
               dryRun: true,
               eventData: { createdAt: "2024-01-15T10:00:00Z" },
            });

            const result = await executeAction(action, context);

            expect((result.result as any).transaction.date).toBe(
               "2024-01-15T10:00:00.000Z",
            );
         });

         it("should interpolate description template", async () => {
            const action = createAction("create_transaction", {
               amountFixed: 100,
               bankAccountId: "bank-123",
               description: "Transaction for {{vendor}}",
               type: "expense",
            });
            const context = createContext({
               dryRun: true,
               eventData: { vendor: "Acme Corp" },
            });

            const result = await executeAction(action, context);

            expect((result.result as any).transaction.description).toBe(
               "Transaction for Acme Corp",
            );
         });
      });

      describe("send_push_notification action", () => {
         it("should fail when title is missing", async () => {
            const action = createAction("send_push_notification", {
               body: "Body",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Title and body are required");
         });

         it("should fail when body is missing", async () => {
            const action = createAction("send_push_notification", {
               title: "Title",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Title and body are required");
         });

         it("should create notification with interpolated values", async () => {
            const action = createAction("send_push_notification", {
               body: "Amount: {{amount}}",
               title: "Transaction: {{description}}",
               url: "/transactions/{{id}}",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               dryRun: true,
               notification: {
                  body: "Amount: 100",
                  organizationId: "org-123",
                  title: "Transaction: Test transaction",
                  url: "/transactions/txn-123",
               },
            });
         });

         it("should return queued result when not dry run", async () => {
            const action = createAction("send_push_notification", {
               body: "Body",
               title: "Title",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect((result.result as any).queued).toBe(true);
         });
      });

      describe("send_email action", () => {
         it("should fail when subject is missing", async () => {
            const action = createAction("send_email", { body: "Body" });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Subject and body are required");
         });

         it("should fail when body is missing", async () => {
            const action = createAction("send_email", { subject: "Subject" });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Subject and body are required");
         });

         it("should fail when to is custom but customEmail is missing", async () => {
            const action = createAction("send_email", {
               body: "Body",
               subject: "Subject",
               to: "custom",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Custom email address is required");
         });

         it("should send email to owner by default", async () => {
            const action = createAction("send_email", {
               body: "Body: {{description}}",
               subject: "Subject",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               dryRun: true,
               email: {
                  body: "Body: Test transaction",
                  organizationId: "org-123",
                  subject: "Subject",
                  to: "owner",
               },
            });
         });

         it("should send email to custom address", async () => {
            const action = createAction("send_email", {
               body: "Body",
               customEmail: "test@example.com",
               subject: "Subject",
               to: "custom",
            });
            const context = createContext({ dryRun: true });

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect((result.result as any).email.to).toBe("test@example.com");
         });
      });

      describe("stop_execution action", () => {
         it("should return success with stopped flag", async () => {
            const action = createAction("stop_execution", {});
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect(result.result).toEqual({
               reason: "Stop action executed",
               stopped: true,
            });
         });

         it("should include custom reason", async () => {
            const action = createAction("stop_execution", {
               reason: "Custom stop reason",
            });
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(true);
            expect((result.result as any).reason).toBe("Custom stop reason");
         });
      });

      describe("unknown action type", () => {
         it("should return error for unknown action type", async () => {
            const action = {
               config: {},
               continueOnError: false,
               id: "action-1",
               type: "unknown_action" as any,
            };
            const context = createContext();

            const result = await executeAction(action, context);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Unknown action type: unknown_action");
         });
      });

      describe("exception handling", () => {
         it("should catch exceptions and return error result", async () => {
            mockSetTransactionCategories.mockImplementationOnce(() => {
               throw new Error("Unexpected error");
            });
            const action = createAction("set_category", {
               categoryId: "cat-123",
            });
            const context = createContext();

            const result = await executeAction(action, context, mockDb);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Unexpected error");
         });
      });
   });

   describe("executeActions", () => {
      it("should execute multiple actions in sequence", async () => {
         const actions = [
            createAction("set_category", { categoryId: "cat-123" }),
            createAction("add_tag", { tagIds: ["tag-1"] }),
         ];
         const context = createContext();

         const { results, stoppedEarly } = await executeActions(
            actions,
            context,
            mockDb,
         );

         expect(results).toHaveLength(2);
         expect(results[0]!.success).toBe(true);
         expect(results[1]!.success).toBe(true);
         expect(stoppedEarly).toBe(false);
      });

      it("should stop execution when stop_execution action is encountered", async () => {
         const stopAction = createAction("stop_execution", {
            reason: "Stop here",
         });
         const actions = [
            createAction("set_category", { categoryId: "cat-123" }),
            stopAction,
            createAction("add_tag", { tagIds: ["tag-1"] }),
         ];
         const context = createContext();

         const { results, stoppedEarly, stoppedByAction } =
            await executeActions(actions, context, mockDb);

         expect(results).toHaveLength(2);
         expect(stoppedEarly).toBe(true);
         expect(stoppedByAction).toBe(stopAction.id);
         expect(mockAddTagToTransaction).not.toHaveBeenCalled();
      });

      it("should stop execution on error when continueOnError is false", async () => {
         const actions = [
            createAction("set_category", {}),
            createAction("add_tag", { tagIds: ["tag-1"] }),
         ];
         const context = createContext();

         const { results } = await executeActions(actions, context, mockDb);

         expect(results).toHaveLength(1);
         expect(results[0]!.success).toBe(false);
         expect(mockAddTagToTransaction).not.toHaveBeenCalled();
      });

      it("should continue execution on error when continueOnError is true", async () => {
         const actions = [
            createAction("set_category", {}, { continueOnError: true }),
            createAction("add_tag", { tagIds: ["tag-1"] }),
         ];
         const context = createContext();

         const { results } = await executeActions(actions, context, mockDb);

         expect(results).toHaveLength(2);
         expect(results[0]!.success).toBe(false);
         expect(results[1]!.success).toBe(true);
      });

      it("should return empty results for empty actions array", async () => {
         const { results, stoppedEarly } = await executeActions(
            [],
            createContext(),
            mockDb,
         );

         expect(results).toHaveLength(0);
         expect(stoppedEarly).toBe(false);
      });
   });

   describe("isStopAction", () => {
      it("should return true for stop_execution action", () => {
         const action = createAction("stop_execution", {});
         expect(isStopAction(action)).toBe(true);
      });

      it("should return false for other action types", () => {
         expect(isStopAction(createAction("set_category", {}))).toBe(false);
         expect(isStopAction(createAction("add_tag", {}))).toBe(false);
         expect(isStopAction(createAction("send_email", {}))).toBe(false);
      });
   });
});
