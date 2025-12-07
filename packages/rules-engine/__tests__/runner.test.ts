import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Action, ConditionGroup } from "@packages/database/schema";
import { runRule, runRules, runRulesForEvent } from "../src/engine/runner";
import type { AutomationEvent } from "../src/types/events";
import type { AutomationRule, RuleExecutionContext } from "../src/types/rules";

const mockSetTransactionCategories = mock(() => Promise.resolve());
const mockAddTagToTransaction = mock(() => Promise.resolve());
const mockRemoveTagFromTransaction = mock(() => Promise.resolve());
const mockUpdateTransaction = mock(() => Promise.resolve());
const mockCreateAutomationLog = mock(() => Promise.resolve());

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

mock.module(
   "@packages/database/repositories/automation-log-repository",
   () => ({
      createAutomationLog: mockCreateAutomationLog,
   }),
);

const mockDb = {} as any;

function createRule(overrides?: Partial<AutomationRule>): AutomationRule {
   return {
      actions: [],
      conditions: [],
      createdAt: new Date(),
      description: "Test rule",
      flowData: null,
      id: `rule-${Math.random().toString(36).slice(2)}`,
      isActive: true,
      name: "Test Rule",
      organizationId: "org-123",
      priority: 0,
      stopOnFirstMatch: false,
      triggerConfig: {},
      triggerType: "transaction.created",
      updatedAt: new Date(),
      ...overrides,
   };
}

function createEvent(overrides?: Partial<AutomationEvent>): AutomationEvent {
   return {
      data: {
         amount: 100,
         date: "2024-01-15",
         description: "Test transaction",
         id: "txn-123",
         organizationId: "org-123",
         type: "expense" as const,
      },
      id: `event-${Math.random().toString(36).slice(2)}`,
      organizationId: "org-123",
      timestamp: new Date().toISOString(),
      type: "transaction.created",
      ...overrides,
   } as AutomationEvent;
}

function createContext(
   overrides?: Partial<RuleExecutionContext>,
): RuleExecutionContext {
   return {
      dryRun: false,
      event: createEvent(),
      organizationId: "org-123",
      triggeredBy: "event",
      ...overrides,
   };
}

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

function createConditionGroup(
   overrides?: Partial<ConditionGroup>,
): ConditionGroup {
   return {
      conditions: [],
      id: `group-${Math.random().toString(36).slice(2)}`,
      operator: "AND",
      ...overrides,
   };
}

describe("runner", () => {
   beforeEach(() => {
      mockSetTransactionCategories.mockClear();
      mockAddTagToTransaction.mockClear();
      mockRemoveTagFromTransaction.mockClear();
      mockUpdateTransaction.mockClear();
      mockCreateAutomationLog.mockClear();
   });

   describe("runRule", () => {
      it("should skip rule when conditions do not pass", async () => {
         const rule = createRule({
            conditions: [
               createConditionGroup({
                  conditions: [
                     {
                        field: "amount",
                        id: "cond-1",
                        operator: "gt",
                        value: 1000,
                     },
                  ],
               }),
            ],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context);

         expect(result.status).toBe("skipped");
         expect(result.conditionsPassed).toBe(false);
         expect(result.actionsResults).toHaveLength(0);
      });

      it("should execute actions when conditions pass", async () => {
         const rule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
            conditions: [
               createConditionGroup({
                  conditions: [
                     {
                        field: "amount",
                        id: "cond-1",
                        operator: "gt",
                        value: 50,
                     },
                  ],
               }),
            ],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context, mockDb);

         expect(result.status).toBe("success");
         expect(result.conditionsPassed).toBe(true);
         expect(result.actionsResults).toHaveLength(1);
         expect(result.actionsResults[0]!.success).toBe(true);
      });

      it("should execute actions when conditions are empty (always pass)", async () => {
         const rule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
            conditions: [],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context, mockDb);

         expect(result.status).toBe("success");
         expect(result.conditionsPassed).toBe(true);
      });

      it("should return partial status when some actions fail", async () => {
         const rule = createRule({
            actions: [
               createAction("set_category", { categoryId: "cat-123" }),
               createAction("set_category", {}, { continueOnError: true }),
               createAction("add_tag", { tagIds: ["tag-1"] }),
            ],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context, mockDb);

         expect(result.status).toBe("partial");
      });

      it("should return failed status when all actions fail", async () => {
         const rule = createRule({
            actions: [
               createAction("set_category", {}, { continueOnError: true }),
            ],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context, mockDb);

         expect(result.status).toBe("failed");
      });

      it("should return stopped status when stop_execution action is encountered", async () => {
         const rule = createRule({
            actions: [
               createAction("set_category", { categoryId: "cat-123" }),
               createAction("stop_execution", {}),
               createAction("add_tag", { tagIds: ["tag-1"] }),
            ],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context, mockDb);

         expect(result.status).toBe("stopped");
         expect(result.stoppedByAction).toBe(true);
         expect(result.actionsResults).toHaveLength(2);
      });

      it("should not save log when dryRun is true", async () => {
         const rule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
         });
         const event = createEvent();
         const context = createContext({ dryRun: true, event });

         await runRule(rule, event, context, mockDb);

         expect(mockCreateAutomationLog).not.toHaveBeenCalled();
      });

      it("should save log when dryRun is false and db is provided", async () => {
         const rule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
         });
         const event = createEvent();
         const context = createContext({ dryRun: false, event });

         await runRule(rule, event, context, mockDb);

         expect(mockCreateAutomationLog).toHaveBeenCalled();
      });

      it("should include timing information in result", async () => {
         const rule = createRule();
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context);

         expect(result.startedAt).toBeInstanceOf(Date);
         expect(result.completedAt).toBeInstanceOf(Date);
         expect(result.durationMs).toBeGreaterThanOrEqual(0);
         expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(
            result.startedAt.getTime(),
         );
      });

      it("should skip rule when condition uses invalid operator", async () => {
         const rule = createRule({
            conditions: [
               createConditionGroup({
                  conditions: [
                     {
                        field: "amount",
                        id: "cond-1",
                        operator: "invalid_operator" as any,
                        value: 100,
                     },
                  ],
               }),
            ],
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRule(rule, event, context);

         expect(result.status).toBe("skipped");
         expect(result.conditionsPassed).toBe(false);
      });
   });

   describe("runRules", () => {
      it("should evaluate multiple rules in priority order", async () => {
         const rule1 = createRule({ name: "Low Priority", priority: 1 });
         const rule2 = createRule({ name: "High Priority", priority: 10 });
         const rule3 = createRule({ name: "Medium Priority", priority: 5 });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules([rule1, rule2, rule3], event, context);

         expect(result.results[0]!.ruleName).toBe("High Priority");
         expect(result.results[1]!.ruleName).toBe("Medium Priority");
         expect(result.results[2]!.ruleName).toBe("Low Priority");
      });

      it("should skip inactive rules", async () => {
         const activeRule = createRule({ isActive: true, name: "Active" });
         const inactiveRule = createRule({ isActive: false, name: "Inactive" });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules(
            [activeRule, inactiveRule],
            event,
            context,
         );

         expect(result.rulesEvaluated).toBe(1);
         expect(result.results).toHaveLength(1);
      });

      it("should count matched and executed rules correctly", async () => {
         const matchingRule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
            conditions: [],
            name: "Matching",
         });
         const nonMatchingRule = createRule({
            conditions: [
               createConditionGroup({
                  conditions: [
                     {
                        field: "amount",
                        id: "c1",
                        operator: "gt",
                        value: 9999,
                     },
                  ],
               }),
            ],
            name: "Non-matching",
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules(
            [matchingRule, nonMatchingRule],
            event,
            context,
            mockDb,
         );

         expect(result.rulesMatched).toBe(1);
         expect(result.rulesExecuted).toBe(1);
      });

      it("should stop execution when stopOnFirstMatch is true", async () => {
         const rule1 = createRule({
            actions: [createAction("set_category", { categoryId: "cat-1" })],
            name: "First",
            priority: 10,
            stopOnFirstMatch: true,
         });
         const rule2 = createRule({
            actions: [createAction("set_category", { categoryId: "cat-2" })],
            name: "Second",
            priority: 5,
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules([rule1, rule2], event, context, mockDb);

         expect(result.stoppedEarly).toBe(true);
         expect(result.stoppedByRule).toBe(rule1.id);
         expect(result.results).toHaveLength(1);
      });

      it("should stop execution when stop_execution action is triggered", async () => {
         const rule1 = createRule({
            actions: [createAction("stop_execution", {})],
            name: "Stopper",
            priority: 10,
         });
         const rule2 = createRule({
            actions: [createAction("set_category", { categoryId: "cat-2" })],
            name: "After stopper",
            priority: 5,
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules([rule1, rule2], event, context, mockDb);

         expect(result.stoppedEarly).toBe(true);
         expect(result.stoppedByRule).toBe(rule1.id);
      });

      it("should count failed rules", async () => {
         const failingRule = createRule({
            actions: [createAction("set_category", {})],
            name: "Failing",
         });
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules([failingRule], event, context, mockDb);

         expect(result.rulesFailed).toBe(1);
      });

      it("should include timing information", async () => {
         const event = createEvent();
         const context = createContext({ event });

         const result = await runRules([], event, context);

         expect(result.startedAt).toBeInstanceOf(Date);
         expect(result.completedAt).toBeInstanceOf(Date);
         expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
      });
   });

   describe("runRulesForEvent", () => {
      it("should filter rules by trigger type", async () => {
         const transactionRule = createRule({
            name: "Transaction rule",
            triggerType: "transaction.created",
         });
         const updateRule = createRule({
            name: "Update rule",
            triggerType: "transaction.updated",
         });
         const event = createEvent({ type: "transaction.created" });

         const result = await runRulesForEvent(event, [
            transactionRule,
            updateRule,
         ]);

         expect(result.rulesEvaluated).toBe(1);
         expect(result.results[0]?.ruleName).toBe("Transaction rule");
      });

      it("should filter rules by organization", async () => {
         const sameOrgRule = createRule({
            name: "Same org",
            organizationId: "org-123",
         });
         const differentOrgRule = createRule({
            name: "Different org",
            organizationId: "org-other",
         });
         const event = createEvent({ organizationId: "org-123" });

         const result = await runRulesForEvent(event, [
            sameOrgRule,
            differentOrgRule,
         ]);

         expect(result.rulesEvaluated).toBe(1);
         expect(result.results[0]?.ruleName).toBe("Same org");
      });

      it("should filter out inactive rules", async () => {
         const activeRule = createRule({ isActive: true, name: "Active" });
         const inactiveRule = createRule({ isActive: false, name: "Inactive" });
         const event = createEvent();

         const result = await runRulesForEvent(event, [
            activeRule,
            inactiveRule,
         ]);

         expect(result.rulesEvaluated).toBe(1);
      });

      it("should pass dryRun option correctly", async () => {
         const rule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
         });
         const event = createEvent();

         const result = await runRulesForEvent(event, [rule], mockDb, {
            dryRun: true,
         });

         expect(mockSetTransactionCategories).not.toHaveBeenCalled();
         expect(result.results[0]!.actionsResults[0]!.result).toMatchObject({
            dryRun: true,
         });
      });

      it("should pass triggeredBy option correctly", async () => {
         const rule = createRule({
            actions: [createAction("set_category", { categoryId: "cat-123" })],
         });
         const event = createEvent();

         await runRulesForEvent(event, [rule], mockDb, {
            triggeredBy: "manual",
         });

         expect(mockCreateAutomationLog).toHaveBeenCalled();
         const logCall = mockCreateAutomationLog.mock.calls[0] as unknown[];
         expect((logCall[1] as { triggeredBy: string }).triggeredBy).toBe(
            "manual",
         );
      });

      it("should include event info in result", async () => {
         const event = createEvent({ type: "transaction.created" });

         const result = await runRulesForEvent(event, []);

         expect(result.eventId).toBe(event.id);
         expect(result.eventType).toBe("transaction.created");
         expect(result.organizationId).toBe(event.organizationId);
      });
   });
});
