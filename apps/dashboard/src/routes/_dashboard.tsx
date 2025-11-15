import { useTRPC } from "@/integrations/clients";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { DashboardLayout } from "@/layout/dashboard-layout";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
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
