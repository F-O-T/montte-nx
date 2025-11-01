import { pipeline } from "node:stream/promises";
import {
   createRequestHandler,
   RouterServer,
   renderRouterToStream,
} from "@tanstack/react-router/ssr/server";
import type express from "express";
import { createRouter } from "./router";
import "./fetch-polyfill";
import type { AppRouter } from "@packages/api/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import {
   makeQueryClient,
   makeTrpcClient,
   TRPCProvider,
} from "./integrations/clients";

export async function render({
   req,
   res,
   head,
}: {
   head: string;
   req: express.Request;
   res: express.Response;
}) {
   const url = new URL(req.originalUrl || req.url, "https://localhost:3000")
      .href;
   const request = new Request(url, {
      headers: new Headers(req.headers as HeadersInit),
      method: req.method,
   });

   const handler = createRequestHandler({
      createRouter: () => {
         // Create request-scoped instances
         const queryClient = makeQueryClient();
         const trpcClient = makeTrpcClient(request.headers);
         const trpc = createTRPCOptionsProxy<AppRouter>({
            client: trpcClient,
            queryClient,
         });

         const router = createRouter({ queryClient, trpc, trpcClient });

         router.update({
            context: {
               ...router.options.context,
               head: head,
            },
         });
         return router;
      },
      request,
   });

   const response = await handler(({ request, responseHeaders, router }) => {
      // Get the request-scoped clients from the router context
      const { queryClient, trpcClient } = router.options.context;

      return renderRouterToStream({
         // Wrap the app in the request-scoped providers
         children: (
            <QueryClientProvider client={queryClient}>
               <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
                  <RouterServer router={router} />
               </TRPCProvider>
            </QueryClientProvider>
         ),
         request,
         responseHeaders,
         router,
      });
   });

   // Convert the fetch response back to an express response
   res.statusMessage = response.statusText;
   res.status(response.status);

   response.headers.forEach((value, name) => {
      res.setHeader(name, value);
   });

   // Stream the response body
   // biome-ignore lint/suspicious/noExplicitAny: This is a known pattern for bridging fetch Response streams and Node.js streams
   return pipeline(response.body as any, res);
}
