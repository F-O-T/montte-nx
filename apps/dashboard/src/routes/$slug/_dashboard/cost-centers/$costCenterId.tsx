import { createFileRoute } from "@tanstack/react-router";
import { CostCenterDetailsPage } from "@/pages/cost-center-details/ui/cost-center-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/cost-centers/$costCenterId",
)({
   component: CostCenterDetailsPage,
});
