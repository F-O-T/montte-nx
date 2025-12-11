import { mock } from "bun:test";
import type {
   ActionHandlerContext,
   VapidConfig,
} from "../../src/actions/types";
import { createMockDb, type MockDb } from "./mock-db";

export interface MockContextOverrides {
   db?: MockDb;
   organizationId?: string;
   eventData?: Record<string, unknown>;
   ruleId?: string;
   dryRun?: boolean;
   resendClient?: MockResendClient;
   vapidConfig?: VapidConfig;
}

export interface MockResendClient {
   emails: {
      send: ReturnType<typeof mock>;
   };
}

export function createMockResendClient(): MockResendClient {
   return {
      emails: {
         send: mock(() => Promise.resolve({ id: "email-123" })),
      },
   };
}

export function createMockVapidConfig(): VapidConfig {
   return {
      publicKey: "test-vapid-public-key",
      privateKey: "test-vapid-private-key",
      subject: "mailto:test@example.com",
   };
}

export function createMockContext(
   overrides: MockContextOverrides = {},
): ActionHandlerContext {
   const {
      db = createMockDb(),
      organizationId = "org-123",
      eventData = createDefaultEventData(),
      ruleId = "rule-123",
      dryRun = false,
      resendClient = createMockResendClient(),
      vapidConfig = createMockVapidConfig(),
   } = overrides;

   return {
      db: db as unknown as ActionHandlerContext["db"],
      organizationId,
      eventData,
      ruleId,
      dryRun,
      resendClient:
         resendClient as unknown as ActionHandlerContext["resendClient"],
      vapidConfig,
   };
}

export function createDefaultEventData(): Record<string, unknown> {
   return {
      id: "tx-123",
      organizationId: "org-123",
      description: "Test transaction",
      amount: 100.5,
      type: "expense",
      date: "2024-01-15T10:00:00Z",
      bankAccountId: "bank-789",
      categoryIds: ["cat-1"],
      costCenterId: "cost-1",
      tagIds: ["tag-1"],
   };
}

export function createDryRunContext(
   overrides: Omit<MockContextOverrides, "dryRun"> = {},
): ActionHandlerContext {
   return createMockContext({ ...overrides, dryRun: true });
}

export function createContextWithoutResend(
   overrides: Omit<MockContextOverrides, "resendClient"> = {},
): ActionHandlerContext {
   const context = createMockContext(overrides);
   return {
      ...context,
      resendClient: undefined,
   };
}

export function createContextWithoutVapid(
   overrides: Omit<MockContextOverrides, "vapidConfig"> = {},
): ActionHandlerContext {
   const context = createMockContext(overrides);
   return {
      ...context,
      vapidConfig: undefined,
   };
}
