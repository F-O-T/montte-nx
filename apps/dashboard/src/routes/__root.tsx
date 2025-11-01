import { PostHogWrapper } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import appCss from "@packages/ui/globals.css?url";
import {
   createRootRouteWithContext,
   HeadContent,
   Outlet,
   redirect,
   Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/layout/theme-provider";
import type { RouterContext } from "../router";
import "@packages/localization";
import i18n from "@packages/localization";
import { NotFoundComponent } from "@/default/not-found";
export const Route = createRootRouteWithContext<RouterContext>()({
   component: RootComponent,

   head: () => ({
      links: [
         {
            href: appCss,
            rel: "stylesheet",
         },
         { href: "/favicon.svg", rel: "icon" },
      ],
      meta: [
         {
            title: `Finance tracker`,
         },
         {
            charSet: "UTF-8",
         },
         {
            content: "width=device-width, initial-scale=1.0",
            name: "viewport",
         },
         {
            content: i18n.language,
            name: "language",
         },
      ],
      scripts: [
         ...(!import.meta.env.PROD
            ? [
               {
                  children: `import RefreshRuntime from "/@react-refresh"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true`,
                  type: "module",
               },
               {
                  src: "/@vite/client",
                  type: "module",
               },
            ]
            : []),
         {
            src: import.meta.env.PROD
               ? "/assets/entry-client.js"
               : "/src/entry-client.tsx",
            type: "module",
         },
      ],
   }),
   loader: async ({ location }) => {
      if (location.href === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   notFoundComponent: () => (
      <div className="h-screen w-screen">
         <NotFoundComponent />
      </div>
   ),
   ssr: true,
   wrapInSuspense: true,
});

function RootComponent() {
   return (
      <html lang={i18n.language}>
         <head>
            <HeadContent />
         </head>
         <body>
            <PostHogWrapper>
               <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
               >
                  <Toaster />
                  <Outlet /> {/* Start rendering router matches */}
                  <TanStackRouterDevtools position="bottom-left" />
               </ThemeProvider>
            </PostHogWrapper>
            <Scripts />
         </body>
      </html>
   );
}
