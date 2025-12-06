import { createFileRoute } from "@tanstack/react-router";
import { CustomReportDetailsPage } from "@/pages/custom-report-details/ui/custom-report-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/custom-reports/$reportId",
)({
   component: RouteComponent,
});

function RouteComponent() {
   return <CustomReportDetailsPage />;
}
