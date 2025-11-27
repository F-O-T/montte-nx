import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { TransactionDetailsPage } from "@/pages/transaction-details/ui/transaction-details-page";

export const Route = createFileRoute(
   "/_dashboard/$slug/transactions/$transactionId",
)({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.routes.transactions.details.breadcrumb"),
   },
});

function RouteComponent() {
   return <TransactionDetailsPage />;
}
