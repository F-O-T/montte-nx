import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { Polar } from "@polar-sh/sdk";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { transactionRouter } from "./transactions";

export const appRouter = router({
   transactions: transactionRouter,
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
      createTRPCContext: async ({ headers }: { headers: Headers }) =>
         await createTRPCContextInternal({
            auth,
            db,
            headers,
            minioBucket,
            minioClient,
            polarClient,
         }),
      trpcRouter: appRouter,
   };
};

export type AppRouter = typeof appRouter;
