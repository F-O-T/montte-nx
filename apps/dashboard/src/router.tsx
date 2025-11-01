import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import type { InternalTrpcClient, TrpcClient } from "@/integrations/clients";
import { routeTree } from "./routeTree.gen";

export type RouterContext = {
   trpc: TrpcClient;
   trpcClient: InternalTrpcClient;
   queryClient: QueryClient;
   head: string;
};

export const createRouter = (context: Omit<RouterContext, "head">) => {
   const router = routerWithQueryClient(
      createTanstackRouter({
         context: {
            ...context,
            head: "",
         },
         defaultPendingMs: 0,
         defaultPreload: "intent",
         defaultPreloadDelay: 0,
         defaultPreloadStaleTime: 0,
         routeTree,
         scrollRestoration: true,
      }),
      context.queryClient,
   );

   return router;
};

declare module "@tanstack/react-router" {
   interface Register {
      router: ReturnType<typeof createRouter>;
   }
}
