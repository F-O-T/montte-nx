import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
   return createRouter({
      defaultPendingMs: 0,
      defaultPreload: "intent",
      defaultPreloadDelay: 0,
      defaultPreloadStaleTime: 0,
      routeTree,
      scrollRestoration: true,
   });
}

declare module "@tanstack/react-router" {
   interface Register {
      router: ReturnType<typeof getRouter>;
   }
}
