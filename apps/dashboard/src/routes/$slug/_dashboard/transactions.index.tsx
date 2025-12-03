import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/pages/transactions/ui/transactions-page";
export const Route = createFileRoute("/$slug/_dashboard/transactions/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.transactions"),
   },
});

function RouteComponent() {
   return <TransactionsPage />;
}
