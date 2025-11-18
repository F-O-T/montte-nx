import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/pages/transactions/ui/transactions-page";
import { translate } from "@packages/localization";
export const Route = createFileRoute("/_dashboard/transactions")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.transactions"),
   },
});

function RouteComponent() {
   return <TransactionsPage />;
}
