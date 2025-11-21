import { useSuspenseQuery } from "@tanstack/react-query";
import {
   createFileRoute,
   Outlet,
   redirect,
   useLocation,
} from "@tanstack/react-router";
import { getQueryClient, trpc, useTRPC } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   beforeLoad: async ({ location }) => {
      const queryClient = getQueryClient();
      try {
         const status = await queryClient.fetchQuery(
            trpc.onboarding.getOnboardingStatus.queryOptions(),
         );
         if (status.needsOnboarding) {
            throw redirect({ to: "/onboarding" });
         }
      } catch (error) {
         if (
            error instanceof Response ||
            (typeof error === "object" &&
               error !== null &&
               "isRedirect" in error)
         ) {
            throw error;
         }
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   staticData: {
      breadcrumb: "Dashboard Layout",
   },
   wrapInSuspense: true,
});

function RouteComponent() {
   const location = useLocation();
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );
   return (
      <DashboardLayout session={session}>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Outlet />
         </div>
      </DashboardLayout>
   );
}
