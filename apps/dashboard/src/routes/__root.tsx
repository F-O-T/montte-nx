import { PostHogWrapper } from "@packages/posthog/client";
import { Toaster } from "@packages/ui/components/sonner";
import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/layout/theme-provider";
import "@packages/localization";
import { NotFoundComponent } from "@/default/not-found";
import { QueryProvider } from "@/integrations/clients";

declare module "@tanstack/react-router" {
   interface StaticDataRouteOption {
      breadcrumb?: string;
   }
}
export const Route = createRootRoute({
   component: RootComponent,
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
      <PostHogWrapper>
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryProvider>
               <Toaster />
               <Outlet />
               <TanStackRouterDevtools position="bottom-left" />
            </QueryProvider>
         </ThemeProvider>
      </PostHogWrapper>
   );
}
