import { getQueryClient, trpc, useTRPC } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
   createFileRoute,
   Outlet,
   redirect,
   useLocation,
   useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();
      try {
         const [status] = await Promise.all([
            queryClient.fetchQuery(
               trpc.onboarding.getOnboardingStatus.queryOptions(),
            ),
            queryClient.fetchQuery(
               trpc.organization.getOrganizations.queryOptions(),
            ),
         ]);

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
   staticData: {
      breadcrumb: "Dashboard Layout",
   },
   wrapInSuspense: true,
});

function RouteComponent() {
   const location = useLocation();
   const trpc = useTRPC();
   const { data: session, error } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );
   const router = useRouter();

   useEffect(() => {
      if (error) {
         toast.error("Failed to fetch session data.");
         router.navigate({
            replace: true,
            search: location.search,
            to: "/auth/sign-in",
         });
         return;
      }
      if (!session) {
         toast.error("You must be logged in to access this page.");
         router.navigate({
            replace: true,
            search: location.search,
            to: "/auth/sign-in",
         });
      }
   }, [session, location, router, error]);

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
