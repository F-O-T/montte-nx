import { createFileRoute } from "@tanstack/react-router";
import { BankAccountDetailsPage } from "@/pages/bank-account-details/ui/bank-account-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/bank-accounts/$bankAccountId",
)({
   component: RouteComponent,
});

function RouteComponent() {
   return <BankAccountDetailsPage />;
}
