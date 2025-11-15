import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { Polar } from "@polar-sh/sdk";
import { authRouter } from "./routers/auth";
import { categoryRouter } from "./routers/categories";
import { preferenceRouter } from "./routers/preferences";
import { sessionRouter } from "./routers/session";
import { transactionRouter } from "./routers/transactions";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { organizationRouter } from "./routers/organization";
import { organizationInvitesRouter } from "./routers/organization-invites";
import { organizationTeamsRouter } from "./routers/organization-teams";
export const appRouter = router({
   auth: authRouter,
   categories: categoryRouter,
   preferences: preferenceRouter,
   session: sessionRouter,
   transactions: transactionRouter,
   organization: organizationRouter,
   organizationInvites: organizationInvitesRouter,
   organizationTeams: organizationTeamsRouter,
});
export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
   polarClient,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   polarClient: Polar;
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
            polarClient,
            responseHeaders,
         }),
      trpcRouter: appRouter,
   };
};

export type AppRouter = typeof appRouter;
