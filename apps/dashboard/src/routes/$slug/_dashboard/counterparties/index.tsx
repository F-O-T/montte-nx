import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { CounterpartiesPage } from "@/pages/counterparties/ui/counterparties-page";

export const Route = createFileRoute("/$slug/_dashboard/counterparties/")({
   component: CounterpartiesPage,
   staticData: {
      breadcrumb: translate("dashboard.routes.counterparties.title"),
   },
});
