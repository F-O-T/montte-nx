import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { PostHog } from "posthog-node";
import { bankAccountRouter } from "./routers/bank-accounts";
import { billRouter } from "./routers/bills";
import { brasilApiRouter } from "./routers/brasil-api";
import { budgetRouter } from "./routers/budgets";
import { categoryRouter } from "./routers/categories";
import { costCenterRouter } from "./routers/cost-centers";
import { counterpartyRouter } from "./routers/counterparties";
import { interestTemplateRouter } from "./routers/interest-templates";
import { notificationRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { organizationRouter } from "./routers/organization";
import { organizationInvitesRouter } from "./routers/organization-invites";
import { organizationTeamsRouter } from "./routers/organization-teams";
import { pushNotificationRouter } from "./routers/push-notifications";
import { reportRouter } from "./routers/reports";
import { sessionRouter } from "./routers/session";
import { tagRouter } from "./routers/tags";
import { transactionRouter } from "./routers/transactions";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";

export type { ReminderResult } from "./services/bill-reminder-service";

export const appRouter = router({
   bankAccounts: bankAccountRouter,
   bills: billRouter,
   brasilApi: brasilApiRouter,
   budgets: budgetRouter,
   categories: categoryRouter,
   costCenters: costCenterRouter,
   counterparties: counterpartyRouter,
   interestTemplates: interestTemplateRouter,
   notifications: notificationRouter,
   onboarding: onboardingRouter,
   organization: organizationRouter,
   organizationInvites: organizationInvitesRouter,
   organizationTeams: organizationTeamsRouter,
   pushNotifications: pushNotificationRouter,
   reports: reportRouter,
   session: sessionRouter,
   tags: tagRouter,
   transactions: transactionRouter,
});

export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
   posthog,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   posthog: PostHog;
}) => {
   return {
      createTRPCContext: async ({
         headers,
         responseHeaders,
      }: {
         headers: Headers;
         responseHeaders: Headers;
      }) =>
         await createTRPCContextInternal({
            auth,
            db,
            headers,
            minioBucket,
            minioClient,
            posthog,
            responseHeaders,
         }),
      trpcRouter: appRouter,
   };
};

export type AppRouter = typeof appRouter;
