import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { BudgetsPage } from "@/pages/budgets/ui/budgets-page";

export const Route = createFileRoute("/_dashboard/$slug/budgets/")({
   component: BudgetsPage,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.budgets"),
   },
});
