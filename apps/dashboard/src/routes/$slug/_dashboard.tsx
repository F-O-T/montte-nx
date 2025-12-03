import {
   createFileRoute,
   Outlet,
   redirect,
   useLocation,
} from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";

export const Route = createFileRoute("/$slug/_dashboard")({
   beforeLoad: async ({ location }) => {
      const queryClient = getQueryClient();
      try {
         const [session, organizations] = await Promise.all([
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

         const firstOrg = organizations[0];
         if (!firstOrg) {
            throw redirect({ to: "/auth/sign-in" });
         }

         const isOnboardingPage = location.pathname.endsWith("/onboarding");
         if (isOnboardingPage) {
            return;
         }

         const status = await queryClient.fetchQuery(
            trpc.onboarding.getOnboardingStatus.queryOptions(),
         );

         if (status.needsOnboarding) {
            throw redirect({
               params: { slug: firstOrg.slug },
               to: "/$slug/onboarding",
            });
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
