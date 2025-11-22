import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import { authRouter } from "./routers/auth";
import { bankAccountRouter } from "./routers/bank-accounts";
import { billRouter } from "./routers/bills";
import { brasilApiRouter } from "./routers/brasil-api";
import { categoryRouter } from "./routers/categories";
import { notificationRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { organizationRouter } from "./routers/organization";
import { organizationInvitesRouter } from "./routers/organization-invites";
import { organizationTeamsRouter } from "./routers/organization-teams";
import { reportRouter } from "./routers/reports";
import { sessionRouter } from "./routers/session";
import { transactionRouter } from "./routers/transactions";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
export const appRouter = router({
   auth: authRouter,
   bankAccounts: bankAccountRouter,
   bills: billRouter,
   brasilApi: brasilApiRouter,
   categories: categoryRouter,
   notifications: notificationRouter,
   onboarding: onboardingRouter,
   organization: organizationRouter,
   organizationInvites: organizationInvitesRouter,
   organizationTeams: organizationTeamsRouter,
   reports: reportRouter,
   session: sessionRouter,
   transactions: transactionRouter,
});
export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
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
            responseHeaders,
         }),
      trpcRouter: appRouter,
   };
};

export type AppRouter = typeof appRouter;
