import { NotFoundComponent } from "@/default/not-found";
import { QueryProvider } from "@/integrations/clients";
import { ThemeProvider } from "@/layout/theme-provider";
import "@packages/localization";
import { translate } from "@packages/localization";
import { PostHogWrapper } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import {
   createRootRoute,
   HeadContent,
   Outlet,
   redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

declare module "@tanstack/react-router" {
   interface StaticDataRouteOption {
      breadcrumb?: string;
   }
}
export const Route = createRootRoute({
   component: RootComponent,
   head: () => ({
      links: [
         {
            href: "/favicon.svg",
            rel: "icon",
         },
      ],
      meta: [
         {
            content: translate("common.brand.description"),
            name: "description",
         },
         {
            title: translate("common.brand.name"),
         },
      ],
   }),
   loader: async ({ location }: { location: { href: string } }) => {
      if (location.href === "/") {
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   notFoundComponent: () => (
      <div className="h-screen w-screen">
         <NotFoundComponent />
      </div>
   ),
   staticData: {
      breadcrumb: "Home",
   },
});

function RootComponent() {
   return (
      <>
         <HeadContent />
         <PostHogWrapper>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
               <QueryProvider>
                  <Toaster />
                  <Outlet />
                  <TanStackRouterDevtools position="bottom-left" />
               </QueryProvider>
            </ThemeProvider>
         </PostHogWrapper>
      </>
   );
}
