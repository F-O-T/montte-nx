import { RouterClient } from "@tanstack/react-router/ssr/client";
import { hydrateRoot } from "react-dom/client";
import {
   getQueryClient,
   makeTrpcClient,
   QueryProvider,
   trpc,
} from "./integrations/clients";
import { createRouter } from "./router";

const queryClient = getQueryClient();
const trpcClient = makeTrpcClient();

const router = createRouter({ queryClient, trpc, trpcClient });

hydrateRoot(
   document,
   <QueryProvider>
      <RouterClient router={router} />
   </QueryProvider>,
);
