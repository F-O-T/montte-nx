import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { CostCentersPage } from "@/pages/cost-centers/ui/cost-centers-page";

export const Route = createFileRoute("/$slug/_dashboard/cost-centers/")({
   component: CostCentersPage,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.cost-centers"),
   },
});
