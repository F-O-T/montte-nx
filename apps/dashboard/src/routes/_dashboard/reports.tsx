import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/pages/reports/ui/reports-page";

export const Route = createFileRoute("/_dashboard/reports")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Reports",
   },
});

function RouteComponent() {
   return <ReportsPage />;
}
