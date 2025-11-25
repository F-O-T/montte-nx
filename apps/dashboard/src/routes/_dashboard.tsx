import { getQueryClient, trpc } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";
import {
   createFileRoute,
   Outlet,
   redirect,
   useLocation,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();
      try {
         const [status, session] = await Promise.all([
            queryClient.fetchQuery(
               trpc.onboarding.getOnboardingStatus.queryOptions(),
            ),
            queryClient.fetchQuery(trpc.session.getSession.queryOptions()),
            queryClient.fetchQuery(
               trpc.organization.getOrganizations.queryOptions(),
            ),
         ]);

         if (!session) {
            throw redirect({
               replace: true,
               search: location.search,
               to: "/auth/sign-in",
            });
         }

         if (status.needsOnboarding) {
            throw redirect({ to: "/auth/onboarding" });
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
   component: RouteComponent,
   staticData: { breadcrumb: "Dashboard Layout" },
   wrapInSuspense: true,
});

function RouteComponent() {
   const location = useLocation();

   return (
      <DashboardLayout>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Outlet />
         </div>
      </DashboardLayout>
   );
}
