import { TransactionsPage } from "@/pages/transactions/ui/transactions-page";
import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_dashboard/$slug/transactions")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.transactions"),
   },
});

function RouteComponent() {
   return <TransactionsPage />;
}
